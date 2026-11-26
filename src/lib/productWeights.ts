/**
 * CLIENT FACTORY PRODUCT WEIGHT MASTER CATALOG
 * Source of truth from client's official factory standard specification sheet.
 * Used across Recipe Master, Daily Production, Delivery Challans & Stock Forecasts.
 */

export interface FactoryProductSpec {
  id: string;
  code: string;
  name: string;
  nameHindi: string;
  category: 'PAVER' | 'DIVIDER' | 'TILE';
  thicknessMm: number | null;
  standardWeightKg: number;
  weightRange?: { min: number; max: number };
  keywords: string[];
}

export const CLIENT_FACTORY_PRODUCTS: FactoryProductSpec[] = [
  // 1. Paver Blocks (60mm & 80mm)
  {
    id: 'i-shape-60',
    code: 'PAV-I-60',
    name: 'I-Shape 60mm Paver',
    nameHindi: 'आई-शेप पेवर (60mm)',
    category: 'PAVER',
    thicknessMm: 60,
    standardWeightKg: 3.50,
    keywords: ['i shape 60', 'i-shape 60', 'i shap 60', 'i-shap 60', 'ishape 60', 'i shape 60mm'],
  },
  {
    id: 'i-shape-80',
    code: 'PAV-I-80',
    name: 'I-Shape 80mm Paver',
    nameHindi: 'आई-शेप पेवर (80mm)',
    category: 'PAVER',
    thicknessMm: 80,
    standardWeightKg: 4.50,
    weightRange: { min: 4.48, max: 4.50 },
    keywords: ['i shape 80', 'i-shape 80', 'i shap 80', 'i-shap 80', 'ishape 80', 'i shape 80mm'],
  },
  {
    id: 'single-stone-lock',
    code: 'PAV-SSL',
    name: 'Single Stone Lock [SSL]',
    nameHindi: 'सिंगल स्टोन लॉक [SSL]',
    category: 'PAVER',
    thicknessMm: 60,
    standardWeightKg: 4.81,
    keywords: ['ssl', 'single stone lock', 'single stone'],
  },
  {
    id: 'square-60',
    code: 'PAV-SQR-60',
    name: 'Square 60mm Paver',
    nameHindi: 'स्कवायर पेवर (60mm)',
    category: 'PAVER',
    thicknessMm: 60,
    standardWeightKg: 5.12,
    weightRange: { min: 5.10, max: 5.15 },
    keywords: ['square 60', 'स्कवायर', 'square 60mm', 'sqr 60'],
  },
  {
    id: 'dd-60',
    code: 'PAV-DD-60',
    name: 'D.D. 60mm Paver',
    nameHindi: 'डी.डी. पेवर (60mm)',
    category: 'PAVER',
    thicknessMm: 60,
    standardWeightKg: 5.59,
    keywords: ['d.d. 60', 'dd 60', 'd.d. 60mm', 'dd 60mm', 'd.d', 'dd'],
  },
  {
    id: 'diamond-60',
    code: 'PAV-DIA-60',
    name: 'Diamond 60mm Paver',
    nameHindi: 'डायमण्ड पेवर (60mm)',
    category: 'PAVER',
    thicknessMm: 60,
    standardWeightKg: 4.49,
    keywords: ['diamond 60', 'डायमण्ड', 'diamond 60mm', 'dimond'],
  },
  {
    id: 'arrow-60',
    code: 'PAV-ARR-60',
    name: 'Arrow 60mm Paver',
    nameHindi: 'एरो पेवर (60mm)',
    category: 'PAVER',
    thicknessMm: 60,
    standardWeightKg: 3.35,
    keywords: ['arrow 60', 'एरो', 'arrow 60mm', 'arrow'],
  },
  {
    id: 'bricks',
    code: 'PAV-BRK',
    name: 'Bricks Paver',
    nameHindi: 'ब्रिक्स पेवर (ईंट ब्लॉक)',
    category: 'PAVER',
    thicknessMm: 60,
    standardWeightKg: 2.50,
    keywords: ['bricks', 'brick', 'ब्रिक्स'],
  },
  {
    id: 'yoga-60',
    code: 'PAV-YOG-60',
    name: 'Yoga 60mm Paver',
    nameHindi: 'योग पेवर (60mm)',
    category: 'PAVER',
    thicknessMm: 60,
    standardWeightKg: 5.05,
    keywords: ['yoga 60', 'योग 60', 'yoga 60mm', 'yog 60'],
  },
  {
    id: 'zigzag-80',
    code: 'PAV-ZZ-80',
    name: 'Zig-Zag 80mm Paver',
    nameHindi: 'जिग-जैग पेवर (80mm)',
    category: 'PAVER',
    thicknessMm: 80,
    standardWeightKg: 5.50,
    keywords: ['zigzag 80', 'zig zag 80', 'zigzag 80mm', 'zig-zag 80', 'जिग-जैग'],
  },
  {
    id: 'yoga-80',
    code: 'PAV-YOG-80',
    name: 'Yoga 80mm Paver',
    nameHindi: 'योग पेवर (80mm)',
    category: 'PAVER',
    thicknessMm: 80,
    standardWeightKg: 6.20,
    keywords: ['yoga 80', 'योग 80', 'yoga 80mm', 'yog 80'],
  },
  {
    id: 'cobble-60',
    code: 'PAV-COB-60',
    name: 'Cobble 60mm Paver',
    nameHindi: 'कोबेल पेवर (60mm)',
    category: 'PAVER',
    thicknessMm: 60,
    standardWeightKg: 5.50,
    keywords: ['cobble 60', 'कोबेल', 'cobble 60mm', 'cobble'],
  },

  // 2. Dividers / Kerbstones
  {
    id: 'divider-300-300-100',
    code: 'DIV-303010',
    name: 'Divider 300x300x100 mm',
    nameHindi: 'डिवाइडर 300x300x100 mm',
    category: 'DIVIDER',
    thicknessMm: 100,
    standardWeightKg: 22.90,
    keywords: ['300x300x100', '300 x 300 x 100', 'divider 300x300x100', 'kerbstone 300x300x100'],
  },
  {
    id: 'divider-300-300-150',
    code: 'DIV-303015',
    name: 'Divider 300x300x150 mm',
    nameHindi: 'डिवाइडर 300x300x150 mm',
    category: 'DIVIDER',
    thicknessMm: 150,
    standardWeightKg: 24.50,
    keywords: ['300x300x150', '300 x 300 x 150', 'divider 300x300x150', 'kerbstone 300x300x150'],
  },
  {
    id: 'divider-400-300-150',
    code: 'DIV-403015',
    name: 'Divider 400x300x150 mm',
    nameHindi: 'डिवाइडर 400x300x150 mm',
    category: 'DIVIDER',
    thicknessMm: 150,
    standardWeightKg: 45.00,
    keywords: ['400x300x150', '400 x 300 x 150', 'divider 400x300x150', 'kerbstone 400x300x150'],
  },
  {
    id: 'divider-450-300-150',
    code: 'DIV-453015',
    name: 'Divider 450x300x150 mm',
    nameHindi: 'डिवाइडर 450x300x150 mm',
    category: 'DIVIDER',
    thicknessMm: 150,
    standardWeightKg: 47.00,
    keywords: ['450x300x150', '450 x 300 x 150', 'divider 450x300x150', 'kerbstone 450x300x150'],
  },

  // 3. Tiles
  {
    id: 'chequered-tiles',
    code: 'TIL-CHQ',
    name: 'Chequered Tiles',
    nameHindi: 'चेकर्ड टाइल्स',
    category: 'TILE',
    thicknessMm: 25,
    standardWeightKg: 2.95,
    weightRange: { min: 2.90, max: 3.00 },
    keywords: ['chequered', 'chequered tile', 'चेकर्ड', 'checkered', 'चेकर्ड टाइल्स'],
  },
];

