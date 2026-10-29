# KilimoRada 🌱 (*384*----#)

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
npx ngrok http 3000     # or deploy to Render/Railway
```
In the Africa's Talking sandbox, go to **USSD → Create channel** and set the callback URL to `https://YOUR-URL/ussd`.
Test with the **AT Simulator**. SMS replies appear in the simulator's inbox.

Dashboard: `https://YOUR-URL/admin` (add `?key=YOUR_ADMIN_KEY` if you set ADMIN_KEY).

If Gemini gives a "model not found" error, set `GEMINI_MODEL=gemini-2.5-flash-lite` in `.env`.

## Demo script for the judges (about 2 min)
1. Dial, choose **1 → 2** to see the CAN price, then **1** to get it by SMS. Show the SMS arriving.
2. Choose **5** and ask "How do I control fall armyworm?". The screen closes instantly and the answer arrives by SMS.
3. Choose **9** and enter `DAPX99`. A FAKE warning appears. Then enter `DAP2026A01`, which shows as GENUINE.
4. Choose **8** and report `NEWFAKE1` three times, then **9** and verify `NEWFAKE1`. It's now auto-flagged by the community.
5. Open **/admin** to show live stats and masked reports.
6. Choose **10** to switch to Kiswahili and walk through the menu again.

Demo batch codes: `DAP2026A01`, `CAN2026B07`, `H61424118` (genuine) and `DAPX99` (fake).

## Next steps
Real database (reports and languages are currently stored in memory), live price feeds, KEPHIS/PCPB batch data, and extension officer review of flagged reports.
