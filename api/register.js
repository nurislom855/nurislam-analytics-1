// api/register.js
// Foydalanuvchini ro'yxatdan o'tkazish
// Vercel KV (Redis) ga saqlaydi + Telegram ga xabar yuboradi

import crypto from 'crypto';

function hashPassword(password) {
  return crypto.createHash('sha256').update(password + 'nurislam_salt_2025').digest('hex');
}

async function sendTelegram(message) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return;
  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text: message, parse_mode: 'HTML' })
  });
}

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Barcha maydonlarni to\'ldiring' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Parol kamida 6 ta belgidan iborat bo\'lishi kerak' });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Email manzil noto\'g\'ri' });
  }

  try {
    // Vercel KV (Redis) dan foydalanish
    const { kv } = await import('@vercel/kv');

    // Email allaqachon ro'yxatdan o'tganmi?
    const existing = await kv.get(`user:${email.toLowerCase()}`);
    if (existing) {
      return res.status(409).json({ error: 'Bu email allaqachon ro\'yxatdan o\'tgan' });
    }

    const user = {
      name,
      email: email.toLowerCase(),
      password: hashPassword(password),
      createdAt: new Date().toISOString(),
      msgs: []
    };

    // Saqlash
    await kv.set(`user:${email.toLowerCase()}`, JSON.stringify(user));
    // Email ro'yxatiga qo'shish (admin uchun)
    await kv.lpush('users:list', email.toLowerCase());

    // Telegram xabar
    await sendTelegram(
      `🆕 <b>Yangi foydalanuvchi!</b>\n\n` +
      `👤 Ism: <b>${name}</b>\n` +
      `📧 Email: <b>${email}</b>\n` +
      `🕐 Vaqt: ${new Date().toLocaleString('uz-UZ')}\n\n` +
      `#yangi_foydalanuvchi`
    );

    return res.status(200).json({ success: true, message: 'Muvaffaqiyatli ro\'yxatdan o\'tdingiz!' });

  } catch (err) {
    console.error('Register error:', err);
    return res.status(500).json({ error: 'Server xatosi. Qayta urinib ko\'ring.' });
  }
}
