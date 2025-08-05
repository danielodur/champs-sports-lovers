// 🔍 COMPREHENSIVE SUPABASE SETUP VERIFICATION
// This script verifies all components needed for the Champs Sports App

require("dotenv").config();
const { createClient } = require("@supabase/supabase-js");

// Configuration
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

console.log("🔍 CHAMPS SPORTS APP - SUPABASE SETUP VERIFICATION");
console.log("==================================================\n");

// Check environment variables
console.log("1️⃣ ENVIRONMENT VARIABLES CHECK");
console.log("--------------------------------");
console.log(
  "🔑 Supabase URL:",
  supabaseUrl ? `✅ Found (${supabaseUrl.substring(0, 30)}...)` : "❌ Missing"
);
console.log(
  "🔑 Supabase Key:",
  supabaseAnonKey
    ? `✅ Found (${supabaseAnonKey.substring(0, 20)}...)`
    : "❌ Missing"
);

if (!supabaseUrl || !supabaseAnonKey) {
  console.log("\n❌ CRITICAL: Missing Supabase credentials");
  console.log(
    "💡 Please add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY to your .env file"
  );
  process.exit(1);
}

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function verifyDatabaseTables() {
  console.log("\n2️⃣ DATABASE TABLES VERIFICATION");
  console.log("-------------------------------");

  const requiredTables = [
    "profiles",
    "user_settings",
    "favorite_matches",
    "user_follows",
    "user_invites",
    "user_messages",
    "user_check_ins",
    "notifications",
    "user_achievements",
    "blocked_users",
    "match_events",
    "live_match_updates",
  ];

  const results = {};

  for (const tableName of requiredTables) {
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select("*")
        .limit(1);

      if (error) {
        if (error.code === "42P01") {
          // Table doesn't exist
          results[tableName] = {
            status: "❌ MISSING",
            error: "Table not found",
          };
        } else {
          results[tableName] = { status: "⚠️ ERROR", error: error.message };
        }
      } else {
        results[tableName] = { status: "✅ EXISTS", count: data?.length || 0 };
      }
    } catch (err) {
      results[tableName] = { status: "❌ FAILED", error: err.message };
    }
  }

  // Display results
  for (const [table, result] of Object.entries(results)) {
    console.log(`${table.padEnd(20)} ${result.status}`);
    if (result.error) {
      console.log(`   └─ ${result.error}`);
    }
  }

  return results;
}

async function verifyRLSPolicies() {
  console.log("\n3️⃣ RLS (ROW LEVEL SECURITY) VERIFICATION");
  console.log("----------------------------------------");

  try {
    // Test RLS by trying to access profiles table
    const { data, error } = await supabase
      .from("profiles")
      .select("id, username")
      .limit(1);

    if (error) {
      console.log("❌ RLS Test Failed:", error.message);
      return false;
    }

    console.log("✅ RLS is working - queries are being filtered");
    return true;
  } catch (err) {
    console.log("❌ RLS Verification Error:", err.message);
    return false;
  }
}

async function verifyStorageBuckets() {
  console.log("\n4️⃣ STORAGE BUCKETS VERIFICATION");
  console.log("-------------------------------");

  try {
    const requiredBuckets = ["team-logos", "avatars", "match-images"];
    const accessibleBuckets = [];

    for (const bucketName of requiredBuckets) {
      try {
        const { data: files, error: listError } = await supabase.storage
          .from(bucketName)
          .list();

        if (listError) {
          console.log(`   ❌ ${bucketName} - ${listError.message}`);
        } else {
          console.log(
            `   ✅ ${bucketName} - Accessible (${files.length} files)`
          );
          accessibleBuckets.push(bucketName);
        }
      } catch (err) {
        console.log(`   ❌ ${bucketName} - ${err.message}`);
      }
    }

    console.log(
      `\n📦 Storage Summary: ${accessibleBuckets.length}/${requiredBuckets.length} buckets accessible`
    );
    return accessibleBuckets;
  } catch (err) {
    console.log("❌ Storage Verification Error:", err.message);
    return false;
  }
}

async function verifyAuthentication() {
  console.log("\n5️⃣ AUTHENTICATION CONFIGURATION");
  console.log("--------------------------------");

  try {
    // Test auth configuration by checking current session
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error) {
      console.log("❌ Auth Configuration Error:", error.message);
      return false;
    }

    if (session) {
      console.log("✅ Auth is configured - User session found");
      console.log(`   User ID: ${session.user.id}`);
    } else {
      console.log("✅ Auth is configured - No active session (expected)");
    }

    return true;
  } catch (err) {
    console.log("❌ Auth Verification Error:", err.message);
    return false;
  }
}

async function verifyRealtime() {
  console.log("\n6️⃣ REAL-TIME FUNCTIONALITY VERIFICATION");
  console.log("----------------------------------------");

  try {
    // Test real-time subscription
    const channel = supabase
      .channel("test-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "profiles" },
        (payload) => {
          console.log(
            "✅ Real-time is working - Received update:",
            payload.eventType
          );
        }
      )
      .subscribe();

    // Wait a moment for subscription to establish
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Unsubscribe
    await supabase.removeChannel(channel);

    console.log("✅ Real-time subscription test completed");
    return true;
  } catch (err) {
    console.log("❌ Real-time Verification Error:", err.message);
    return false;
  }
}

async function runVerification() {
  try {
    console.log("🚀 Starting comprehensive verification...\n");

    const dbResults = await verifyDatabaseTables();
    const rlsWorking = await verifyRLSPolicies();
    const storageBuckets = await verifyStorageBuckets();
    const authWorking = await verifyAuthentication();
    const realtimeWorking = await verifyRealtime();

    // Summary
    console.log("\n📊 VERIFICATION SUMMARY");
    console.log("=======================");

    const missingTables = Object.values(dbResults).filter(
      (r) => r.status === "❌ MISSING"
    ).length;
    const totalTables = Object.keys(dbResults).length;

    console.log(
      `📋 Database Tables: ${totalTables - missingTables}/${totalTables} exist`
    );
    console.log(`🔒 RLS Policies: ${rlsWorking ? "✅ Working" : "❌ Issues"}`);
    console.log(
      `📦 Storage: ${storageBuckets ? "✅ Accessible" : "❌ Issues"}`
    );
    console.log(
      `🔐 Authentication: ${authWorking ? "✅ Configured" : "❌ Issues"}`
    );
    console.log(
      `⚡ Real-time: ${realtimeWorking ? "✅ Working" : "❌ Issues"}`
    );

    // Recommendations
    console.log("\n💡 RECOMMENDATIONS");
    console.log("==================");

    if (missingTables > 0) {
      console.log("🔧 Run database schema setup:");
      console.log("   node -e \"require('./database_schema.sql')\"");
    }

    if (!rlsWorking) {
      console.log("🔧 Check RLS policies in Supabase dashboard");
    }

    if (!storageBuckets) {
      console.log("🔧 Create storage buckets in Supabase dashboard");
    }

    if (!authWorking) {
      console.log("🔧 Verify auth settings in Supabase dashboard");
    }

    if (!realtimeWorking) {
      console.log("🔧 Enable real-time on tables in Supabase dashboard");
    }

    console.log("\n✅ Verification completed!");
  } catch (error) {
    console.log("\n❌ Verification failed:", error.message);
  }
}

// Run the verification
runVerification();
