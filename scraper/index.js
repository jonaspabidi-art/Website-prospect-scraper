const puppeteer = require('puppeteer');

// ─── City Coordinates ─────────────────────────────────────────────────────────

const CITY_COORDS = {
  göteborg: '57.7089:11.9746',
  stockholm: '59.3293:18.0686',
  malmö: '55.6050:13.0038',
  uppsala: '59.8586:17.6389',
  linköping: '58.4108:15.6214',
  örebro: '59.2753:15.2134',
  västerås: '59.6162:16.5528',
  helsingborg: '56.0465:12.6945',
  norrköping: '58.5877:16.1924',
  jönköping: '57.7826:14.1618',
  umeå: '63.8258:20.2630',
  lund: '55.7047:13.1910',
  borås: '57.7210:12.9401',
  sundsvall: '62.3908:17.3069',
  gävle: '60.6749:17.1413',
};

function getCityCoords(city) {
  const key = city.toLowerCase().trim();
  return CITY_COORDS[key] || null;
}

// ─── Config ───────────────────────────────────────────────────────────────────

const USER_AGENTS = [
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:125.0) Gecko/20100101 Firefox/125.0',
];

function randomUA() {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

function delay(ms) {
  return new Promise(r => setTimeout(r, ms));
}

function randomDelay() {
  return delay(2000 + Math.random() * 1000);
}

let _logFn = (msg) => console.log(`[${new Date().toLocaleTimeString('sv-SE')}] ${msg}`);

function log(msg) {
  _logFn(`[${new Date().toLocaleTimeString('sv-SE')}] ${msg}`);
}

// Extract full phone number from revealNumber URL param: 4631281450 → 031-28 14 50
function parseRevealPhone(href) {
  if (!href) return '';
  const match = href.match(/revealNumber=(\d+)/);
  if (!match) return '';
  let num = match[1];
  // Remove Sweden country code 46 prefix
  if (num.startsWith('46')) num = '0' + num.slice(2);
  // Format: 0XX-XX XX XX
  if (num.length >= 9) {
    const areaEnd = num.startsWith('08') ? 3 : 3;
    const area = num.slice(0, areaEnd);
    const rest = num.slice(areaEnd);
    const parts = rest.match(/.{1,2}/g) || [rest];
    return `${area}-${parts.join(' ')}`;
  }
  return num;
}

// ─── Hitta.se Scraper ─────────────────────────────────────────────────────────

async function scrapeHitta(browser, industry, city, maxResults) {
  log(`Scrapar hitta.se för "${industry}" i ${city}...`);

  const coords = getCityCoords(city);
  if (!coords) {
    log(`  Varning: Inga koordinater för ${city}, söker utan geo-filter`);
  }

  const results = [];
  const page = await browser.newPage();
  await page.setUserAgent(randomUA());
  await page.setViewport({ width: 1280, height: 900 });

  await page.setRequestInterception(true);
  page.on('request', req => {
    const type = req.resourceType();
    const url = req.url();
    // Block heavy assets but keep main JS/CSS for Next.js rendering
    if (type === 'image' || type === 'font' || type === 'media') req.abort();
    else if (url.includes('btloader') || url.includes('google-analytics') || url.includes('googlesyndication')) req.abort();
    else req.continue();
  });

  let pageNum = 1;
  let hasMore = true;

  while (hasMore && results.length < maxResults) {
    const geoParam = coords ? `&geo.hint=${coords}` : '';
    const url = `https://www.hitta.se/s%C3%B6k?vad=${encodeURIComponent(industry)}&var=${encodeURIComponent(city)}&typ=ftg&sida=${pageNum}${geoParam}`;
    log(`  hitta.se sida ${pageNum}...`);

    try {
      await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });
      await delay(1500);

      const pageData = await page.evaluate(() => {
        const cards = document.querySelectorAll('[class*="style_result__"]');
        const items = [];

        cards.forEach(card => {
          try {
            // Company name
            const nameEl = card.querySelector('a[data-test="search-list-link"] span') ||
                           card.querySelector('h2[data-test="search-result-title"] a');
            const name = nameEl ? nameEl.textContent.trim() : '';
            if (!name) return;

            // Address
            const addrEl = card.querySelector('[class*="displayLocation"] span') ||
                           card.querySelector('[class*="infoRow"] span');
            const address = addrEl ? addrEl.textContent.trim() : '';

            // Phone — extract from revealNumber href param (full number encoded)
            const phoneReveal = card.querySelector('a[href*="revealNumber"]');
            const phoneTel = card.querySelector('a[href^="tel:"]');
            const phoneHref = phoneReveal?.href || phoneTel?.href || '';

            // Org number from card (rarely shown, but check)
            const orgText = card.textContent.match(/(\d{6}-\d{4})/);
            const orgNumber = orgText ? orgText[1] : '';

            // Website: any external link not from hitta.se/cdn
            const extLinks = Array.from(card.querySelectorAll('a')).filter(a => {
              const h = a.href || '';
              return (h.startsWith('http://') || h.startsWith('https://')) &&
                     !h.includes('hitta.se') &&
                     !h.includes('cdn.') &&
                     !h.startsWith('tel:') &&
                     !h.startsWith('mailto:');
            });
            const hasWebsite = extLinks.length > 0;

            // Company detail URL (for future enrichment)
            const detailLink = card.querySelector('a[href*="/verksamhet/"]:not([href*="revealNumber"])');
            const detailUrl = detailLink ? detailLink.href : '';

            items.push({ name, address, phoneHref, orgNumber, hasWebsite, detailUrl });
          } catch {}
        });

        // Total results shown on page
        const totalMatch = document.title.match(/\((\d+)\s+Sökträffar\)/);
        const total = totalMatch ? parseInt(totalMatch[1]) : 0;

        return { items, total, cardCount: cards.length };
      });

      if (pageData.cardCount === 0) {
        log(`  hitta.se: Inga kort på sida ${pageNum}, avslutar`);
        hasMore = false;
        break;
      }

      const noWebsite = pageData.items.filter(i => !i.hasWebsite);
      log(`  hitta.se sida ${pageNum}: ${pageData.cardCount} kort, ${noWebsite.length} utan hemsida på listningssidan`);

      // Take listing-card results at face value — no detail page verification
      for (const item of noWebsite) {
        if (results.length >= maxResults) break;
        results.push({
          name: item.name,
          phone: parseRevealPhone(item.phoneHref),
          address: item.address,
          org_number: item.orgNumber,
          has_website: false,
          source: 'hitta',
        });
        log(`  + ${item.name} (${parseRevealPhone(item.phoneHref) || 'inget tel'})`);
      }

      // Stop paginating once we have enough, or no more pages
      const totalResults = pageData.total;
      const perPage = pageData.cardCount;
      if (results.length >= maxResults || !totalResults || pageNum * perPage >= totalResults || pageData.cardCount < 10) {
        hasMore = false;
      } else {
        pageNum++;
        await randomDelay();
      }

    } catch (err) {
      log(`  FEL hitta.se sida ${pageNum}: ${err.message}`);
      hasMore = false;
    }
  }

  await page.close();
  log(`hitta.se klart: ${results.length} bekräftade företag utan hemsida`);
  return results;
}

