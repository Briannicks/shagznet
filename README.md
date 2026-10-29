# KilimoRada  (*384*----#)

USSD + SMS farming hub for Kenyan farmers on any phone. No smartphone or internet needed.
Built with Node.js, Express, Africa's Talking and Google Gemini.

## Features
- Prices: fertilizer, certified seeds, EPRA fuel and produce, all instant (<0.2s).
- **"SMS me this"** on every result, so farmers keep a copy of prices.
- **Ask Expert:** the AI answer arrives by SMS, so the USSD screen never times out. Limited to 3 questions per hour per phone.
- **Report Fake Inputs:** each report gets a reference number and an SMS confirmation.
- **Verify Batch Code:** checks the batch registry plus community reports. After 3 reports, a code is **auto-flagged as fake**.
- **English / Kiswahili** toggle (option 10), remembered per phone. AI replies come in the farmer's language.
- **0 = Back, 00 = Main menu** navigation.
- **/admin dashboard** shows live stats and reports, with reporter phone numbers masked for privacy.

## Setup
```bash
npm install
cp .env.example .env    # fill in your keys
npm start

```
In the Africa's Talking sandbox, go to **USSD → Create channel** and set the callback URL to `https://YOUR-URL/ussd`.
Test with the **AT Simulator**. SMS replies appear in the simulator's inbox.

Dashboard: `https://YOUR-URL/admin` (add `?key=YOUR_ADMIN_KEY` if you set ADMIN_KEY).

If Gemini gives a "model not found" error, set `GEMINI_MODEL=gemini-2.5-flash-lite` in `.env`.

