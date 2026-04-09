// ═══════════════════════════════════════════════════════════
//  EXTERNE API-AUFRUFE — Open Food Facts + Claude AI + Nightscout
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

// ── Claude AI — KH-Schätzung ───────────────────────────────

/**
 * Schätzt Kohlenhydrate einer Mahlzeit via Claude API.
 * @param {string} description  — z.B. "Spaghetti Bolognese, ca. 200g"
 * @param {string} apiKey       — Anthropic API-Key aus den Einstellungen
 * @returns {{ khMin: number, khMax: number, khMid: number, note: string }}
 */
export async function estimateKHWithAI(description, apiKey) {
  if (!apiKey) throw new Error('Kein API-Key konfiguriert.');

  const resp = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type':         'application/json',
      'x-api-key':            apiKey,
      'anthropic-version':    '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 256,
      messages: [{
        role: 'user',
        content:
          'Du bist ein Diabetes-Ernährungsberater. Schätze die Kohlenhydrate (KH) dieser Mahlzeit.\n' +
          'Antwort NUR als JSON: {"khMin": <Zahl>, "khMax": <Zahl>, "khMid": <Zahl>, "note": "<kurze Erklärung>"}\n' +
          'Alle Werte in Gramm, ganze Zahlen.\n\n' +
          'Mahlzeit: ' + description,
      }],
    }),
    signal: AbortSignal.timeout(15000),
  });

  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}));
    throw new Error(err?.error?.message || `API-Fehler ${resp.status}`);
  }

  const data = await resp.json();
  const text = data.content?.[0]?.text || '';

  // JSON aus Antwort extrahieren (auch wenn Modell etwas drumherum schreibt)
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('Ungültige AI-Antwort.');
  return JSON.parse(match[0]);
}

// ── Nightscout — CGM-Daten lesen ──────────────────────────

/**
 * Lädt CGM-Einträge von einer Nightscout-Instanz.
 * @param {string} url    — z.B. "https://nightscout.meinserver.de"
 * @param {string} token  — Nightscout Access Token
 * @param {number} count  — Anzahl Einträge (Standard: 288 = 24h bei 5-Min-Intervall)
 * @returns {Array<{ timestamp, value, source }>}
 */
export async function fetchNightscout(url, token, count = 288) {
  const apiUrl = `${url.replace(/\/$/, '')}/api/v1/entries.json`
    + `?count=${count}`
    + (token ? `&token=${encodeURIComponent(token)}` : '');

  const resp = await fetch(apiUrl, { signal: AbortSignal.timeout(12000) });
  if (!resp.ok) throw new Error(`Nightscout: HTTP ${resp.status}`);

  const entries = await resp.json();
  return entries
    .filter(e => e.sgv && e.date)
    .map(e => ({
      id:        'ns_' + e._id,
      type:      'bz',
      value:     Math.round(e.sgv),
      timestamp: e.date,
      source:    'nightscout',
      note:      'CGM',
    }));
}