// ─── Google Maps Scraper ──────────────────────────────────────────────────────

async function scrapeGoogleMaps(browser, industry, city, maxResults, hittaResults = []) {
  log(`Scrapar Google Maps för "${industry}" i ${city}...`);
  const googleProspects = [];
  const confirmedHasWebsite = new Set();

  const page = await browser.newPage();
  await page.setUserAgent(randomUA());
  await page.setViewport({ width: 1280, height: 900 });

  await page.setRequestInterception(true);
  page.on('request', req => {
    const type = req.resourceType();
    if (type === 'image' || type === 'font' || type === 'media') req.abort();
    else req.continue();
  });

  const query = `${industry} ${city} Sverige`;
  const searchUrl = `https://www.google.com/maps/search/${encodeURIComponent(query)}`;

  try {
    // Step 1: load search page to set consent cookie
    await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await delay(1500);

    // Accept Google consent (Swedish: "Godkänn alla")
    try {
      const btn = await page.$('button[jsname="b3VHJd"]');
      if (btn) { await btn.click(); await delay(2000); log('  Google Maps: Samtycke godkänt'); }
    } catch {}

    // Wait for results feed
    try {
      await page.waitForSelector('[role="feed"]', { timeout: 15000 });
    } catch {
      log('  Google Maps: Resultatlista hittades inte (timeout)');
      await page.close();
      return { googleProspects, confirmedHasWebsite };
    }

    // Step 2: scroll to load enough results
    log('  Google Maps: Laddar resultat...');
    let prevCount = 0;
    let stableRounds = 0;

    while (stableRounds < 4) {
      await page.evaluate(() => {
        const feed = document.querySelector('[role="feed"]');
        if (feed) feed.scrollTop += 2000;
      });
      await delay(1200);

      const count = await page.evaluate(() =>
        document.querySelectorAll('[role="feed"] a.hfpxzc').length
      );

      if (count === prevCount) stableRounds++;
      else { stableRounds = 0; prevCount = count; }

      if (count >= maxResults * 3) break;
    }

    // Step 3: collect all place URLs (deduplicated, skip sponsored ads)
    const placeUrls = await page.evaluate(() => {
      const links = document.querySelectorAll('[role="feed"] a.hfpxzc');
      return [...new Set(Array.from(links).map(a => a.href))].filter(h => h.includes('/maps/place/'));
    });

    log(`  Google Maps: ${placeUrls.length} platser att undersöka`);

    // Step 4: navigate to each place URL directly (consent cookie already set)
    const limit = Math.min(placeUrls.length, maxResults * 3);
    for (let i = 0; i < limit; i++) {
      if (googleProspects.length >= maxResults) break;

      try {
        await page.goto(placeUrls[i], { waitUntil: 'domcontentloaded', timeout: 20000 });
        await page.waitForSelector('h1', { timeout: 5000 }).catch(() => {});
        await delay(500);

        const data = await page.evaluate(() => {
          const h1 = document.querySelector('h1');
          const name = h1 ? h1.textContent.trim() : document.title.split(' – ')[0].trim();
          const addrEl = document.querySelector('[data-item-id="address"]');
          const address = addrEl ? addrEl.textContent.trim() : '';
          const phoneEl = document.querySelector('[data-item-id^="phone:"]');
          const phone = phoneEl ? phoneEl.textContent.trim() : '';
          const hasWebsite = !!document.querySelector('[data-item-id="authority"]');

          let rating = 0;
          const ratingSpans = Array.from(document.querySelectorAll('span')).filter(s =>
            s.children.length === 0 && /^[1-5],[0-9]$/.test(s.textContent.trim())
          );
          if (ratingSpans.length > 0) rating = parseFloat(ratingSpans[0].textContent.replace(',', '.'));

          const reviewBtn = document.querySelector('button[aria-label*="recensioner"]');
          let reviewCount = 0;
          if (reviewBtn) {
            const m = (reviewBtn.getAttribute('aria-label') || '').match(/[\d\s]+/);
            if (m) reviewCount = parseInt(m[0].replace(/\s/g, '')) || 0;
          }

          return { name, address, phone, has_website: hasWebsite, google_rating: rating, google_reviews_count: reviewCount };
        });

        if (!data.name) { await delay(500); continue; }

        if (data.has_website) {
          // Check if this Maps result matches a hitta.se prospect — if so, confirm they have a website
          const matched = hittaResults.find(h => namesMatch(h.name, data.name));
          if (matched) {
            confirmedHasWebsite.add(normalize(matched.name));
            log(`  ✗ ${data.name} — har hemsida på Maps, tas bort från hitta-listan`);
          }
        } else {
          googleProspects.push({ ...data, source: 'google' });
          log(`  ✓ ${data.name} | ${data.phone} | ${data.google_reviews_count} rec, ${data.google_rating}★`);
        }

        await delay(800 + Math.random() * 400);

      } catch (err) {
        log(`  FEL Google Maps post ${i + 1}: ${err.message.split('\n')[0]} — hoppar över`);
      }
    }

  } catch (err) {
    log(`  FEL Google Maps: ${err.message}`);
  }

  await page.close();
  log(`Google Maps klart: ${googleProspects.length} nya prospects, ${confirmedHasWebsite.size} hitta-bolag bekräftade med hemsida`);
  return { googleProspects, confirmedHasWebsite };
}