/**
 * Find matching product specification from name or code query
 */
export function findFactoryProduct(query: string | null | undefined): FactoryProductSpec | null {
  if (!query || typeof query !== 'string') return null;
  const clean = query.trim().toLowerCase();
  // Normalized string with spaces and punctuation removed for fuzzy matching
  const norm = clean.replace(/[\s\-_.]+/g, '').replace(/mm/g, 'm');

  for (const prod of CLIENT_FACTORY_PRODUCTS) {
    const prodName = prod.name.toLowerCase();
    const prodCode = prod.code.toLowerCase();
    const prodNorm = prodName.replace(/[\s\-_.]+/g, '').replace(/mm/g, 'm');
    const prodCodeNorm = prodCode.replace(/[\s\-_.]+/g, '').replace(/mm/g, 'm');

    if (prodName === clean || prodCode === clean || prodNorm === norm || prodCodeNorm === norm) {
      return prod;
    }
    for (const kw of prod.keywords) {
      const kwNorm = kw.toLowerCase().replace(/[\s\-_.]+/g, '').replace(/mm/g, 'm');
      if (clean.includes(kw) || norm.includes(kwNorm)) {
        return prod;
      }
    }
  }

  // Fallback checks with normalized string
  if (norm.includes('ishape60') || norm.includes('i-shape60') || norm.includes('ishap60') || norm.includes('i60')) {
    return CLIENT_FACTORY_PRODUCTS.find((p) => p.id === 'i-shape-60') || null;
  }
  if (norm.includes('ishape80') || norm.includes('i-shape80') || norm.includes('ishap80') || norm.includes('i80')) {
    return CLIENT_FACTORY_PRODUCTS.find((p) => p.id === 'i-shape-80') || null;
  }
  if (norm.includes('singlestone') || norm.includes('ssl')) {
    return CLIENT_FACTORY_PRODUCTS.find((p) => p.id === 'single-stone-lock') || null;
  }
  if (norm.includes('square') || clean.includes('स्कवायर')) {
    return CLIENT_FACTORY_PRODUCTS.find((p) => p.id === 'square-60') || null;
  }
  if (norm.includes('dd') || clean.includes('d.d')) {
    return CLIENT_FACTORY_PRODUCTS.find((p) => p.id === 'dd-60') || null;
  }
  if (norm.includes('diamond') || clean.includes('डायमण्ड')) {
    return CLIENT_FACTORY_PRODUCTS.find((p) => p.id === 'diamond-60') || null;
  }
  if (norm.includes('arrow') || clean.includes('एरो')) {
    return CLIENT_FACTORY_PRODUCTS.find((p) => p.id === 'arrow-60') || null;
  }
  if (norm.includes('brick') || clean.includes('ब्रिक्स')) {
    return CLIENT_FACTORY_PRODUCTS.find((p) => p.id === 'bricks') || null;
  }
  if (norm.includes('yoga60') || clean.includes('योग 60')) {
    return CLIENT_FACTORY_PRODUCTS.find((p) => p.id === 'yoga-60') || null;
  }
  if (norm.includes('yoga80') || clean.includes('योग 80')) {
    return CLIENT_FACTORY_PRODUCTS.find((p) => p.id === 'yoga-80') || null;
  }
  if (norm.includes('zigzag') || clean.includes('जिग-जैग')) {
    return CLIENT_FACTORY_PRODUCTS.find((p) => p.id === 'zigzag-80') || null;
  }
  if (norm.includes('cobble') || clean.includes('कोबेल')) {
    return CLIENT_FACTORY_PRODUCTS.find((p) => p.id === 'cobble-60') || null;
  }
  if (clean.includes('kerb') || clean.includes('divider') || clean.includes('डिवाइडर') || norm.includes('divider')) {
    if (norm.includes('100')) return CLIENT_FACTORY_PRODUCTS.find((p) => p.id === 'divider-300-300-100') || null;
    if (norm.includes('400')) return CLIENT_FACTORY_PRODUCTS.find((p) => p.id === 'divider-400-300-150') || null;
    if (norm.includes('450')) return CLIENT_FACTORY_PRODUCTS.find((p) => p.id === 'divider-450-300-150') || null;
    return CLIENT_FACTORY_PRODUCTS.find((p) => p.id === 'divider-300-300-150') || null;
  }
  if (norm.includes('tile') || norm.includes('chequered') || clean.includes('टाइल') || clean.includes('चेकर्ड')) {
    return CLIENT_FACTORY_PRODUCTS.find((p) => p.id === 'chequered-tiles') || null;
  }

  return null;
}

/**
 * Get standard finished piece weight in kg for a product
 */
export function getProductPieceWeight(productNameOrCode: string | null | undefined, fallbackKg = 3.50): number {
  const spec = findFactoryProduct(productNameOrCode);
  return spec ? spec.standardWeightKg : fallbackKg;
}

/**
 * Calculate expected batch pieces based on dry raw material weight and particular piece weight
 * Effective dry concrete output = Dry Batch * (1 - wastage)
 * Target Units = Math.round(Effective Output / Piece Weight)
 */
export function calculateBatchUnitsFromDryWeight(
  dryBatchWeightKg: number,
  pieceWeightKg: number,
  wastagePct = 3.25
): number {
  if (pieceWeightKg <= 0 || dryBatchWeightKg <= 0) return 1;
  const effectiveDryOutput = dryBatchWeightKg * (1 - wastagePct / 100);
  const calculatedPcs = Math.round(effectiveDryOutput / pieceWeightKg);
  return calculatedPcs > 0 ? calculatedPcs : 1;
}
