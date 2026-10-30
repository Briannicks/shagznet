// services.js - Person 2: state, helpers, SMS and AI
import 'dotenv/config';
import AfricasTalking from 'africastalking';
import { GoogleGenAI } from '@google/genai';
import { T, AI_LIMIT_PER_HOUR } from './data.js';

const at = AfricasTalking({
  apiKey: process.env.AT_API_KEY || 'missing',
  username: process.env.AT_USERNAME || 'sandbox',
});
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || 'missing' });
const MODEL = process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite';

// ================= IN-MEMORY STATE (fine for an MVP) =================
export const languages = new Map(); // phone -> 'en' | 'sw'
export const aiUsage = new Map(); // phone -> [timestamps]
export const reports = []; // { ref, phone, input, key, time }
export const stats = { sessions: new Set(), aiQuestions: 0, smsSent: 0, verifications: 0 };

// ================= HELPERS =================
export const tr = (lang, v) => (typeof v === 'string' ? v : v[lang] || v.en);
export const normCode = (s) => s.toUpperCase().replace(/[^A-Z0-9+]/g, '');
export const reportCount = (key) => reports.filter((r) => r.key === key).length;
export const maskPhone = (p = '') => p.replace(/^(\+?\d{4})\d+(\d{3})$/, '$1****$2');
export const makeRef = () => 'KR' + Math.random().toString(36).slice(2, 7).toUpperCase();

// Africa's Talking: USSD menus must not contain special characters
export const cleanUssd = (msg) =>
  msg
    .replace(/&/g, 'and')
    .replace(/[()]/g, '')
    .replace(/[^A-Za-z0-9 .,:\-\/+?!'\n]/g, '')
    .replace(/ {2,}/g, ' ');

// Handles "0" (back) and "00" (main menu) inside Africa's Talking's accumulated text
export function navigate(text) {
  const out = [];
  for (const p of text.split('*')) {
    if (p === '00') out.length = 0;
    else if (p === '0') out.pop();
    else out.push(p);
  }
  return out;
}

export function underAiLimit(phone) {
  const hourAgo = Date.now() - 60 * 60 * 1000;
  const recent = (aiUsage.get(phone) || []).filter((t) => t > hourAgo);
  if (recent.length >= AI_LIMIT_PER_HOUR) return false;
  aiUsage.set(phone, [...recent, Date.now()]);
  return true;
}

// ================= SMS =================
export async function sendSms(phoneNumber, message) {
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
export async function answerWithAI(phoneNumber, question, lang) {
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