const puppeteer = require('puppeteer');
const Anthropic = require('@anthropic-ai/sdk');

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

async function haikusHasWebsite(pageText, companyName, source = 'hitta') {
  try {
    const context = source === 'maps'
      ? `Google Maps-sidan för "${companyName}"`
      : `hitta.se-sidan för "${companyName}"`;
    const ignoreNote = source === 'maps'
      ? 'Ignorera Google Maps UI-knappar, navigeringslänkar, bokningslänkar (Bokadirekt etc.) och annonser.'
      : "Ignorera andra bolags info, annonser och hitta.se's eget innehåll.";
    const msg = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 10,
      messages: [{
        role: 'user',
        content: `Titta på texten nedan från ${context}.\nHar JUST DETTA specifika företag en egen hemsida (inte Facebook, Instagram, bokningssajt eller liknande) länkad på sidan?\n${ignoreNote}\nSvara bara "ja" eller "nej".\n\n${pageText.slice(0, 3000)}`,
      }],
    });
    const answer = (msg.content[0]?.text || '').toLowerCase().trim();
    return answer.startsWith('ja');
  } catch (err) {
    log(`  Haiku-fel för "${companyName}": ${err.message.split('\n')[0]}`);
    return false;
  }
}

// ─── Free/low-quality platform indicators ─────────────────────────────────────

const FREE_PLATFORMS = [
  'wixsite.com', 'weebly.com', 'webnode.se', 'webnode.com',
  'wordpress.com', 'squarespace.com', 'blogspot.com', 'jimdo.com',
  'mystrikingly.com', 'pages.google.com',
];

// Chain/franchise domains — company doesn't own its own website, exclude as leads
const CHAIN_DOMAINS = [
  'autoexperten.se', 'adbildelar.se', 'mekonomen.se', 'meca.se',
  'bosch-car-service.se', 'fixafelan.se', 'specsavers.se',
  'euronics.se', 'elkjop.se', 'mediamarkt.se',
];

// ─── Hitta.se website URL extractor (weak_website mode) ──────────────────────

async function extractHittaWebsiteUrls(browser, candidates) {
  const toCheck = candidates.filter(c => c.detail_url);
  if (toCheck.length === 0) return [];
  log(`\nExtraherar hemsidor: besöker ${toCheck.length} hitta.se-detaljsidor...`);

  const page = await browser.newPage();
  await page.setUserAgent(randomUA());
  await page.setViewport({ width: 1280, height: 900 });
  await page.setRequestInterception(true);
  page.on('request', req => {
    if (['image', 'font', 'media'].includes(req.resourceType())) req.abort();
    else req.continue();
  });

  const withWebsite = [];

  for (const biz of toCheck) {
    try {
      await page.goto(biz.detail_url, { waitUntil: 'domcontentloaded', timeout: 20000 });
      await delay(600);

      const result = await page.evaluate(() => {
        let websiteUrl = '';

        // 1. exitUrl in redirect/proxy link (most common: "Besök hemsida" button)
        const exitA = Array.from(document.querySelectorAll('a[href]')).find(a =>
          a.href.includes('exitUrl') || (a.href.includes('/redir') && !a.href.includes('revealNumber'))
        );
        if (exitA) {
          const m = exitA.href.match(/exitUrl=([^&]+)/);
          if (m) { try { websiteUrl = decodeURIComponent(m[1]); } catch { websiteUrl = m[1]; } }
        }

        // 2. Link with text "hemsida" pointing to external domain
        if (!websiteUrl) {
          const websiteLink = Array.from(document.querySelectorAll('a[href]')).find(a => {
            const t = (a.textContent || '').toLowerCase();
            const h = a.href || '';
            return (t.includes('hemsida') || t.includes('webbplats')) &&
              h.startsWith('http') && !h.includes('hitta.se') && h.length > 15;
          });
          if (websiteLink) websiteUrl = websiteLink.href;
        }

        // 3. URL pattern in text near "hemsida"/"webbplats"
        if (!websiteUrl) {
          const text = document.body.innerText;
          const pats = [
            /hemsida\s*:?\s*(https?:\/\/[^\s\n]{4,})/i,
            /webbplats\s*:?\s*(https?:\/\/[^\s\n]{4,})/i,
            /hemsida\s*:?\s*(www\.[^\s\n]{4,})/i,
          ];
          for (const p of pats) {
            const m = text.match(p);
            if (m) { websiteUrl = m[1].startsWith('www') ? 'http://' + m[1] : m[1]; break; }
          }
        }

        const orgMatch = document.body.innerText.match(/(\d{6}-\d{4})/);
        return { websiteUrl, orgNumber: orgMatch ? orgMatch[1] : '' };
      });

      if (result.websiteUrl) {
        log(`  ✓ ${biz.name} — ${result.websiteUrl}`);
        withWebsite.push({
          ...biz,
          has_website: true,
          website_url: result.websiteUrl,
          org_number: result.orgNumber || biz.org_number,
        });
      } else {
        log(`  ~ ${biz.name} — ingen hemsida-länk hittad`);
      }
    } catch (err) {
      log(`  ? ${biz.name} — fel: ${err.message.split('\n')[0]}`);
    }
    await delay(700 + Math.random() * 300);
  }

  await page.close();
  log(`Hitta-hemsidor: ${withWebsite.length}/${toCheck.length} med hittad URL`);
  return withWebsite;
}

// ─── Website quality checker (weak_website mode) ─────────────────────────────

