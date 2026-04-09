// ═══════════════════════════════════════════════════════════
//  LERNMODUL — 5 Tabs, statischer Inhalt
// ═══════════════════════════════════════════════════════════
import { state, save } from '../state.js';
import { checkAndUnlockAchievements } from '../achievements.js';

const TABS = [
  { id: 'bz',    label: '🩸 BZ verstehen' },
  { id: 'low',   label: '📉 Unterzucker' },
  { id: 'high',  label: '📈 Überzucker' },
  { id: 'food',  label: '🍎 Essen & KH' },
  { id: 'sos',   label: '🆘 Notfall' },
];

export function render(container) {
  container.innerHTML = `
    <div class="page-header">
      <button class="btn-back" onclick="window.showPage('home')">‹</button>
      <h2 class="page-title">Lernen</h2>
      <span class="page-icon">📚</span>
    </div>

    <div class="learn-tabs" id="learnTabs">
      ${TABS.map((t,i) =>
        `<button class="learn-tab-btn${i===0?' active':''}" data-tab="${t.id}">${t.label}</button>`
      ).join('')}
    </div>

    <div id="learnContent"></div>`;
}

export function init() {
  // Besuch zählen
  state.learnVisits = (state.learnVisits || 0) + 1;
  save();
  checkAndUnlockAchievements();

  document.getElementById('learnTabs')?.addEventListener('click', e => {
    const btn = e.target.closest('.learn-tab-btn');
    if (!btn) return;
    document.querySelectorAll('.learn-tab-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    _renderTab(btn.dataset.tab);
  });

  _renderTab('bz');
}

export function refresh() {}

function _renderTab(id) {
  const c = document.getElementById('learnContent');
  if (!c) return;
  c.innerHTML = `<div class="learn-tab-content active">${CONTENT[id] || ''}</div>`;
}

const CONTENT = {
  bz: `
    <div class="learn-card">
      <h3>🩸 Was ist Blutzucker?</h3>
      <p>Blutzucker (BZ) ist die Menge Zucker (Glukose) in deinem Blut.
         Glukose ist der Hauptbrennstoff für deinen Körper und dein Gehirn.</p>
      <p>Bei Typ-1-Diabetes produziert dein Körper kein Insulin mehr selbst —
         deshalb musst du Insulin von außen zuführen.</p>
    </div>
    <div class="learn-card">
      <h3>🎯 Dein Zielbereich</h3>
      <p>Der normale Zielbereich liegt zwischen <strong>70 und 180 mg/dL</strong>.</p>
      <ul>
        <li><strong>&lt; 70 mg/dL</strong> — Unterzucker: sofort behandeln!</li>
        <li><strong>70–180 mg/dL</strong> — Super! Im grünen Bereich 🟢</li>
        <li><strong>&gt; 180 mg/dL</strong> — Überzucker: Insulin prüfen</li>
        <li><strong>&gt; 300 mg/dL</strong> — Sofort Arzt kontaktieren!</li>
      </ul>
    </div>
    <div class="learn-card">
      <h3>📱 Dexcom G7</h3>
      <p>Dein Dexcom G7 misst den Blutzucker alle 5 Minuten automatisch —
         du siehst Trends und wirst bei kritischen Werten gewarnt.</p>
      <p>Der Sensor sitzt auf deiner Haut und misst den Zucker im Unterhautfettgewebe.</p>
    </div>`,

  low: `
    <div class="learn-card learn-card-urgent">
      <h3>📉 Unterzucker (Hypoglykämie)</h3>
      <p><strong>BZ unter 70 mg/dL</strong> — das ist ein Notfall!</p>
    </div>
    <div class="learn-card">
      <h3>😰 Zeichen erkennen</h3>
      <ul>
        <li>Zittern, Schwitzen</li>
        <li>Herzrasen, Blässe</li>
        <li>Hunger, Kopfschmerzen</li>
        <li>Konzentrationsprobleme</li>
        <li>Verwirrung (bei starkem Unterzucker)</li>
      </ul>
    </div>
    <div class="learn-card">
      <h3>✅ Die 15-15-Regel</h3>
      <ol class="learn-steps">
        <li>15g schnelle Kohlenhydrate essen (Traubenzucker, 150ml Saft, Cola)</li>
        <li>15 Minuten warten</li>
        <li>BZ nochmals messen</li>
        <li>Wenn immer noch &lt; 70: nochmals 15g KH</li>
        <li>Wenn besser: langsame KH essen (Brot, Müsliriegel)</li>
      </ol>
    </div>
    <div class="learn-card learn-card-urgent">
      <h3>🚨 Bewusstlosigkeit</h3>
      <p><strong>Glucagon-Spritze geben + sofort Notruf 112!</strong></p>
      <p>Nichts in den Mund geben wenn bewusstlos!</p>
    </div>`,

  high: `
    <div class="learn-card learn-card-warning">
      <h3>📈 Überzucker (Hyperglykämie)</h3>
      <p><strong>BZ über 180 mg/dL</strong> — Insulin prüfen und handeln.</p>
    </div>
    <div class="learn-card">
      <h3>😓 Zeichen erkennen</h3>
      <ul>
        <li>Großer Durst</li>
        <li>Häufiges Wasserlassen</li>
        <li>Müdigkeit, Schwindel</li>
        <li>Übelkeit (bei sehr hohem BZ)</li>
        <li>Atem riecht nach Aceton (Ketone!)</li>
      </ul>
    </div>
    <div class="learn-card">
      <h3>✅ Was tun?</h3>
      <ol class="learn-steps">
        <li>BZ genau messen</li>
        <li>Ketone messen (wenn &gt; 250 mg/dL)</li>
        <li>Korrekturinsulin nach Schema spritzen</li>
        <li>Viel Wasser trinken</li>
        <li>Alle 2h nochmals messen</li>
      </ol>
    </div>
    <div class="learn-card learn-card-urgent">
      <h3>🚨 Sofort zum Arzt wenn...</h3>
      <ul>
        <li>BZ über 300 mg/dL</li>
        <li>Ketone über 3 mmol/L</li>
        <li>Übelkeit oder Erbrechen</li>
        <li>Bauchschmerzen</li>
        <li>Schnelle Atmung</li>
      </ul>
    </div>`,

  food: `
    <div class="learn-card">
      <h3>🍎 Was sind Kohlenhydrate?</h3>
      <p>Kohlenhydrate (KH) werden im Körper zu Glukose umgewandelt und heben den BZ.
         Nicht alle KH wirken gleich schnell!</p>
    </div>
    <div class="learn-card">
      <h3>⚡ Schnelle vs. langsame KH</h3>
      <p><strong>Schnell (lassen BZ rasch steigen):</strong></p>
      <ul>
        <li>Weißbrot, Weißreis, Limo, Saft</li>
        <li>Süßigkeiten, Gummibärchen</li>
        <li>Kartoffelpüree</li>
      </ul>
      <p style="margin-top:12px"><strong>Langsam (sanfterer Anstieg):</strong></p>
      <ul>
        <li>Vollkornbrot, Hülsenfrüchte</li>
        <li>Haferflocken, Pasta al dente</li>
        <li>Die meisten Gemüsesorten</li>
      </ul>
    </div>
    <div class="learn-card">
      <h3>🧮 KH berechnen — Omnipod 5</h3>
      <p>Mit dem Omnipod 5 gibst du die <strong>KH-Menge in Gramm</strong> ein —
         der Pod berechnet dann automatisch die Insulinmenge.</p>
      <p>Der KH-Rechner in der App hilft dir, die Gramm genau zu bestimmen!</p>
    </div>
    <div class="learn-card">
      <h3>🥗 Praktische Mengen</h3>
      <ul>
        <li>1 Scheibe Toastbrot ≈ 13g KH</li>
        <li>1 mittlerer Apfel ≈ 20g KH</li>
        <li>100g Nudeln (gekocht) ≈ 25g KH</li>
        <li>1 Glas Orangensaft (200ml) ≈ 20g KH</li>
        <li>1 Banane ≈ 25g KH</li>
        <li>Gemüse: meist &lt; 5g KH pro 100g</li>
      </ul>
    </div>`,

  sos: `
    <div class="learn-card learn-card-urgent">
      <h3>🆘 NOTFALL-PLAN</h3>
      <p>Diesen Plan ausdrucken und in der Schule hinterlegen!</p>
    </div>
    <div class="learn-card">
      <h3>📞 Notfallkontakte</h3>
      <ul>
        <li><strong>Notruf:</strong> 112</li>
        <li><strong>Giftnotruf:</strong> 0800 192 40 (kostenfrei)</li>
        <li><strong>Kinderärztlicher Notfall:</strong> 116 117</li>
      </ul>
    </div>
    <div class="learn-card">
      <h3>📋 Was du anderen sagen kannst</h3>
      <p style="background:var(--surface-1);padding:12px;border-radius:8px;font-size:14px;margin-top:8px">
        "Ich habe <strong>Typ-1-Diabetes</strong>. Mein Blutzucker ist gerade zu <strong>niedrig/hoch</strong>.
        Bitte gib mir <strong>Traubenzucker</strong> (liegt in meiner Tasche)
        und ruf meine <strong>Eltern an</strong>."
      </p>
    </div>
    <div class="learn-card">
      <h3>🎒 Was immer dabei sein muss</h3>
      <ul>
        <li>✅ Traubenzucker / Saft</li>
        <li>✅ Dexcom G7 Sensor + Transmitter</li>
        <li>✅ Ersatz-Pod (Omnipod 5)</li>
        <li>✅ Blutzucker-Messgerät als Backup</li>
        <li>✅ Glucagon-Notfall-Set</li>
        <li>✅ Notfallausweis mit Kontakten</li>
      </ul>
    </div>`,
};
