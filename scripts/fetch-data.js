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

// তোমার টাইমজোন — চাইলে বদলাতে পারো (যেমন Bangladesh সবসময় Asia/Dhaka)
const TIMEZONE = "Asia/Dhaka";

/**
 * সময়টা সুন্দরভাবে AM/PM ফরম্যাটে বানানোর ফাংশন
 * উদাহরণ আউটপুট: "25 September 2026, 08:45:12 PM"
 */
function formatReadableTime(date) {
  const datePart = new Intl.DateTimeFormat("en-GB", {
    timeZone: TIMEZONE,
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);

  const timePart = new Intl.DateTimeFormat("en-US", {
    timeZone: TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  }).format(date);

  return `${datePart}, ${timePart}`;
}

/**
 * আগের output.json ফাইলটা পড়ে (যদি থাকে), যাতে আমরা বুঝতে পারি
 * আগের সিংকের পর নতুন কয়টা ডাটা যোগ হয়েছে।
 */
function readPreviousData() {
  try {
    const raw = fs.readFileSync(OUTPUT_PATH, "utf-8");
    const parsed = JSON.parse(raw);
    return parsed;
  } catch (err) {
    // প্রথমবার রান হলে ফাইল থাকবে না, এটা স্বাভাবিক
    return null;
  }
}

/**
 * এখানে তুমি চাইলে ডাটা তোমার পছন্দমতো রূপে সাজাতে পারো।
 */
function transformData(rawData) {
  const eventsArray = rawData
    ? Object.entries(rawData).map(([id, value]) => ({
        id,
        ...value,
      }))
    : [];

  return eventsArray;
}

async function main() {
  console.log("🔄 Firebase থেকে ডাটা fetch করা শুরু হচ্ছে...");

  const previousData = readPreviousData();
  const previousIds = new Set(
    (previousData && Array.isArray(previousData.events)
      ? previousData.events
      : []
    ).map((e) => e.id)
  );

  const response = await fetch(SOURCE_URL);

  if (!response.ok) {
    throw new Error(
      `❌ Firebase থেকে ডাটা আনা যায়নি। Status: ${response.status} ${response.statusText}`
    );
  }

  const rawData = await response.json();
  const eventsArray = transformData(rawData);

  // আগের সিংকের সাথে তুলনা করে নতুন কয়টা ডাটা এসেছে বের করা
  const newItemsCount = eventsArray.filter(
    (e) => !previousIds.has(e.id)
  ).length;

  const now = new Date();

  const finalData = {
    last_updated: formatReadableTime(now), // 👈 সুন্দরভাবে AM/PM সহ, একদম উপরে
    last_updated_iso: now.toISOString(), // মেশিন-রিডেবল ভার্সন (প্রয়োজনে ব্যবহারের জন্য)
    new_since_last_sync: newItemsCount, // 👈 আগের সিংকের পর নতুন কয়টা ডাটা পাওয়া গেছে
    total_events: eventsArray.length,
    events: eventsArray,
  };

  // data ফোল্ডার না থাকলে বানিয়ে নাও
  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(finalData, null, 2), "utf-8");

  console.log(`✅ সফলভাবে ${OUTPUT_PATH} আপডেট হয়েছে।`);
  console.log(`🕒 শেষ আপডেট: ${finalData.last_updated}`);
  console.log(`🆕 নতুন ডাটা: ${finalData.new_since_last_sync}`);
  console.log(`📊 মোট ইভেন্ট: ${finalData.total_events}`);
}

main().catch((err) => {
  console.error("🔥 স্ক্রিপ্ট চালাতে গিয়ে সমস্যা হয়েছে:", err.message);
  process.exit(1);
});