async function checkWebsiteQuality(browser, candidates) {
  if (candidates.length === 0) return [];
  log(`\nHemsidekvalitet: kollar ${candidates.length} hemsidor...`);

  const page = await browser.newPage();
  await page.setUserAgent(randomUA());
  await page.setViewport({ width: 390, height: 844 }); // Mobile viewport for accurate check
  await page.setRequestInterception(true);
  page.on('request', req => {
    if (['image', 'font', 'media'].includes(req.resourceType())) req.abort();
    else req.continue();
  });

  const results = [];

  for (const biz of candidates) {
    if (!biz.website_url) {
      results.push({ ...biz, website_quality: 'unknown', website_signals: [] });
      continue;
    }

    const signals = [];
    let quality = 'ok';

    // Chain/franchise pages — company has no independent website, skip as lead
    if (CHAIN_DOMAINS.some(d => biz.website_url.includes(d))) {
      log(`  ✗ ${biz.name} — kedjessida (${biz.website_url}), hoppar över`);
      results.push({ ...biz, website_quality: 'good', website_signals: ['Kedjessida'] });
      continue;
    }

    // Instant checks from URL (no page visit needed)
    if (FREE_PLATFORMS.some(p => biz.website_url.includes(p))) signals.push('Gratis plattform');
    if (biz.website_url.startsWith('http://')) signals.push('Ingen HTTPS');

    try {
      const t0 = Date.now();
      await page.goto(biz.website_url, { waitUntil: 'domcontentloaded', timeout: 20000 });
      const loadMs = Date.now() - t0;
      await delay(1500); // longer wait so JS-heavy sites render fully

      if (loadMs > 8000) signals.push(`Långsam (${Math.round(loadMs / 1000)}s)`);

      const data = await page.evaluate(() => {
        const hasViewport = !!document.querySelector('meta[name="viewport"]');
        const text = document.body.innerText || '';
        const yearM = text.match(/©\s*(\d{4})|[Cc]opyright\s*©?\s*(\d{4})/);
        const copyrightYear = yearM ? parseInt(yearM[1] || yearM[2]) : 0;
        return { hasViewport, copyrightYear, pageText: text.slice(0, 3000) };
      });

      if (!data.hasViewport) signals.push('Ej mobilanpassad');
      if (data.copyrightYear > 0 && data.copyrightYear <= 2020) {
        signals.push(`Föråldrad (© ${data.copyrightYear})`);
      }

      // Take screenshot so Haiku can visually judge the site
      let screenshotB64 = null;
      try {
        const buf = await page.screenshot({ type: 'jpeg', quality: 55, clip: { x: 0, y: 0, width: 390, height: 844 } });
        screenshotB64 = buf.toString('base64');
      } catch (_) {}

      // Haiku evaluates both screenshot and text
      if (process.env.ANTHROPIC_API_KEY) {
        try {
          const prompt = `Du är webbutvecklare som bedömer om ett företag behöver en ny hemsida.\n\nAnalysera hemsidan för "${biz.name}". Svara BARA med ett ord: "bra" eller "dålig".\n\nSvara "bra" om hemsidan HAR MINST ETT av:\n• Onlinebeställning, onlinebokning eller fungerande e-handel\n• Modern, professionell design med tydliga tjänste- eller produktbeskrivningar OCH kontaktinfo\n• Uppenbara tecken på att sidan är nyligen uppdaterad (nyheter, aktuella priser, copyright 2022+)\n• Kedja, franchise eller etablerad nationell aktör med flera lokaler\n\nSvara "dålig" om hemsidan TYDLIGT lider av MINST TVÅ av:\n• Nästan inget innehåll — under 200 ord, inga tjänstebeskrivningar, ingen prislista\n• Föråldrad design — tabellayout, pixelgrafik, copyright 2020 eller äldre\n• Ingen kontaktinformation (telefonnummer, adress eller e-post saknas helt)\n• Inga bilder av verksamheten (produkter, lokal eller personal)\n• Mobilvy ser trasig ut eller saknas helt\n• Det är en Facebook-/Instagram-sida, Google My Business-sida eller tredjepartskatalog\n\nOm du är osäker eller sidan verkar "okej men inte fantastisk" — svara "bra". Bättre att missa ett lead än att kontakta någon som har en fungerande sida.\n\nSidtext:\n${data.pageText}`;

          const content = screenshotB64
            ? [
                { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: screenshotB64 } },
                { type: 'text', text: prompt },
              ]
            : prompt;

          const msg = await anthropic.messages.create({
            model: 'claude-haiku-4-5-20251001',
            max_tokens: 5,
            messages: [{ role: 'user', content }],
          });
          const ans = (msg.content[0]?.text || '').toLowerCase().trim();
          if (ans.startsWith('d')) { signals.push('Haiku: dålig'); quality = 'poor'; }
          else if (ans.startsWith('b') && signals.length < 2) { quality = 'good'; }
        } catch (err) {
          log(`  Haiku-fel hemsida "${biz.name}": ${err.message.split('\n')[0]}`);
        }
      }

      // 1 signal is enough if Haiku didn't actively say "bra"
      if (quality !== 'good' && quality !== 'poor') {
        quality = signals.length >= 1 ? 'poor' : 'ok';
      }

      const sigStr = signals.length ? signals.join(', ') : 'inga varningar';
      log(`  ${quality === 'poor' ? '✓' : quality === 'good' ? '✗' : '~'} ${biz.name} — ${quality} (${sigStr})`);

    } catch (err) {
      log(`  ? ${biz.name} — hemsida otillgänglig: ${err.message.split('\n')[0]}`);
      signals.push('Otillgänglig');
      quality = 'poor'; // Inaccessible site = worth contacting
    }

    results.push({ ...biz, website_quality: quality, website_signals: signals });
    await delay(600 + Math.random() * 400);
  }

  await page.close();
  const poor = results.filter(r => r.website_quality === 'poor').length;
  log(`Hemsidekvalitet klar: ${poor}/${candidates.length} med dålig/föråldrad hemsida`);
  return results;
}

// ─── City Coordinates ─────────────────────────────────────────────────────────

const CITY_COORDS = {
  // Städer / kommuner
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
  mölndal: '57.6557:12.0140',
  // Stadsdelar Göteborg
  hisingen: '57.7200:11.9100',
  'hisings kärra': '57.7780:11.9540',
  'hisings backa': '57.7420:11.9470',
  lindholmen: '57.7081:11.9340',
  majorna: '57.6940:11.9260',
  'centrum göteborg': '57.7089:11.9746',
  kungsbacka: '57.4850:12.0760',
  partille: '57.7390:12.1060',
  // Stadsdelar Stockholm
  södermalm: '59.3140:18.0706',
  östermalm: '59.3380:18.0940',
  kungsholmen: '59.3330:18.0320',
  vasastan: '59.3440:18.0490',
  lidingö: '59.3640:18.1640',
  nacka: '59.3130:18.1630',
  solna: '59.3670:18.0010',
  sundbyberg: '59.3610:17.9710',
  // Stadsdelar Malmö
  limhamn: '55.5800:12.9320',
  husie: '55.5790:13.0740',
};

