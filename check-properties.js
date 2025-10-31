// Quick script to check if properties exist in the database
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://tproaiqvkohrlxjmkgxt.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRwcm9haXF2a29ocmx4am1rZ3h0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc0MjUwNDksImV4cCI6MjA3MzAwMTA0OX0.RoOBMaKyPXi0BXfWOhLpAAj89sKYxWEE-Zz5iu3kTEI";

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkProperties() {
  console.log("🔍 Checking properties in database...\n");

  try {
    const { data, error, count } = await supabase
      .from("properties")
      .select("*", { count: "exact" })
      .limit(5);

    if (error) {
      console.error("❌ Error fetching properties:", error);
      console.error("Error details:", {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
      });
      return;
    }

    console.log(`✅ Found ${count} total properties in database`);
    console.log(`📋 Showing first ${data?.length || 0} properties:\n`);

    if (data && data.length > 0) {
      data.forEach((property, index) => {
        console.log(`${index + 1}. ${property.title || "Untitled"}`);
        console.log(`   ID: ${property.id}`);
        console.log(`   Location: ${property.location || "N/A"}`);
        console.log(`   Price: ₦${property.price || 0}`);
        console.log(`   Type: ${property.property_type || "N/A"}`);
        console.log(`   Bedrooms: ${property.bedrooms || 0}`);
        console.log(`   Bathrooms: ${property.bathrooms || 0}`);
        console.log(
          `   Images: ${
            Array.isArray(property.images)
              ? property.images.length + " images"
              : typeof property.images
          }`
        );
        console.log(`   Created: ${property.created_at}`);
        console.log("");
      });
    } else {
      console.log("⚠️  No properties found in database!");
      console.log(
        "💡 You may need to run a seed script to add sample properties."
      );
    }
  } catch (error) {
    console.error("❌ Unexpected error:", error);
  }
}

checkProperties();
