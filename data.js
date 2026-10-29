
export const AI_LIMIT_PER_HOUR = 3; // fair use per phone number
export const FLAG_THRESHOLD = 3; // community reports before a code is auto-flagged


export const T = {
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


export const MENUS = {
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

export const FUEL = { en: 'EPRA Rates: Super Petrol KSh 226.96/L, Diesel KSh 227.43/L, Kerosene KSh 219.53/L.', sw: 'Bei za EPRA: Petroli KSh 226.96/L, Dizeli KSh 227.43/L, Mafuta taa KSh 219.53/L.' };
export const AGROVETS = { en: '1. Farmers Centre (0711000111) 2. Kenya Seed Depot. All KEBS certified.', sw: '1. Farmers Centre (0711000111) 2. Kenya Seed Depot. Zote zimeidhinishwa na KEBS.' };


export const BATCHES = {
  DAP2026A01: { status: 'genuine', product: 'DAP 50kg (NCPB)' },
  CAN2026B07: { status: 'genuine', product: 'CAN 50kg (NCPB)' },
  H61424118: { status: 'genuine', product: 'Maize H614 2kg (Kenya Seed)' },
  DAPX99: { status: 'fake', product: 'DAP 50kg' },
};