// ─── Allabolag.se Enrichment ──────────────────────────────────────────────────

async function enrichWithAllabolag(browser, businesses) {
  log(`\nBerikar data från allabolag.se för ${businesses.length} företag...`);

  const page = await browser.newPage();
  await page.setUserAgent(randomUA());
  await page.setViewport({ width: 1280, height: 900 });

  await page.setRequestInterception(true);
  page.on('request', req => {
    if (['image', 'font', 'media'].includes(req.resourceType())) req.abort();
    else req.continue();
  });

  const enriched = [];

  for (let i = 0; i < businesses.length; i++) {
    const biz = businesses[i];
    log(`  Allabolag ${i + 1}/${businesses.length}: "${biz.name}"`);

    const searchTerm = biz.org_number ? biz.org_number.replace(/\D/g, '') : biz.name;
    const searchUrl = `https://www.allabolag.se/what/${encodeURIComponent(searchTerm)}`;

    try {
      await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 20000 });
      await delay(1000);

      // Accept cookies once
      if (i === 0) {
        try {
          const cookieBtn = await page.$('[id*="CybotCookiebotDialogBodyLevelButtonLevelOptinAllowAll"], button[id*="accept"]');
          if (cookieBtn) { await cookieBtn.click(); await delay(500); }
        } catch {}
      }

      // If on search results page, click the most relevant result
      const isSearchPage = page.url().includes('/what/') || page.url().includes('/search');
      if (isSearchPage) {
        const resultLink = await page.$('.search-results a, [class*="company"] a, [class*="result"] a[href*="/5"]');
        if (resultLink) {
          await resultLink.click();
          await delay(1500);
        }
      }

      const financials = await page.evaluate((bizName) => {
        const bodyText = document.body.innerText;
        const rows = Array.from(document.querySelectorAll('tr, [class*="row"]'));

        function findValue(keywords) {
          for (const row of rows) {
            const text = row.textContent;
            if (keywords.some(kw => text.toLowerCase().includes(kw.toLowerCase()))) {
              const cells = row.querySelectorAll('td, [class*="cell"], [class*="value"]');
              if (cells.length >= 2) {
                const val = cells[cells.length - 1].textContent.replace(/\s+/g, '').replace(',', '.');
                return val;
              }
            }
          }
          return null;
        }

        // Revenue
        const revRaw = findValue(['Omsättning', 'Nettoomsättning']);
        let revenue = 0;
        if (revRaw) {
          const num = parseFloat(revRaw.replace(/[^\d.-]/g, ''));
          if (!isNaN(num)) {
            // Allabolag shows values in tkr (thousands)
            revenue = num * 1000;
          }
        }
        // Fallback: scan body text
        if (!revenue) {
          const match = bodyText.match(/Omsättning[^\d]*(\d[\d\s]*)\s*(?:tkr|kkr|kr|TSEK)/i);
          if (match) revenue = parseInt(match[1].replace(/\s/g, '')) * 1000;
        }

        // Employees
        const empRaw = findValue(['Anställda', 'Medelantalet anställda']);
        let employees = empRaw ? parseInt(empRaw.replace(/\D/g, '')) || 0 : 0;
        if (!employees) {
          const empMatch = bodyText.match(/(?:Anställda|anställda)[^\d]*(\d+)/i);
          if (empMatch) employees = parseInt(empMatch[1]) || 0;
        }

        // Profit
        const profitRaw = findValue(['Årets resultat', 'Nettoresultat', 'Resultat efter']);
        let profitPositive = false;
        if (profitRaw) {
          profitPositive = !profitRaw.includes('-') && parseFloat(profitRaw.replace(/[^\d.-]/g, '')) > 0;
        }

        // Founding year
        let foundingYear = 0;
        const yearPatterns = [
          /Registrerad\s+(\d{4})/i,
          /Bolaget grundades\s+(\d{4})/i,
          /Startår\s*:?\s*(\d{4})/i,
          /(?:sedan|från)\s+(\d{4})/i,
        ];
        for (const pat of yearPatterns) {
          const m = bodyText.match(pat);
          if (m) { foundingYear = parseInt(m[1]); break; }
        }

        // Also check meta info sections
        const allText = document.querySelector('[class*="keyFigure"], [class*="key-figure"], [class*="company-info"]')?.textContent || '';

        return { revenue, employees, profit_positive: profitPositive, founding_year: foundingYear };
      }, biz.name);

      const yearsInBusiness = financials.founding_year > 1900
        ? new Date().getFullYear() - financials.founding_year
        : 0;

      const enrichedBiz = {
        ...biz,
        revenue: financials.revenue,
        employees: financials.employees,
        profit_positive: financials.profit_positive,
        years_in_business: yearsInBusiness,
      };

      enriched.push(enrichedBiz);
      log(`    → Omsättning: ${financials.revenue ? Math.round(financials.revenue / 1000) + 'k kr' : 'N/A'} | ${financials.employees} anst. | ${yearsInBusiness ? yearsInBusiness + ' år' : '?'}`);

    } catch (err) {
      log(`  FEL allabolag "${biz.name}": ${err.message}`);
      enriched.push({ ...biz, revenue: 0, employees: 0, profit_positive: false, years_in_business: 0 });
    }

    await randomDelay();
  }

  await page.close();
  log(`Allabolag-berikning klar`);
  return enriched;
}

