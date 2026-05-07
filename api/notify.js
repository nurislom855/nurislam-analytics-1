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

  const { userName, email, answers, result } = req.body;

  try {
    const shortResult = result?.slice(0, 1500) + (result?.length > 1500 ? '...' : '');
    const msg =
      `📊 <b>Yangi AI Tahlil Natijasi</b>\n\n` +
      `👤 <b>${userName}</b> (${email})\n` +
      `🕐 ${new Date().toLocaleString('uz-UZ')}\n\n` +
      `<b>Biznes:</b>\n` +
      `• Soha: ${answers?.biznes_turi || '-'}\n` +
      `• Yoshi: ${answers?.biznes_yoshi || '-'}\n` +
      `• Xodimlar: ${answers?.xodimlar || '-'}\n` +
      `• Daromad: ${answers?.oylik_daromad || '-'}\n\n` +
      `<b>AI Tahlil:</b>\n${shortResult}\n\n#tahlil`;

    await sendTelegram(msg);

    try {
      const { Redis } = await import('@upstash/redis');
      const redis = new Redis({ url: process.env.KV_REST_API_URL, token: process.env.KV_REST_API_TOKEN });
      const raw = await redis.get(`user:${email?.toLowerCase()}`);
      if (raw) {
        const u = typeof raw === 'string' ? JSON.parse(raw) : raw;
        const t = new Date().toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' });
        if (!u.msgs) u.msgs = [];
        u.msgs.push({ role: 'user', text: `[Tahlil] ${answers?.biznes_turi}`, time: t });
        u.msgs.push({ role: 'assistant', text: result, time: t });
        await redis.set(`user:${email.toLowerCase()}`, JSON.stringify(u));
      }
    } catch(e) {}

    return res.status(200).json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: 'Xatolik: ' + err.message });
  }
}
