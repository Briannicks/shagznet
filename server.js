import 'dotenv/config';
import express from 'express';
import AfricasTalking from 'africastalking';
import { GoogleGenAI } from '@google/genai';

const app = express();
app.use(express.urlencoded({ extended: true }));

const at = AfricasTalking({
  apiKey: process.env.AT_API_KEY || 'missing',
  username: process.env.AT_USERNAME || 'sandbox',
});
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || 'missing' });
const MODEL = process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite';
const AI_LIMIT_PER_HOUR = 3; // fair use per phone number
const FLAG_THRESHOLD = 3; // community reports before a code is auto-flagged

// ================= TEXT (English + Kiswahili) =================
const T = {
  en: {
    main: `CON KilimoRada
1. Fertilizer
2. Seeds
3. Fuel (EPRA)
4. Market Prices
5. Ask Expert (SMS)
6. Weather
7. Verified Agrovets
8. Report Fake Inputs
9. Verify Batch Code
10. Kiswahili`,
    nav: '0. Back  00. Main menu',
    smsMe: '1. SMS me this',
    sent: 'Sent to your phone by SMS. Thank you for using KilimoRada!',
    invalid: 'Invalid choice. Please dial again.',
    askQ: 'Type your farming question (max 80 chars):\n0. Back',
    tooShort: 'Question too short. Please dial again and ask in more detail.',
    aiAck: 'Request received! Your answer is being generated and will arrive via SMS shortly.',
    aiLimit: `You have asked ${AI_LIMIT_PER_HOUR} questions this hour. Please try again later.`,
    reportQ: 'Enter suspect batch code or scam phone number:\n0. Back',
    reportOk: (ref) => `Report logged successfully! Ref: ${ref}. Thank you for protecting the community.`,
    reportSms: (ref, input) => `KilimoRada: Your report on "${input}" was received. Ref ${ref}. Thank you for keeping farmers safe.`,
    verifyQ: 'Enter the batch code printed on the bag or packet:\n0. Back',
    fake: (c, n) => `WARNING: ${c} is flagged as FAKE${n ? ` (${n} community reports)` : ''}. Do not buy or use it. Report it to your nearest agriculture office.`,
    genuine: (c, p) => `GENUINE: ${c} - ${p}. Safe to use.`,
    unknown: (c) => `${c} is not in our records. Buy only from verified agrovets (option 7) and keep your receipt.`,
    langSet: 'Language set to English. Dial again to continue.',
    aiFail: 'KilimoRada: Sorry, we could not answer right now. Please try again later.',
  },
  sw: {
    main: `CON KilimoRada
1. Mbolea
2. Mbegu
3. Mafuta (EPRA)
4. Bei Sokoni
5. Uliza Mtaalamu (SMS)
6. Hali ya Hewa
7. Agrovet Halali
8. Ripoti Pembejeo Feki
9. Thibitisha Bechi
10. English`,
    nav: '0. Rudi  00. Menyu kuu',
    smsMe: '1. Nitumie kwa SMS',
    sent: 'Imetumwa kwa simu yako kwa SMS. Asante kwa kutumia KilimoRada!',
    invalid: 'Chaguo si sahihi. Tafadhali piga tena.',
    askQ: 'Andika swali lako la kilimo (herufi 80):\n0. Rudi',
    tooShort: 'Swali ni fupi mno. Tafadhali piga tena na ueleze zaidi.',
    aiAck: 'Ombi limepokelewa! Jibu lako litakufikia kwa SMS hivi karibuni.',
    aiLimit: `Umeuliza maswali ${AI_LIMIT_PER_HOUR} saa hii. Tafadhali jaribu tena baadaye.`,
    reportQ: 'Weka nambari ya bechi au nambari ya simu ya tapeli:\n0. Rudi',
    reportOk: (ref) => `Ripoti imepokelewa! Kumb: ${ref}. Asante kwa kulinda jamii.`,
    reportSms: (ref, input) => `KilimoRada: Ripoti yako kuhusu "${input}" imepokelewa. Kumb ${ref}. Asante kwa kuwalinda wakulima.`,
    verifyQ: 'Weka nambari ya bechi iliyo kwenye gunia au pakiti:\n0. Rudi',
    fake: (c, n) => `ONYO: ${c} ni FEKI${n ? ` (ripoti ${n} za jamii)` : ''}. Usinunue wala kutumia. Ripoti kwa afisi ya kilimo iliyo karibu.`,
    genuine: (c, p) => `HALALI: ${c} - ${p}. Ni salama kutumia.`,
    unknown: (c) => `${c} haipo kwenye rekodi zetu. Nunua tu kutoka agrovet zilizothibitishwa (chaguo 7) na uweke risiti.`,
    langSet: 'Lugha imewekwa Kiswahili. Piga tena kuendelea.',
    aiFail: 'KilimoRada: Samahani, hatukuweza kujibu sasa. Tafadhali jaribu tena baadaye.',
  },
};

