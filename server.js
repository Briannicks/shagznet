// server.js - Person 3: Express routes and app startup
import 'dotenv/config';
import express from 'express';
import { T, MENUS, FUEL, AGROVETS, BATCHES, FLAG_THRESHOLD } from './data.js';
import {
  languages, reports, stats,
  tr, normCode, reportCount, maskPhone, makeRef, cleanUssd,
  navigate, underAiLimit, sendSms, answerWithAI,
} from './services.js';

const app = express();
app.use(express.urlencoded({ extended: true }));

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