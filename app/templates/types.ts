export type TemplateId = 'restaurang' | 'hantverkare' | 'tjansteforetag' | 'verkstad';

export interface MenuItem {
  name: string;
  description: string;
  price: string;
}

export interface ServiceFeature {
  title: string;
  description: string;
}

export interface DemoContent {
  businessName: string;
  tagline: string;
  description: string;
  phone: string;
  email: string;
  address: string;
  logoUrl: string | null;
  heroImageUrl: string | null;
  primaryColor: string;
  // restaurang
  openingHours?: string;
  menuItems?: MenuItem[];
  // hantverkare / verkstad
  serviceList?: string[];
  galleryImages?: string[];
  // verkstad
  brands?: string[];
  // tjansteforetag
  serviceFeatures?: ServiceFeature[];
}

export const TEMPLATE_LABELS: Record<TemplateId, string> = {
  restaurang: 'Restaurang / Café',
  hantverkare: 'Hantverkare',
  tjansteforetag: 'Tjänsteföretag',
  verkstad: 'Verkstad / Däckverkstad',
};

export const TEMPLATE_COLORS: Record<TemplateId, string> = {
  restaurang: '#b5813f',
  hantverkare: '#1e40af',
  tjansteforetag: '#5b21b6',
  verkstad: '#b91c1c',
};

export function defaultContent(template: TemplateId): DemoContent {
  const base = {
    logoUrl: null,
    heroImageUrl: null,
    primaryColor: TEMPLATE_COLORS[template],
    phone: '08-123 45 67',
    email: 'info@example.se',
    address: 'Exempelgatan 1, Stockholm',
  };

  switch (template) {
    case 'restaurang':
      return {
        ...base,
        businessName: 'Café Solsidan',
        tagline: 'Hemlagat med kärlek sedan 1998',
        description: 'Välkommen till ett café där varje besök är en upplevelse. Vi serverar färsk mat och handbryggd kaffe i hjärtat av stan.',
        openingHours: 'Mån–Fre 08:00–18:00 · Lör–Sön 10:00–16:00',
        menuItems: [
          { name: 'Dagens lunch', description: 'Vällagad husmanskost med sallad och bröd', price: '135 kr' },
          { name: 'Smörgås', description: 'Freshbakat bröd med säsongens pålägg', price: '75 kr' },
          { name: 'Kaffe & kaka', description: 'Bryggkaffe och hembakad kaka', price: '65 kr' },
        ],
      };
    case 'hantverkare':
      return {
        ...base,
        businessName: 'Karlssons VVS',
        tagline: 'Snabb och pålitlig service sedan 2005',
        description: 'Vi hjälper privatpersoner och företag med alla typer av VVS-arbeten. Alltid fast pris och nöjd-kund-garanti.',
        serviceList: ['Stambyten', 'Badrumsrenovering', 'Värmepumpar', 'Felavhjälpning', 'Rörinstallation', 'Golvvärme'],
        galleryImages: [],
      };
    case 'tjansteforetag':
      return {
        ...base,
        businessName: 'Nexus Consulting',
        tagline: 'Vi tar ditt företag till nästa nivå',
        description: 'Vi erbjuder strategisk rådgivning och digitala lösningar som skapar verkligt affärsvärde. Från startup till storbolag.',
        serviceFeatures: [
          { title: 'Strategi & Analys', description: 'Datadriven rådgivning som ger tydliga resultat och mätbar tillväxt.' },
          { title: 'Digital Transformation', description: 'Vi moderniserar era processer och system för framtidens krav.' },
          { title: 'Utbildning & Coaching', description: 'Skräddarsydda program som stärker era medarbetares kompetens.' },
        ],
      };
    case 'verkstad':
      return {
        ...base,
        businessName: 'Motorhuset Göteborg',
        tagline: 'Proffs på din bil sedan 1992',
        description: 'Vi utför alla typer av bilservice och reparationer. Certifierade mekaniker, garanterade arbeten och konkurrenskraftiga priser.',
        openingHours: 'Mån–Fre 07:30–17:00 · Lör 09:00–13:00',
        serviceList: ['Däckbyte & balansering', 'Oljebyte & service', 'Bromsar & hjul', 'AC-service', 'Besiktningsförberedelse', 'Felsökning'],
        brands: ['Volvo', 'Saab', 'Ford', 'Toyota', 'BMW', 'Volkswagen'],
      };
  }
}
