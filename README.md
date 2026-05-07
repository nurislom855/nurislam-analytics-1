# 🚀 Vercel ga Deploy qilish — Bosqichma-bosqich

## 1-qadam: Telegram Chat ID olish

1. Telegram da @nurislomyuklaydibot ga yozing: `/start`
2. Brauzerda oching:
   `https://api.telegram.org/bot7950739325:AAEuod4VfHq06PQbCrMNyzZ_phb4IecmVkw/getUpdates`
3. Javobda `"chat":{"id": XXXXX}` — shu XXXXX raqam sizning Chat ID

---

## 2-qadam: GitHub ga yuklash

```bash
# GitHub da yangi repository oching (masalan: nurislam-analytics)
git init
git add .
git commit -m "first commit"
git remote add origin https://github.com/SIZNING_USERNAME/nurislam-analytics.git
git push -u origin main
```

---

## 3-qadam: Vercel ga ulash

1. https://vercel.com ga kiring (GitHub bilan)
2. "New Project" → GitHub repo ni tanlang
3. "Deploy" bosing

---

## 4-qadam: Vercel KV (baza) yaratish

1. Vercel dashboard → loyiha → "Storage" tab
2. "Create Database" → "KV (Redis)" tanlang
3. Nom bering → "Create"
4. "Connect to Project" bosing
   (KV_REST_API_URL va KV_REST_API_TOKEN avtomatik qo'shiladi)

---

## 5-qadam: Environment Variables qo'shish

Vercel → loyiha → Settings → Environment Variables:

| Name | Value |
|------|-------|
| `TELEGRAM_BOT_TOKEN` | `7950739325:AAEuod4VfHq06PQbCrMNyzZ_phb4IecmVkw` |
| `TELEGRAM_CHAT_ID` | Olgan Chat ID ingiz |

"Save" bosing → "Redeploy" qiling.

---

## ✅ Tayyor!

Saytingiz ishlaydi:
- Foydalanuvchilar ro'yxatdan o'tadi → Telegram ga xabar keladi
- Har kirishda ham xabar keladi
- AI tahlil natijasi ham Telegram ga yuboriladi
- Parollar xavfsiz saqlanadi (hash qilingan)

---

## 📦 Loyiha tuzilmasi

```
nurislam-analytics/
├── api/
│   ├── register.js   ← Ro'yxatdan o'tish
│   ├── login.js      ← Kirish
│   └── notify.js     ← Telegram xabar
├── index.html        ← Sayt
├── vercel.json       ← Sozlamalar
└── .env.example      ← Env namuna
```
