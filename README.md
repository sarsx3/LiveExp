# Firebase → GitHub Auto Data Sync

এই রিপোজিটরি প্রতি **৫ মিনিট** পর পর তোমার Firebase Realtime Database থেকে ডাটা এনে
`data/output.json` ফাইলে নতুন করে সেভ করবে — সম্পূর্ণ **GitHub Actions** ব্যবহার করে,
কোনো সার্ভার ছাড়াই, ফ্রি-তে।

---

## 📁 ফাইল স্ট্রাকচার

```
.
├── .github/
│   └── workflows/
│       └── sync-data.yml     ← Cron job (প্রতি ৫ মিনিটে রান হয়)
├── scripts/
│   └── fetch-data.js         ← ডাটা fetch করে transform করার কোড
├── data/
│   └── output.json           ← তোমার নতুন/আলাদা আউটপুট JSON (অটো-আপডেট হয়)
└── README.md
```

---

## 🚀 ধাপে ধাপে সেটআপ (একদম শুরু থেকে)

### ধাপ ১: GitHub রিপোজিটরি বানাও
1. GitHub এ লগইন করো → উপরে ডান পাশে **"+"** → **New repository**
2. নাম দাও (যেমন: `firebase-auto-sync`)
3. **Public** বা **Private** — যেটা চাও (তবে সিকিউরিটির জন্য Private রাখাই ভালো)
4. **Create repository** ক্লিক করো

### ধাপ ২: এই ফাইলগুলো রিপোতে আপলোড করো
নিচে দেওয়া ৪টা ফাইল (`sync-data.yml`, `fetch-data.js`, `output.json`, `README.md`)
একই ফোল্ডার স্ট্রাকচার মেনে তোমার রিপোতে আপলোড করো (GitHub এর "Add file → Upload files"
দিয়ে করতে পারো, অথবা `git clone` করে লোকালি রেখে `git push` করতে পারো)।

### ধাপ ৩: 🔐 Secret যোগ করো (সবচেয়ে গুরুত্বপূর্ণ ধাপ!)

তোমার Firebase লিংকে একটা `auth` টোকেন আছে —
```
https://priofy-6b9b4-default-rtdb.firebaseio.com/sports_events.json?auth=2gEYXaFECMKJNDrGUdv6ZhJH4ceHiokhHNrpePXF
```

⚠️ **এই টোকেনটা কখনোই সরাসরি কোডে/ফাইলে লিখে পাবলিশ কোরো না** — এটা তোমার ডাটাবেজের
একটা সিক্রেট চাবির মতো। এর বদলে GitHub এর নিজস্ব **Secrets** সিস্টেমে রাখবে, যেটা
কেউ দেখতে পারবে না, শুধু GitHub Actions ব্যবহার করতে পারবে।

সেটাপ করতে:
1. তোমার রিপোতে যাও → **Settings** ট্যাব
2. বাম পাশে **Secrets and variables** → **Actions**
3. **New repository secret** ক্লিক করো, এবং নিচের দুইটা secret আলাদাভাবে যোগ করো:

| Name | Value |
|---|---|
| `FIREBASE_DB_URL` | `https://priofy-6b9b4-default-rtdb.firebaseio.com/sports_events.json` |
| `FIREBASE_AUTH_TOKEN` | `2gEYXaFECMKJNDrGUdv6ZhJH4ceHiokhHNrpePXF` |

> 💡 লক্ষ্য করো: `FIREBASE_DB_URL` এ `?auth=...` অংশটুকু নেই — সেটা আলাদা secret হিসেবে
> `FIREBASE_AUTH_TOKEN` এ দেওয়া হয়েছে। স্ক্রিপ্ট নিজেই দুইটা জোড়া লাগিয়ে নিবে।