// ================= LOCAL DATA (instant lookups) =================
const MENUS = {
  1: {
    title: { en: 'Fertilizer Rates', sw: 'Bei za Mbolea' },
    options: {
      1: ['DAP', { en: 'Subsidized DAP (50kg): KES 2,500 (NCPB e-Voucher). Commercial: KES 5,500+.', sw: 'DAP ya ruzuku (50kg): KES 2,500 (e-Voucher NCPB). Bei ya kawaida: KES 5,500+.' }],
      2: ['CAN', { en: 'Subsidized CAN (50kg): KES 1,800 (NCPB e-Voucher). Commercial: KES 4,000.', sw: 'CAN ya ruzuku (50kg): KES 1,800 (e-Voucher NCPB). Bei ya kawaida: KES 4,000.' }],
      3: ['NPK', { en: 'NPK 23:23:0 (50kg): KES 2,300 (NCPB).', sw: 'NPK 23:23:0 (50kg): KES 2,300 (NCPB).' }],
    },
  },
  2: {
    title: { en: 'Certified Seed Prices', sw: 'Bei za Mbegu Zilizoidhinishwa' },
    options: {
      1: [{ en: 'Maize', sw: 'Mahindi' }, { en: 'Hybrid Maize H614 (2kg): KES 560 at certified Agrovets.', sw: 'Mbegu za Mahindi H614 (2kg): KES 560 kwa Agrovet zilizoidhinishwa.' }],
      2: [{ en: 'Beans', sw: 'Maharagwe' }, { en: 'Rosecoco Beans (2kg): KES 480.', sw: 'Maharagwe Rosecoco (2kg): KES 480.' }],
      3: [{ en: 'Tomato', sw: 'Nyanya' }, { en: 'Money Maker Tomato Seeds (10g): KES 350.', sw: 'Mbegu za Nyanya Money Maker (10g): KES 350.' }],
    },
  },
  4: {
    title: { en: 'Produce Market Prices', sw: 'Bei za Mazao Sokoni' },
    options: {
      1: [{ en: 'Maize 90kg', sw: 'Mahindi 90kg' }, { en: 'Dry Maize (90kg Bag): Wholesale KES 3,200 - KES 3,600 (Nairobi/Eldoret).', sw: 'Mahindi makavu (gunia 90kg): Jumla KES 3,200 - 3,600 (Nairobi/Eldoret).' }],
      2: [{ en: 'Tomatoes', sw: 'Nyanya' }, { en: 'Tomatoes (64kg Crate): KES 6,500 - KES 8,000 depending on market.', sw: 'Nyanya (kreti 64kg): KES 6,500 - 8,000 kulingana na soko.' }],
      3: [{ en: 'Potatoes', sw: 'Viazi' }, { en: 'Shangi Potatoes (50kg Bag): KES 2,200.', sw: 'Viazi Shangi (gunia 50kg): KES 2,200.' }],
    },
  },
  6: {
    title: { en: 'Weather Forecast', sw: 'Hali ya Hewa' },
    options: {
      1: ['Kiambu', { en: 'Kiambu: Scattered light rains expected. Good for weeding.', sw: 'Kiambu: Mvua nyepesi za hapa na pale. Wakati mzuri wa kupalilia.' }],
      2: ['Nakuru', { en: 'Nakuru: Sunny & dry conditions. Optimal for maize harvesting.', sw: 'Nakuru: Jua na hali kavu. Wakati mzuri wa kuvuna mahindi.' }],
      3: ['Uasin Gishu', { en: 'Uasin Gishu: Heavy rainfall expected. Delay spraying pesticides.', sw: 'Uasin Gishu: Mvua kubwa inatarajiwa. Ahirisha kunyunyizia dawa.' }],
    },
  },
};