// For sub-areas: which municipality name to use in the hitta.se ?var= parameter
const CITY_VAR_OVERRIDE = {
  hisingen: 'Göteborg',
  'hisings kärra': 'Göteborg',
  'hisings backa': 'Göteborg',
  lindholmen: 'Göteborg',
  majorna: 'Göteborg',
  'centrum göteborg': 'Göteborg',
  kungsbacka: 'Kungsbacka',
  partille: 'Partille',
  södermalm: 'Stockholm',
  östermalm: 'Stockholm',
  kungsholmen: 'Stockholm',
  vasastan: 'Stockholm',
  lidingö: 'Lidingö',
  nacka: 'Nacka',
  solna: 'Solna',
  sundbyberg: 'Sundbyberg',
  limhamn: 'Malmö',
  husie: 'Malmö',
};

function getCityCoords(city) {
  const key = city.toLowerCase().trim();
  return CITY_COORDS[key] || null;
}

function getCityVar(city) {
  const key = city.toLowerCase().trim();
  return CITY_VAR_OVERRIDE[key] || city;
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
    const areaEnd = num.startsWith('08') ? 2 : 3;
    const area = num.slice(0, areaEnd);
    const rest = num.slice(areaEnd);
    const parts = rest.match(/.{1,2}/g) || [rest];
    return `${area}-${parts.join(' ')}`;
  }
  return num;
}

// ─── Hitta.se Scraper ─────────────────────────────────────────────────────────