### ধাপ ৪: GitHub Actions চালু করো
1. রিপোর **Actions** ট্যাবে যাও
2. যদি জিজ্ঞেস করে "I understand my workflows, go ahead and enable them" — সেটায় ক্লিক করো
3. বাম পাশে **Sync Firebase Data** workflow দেখতে পাবে

### ধাপ ৫: টেস্ট করো
প্রথমবার ৫ মিনিট অপেক্ষা না করে ম্যানুয়ালি টেস্ট করতে পারো:
1. **Actions** ট্যাব → **Sync Firebase Data** সিলেক্ট করো
2. ডান পাশে **Run workflow** বাটনে ক্লিক করো → **Run workflow** কনফার্ম করো
3. কিছুক্ষণ পর রিফ্রেশ করলে দেখবে একটা green ✅ রান সম্পন্ন হয়েছে
4. রিপোর `data/output.json` ফাইলে ঢুকে দেখো — নতুন ডাটা চলে এসেছে

এরপর থেকে এটা **প্রতি ৫ মিনিট পর পর** নিজে থেকেই রান হতে থাকবে, এবং
Firebase এ ডাটা বদলালে `output.json` ও নিজে থেকেই আপডেট হয়ে commit হয়ে যাবে।

---

## ⚙️ কীভাবে কাজ করে (সংক্ষেপে)

- `sync-data.yml` — GitHub এর cron scheduler প্রতি ৫ মিনিটে ট্রিগার হয় এবং
  `fetch-data.js` স্ক্রিপ্টটা রান করে।
- `fetch-data.js` — Firebase URL + secret টোকেন জোড়া লাগিয়ে ডাটা fetch করে,
  নিজের মতো ফরম্যাটে সাজিয়ে (`last_synced_at`, `total_events`, `events` সহ)
  `data/output.json` এ লিখে ফেলে।
- ফাইলে কোনো পরিবর্তন হলে workflow সেটা automatically **commit + push** করে দেয়।
  কোনো পরিবর্তন না থাকলে commit করে না (অহেতুক commit history ভরে যাবে না)।

---

## ✏️ ডাটা কীভাবে নিজের মতো সাজাবে

`scripts/fetch-data.js` ফাইলের `transformData()` ফাংশনের ভেতরে তুমি চাইলে
নিজের প্রয়োজনমতো ডাটা ফিল্টার/সর্ট/রিনেম করতে পারো। যেমন — শুধু আজকের ম্যাচগুলো
রাখতে চাইলে, বা নির্দিষ্ট ফিল্ড বাদ দিতে চাইলে, এই ফাংশনেই পরিবর্তন করবে।

---

## ⏱️ সময় পরিবর্তন করতে চাইলে

`.github/workflows/sync-data.yml` ফাইলের এই লাইনটা বদলে দাও:

```yaml
- cron: "*/5 * * * *"   # প্রতি ৫ মিনিট
```

উদাহরণ:
- প্রতি ১০ মিনিটে → `*/10 * * * *`
- প্রতি ১ ঘণ্টায় → `0 * * * *`

> ⚠️ নোট: GitHub Actions এর ফ্রি cron সবসময় একদম সঠিক সময়ে রান নাও হতে পারে
> (কয়েক মিনিট দেরি হতে পারে, GitHub এর সার্ভার লোডের উপর নির্ভর করে) — এটা
> GitHub এর নিজস্ব একটা সীমাবদ্ধতা, তোমার কোডের সমস্যা না।

---

## 🌐 নতুন JSON টা কোথায় পাবে?

কাজ শুরু হওয়ার পর তোমার `output.json` এর raw লিংক হবে এরকম:

```
https://raw.githubusercontent.com/<তোমার-ইউজারনেম>/<রিপো-নাম>/main/data/output.json
```

এই লিংকটাই তুমি অন্য কোথাও (ওয়েবসাইট, অ্যাপ ইত্যাদি) ব্যবহার করতে পারবে —
এটা তোমার নিজের অটো-আপডেট হওয়া JSON API হিসেবে কাজ করবে।