// ─── Merge & Deduplicate ──────────────────────────────────────────────────────

function normalize(str) {
  return (str || '').toLowerCase().trim()
    .replace(/\s+/g, ' ')
    .replace(/[åä]/g, 'a').replace(/ö/g, 'o')
    .replace(/[^a-z0-9 ]/g, '');
}

function namesMatch(a, b) {
  const na = normalize(a);
  const nb = normalize(b);
  if (na === nb) return true;
  const wa = na.split(' ')[0];
  const wb = nb.split(' ')[0];
  return wa.length > 3 && wb.length > 3 && (na.includes(wb) || nb.includes(wa));
}

function mergeResults(hittaResults, googleResults) {
  log(`\nSammanfogar: ${hittaResults.length} hitta.se + ${googleResults.length} Google Maps`);
  const merged = [];
  const googleUsed = new Set();

  for (const h of hittaResults) {
    let bestMatch = null;
    let bestScore = 0;

    for (let gi = 0; gi < googleResults.length; gi++) {
      if (googleUsed.has(gi)) continue;
      const g = googleResults[gi];

      const hn = normalize(h.name);
      const gn = normalize(g.name);

      // Name similarity: exact match, or one contains the other
      let nameScore = 0;
      if (hn === gn) nameScore = 3;
      else if (hn.includes(gn.split(' ')[0]) || gn.includes(hn.split(' ')[0])) nameScore = 1;

      // Address similarity: first token match
      const ha = normalize(h.address).split(' ')[0];
      const ga = normalize(g.address).split(' ')[0];
      const addrScore = ha && ga && ha === ga ? 1 : 0;

      const total = nameScore + addrScore;
      if (total >= 2 && total > bestScore) {
        bestScore = total;
        bestMatch = { index: gi, data: g };
      }
    }

    if (bestMatch) {
      googleUsed.add(bestMatch.index);
      merged.push({
        ...h,
        google_reviews_count: bestMatch.data.google_reviews_count || 0,
        google_rating: bestMatch.data.google_rating || 0,
        source: 'both',
      });
    } else {
      merged.push({ ...h, google_reviews_count: 0, google_rating: 0 });
    }
  }

  // Google-only entries
  for (let gi = 0; gi < googleResults.length; gi++) {
    if (!googleUsed.has(gi)) {
      merged.push({
        ...googleResults[gi],
        org_number: '',
        revenue: 0,
        employees: 0,
        profit_positive: false,
        years_in_business: 0,
      });
    }
  }

  const both = merged.filter(b => b.source === 'both').length;
  log(`Sammanslagning: ${merged.length} unika företag (${both} på båda källorna)`);
  return merged;
}