async function scrapeHitta(browser, industry, city, maxResults, mode = 'no_website', skipNames = new Set(), skipPhones = new Set()) {
  log(`Scrapar hitta.se för "${industry}" i ${city}...`);

  const coords = getCityCoords(city);
  const varCity = getCityVar(city);
  if (!coords) {
    log(`  Varning: Inga koordinater för "${city}", söker utan geo-filter`);
  } else if (varCity !== city) {
    log(`  Stadsdel "${city}" → söker under "${varCity}" med geo.hint`);
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
    const url = `https://www.hitta.se/s%C3%B6k?vad=${encodeURIComponent(industry)}&var=${encodeURIComponent(varCity)}&typ=ftg&sida=${pageNum}${geoParam}`;
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

            // Industry/category label on the card
            const catEl = card.querySelector('[class*="category"] span, [class*="bransch"], [class*="label"] span, [class*="type"] span, [class*="subtitle"]');
            const category = catEl ? catEl.textContent.trim() : '';

            // Phone — extract from revealNumber href param (full number encoded)
            const phoneReveal = card.querySelector('a[href*="revealNumber"]');
            const phoneTel = card.querySelector('a[href^="tel:"]');
            const phoneHref = phoneReveal?.href || phoneTel?.href || '';

            // Org number from card (rarely shown, but check)
            const orgText = card.textContent.match(/(\d{6}-\d{4})/);
            const orgNumber = orgText ? orgText[1] : '';

            // Website detection — multiple signals:
            // 1. Direct external links (not hitta.se or known non-website domains)
            const NON_WEBSITE_DOMAINS = ['google.com', 'maps.google', 'facebook.com', 'instagram.com',
              'linkedin.com', 'twitter.com', 'youtube.com', 'yelp.com', 'trustpilot.com',
              'blocket.se', 'ratsit.se', 'allabolag.se', 'uc.se', 'eniro.se'];
            const hasDirectLink = Array.from(card.querySelectorAll('a')).some(a => {
              const h = a.href || '';
              return (h.startsWith('http://') || h.startsWith('https://')) &&
                     !h.includes('hitta.se') && !h.includes('cdn.') &&
                     !h.startsWith('tel:') && !h.startsWith('mailto:') &&
                     !NON_WEBSITE_DOMAINS.some(d => h.includes(d));
            });
            // 2. Hitta redirect/proxy website links
            const hasRedirectLink = Array.from(card.querySelectorAll('a')).some(a => {
              const h = a.href || '';
              const label = (a.textContent + (a.getAttribute('aria-label') || '')).toLowerCase();
              return (h.includes('exitUrl') || h.includes('redir') || label.includes('hemsida') || label.includes('webbplats')) && h.length > 10;
            });
            // 3. Explicit website icon/element
            const hasWebsiteEl = !!(
              card.querySelector('[aria-label*="hemsida"], [aria-label*="webbplats"], [aria-label*="website"], [title*="hemsida"]')
            );
            // 4. Raw www. URL text in card (sometimes shown as plain text)
            const hasWwwText = /\bwww\.[a-zåäö0-9-]{2,}\.[a-z]{2,}/i.test(card.textContent);

            const hasWebsite = hasDirectLink || hasRedirectLink || hasWebsiteEl || hasWwwText;
            const websiteReason = hasWebsite
              ? (hasDirectLink ? 'directLink' : hasRedirectLink ? 'redirectLink' : hasWebsiteEl ? 'websiteEl' : 'wwwText')
              : null;

            // Company detail URL (used for cross-verification)
            const detailLink = card.querySelector('a[href*="/verksamhet/"]:not([href*="revealNumber"])');
            const detailUrl = detailLink ? detailLink.href : '';

            // Card-level URL extraction (best-effort; detail page gives accurate URL)
            let websiteUrl = '';
            const exitA = Array.from(card.querySelectorAll('a[href]')).find(a => a.href.includes('exitUrl'));
            if (exitA) {
              const m = exitA.href.match(/exitUrl=([^&]+)/);
              if (m) { try { websiteUrl = decodeURIComponent(m[1]); } catch { websiteUrl = m[1]; } }
            }
            items.push({ name, address, category, phoneHref, orgNumber, hasWebsite, websiteReason, websiteUrl, detailUrl });
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

      // In weak_website mode we collect ALL items (URL extraction happens later via detail pages).
      // In no_website mode we only collect items where the card shows no website.
      const targetItems = mode === 'weak_website'
        ? pageData.items
        : pageData.items.filter(i => !i.hasWebsite);

      if (mode === 'no_website') {
        const withWebsite = pageData.items.filter(i => i.hasWebsite);
        log(`  hitta.se sida ${pageNum}: ${pageData.cardCount} kort, ${targetItems.length} utan hemsida`);
        for (const w of withWebsite) {
          log(`  ~ ${w.name} — hemsida detekterad (${w.websiteReason})`);
        }
      } else {
        log(`  hitta.se sida ${pageNum}: ${pageData.cardCount} kort, samlar alla för hemsidekoll`);
      }

      for (const item of targetItems) {
        if (results.length >= maxResults) break;

        if (skipNames.has((item.name || '').toLowerCase())) {
          log(`  ~ ${item.name} — redan sparad, hoppar över`);
          continue;
        }

        const itemPhone = parseRevealPhone(item.phoneHref).replace(/\D/g, '').slice(-9);
        if (itemPhone && itemPhone.length >= 8 && skipPhones.has(itemPhone)) {
          log(`  ~ ${item.name} — telefon redan sparad, hoppar över`);
          continue;
        }

        // Soft industry check
        if (item.category) {
          const norm = s => s.toLowerCase().replace(/[åä]/g, 'a').replace(/ö/g, 'o').replace(/[^a-z0-9 ]/g, '');
          const cat = norm(item.category);
          const ind = norm(industry);
          const indWords = ind.split(' ').filter(w => w.length > 3);
          const catWords = cat.split(' ').filter(w => w.length > 3);
          const overlap = indWords.some(w => cat.includes(w)) || catWords.some(w => ind.includes(w));
          if (!overlap && item.category.length > 3) {
            log(`  ~ ${item.name} (bransch "${item.category}" matchar inte "${industry}", hoppar över)`);
            continue;
          }
        }

        results.push({
          name: item.name,
          phone: parseRevealPhone(item.phoneHref),
          address: item.address,
          category: item.category,
          org_number: item.orgNumber,
          has_website: mode === 'weak_website' ? (item.hasWebsite || false) : false,
          website_url: item.websiteUrl || '',
          detail_url: item.detailUrl,
          source: 'hitta',
        });
        log(`  + ${item.name}${item.category ? ` [${item.category}]` : ''} (${parseRevealPhone(item.phoneHref) || 'inget tel'})`);
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
  log(`hitta.se klart: ${results.length} ${mode === 'weak_website' ? 'kandidater för hemsidekoll' : 'bekräftade företag utan hemsida'}`);
  return results;
}

// ─── Google Maps Scraper ──────────────────────────────────────────────────────

async function scrapeGoogleMaps(browser, industry, city, maxResults, hittaResults = [], mode = 'no_website', skipPhones = new Set()) {
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
        document.querySelectorAll('[role="feed"] a[href*="/maps/place/"]').length
      );

      if (count === prevCount) stableRounds++;
      else { stableRounds = 0; prevCount = count; }

      if (count >= maxResults * 3) break;
    }

    // Step 3: collect all place URLs (deduplicated, skip sponsored ads)
    const placeUrls = await page.evaluate(() => {
      const links = document.querySelectorAll('[role="feed"] a[href*="/maps/place/"]');
      return [...new Set(Array.from(links).map(a => a.href))];
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
        const mapsUrl = page.url();

        const data = await page.evaluate(() => {
          const h1 = document.querySelector('h1');
          const name = h1 ? h1.textContent.trim() : document.title.split(' – ')[0].trim();
          const addrEl = document.querySelector('[data-item-id="address"]');
          const address = addrEl ? addrEl.textContent.trim() : '';
          const phoneEl = document.querySelector('[data-item-id^="phone:"]');
          const phone = phoneEl ? phoneEl.textContent.trim() : '';

          // Website detection: only use Maps-specific selectors. The broad "any external link"
          // check was removed because Maps pages often show booking/delivery links that are
          // NOT the company's own website, causing false positives. Haiku catches the rest.
          const hasWebsite = !!(
            document.querySelector('[data-item-id="authority"]') ||
            document.querySelector('a[aria-label*="ebbplats"], a[aria-label*="ebsite"], a[aria-label*="Hemsida"]')
          );

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

          // Extract website URL when present (used by weak_website mode)
          let websiteUrl = '';
          if (hasWebsite) {
            const authEl = document.querySelector('[data-item-id="authority"]');
            if (authEl) websiteUrl = authEl.href || (authEl.querySelector('a') || {}).href || '';
            if (!websiteUrl) {
              const ariaEl = document.querySelector('a[aria-label*="ebbplats"], a[aria-label*="ebsite"], a[aria-label*="Hemsida"]');
              if (ariaEl) websiteUrl = ariaEl.href || '';
            }
          }

          return { name, address, phone, has_website: hasWebsite, website_url: websiteUrl, google_rating: rating, google_reviews_count: reviewCount, pageText: document.body.innerText.slice(0, 3000) };
        });

        if (!data.name) { await delay(500); continue; }

        // If selector says no website, ask Haiku as backup
        let hasWebsite = data.has_website;
        if (!hasWebsite && process.env.ANTHROPIC_API_KEY) {
          hasWebsite = await haikusHasWebsite(data.pageText, data.name, 'maps');
          if (hasWebsite) log(`  ~ ${data.name} — hemsida hittad av Haiku på Maps`);
        }

        const mapsPhone = (data.phone || '').replace(/\D/g, '').slice(-9);
        const phoneKnown = mapsPhone && mapsPhone.length >= 8 && skipPhones.has(mapsPhone);

        if (mode === 'weak_website') {
          // Collect companies WITH websites
          if (hasWebsite && data.website_url) {
            if (phoneKnown) { log(`  ~ ${data.name} — telefon redan sparad, hoppar över`); }
            else {
              googleProspects.push({ ...data, source: 'google', maps_verified: true, maps_url: mapsUrl });
              log(`  ✓ ${data.name} — ${data.website_url}`);
            }
          }
        } else {
          // no_website: cross-verify hitta candidates and collect Maps-only prospects
          if (hasWebsite) {
            const matched = hittaResults.find(h => namesMatch(h.name, data.name));
            if (matched) {
              confirmedHasWebsite.add(normalize(matched.name));
              log(`  ✗ ${data.name} — har hemsida på Maps, tas bort från hitta-listan`);
            }
          } else if (phoneKnown) {
            log(`  ~ ${data.name} — telefon redan sparad, hoppar över`);
          } else {
            googleProspects.push({ ...data, source: 'google', maps_verified: true, maps_url: mapsUrl });
            log(`  ✓ ${data.name} | ${data.phone} | ${data.google_reviews_count} rec, ${data.google_rating}★`);
          }
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

// ─── Per-company Google Maps Verification ────────────────────────────────────

async function verifyHittaCandidatesOnMaps(browser, candidates, city) {
  if (candidates.length === 0) return candidates;
  log(`\nMaps-verifiering: kollar ${candidates.length} hitta.se-kandidater individuellt...`);

  const page = await browser.newPage();
  await page.setUserAgent(randomUA());
  await page.setViewport({ width: 1280, height: 900 });
  await page.setRequestInterception(true);
  page.on('request', req => {
    if (['image', 'font', 'media'].includes(req.resourceType())) req.abort();
    else req.continue();
  });

  let consentDone = false;
  const verified = [];

  for (const biz of candidates) {
    try {
      const query = `${biz.name} ${city}`;
      await page.goto(
        `https://www.google.com/maps/search/${encodeURIComponent(query)}`,
        { waitUntil: 'domcontentloaded', timeout: 20000 }
      );
      await delay(1000);

      if (!consentDone) {
        try {
          const btn = await page.$('button[jsname="b3VHJd"]');
          if (btn) { await btn.click(); await delay(1500); }
        } catch {}
        consentDone = true;
      }

      await page.waitForSelector('h1, [role="feed"]', { timeout: 8000 }).catch(() => {});

      // Only act on a direct place match — if Maps shows a list we can't
      // be sure the first result is the right company, so keep the candidate.
      const hasFeed = await page.$('[role="feed"]');
      if (hasFeed) {
        verified.push(biz);
        log(`  ? ${biz.name} — Maps visade lista, behåller`);
        await delay(400);
        continue;
      }

      const result = await page.evaluate(() => {
        const h1 = document.querySelector('h1');
        const hasWebsite = !!(
          document.querySelector('[data-item-id="authority"]') ||
          document.querySelector('a[aria-label*="ebbplats"], a[aria-label*="ebsite"], a[aria-label*="Hemsida"]')
        );
        return {
          pageName: h1 ? h1.textContent.trim() : '',
          hasWebsite,
          pageText: document.body.innerText.slice(0, 3000),
        };
      });

      if (result.pageName && namesMatch(biz.name, result.pageName)) {
        let hasWebsite = result.hasWebsite;
        if (!hasWebsite && process.env.ANTHROPIC_API_KEY) {
          hasWebsite = await haikusHasWebsite(result.pageText, biz.name, 'maps');
          if (hasWebsite) log(`  ✗ ${biz.name} — hemsida hittad av Haiku (individuell Maps-koll)`);
        }
        if (hasWebsite) {
          log(`  ✗ ${biz.name} — hemsida bekräftad på Google Maps`);
        } else {
          verified.push({ ...biz, maps_verified: true, maps_url: page.url() });
          log(`  ✓ ${biz.name} — ingen hemsida på Maps`);
        }
      } else {
        verified.push(biz);
        log(`  ? ${biz.name} — ingen direkt Maps-träff, behåller`);
      }

      await delay(600 + Math.random() * 400);
    } catch (err) {
      log(`  ? ${biz.name} — Maps-fel: ${err.message.split('\n')[0]}, behåller`);
      verified.push(biz);
    }
  }

  await page.close();
  log(`Maps-verifiering klar: ${candidates.length - verified.length} borttagna, ${verified.length} kvar`);
  return verified;
}

// ─── Hitta.se Detail Page Verification ───────────────────────────────────────

async function verifyHittaDetails(browser, candidates) {
  const toCheck = candidates.filter(c => c.detail_url);
  log(`\nDetaljverifiering: ${toCheck.length}/${candidates.length} har detail_url, Haiku: ${process.env.ANTHROPIC_API_KEY ? 'aktivt' : 'saknas'}`);
  if (toCheck.length === 0) return candidates;

  const page = await browser.newPage();
  await page.setUserAgent(randomUA());
  await page.setViewport({ width: 1280, height: 900 });
  await page.setRequestInterception(true);
  page.on('request', req => {
    if (['image', 'font', 'media'].includes(req.resourceType())) req.abort();
    else req.continue();
  });

  const enrichedMap = new Map(); // name → updated biz object

  for (const biz of toCheck) {
    try {
      await page.goto(biz.detail_url, { waitUntil: 'domcontentloaded', timeout: 20000 });
      await delay(700);

      const result = await page.evaluate(() => {
        const text = document.body.innerText;
        const NON_WEBSITE_DOMAINS = ['google.com', 'maps.google', 'facebook.com', 'instagram.com',
          'linkedin.com', 'twitter.com', 'youtube.com', 'yelp.com', 'trustpilot.com',
          'blocket.se', 'ratsit.se', 'allabolag.se', 'uc.se', 'eniro.se'];

        let hasWebsite = false;
        // 1. Text pattern: "hemsida: https://..." or "webbplats: www...."
        if (/hemsida\s*:?\s*(https?:\/\/|www\.)/i.test(text)) hasWebsite = true;
        if (!hasWebsite && /webbplats\s*:?\s*(https?:\/\/|www\.)/i.test(text)) hasWebsite = true;
        // 2. Explicit aria-label/title links
        if (!hasWebsite && document.querySelector(
          'a[aria-label*="hemsida"], a[aria-label*="webbplats"], ' +
          'a[title*="hemsida"], a[title*="webbplats"]'
        )) hasWebsite = true;
        // 3. "hemsida" text followed by a www. URL nearby
        if (!hasWebsite) {
          const idx = text.toLowerCase().indexOf('hemsida');
          if (idx !== -1 && /www\.[a-z0-9-]+\.[a-z]{2,}/i.test(text.slice(idx, idx + 200))) hasWebsite = true;
        }
        // 4. Hitta.se redirect/proxy links (most common: "Besök hemsida" button)
        if (!hasWebsite) {
          hasWebsite = Array.from(document.querySelectorAll('a[href]')).some(a => {
            const h = a.href || '';
            return h.includes('exitUrl') || h.includes('/redir') || h.includes('redirect=');
          });
        }
        // 5. Any link text that says "hemsida" or "webbplats"
        if (!hasWebsite) {
          hasWebsite = Array.from(document.querySelectorAll('a[href]')).some(a => {
            const t = (a.textContent || a.getAttribute('aria-label') || '').toLowerCase();
            const h = a.href || '';
            return h.length > 10 && (t.includes('hemsida') || t.includes('webbplats'));
          });
        }
        // Also grab org number while we're here — feeds allabolag Path 1
        const orgMatch = text.match(/(\d{6}-\d{4})/);
        return { hasWebsite, orgNumber: orgMatch ? orgMatch[1] : '', pageText: text.slice(0, 3000) };
      });

      // If heuristics say no website, ask Haiku as a second opinion
      let hasWebsite = result.hasWebsite;
      if (!hasWebsite && process.env.ANTHROPIC_API_KEY) {
        hasWebsite = await haikusHasWebsite(result.pageText, biz.name);
        if (hasWebsite) log(`  ✗ ${biz.name} — hemsida hittad av Haiku`);
      }

      if (hasWebsite) {
        log(`  ✗ ${biz.name} — hemsida på detaljsida`);
      } else {
        const updated = result.orgNumber && !biz.org_number
          ? { ...biz, org_number: result.orgNumber }
          : biz;
        if (result.orgNumber && !biz.org_number) log(`  ✓ ${biz.name} — ingen hemsida, org ${result.orgNumber}`);
        else log(`  ✓ ${biz.name} — ingen hemsida bekräftad`);
        enrichedMap.set(normalize(biz.name), updated);
      }
    } catch (err) {
      log(`  ? ${biz.name} — verifieringsfel: ${err.message.split('\n')[0]}`);
      enrichedMap.set(normalize(biz.name), biz);
    }
    await delay(900 + Math.random() * 400);
  }

  // Preserve order; candidates without detail_url pass through unchanged
  await page.close();
  const filtered = candidates
    .filter(c => !c.detail_url || enrichedMap.has(normalize(c.name)))
    .map(c => enrichedMap.get(normalize(c.name)) ?? c);

  const removed = candidates.length - filtered.length;
  log(`Detaljverifiering klar: ${removed} extra borttagna, ${filtered.length} av ${candidates.length} kvar`);
  return filtered;
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

  let cookiesAccepted = false;
  const enriched = [];

  for (let i = 0; i < businesses.length; i++) {
    const biz = businesses[i];
    log(`  Allabolag ${i + 1}/${businesses.length}: "${biz.name}"`);

    let onCompanyPage = false;

    // Path 1: direct URL via org number — most reliable, skip search entirely
    if (biz.org_number) {
      const orgClean = biz.org_number.replace(/\D/g, '');
      if (orgClean.length === 10) {
        try {
          await page.goto(`https://www.allabolag.se/${orgClean}`, {
            waitUntil: 'domcontentloaded', timeout: 20000,
          });
          await delay(700);
          const url = page.url();
          // Old format: /NNNNNNNNNN/  — new format: /foretag/{slug}/.../{hash}
          onCompanyPage = /\/\d{10}(\/|$)/.test(url) ||
            (url.includes('allabolag.se/foretag/') && !url.includes('/foretag-s'));
          log(`    → Path1 URL: ${url} → ${onCompanyPage ? 'OK' : 'ej bolagssida'}`);
        } catch (e) {
          log(`    → Path1 fel: ${e.message.split('\n')[0]}`);
        }
      }
    }

    // Path 2: use allabolag homepage search form (resilient against URL changes)
    if (!onCompanyPage) {
      try {
        // Use /what/ URL — redirects to bransch-sökning which lists company cards
        await page.goto(
          `https://www.allabolag.se/what/${encodeURIComponent(biz.name)}`,
          { waitUntil: 'domcontentloaded', timeout: 20000 }
        );
        await delay(800);

        if (!cookiesAccepted) {
          try {
            await page.evaluate(() => {
              const btn = document.querySelector(
                '#CybotCookiebotDialogBodyLevelButtonLevelOptinAllowAll, ' +
                'button[id*="accept-all"], button[class*="accept"], ' +
                'button[aria-label*="ccept"], [class*="consent"] button'
              );
              if (btn) btn.click();
            });
            await delay(600);
          } catch {}
          cookiesAccepted = true;
        }

        const searchLanded = page.url();
        log(`    → Sök-URL: ${searchLanded}`);

        // Match both old /NNNNNNNNNN/ and new /foretag/{slug}/{city}/{cat}/{hash} formats.
        // Prefer a link whose anchor text contains the first word of the company name.
        const { companyHref, linkCount } = await page.evaluate((name) => {
          const norm = s => s.toLowerCase().replace(/[åä]/g, 'a').replace(/ö/g, 'o').replace(/[^a-z0-9 ]/g, '');
          const firstWord = norm(name).split(' ').find(w => w.length > 3) || norm(name).split(' ')[0];
          const isCompanyHref = h =>
            /\/\d{10}(\/|$)/.test(h) ||
            (/\/foretag\/[^/]+\/[^/]+\/[^/]+\/[A-Za-z0-9]{8,}/.test(h) && !h.includes('/foretag-s'));

          const all = Array.from(document.querySelectorAll('a[href]'));
          // First pass: find link whose visible text matches the company name
          const exact = all.find(a =>
            isCompanyHref(a.getAttribute('href') || '') &&
            norm(a.textContent || '').includes(firstWord)
          );
          // Fallback: first any company-format link
          const fallback = all.find(a => isCompanyHref(a.getAttribute('href') || ''));
          const a = exact || fallback;
          return { companyHref: a ? a.href : null, linkCount: all.length };
        }, biz.name).catch(() => ({ companyHref: null, linkCount: 0 }));

        log(`    → ${linkCount} länkar, bolagslänk: ${companyHref || 'ingen hittad'}`);

        if (companyHref) {
          await page.goto(companyHref, { waitUntil: 'domcontentloaded', timeout: 20000 });
          await delay(800);
          onCompanyPage = true;
          log(`    → Navigerade till: ${page.url()}`);
        }
      } catch (e) {
        log(`    → Path2 fel: ${e.message.split('\n')[0]}`);
      }
    }

    if (!onCompanyPage) {
      log(`    → Hittade inte "${biz.name}" på allabolag, hoppar över`);
      enriched.push({ ...biz, revenue: 0, employees: biz.employees || 0, profit_positive: false, years_in_business: 0 });
      await randomDelay();
      continue;
    }

    try {
      const fin = await page.evaluate(() => {
        const text = document.body.innerText;

        // Read the numeric value that appears right after a label (same line or next line).
        // allabolag.se renders key figures as "Label\nValue unit" or "Label: Value unit".
        function extractAfterLabel(labels) {
          for (const label of labels) {
            const esc = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

            // Format 1 (primary): "Label\t5 934" — allabolag tab-separates value on same line
            const tabM = text.match(new RegExp(esc + '\\s*\\t\\s*(-?\\d[\\d\\s]*(?:[,.]\\d+)?)', 'i'));
            if (tabM) {
              const n = parseFloat(tabM[1].replace(/\s+/g, '').replace(',', '.'));
              if (!isNaN(n) && n > 0) return { n, unit: 'tkr' };
            }

            // Format 2 (fallback): "Label\n2025   8 499 tkr" — year before value+unit
            const idx = text.search(new RegExp(esc, 'i'));
            if (idx === -1) continue;
            const slice = text.slice(idx + label.length, idx + label.length + 200);
            const unitM = slice.match(/(?:(?:19|20)\d{2}\s+)?(-?\d[\d\s]*(?:[,.]\d+)?)\s*(tkr|kkr|mnkr|msek)/i);
            if (unitM) {
              const n = parseFloat(unitM[1].replace(/\s+/g, '').replace(',', '.'));
              if (!isNaN(n) && n > 0) return { n, unit: unitM[2].toLowerCase() };
            }
          }
          return null;
        }

        // Revenue — allabolag shows values in tkr (thousands of SEK) by default
        let revenue = 0;
        const rev = extractAfterLabel([
          'Nettoomsättning', 'Omsättning', 'Rörelsens intäkter',
        ]);
        if (rev && rev.n > 0) {
          revenue = /mnkr|msek/.test(rev.unit) ? rev.n * 1_000_000 : rev.n * 1_000;
        }

        // Employees
        let employees = 0;
        const emp = extractAfterLabel([
          'Medelantal anställda', 'Antal anställda', 'Anställda',
        ]);
        if (emp) employees = Math.round(Math.abs(emp.n));
        if (!employees) {
          const m = text.match(/anst[äa]llda\D{0,25}(\d+)/i);
          if (m) employees = parseInt(m[1]) || 0;
        }

        // Profit sign
        let profitPositive = false;
        const profit = extractAfterLabel([
          'Årets resultat', 'Resultat efter finansiella poster', 'Nettoresultat',
        ]);
        if (profit) profitPositive = profit.n > 0;

        // Registration / founding year
        let foundingYear = 0;
        const yearPatterns = [
          /[Rr]egistr(?:erings(?:datum|år)|erad)\s*:?\s*(\d{4})/,
          /[Bb]ildat\s*:?\s*(\d{4})/,
          /[Gg]rundades?\s+(\d{4})/,
          /(\d{4})-\d{2}-\d{2}/,   // ISO date — first occurrence
        ];
        for (const pat of yearPatterns) {
          const m = text.match(pat);
          if (m) {
            const y = parseInt(m[1]);
            if (y >= 1900 && y <= new Date().getFullYear()) { foundingYear = y; break; }
          }
        }

        // JSON-LD structured data as supplementary source
        try {
          for (const s of document.querySelectorAll('script[type="application/ld+json"]')) {
            const j = JSON.parse(s.textContent);
            const node = Array.isArray(j['@graph'])
              ? j['@graph'].find(x => x['@type'] === 'Organization' || x['@type'] === 'LocalBusiness')
              : j;
            if (!node) continue;
            if (node.foundingDate && !foundingYear) {
              const y = parseInt(String(node.foundingDate).slice(0, 4));
              if (y >= 1900) foundingYear = y;
            }
            if (node.numberOfEmployees?.value && !employees) {
              employees = parseInt(node.numberOfEmployees.value) || 0;
            }
          }
        } catch {}

        // Website check — if allabolag lists a website URL for the company, they have one
        let websiteFound = false;
        const webIdx = text.search(/webbplats|hemsida/i);
        if (webIdx !== -1) {
          const webSlice = text.slice(webIdx, webIdx + 200);
          websiteFound = /https?:\/\/[^\s\n]+|www\.[a-z0-9-]+\.[a-z]{2,}/i.test(webSlice);
        }

        return { revenue, employees, profit_positive: profitPositive, founding_year: foundingYear, website_found: websiteFound };
      });

      const yearsInBusiness = fin.founding_year > 1900
        ? new Date().getFullYear() - fin.founding_year
        : 0;

      if (fin.website_found) {
        log(`    → ⚠ Webbplats registrerad på allabolag — filtreras`);
      }

      enriched.push({
        ...biz,
        revenue: fin.revenue,
        employees: fin.employees || biz.employees || 0,
        profit_positive: fin.profit_positive,
        years_in_business: yearsInBusiness,
        website_found: fin.website_found,
      });

      log(
        `    → Omsättning: ${fin.revenue ? Math.round(fin.revenue / 1000) + 'k kr' : 'saknas'}` +
        ` | ${fin.employees || 0} anst.` +
        ` | ${yearsInBusiness || '?'} år` +
        ` | ${fin.profit_positive ? 'vinst ✓' : 'ej vinst'}`
      );

    } catch (err) {
      log(`  FEL allabolag "${biz.name}": ${err.message}`);
      enriched.push({ ...biz, revenue: 0, employees: biz.employees || 0, profit_positive: false, years_in_business: 0 });
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
  return wa.length >= 3 && wb.length >= 3 && (na.includes(wb) || nb.includes(wa));
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
        maps_verified: true,
        maps_url: bestMatch.data.maps_url || h.maps_url || null,
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
  else if (biz.website_quality === 'poor') score += 2;
  if (!biz.maps_verified) score -= 2;
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

async function runScraper({ industry, city, maxResults = 20, mode = 'no_website', onProgress = () => {}, skipNames = new Set(), skipPhones = new Set() }) {
  _logFn = (msg) => { onProgress(msg); };

  const scrapeLimit = Math.min(maxResults * 3, 60);
  const modeLabel = mode === 'weak_website' ? 'svag hemsida' : 'utan hemsida';
  log(`Prospektering: ${industry} i ${city} — läge: ${modeLabel} (samlar ${scrapeLimit} kandidater, returnerar topp ${maxResults})`);

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

  // City filter helper — shared by both modes
  const cityNorm = normalize(city);
  const acceptedLocations = new Set([cityNorm, 'gothenburg', 'goteborg']);
  for (const [area, parent] of Object.entries(CITY_VAR_OVERRIDE)) {
    if (normalize(parent) === cityNorm) acceptedLocations.add(normalize(area));
  }
  const cityFilterFn = (b) => {
    if (!b.address) return true;
    const addr = normalize(b.address);
    if (Array.from(acceptedLocations).some(loc => addr.includes(loc))) return true;
    log(`  ✗ ${b.name} — adress "${b.address}" matchar inte ${city}`);
    return false;
  };

  try {
    // ── weak_website mode ──────────────────────────────────────────────────────
    if (mode === 'weak_website') {
      const TARGET = Math.ceil(maxResults * 1.5); // aim for 30 before allabolag filter
      const allPoor = [];
      const allPoorNames = new Set();
      // runSeenNames: DB names + this run's collected names — prevents hitta from re-collecting
      const runSeenNames = new Set([...skipNames]);

      // Step 1: Google Maps once (popular businesses first)
      const { googleProspects: googleWithWebsite } = await scrapeGoogleMaps(
        browser, industry, city, maxResults, [], 'weak_website', skipPhones
      );
      await randomDelay();
      const filteredGoogle = googleWithWebsite.filter(cityFilterFn);
      if (filteredGoogle.length > 0) {
        const googleQuality = await checkWebsiteQuality(browser, filteredGoogle);
        for (const b of googleQuality) {
          if (b.website_quality === 'poor' && !allPoorNames.has(normalize(b.name))) {
            allPoorNames.add(normalize(b.name));
            runSeenNames.add(normalize(b.name));
            allPoor.push(b);
          }
        }
        log(`Google Maps bidrog: ${allPoor.length} dåliga hemsidor`);
      }

      // Step 2: Hitta.se — paginate in batches until TARGET reached
      // runSeenNames grows each batch so scrapeHitta naturally advances through pages
      const BATCH = 25;
      const MAX_ITERS = 5;

      for (let iter = 0; iter < MAX_ITERS && allPoor.length < TARGET; iter++) {
        log(`\nHitta-batch ${iter + 1}...`);
        const hittaBatch = await scrapeHitta(
          browser, industry, city, BATCH, 'weak_website', runSeenNames, skipPhones
        );
        if (hittaBatch.length === 0) { log('Inga fler hitta-resultat, avslutar.'); break; }

        // Add batch to runSeenNames so next iteration skips these and advances
        for (const b of hittaBatch) runSeenNames.add(normalize(b.name));

        await randomDelay();
        const withUrls = await extractHittaWebsiteUrls(browser, hittaBatch);
        const filtered = withUrls.filter(cityFilterFn);
        if (filtered.length === 0) {
          log(`Hitta-batch ${iter + 1}: inga hemsidor hittades, fortsätter...`);
          continue;
        }

        const qualityChecked = await checkWebsiteQuality(browser, filtered);
        let added = 0;
        for (const b of qualityChecked) {
          if (b.website_quality === 'poor' && !allPoorNames.has(normalize(b.name))) {
            allPoorNames.add(normalize(b.name));
            allPoor.push(b);
            added++;
          }
        }
        log(`Hitta-batch ${iter + 1}: +${added} dåliga → totalt ${allPoor.length}/${TARGET}`);
      }

      if (allPoor.length === 0) {
        log('Inga bolag med dålig hemsida hittades.');
        return [];
      }

      // Step 3: Enrich with allabolag
      const enriched = await enrichWithAllabolag(browser, allPoor);
      const enrichedFiltered = enriched.filter(b => {
        if (b.revenue && b.revenue > 50_000_000) {
          log(`  ✗ ${b.name} — för hög omsättning (${Math.round(b.revenue / 1_000_000)}M kr), tas bort`);
          return false;
        }
        if (b.employees && b.employees > 20) {
          log(`  ✗ ${b.name} — för stor aktör (${b.employees} anst.), tas bort`);
          return false;
        }
        return true;
      });

      log('Beräknar prioritetspoäng...');
      const scored = enrichedFiltered.map(b => ({ ...b, priority_score: calculateScore(b) }));
      scored.sort((a, b) => b.priority_score - a.priority_score);
      const topResults = scored.slice(0, maxResults);
      log(`KLAR! Returnerar topp ${topResults.length} av ${scored.length} bolag med dålig hemsida.`);
      return topResults;
    }

    // ── no_website mode (default) ──────────────────────────────────────────────
    const hittaResults = await scrapeHitta(browser, industry, city, scrapeLimit, 'no_website', skipNames, skipPhones);
    await randomDelay();

    const { googleProspects, confirmedHasWebsite } = await scrapeGoogleMaps(browser, industry, city, maxResults, hittaResults, 'no_website', skipPhones);

    if (confirmedHasWebsite.size > 0) {
      log(`Filtrerar: ${confirmedHasWebsite.size} hitta-bolag bekräftade med hemsida tas bort`);
    }
    const filteredHitta = hittaResults.filter(h => !confirmedHasWebsite.has(normalize(h.name)));

    const verifiedHitta = await verifyHittaDetails(browser, filteredHitta);
    const mapsVerifiedHitta = await verifyHittaCandidatesOnMaps(browser, verifiedHitta, city);

    const filteredHittaByCity = mapsVerifiedHitta.filter(cityFilterFn);
    const filteredGoogleByCity = googleProspects.filter(cityFilterFn);
    const removedByCity = (mapsVerifiedHitta.length + googleProspects.length) - (filteredHittaByCity.length + filteredGoogleByCity.length);
    if (removedByCity > 0) log(`Adressfilter: ${removedByCity} bolag borttagna (fel stad)`);

    const merged = mergeResults(filteredHittaByCity, filteredGoogleByCity);

    if (merged.length === 0) {
      log('Inga företag hittades utan hemsida.');
      return [];
    }

    const enriched = await enrichWithAllabolag(browser, merged);

    const enrichedFiltered = enriched.filter(b => {
      if (b.website_found) {
        log(`  ✗ ${b.name} — webbplats bekräftad på allabolag, tas bort`);
        return false;
      }
      if (b.revenue && b.revenue > 50_000_000) {
        log(`  ✗ ${b.name} — för hög omsättning (${Math.round(b.revenue / 1_000_000)}M kr), tas bort`);
        return false;
      }
      if (b.employees && b.employees > 20) {
        log(`  ✗ ${b.name} — för stor aktör (${b.employees} anst.), tas bort`);
        return false;
      }
      return true;
    });

    log('Beräknar prioritetspoäng...');
    const scored = enrichedFiltered.map(b => ({ ...b, priority_score: calculateScore(b) }));
    scored.sort((a, b) => b.priority_score - a.priority_score);
    const topResults = scored.slice(0, maxResults);
    log(`KLAR! Returnerar topp ${topResults.length} av ${scored.length} undersökta prospekt.`);
    return topResults;

  } finally {
    await browser.close();
  }
}

module.exports = { runScraper };