const FUEL = { en: 'EPRA Rates: Super Petrol KSh 226.96/L, Diesel KSh 227.43/L, Kerosene KSh 219.53/L.', sw: 'Bei za EPRA: Petroli KSh 226.96/L, Dizeli KSh 227.43/L, Mafuta taa KSh 219.53/L.' };
const AGROVETS = { en: '1. Farmers Centre (0711000111) 2. Kenya Seed Depot. All KEBS certified.', sw: '1. Farmers Centre (0711000111) 2. Kenya Seed Depot. Zote zimeidhinishwa na KEBS.' };

// Demo batch registry (replace with real KEPHIS/manufacturer data later)
const BATCHES = {
  DAP2026A01: { status: 'genuine', product: 'DAP 50kg (NCPB)' },
  CAN2026B07: { status: 'genuine', product: 'CAN 50kg (NCPB)' },
  H61424118: { status: 'genuine', product: 'Maize H614 2kg (Kenya Seed)' },
  DAPX99: { status: 'fake', product: 'DAP 50kg' },
};

// ================= IN-MEMORY STATE (fine for an MVP) =================
const languages = new Map(); // phone -> 'en' | 'sw'
const aiUsage = new Map(); // phone -> [timestamps]
const reports = []; // { ref, phone, input, key, time }
const stats = { sessions: new Set(), aiQuestions: 0, smsSent: 0, verifications: 0 };

// ================= HELPERS =================
const tr = (lang, v) => (typeof v === 'string' ? v : v[lang] || v.en);
const normCode = (s) => s.toUpperCase().replace(/[^A-Z0-9+]/g, '');
const reportCount = (key) => reports.filter((r) => r.key === key).length;
const maskPhone = (p = '') => p.replace(/^(\+?\d{4})\d+(\d{3})$/, '$1****$2');
const makeRef = () => 'KR' + Math.random().toString(36).slice(2, 7).toUpperCase();

