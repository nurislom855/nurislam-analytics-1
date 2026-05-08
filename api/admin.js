// api/admin.js — Admin panel uchun foydalanuvchilar ro'yxati

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { action, adminPass, email, newPassword } = req.body;

  // Admin parolini tekshirish
  if (adminPass !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Admin paroli noto\'g\'ri' });
  }

  try {
    const { Redis } = await import('@upstash/redis');
    const redis = new Redis({
      url: process.env.KV_REST_API_URL,
      token: process.env.KV_REST_API_TOKEN,
    });

    // Barcha foydalanuvchilarni olish
    if (action === 'getUsers') {
      const emailList = await redis.lrange('users:list', 0, -1);
      const users = [];
      for (const em of emailList) {
        const raw = await redis.get(`user:${em}`);
        if (raw) {
          const u = typeof raw === 'string' ? JSON.parse(raw) : raw;
          users.push({
            name: u.name,
            email: u.email,
            createdAt: u.createdAt,
            lastLogin: u.lastLogin,
            msgsCount: u.msgs?.length || 0
          });
        }
      }
      return res.status(200).json({ users });
    }

    // Parolni tiklash
    if (action === 'resetPassword') {
      if (!email || !newPassword) return res.status(400).json({ error: 'Email va yangi parol kerak' });
      if (newPassword.length < 6) return res.status(400).json({ error: 'Parol kamida 6 ta belgi' });

      const crypto = await import('crypto');
      const hash = crypto.createHash('sha256').update(newPassword + 'nurislam_salt_2025').digest('hex');

      const raw = await redis.get(`user:${email.toLowerCase()}`);
      if (!raw) return res.status(404).json({ error: 'Foydalanuvchi topilmadi' });

      const u = typeof raw === 'string' ? JSON.parse(raw) : raw;
      u.password = hash;
      await redis.set(`user:${email.toLowerCase()}`, JSON.stringify(u));

      return res.status(200).json({ success: true, message: 'Parol yangilandi' });
    }

    // Foydalanuvchini o'chirish
    if (action === 'deleteUser') {
      if (!email) return res.status(400).json({ error: 'Email kerak' });
      await redis.del(`user:${email.toLowerCase()}`);
      await redis.lrem('users:list', 0, email.toLowerCase());
      return res.status(200).json({ success: true, message: 'Foydalanuvchi o\'chirildi' });
    }

    return res.status(400).json({ error: 'Noma\'lum action' });

  } catch (err) {
    return res.status(500).json({ error: 'Server xatosi: ' + err.message });
  }
}
