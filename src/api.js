// ═══════════════════════════════════════════════════════════
//  EXTERNE API-AUFRUFE — Open Food Facts
// ═══════════════════════════════════════════════════════════

const OFFBaseUrl = 'https://world.openfoodfacts.org';

/**
 * Sucht nach Lebensmitteln in der Open Food Facts API.
 * Gibt ein Array von food-Objekten zurück (oder [] bei Fehler/Offline).
 */
export async function searchOnlineFood(query) {
  const url = `${OFFBaseUrl}/cgi/search.pl?`
    + `search_terms=${encodeURIComponent(query)}`
    + `&action=process&json=1`
    + `&fields=product_name,nutriments,code,image_small_url`
    + `&page_size=8&lc=de&cc=de`;

  const resp = await fetch(url, { signal: AbortSignal.timeout(6000) });
  const data = await resp.json();

  return (data.products || [])
    .filter(p => p.product_name && p.nutriments?.carbohydrates_100g != null)
    .map(p => ({
      id:        'off_' + p.code,
      name:      p.product_name,
      khPer100g: Math.round(p.nutriments.carbohydrates_100g * 10) / 10,
      emoji:     '🌍',
      source:    'online',
      barcode:   p.code,
    }));
}

/**
 * Sucht ein Produkt über den Barcode (EAN).
 * Gibt ein food-Objekt zurück oder null bei nicht gefunden.
 */
export async function lookupBarcodeOnline(code) {
  const url = `${OFFBaseUrl}/api/v0/product/${code}.json`
    + `?fields=product_name,nutriments,code`;

  const resp = await fetch(url, { signal: AbortSignal.timeout(8000) });
  const data = await resp.json();

  if (data.status !== 1 || !data.product?.product_name) return null;

  const p  = data.product;
  const kh = p.nutriments?.carbohydrates_100g;
  if (kh == null) return null;

  return {
    id:        'off_' + code,
    name:      p.product_name,
    khPer100g: Math.round(kh * 10) / 10,
    emoji:     '🌍',
    source:    'online',
    barcode:   code,
  };
}