// Africa's Talking: USSD menus must not contain special characters
const cleanUssd = (msg) =>
  msg
    .replace(/&/g, 'and')
    .replace(/[()]/g, '')
    .replace(/[^A-Za-z0-9 .,:\-\/+?!'\n]/g, '')
    .replace(/ {2,}/g, ' ');

// Handles "0" (back) and "00" (main menu) inside Africa's Talking's accumulated text
function navigate(text) {
  const out = [];
  for (const p of text.split('*')) {
    if (p === '00') out.length = 0;
    else if (p === '0') out.pop();
    else out.push(p);
  }
  return out;
}

function underAiLimit(phone) {
  const hourAgo = Date.now() - 60 * 60 * 1000;
  const recent = (aiUsage.get(phone) || []).filter((t) => t > hourAgo);
  if (recent.length >= AI_LIMIT_PER_HOUR) return false;
  aiUsage.set(phone, [...recent, Date.now()]);
  return true;
}

// ================= SMS =================
async function sendSms(phoneNumber, message) {
  const text = message.replace(/[*#_`]/g, '').trim().slice(0, 160);
  console.log(`[OUTBOUND SMS TO ${phoneNumber}]: ${text}`);
  stats.smsSent++;
  try {
    const opts = { to: [phoneNumber], message: text };
    if (process.env.AT_SENDER_ID) opts.from = process.env.AT_SENDER_ID;
    await at.SMS.send(opts);
  } catch (err) {
    console.error('SMS failed:', err.message || err);
  }
}

// ================= AI (background) =================
async function answerWithAI(phoneNumber, question, lang) {
  try {
    const res = await ai.models.generateContent({
      model: MODEL,
      contents: question,
      config: {
        systemInstruction:
          'You are an agricultural advisor for a Kenyan farmer on a basic feature phone. Provide practical advice in plain text. NO markdown (no asterisks, bolding, or special symbols). Keep total response under 140 characters. ' +
          (lang === 'sw' ? 'Reply in simple Kiswahili.' : 'Reply in simple English.'),
      },
    });
    await sendSms(phoneNumber, `KilimoRada: ${res.text}`);
  } catch (err) {
    console.error('Gemini error:', err.message || err);
    await sendSms(phoneNumber, T[lang].aiFail);
  }
}

// ================= USSD =================
app.post('/ussd', (req, res) => {
  const { phoneNumber, sessionId, text = '' } = req.body;
  console.log(`[USSD IN] session=${sessionId} phone=${phoneNumber} text="${text}"`);
  if (sessionId) stats.sessions.add(sessionId);

  const lang = languages.get(phoneNumber) || 'en';
  const t = T[lang];
  const parts = text === '' ? [] : navigate(text);
  const [choice, sub, action] = parts;
  const input = parts.slice(1).join('*').trim(); // free text (questions, codes)

  let reply;

  if (parts.length === 0) {
    reply = t.main;
  } else if (MENUS[choice]) {
    // Options 1, 2, 4, 6
    const menu = MENUS[choice];
    const item = sub && menu.options[sub];
    if (!sub) {
      const list = Object.entries(menu.options).map(([k, [label]]) => `${k}. ${tr(lang, label)}`).join('\n');
      reply = `CON ${tr(lang, menu.title)}\n${list}\n${t.nav}`;
    } else if (!item) {
      reply = `END ${t.invalid}`;
    } else if (action === undefined) {
      reply = `CON ${tr(lang, item[1])}\n${t.smsMe}\n${t.nav}`;
    } else if (action === '1') {
      sendSms(phoneNumber, `KilimoRada: ${tr(lang, item[1])}`);
      reply = `END ${t.sent}`;
    } else {
      reply = `END ${t.invalid}`;
    }
  } else if (choice === '3' || choice === '7') {
    // Fuel rates / Verified agrovets
    const msg = tr(lang, choice === '3' ? FUEL : AGROVETS);
    if (!sub) reply = `CON ${msg}\n${t.smsMe}\n${t.nav}`;
    else if (sub === '1') {
      sendSms(phoneNumber, `KilimoRada: ${msg}`);
      reply = `END ${t.sent}`;
    } else reply = `END ${t.invalid}`;
  } else if (choice === '5') {
    // Ask Ag-Assistant: answer goes by SMS so USSD never times out
    if (!input) reply = `CON ${t.askQ}`;
    else if (input.length < 5) reply = `END ${t.tooShort}`;
    else if (!underAiLimit(phoneNumber)) reply = `END ${t.aiLimit}`;
    else {
      stats.aiQuestions++;
      reply = `END ${t.aiAck}`;
      answerWithAI(phoneNumber, input.slice(0, 80), lang); // not awaited on purpose
    }
  } else if (choice === '8') {
    // Report fake inputs / scams
    if (!input) reply = `CON ${t.reportQ}`;
    else {
      const ref = makeRef();
      const key = normCode(input);
      reports.push({ ref, phone: phoneNumber, input: input.slice(0, 40), key, time: new Date().toISOString() });
      const count = reportCount(key);
      console.log(`[SCAM REPORT ${ref}] ${maskPhone(phoneNumber)}: ${input} (total reports: ${count})`);
      if (count === FLAG_THRESHOLD) console.log(`[AUTO-FLAG] ${key} reached ${FLAG_THRESHOLD} community reports`);
      sendSms(phoneNumber, t.reportSms(ref, input.slice(0, 40)));
      reply = `END ${t.reportOk(ref)}`;
    }
  } else if (choice === '9') {
    // Verify batch code: registry + community reports
    if (!input) reply = `CON ${t.verifyQ}`;
    else {
      stats.verifications++;
      const code = normCode(input);
      const record = BATCHES[code];
      const count = reportCount(code);
      if (record?.status === 'fake' || count >= FLAG_THRESHOLD) reply = `END ${t.fake(code, count)}`;
      else if (record) reply = `END ${t.genuine(code, record.product)}`;
      else reply = `END ${t.unknown(code)}`;
    }
  } else if (choice === '10') {
    const newLang = lang === 'en' ? 'sw' : 'en';
    languages.set(phoneNumber, newLang);
    reply = `END ${T[newLang].langSet}`;
  } else {
    reply = `END ${t.invalid}`;
  }

  reply = cleanUssd(reply);
  if (reply.length > 182) console.warn(`[WARN] USSD reply is ${reply.length} chars (limit ~182)`);
  console.log(`[USSD OUT] ${reply.split('\n')[0]}`);
  res.set('Content-Type', 'text/plain');
  res.set('at-ussd-hop-metadata', parts.length ? `menu-${parts.join('-')}`.slice(0, 99) : 'main-menu');
  res.send(reply);
});

// ================= SESSION EVENTS (end of interaction from Africa's Talking) =================
app.post('/ussd/events', (req, res) => {
  const { sessionId, status, input, errorMessage, lastAppResponse, durationInMillis } = req.body;
  console.log(`[USSD EVENT] session=${sessionId} status=${status} input="${input || ''}" duration=${durationInMillis}ms`);
  if (status === 'Failed') console.log(`[USSD FAILED] error=${errorMessage} lastResponse=${lastAppResponse}`);
  res.sendStatus(200);
});

// ================= ADMIN DASHBOARD (for the demo) =================
app.get('/admin', (req, res) => {
  if (process.env.ADMIN_KEY && req.query.key !== process.env.ADMIN_KEY) return res.status(401).send('Unauthorized');

  const counts = {};
  reports.forEach((r) => (counts[r.key] = (counts[r.key] || 0) + 1));
  const flagged = Object.entries(counts).sort((a, b) => b[1] - a[1]);

  const card = (label, value) => `<div class="card"><div class="num">${value}</div><div>${label}</div></div>`;
  const rows = reports.slice().reverse().map((r) =>
    `<tr><td>${r.ref}</td><td>${maskPhone(r.phone)}</td><td>${r.input.replace(/</g, '&lt;')}</td><td>${new Date(r.time).toLocaleString('en-KE')}</td></tr>`
  ).join('');
  const flags = flagged.map(([k, n]) =>
    `<li>${k} — ${n} report(s) ${n >= FLAG_THRESHOLD ? '<b class="red">AUTO-FLAGGED</b>' : ''}</li>`
  ).join('');

  res.send(`<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>KilimoRada Dashboard</title><meta http-equiv="refresh" content="10">
<style>
body{font-family:system-ui,sans-serif;margin:0;padding:24px;background:#f4f7f2;color:#1d2b1a}
h1{color:#2e6b1f;margin-top:0}.grid{display:flex;gap:12px;flex-wrap:wrap}
.card{background:#fff;border-radius:10px;padding:16px 20px;min-width:140px;box-shadow:0 1px 3px #0002}
.num{font-size:28px;font-weight:700;color:#2e6b1f}table{width:100%;border-collapse:collapse;background:#fff;margin-top:8px}
td,th{padding:8px;border-bottom:1px solid #e5e5e5;text-align:left}.red{color:#b3261e}
.wrap{overflow-x:auto}
</style></head><body>
<h1>🌱 KilimoRada Dashboard</h1>
<div class="grid">
${card('USSD sessions', stats.sessions.size)}${card('AI questions', stats.aiQuestions)}
${card('SMS sent', stats.smsSent)}${card('Batch checks', stats.verifications)}${card('Scam reports', reports.length)}
</div>
<h2>Most reported codes / numbers</h2><ul>${flags || '<li>No reports yet</li>'}</ul>
<h2>Recent reports</h2><div class="wrap"><table><tr><th>Ref</th><th>Reporter</th><th>Reported</th><th>Time</th></tr>${rows || '<tr><td colspan="4">No reports yet</td></tr>'}</table></div>
<p><small>Phone numbers are masked to protect reporters. Auto-refreshes every 10s.</small></p>
</body></html>`);
});

app.get('/', (_req, res) => res.send('KilimoRada USSD is running. Dashboard: /admin'));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`KilimoRada running on port ${PORT}`));