/**
 * fetch-data.js
 * -----------------------------------------------------
 * এই স্ক্রিপ্টটি Firebase Realtime Database থেকে ডাটা fetch করে
 * একটা নতুন/আলাদা JSON ফাইল বানায় (data/output.json)।
 *
 * Node.js এর বিল্ট-ইন fetch() ব্যবহার করা হয়েছে (Node 18+),
 * তাই কোনো npm package ইন্সটল করার দরকার নেই।
 * -----------------------------------------------------
 */

const fs = require("fs");
const path = require("path");

// ==== ENV VARIABLES (GitHub Secrets থেকে আসবে) ====
const DB_BASE_URL = process.env.FIREBASE_DB_URL; // যেমন: https://priofy-6b9b4-default-rtdb.firebaseio.com/sports_events.json
const AUTH_TOKEN = process.env.FIREBASE_AUTH_TOKEN; // secret token

if (!DB_BASE_URL || !AUTH_TOKEN) {
  console.error(
    "❌ Error: FIREBASE_DB_URL অথবা FIREBASE_AUTH_TOKEN environment variable পাওয়া যায়নি।"
  );
  process.exit(1);
}

const SOURCE_URL = `${DB_BASE_URL}?auth=${AUTH_TOKEN}`;
const OUTPUT_PATH = path.join(__dirname, "..", "data", "output.json");

/**
 * এখানে তুমি চাইলে ডাটা তোমার পছন্দমতো রূপে সাজাতে পারো।
 * এখন এটা শুধু raw ডাটার সাথে একটা "last_synced_at" টাইমস্ট্যাম্প
 * এবং টোটাল ইভেন্ট কাউন্ট যোগ করে সেভ করছে।
 */
function transformData(rawData) {
  const eventsArray = rawData
    ? Object.entries(rawData).map(([id, value]) => ({
        id,
        ...value,
      }))
    : [];

  return {
    last_synced_at: new Date().toISOString(),
    total_events: eventsArray.length,
    events: eventsArray,
  };
}

async function main() {
  console.log("🔄 Firebase থেকে ডাটা fetch করা শুরু হচ্ছে...");

  const response = await fetch(SOURCE_URL);

  if (!response.ok) {
    throw new Error(
      `❌ Firebase থেকে ডাটা আনা যায়নি। Status: ${response.status} ${response.statusText}`
    );
  }

  const rawData = await response.json();
  const finalData = transformData(rawData);

  // data ফোল্ডার না থাকলে বানিয়ে নাও
  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(finalData, null, 2), "utf-8");

  console.log(`✅ সফলভাবে ${OUTPUT_PATH} আপডেট হয়েছে।`);
  console.log(`📊 মোট ইভেন্ট: ${finalData.total_events}`);
}

main().catch((err) => {
  console.error("🔥 স্ক্রিপ্ট চালাতে গিয়ে সমস্যা হয়েছে:", err.message);
  process.exit(1);
});
