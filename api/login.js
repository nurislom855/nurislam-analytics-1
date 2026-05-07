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
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email va parolni kiriting' });

  try {
    const { Redis } = await import('@upstash/redis');
    const redis = new Redis({ url: process.env.KV_REST_API_URL, token: process.env.KV_REST_API_TOKEN });
    const raw = await redis.get(`user:${email.toLowerCase()}`);
    if (!raw) return res.status(401).json({ error: 'Email yoki parol noto\'g\'ri' });
    const user = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (user.password !== hashPassword(password)) return res.status(401).json({ error: 'Email yoki parol noto\'g\'ri' });
    user.lastLogin = new Date().toISOString();
    await redis.set(`user:${email.toLowerCase()}`, JSON.stringify(user));
    await sendTelegram(`🔐 <b>Foydalanuvchi kirdi</b>\n\n👤 <b>${user.name}</b>\n📧 ${email}\n🕐 ${new Date().toLocaleString('uz-UZ')}\n\n#kirish`);
    return res.status(200).json({ success: true, user: { name: user.name, email: user.email } });
  } catch (err) {
    return res.status(500).json({ error: 'Server xatosi: ' + err.message });
  }
}