// ─── Scoring ──────────────────────────────────────────────────────────────────

function calculateScore(biz) {
  let score = 0;
  if (!biz.has_website) score += 3;
  if (biz.revenue > 5_000_000) score += 4;
  else if (biz.revenue >= 1_000_000) score += 3;
  else if (biz.revenue >= 500_000) score += 2;
  if (biz.employees >= 3 && biz.employees <= 15) score += 2;
  if (biz.profit_positive) score += 1;
  if (biz.years_in_business >= 5 && biz.years_in_business <= 20) score += 2;
  else if (biz.years_in_business > 20) score += 1;
  const r = biz.google_reviews_count || 0;
  if (r > 50) score += 3;
  else if (r > 20) score += 2;
  else if (r > 5) score += 1;
  const rt = biz.google_rating || 0;
  if (rt >= 4.5) score += 2;
  else if (rt >= 4.0) score += 1;
  if (biz.source === 'both') score += 2;
  return score;
}

// ─── Exported runner ─────────────────────────────────────────────────────────

async function runScraper({ industry, city, maxResults = 20, onProgress = () => {} }) {
  _logFn = (msg) => { onProgress(msg); };

  log(`Prospektering: ${industry} i ${city} (max ${maxResults} per källa)`);

  const browser = await puppeteer.launch({
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-blink-features=AutomationControlled',
      '--disable-infobars',
      '--window-size=1280,900',
      '--lang=sv-SE,sv',
    ],
  });

  await browser.defaultBrowserContext().overridePermissions('https://www.hitta.se', []);

  try {
    const hittaResults = await scrapeHitta(browser, industry, city, maxResults);
    await randomDelay();

    const { googleProspects, confirmedHasWebsite } = await scrapeGoogleMaps(browser, industry, city, maxResults, hittaResults);

    if (confirmedHasWebsite.size > 0) {
      log(`Filtrerar: ${confirmedHasWebsite.size} hitta-bolag bekräftade med hemsida tas bort`);
    }
    const filteredHitta = hittaResults.filter(h => !confirmedHasWebsite.has(normalize(h.name)));

    const merged = mergeResults(filteredHitta, googleProspects);

    if (merged.length === 0) {
      log('Inga företag hittades utan hemsida.');
      return [];
    }

    const enriched = await enrichWithAllabolag(browser, merged);

    log('Beräknar prioritetspoäng...');
    const scored = enriched.map(b => ({ ...b, priority_score: calculateScore(b) }));
    scored.sort((a, b) => b.priority_score - a.priority_score);

    log(`KLAR! ${scored.length} prospekt hittade.`);
    return scored;

  } finally {
    await browser.close();
  }
}

module.exports = { runScraper };
