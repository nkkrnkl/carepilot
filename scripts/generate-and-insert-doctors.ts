#!/usr/bin/env tsx
/**
 * Script to generate and insert 20 mock doctors into doctorInformation_table
 * 
 * Usage: npx tsx scripts/generate-and-insert-doctors.ts
 */

import "dotenv/config";
import { createDoctor, closeConnection } from "../lib/azure/sql-storage";

// Mock doctor data generator
function generateMockDoctors() {
  const specialties = [
    "Internal Medicine",
    "Family Medicine",
    "Dermatology",
    "Pediatrics",
    "Psychiatry",
    "Endocrinology",
    "Orthopedics",
    "Cardiology",
    "Neurology",
    "Gastroenterology",
  ];

  const firstNames = [
    "Sarah", "Michael", "Emily", "David", "Jennifer", "Christopher", "Jessica", "Daniel",
    "Amanda", "Matthew", "Ashley", "Andrew", "Melissa", "James", "Nicole", "Robert",
    "Michelle", "John", "Laura", "William"
  ];

  const lastNames = [
    "Martinez", "Chen", "Rodriguez", "Johnson", "Williams", "Brown", "Jones", "Garcia",
    "Miller", "Davis", "Wilson", "Moore", "Taylor", "Anderson", "Thomas", "Jackson",
    "White", "Harris", "Martin", "Thompson"
  ];

  const languages = [
    ["English"],
    ["English", "Spanish"],
    ["English", "Chinese"],
    ["English", "French"],
    ["English", "Arabic"],
    ["English", "Hindi"],
    ["English", "Spanish", "Portuguese"],
  ];

  const addresses = [
    "123 Medical Center Dr, Cambridge, MA 02139",
    "456 Healthcare Ave, Boston, MA 02115",
    "789 Wellness St, Cambridge, MA 02140",
    "321 Health Plaza, Somerville, MA 02144",
    "654 Medical Blvd, Boston, MA 02116",
    "987 Care Lane, Cambridge, MA 02141",
    "147 Doctor Way, Boston, MA 02117",
    "258 Clinic Road, Somerville, MA 02145",
    "369 Hospital Drive, Cambridge, MA 02142",
    "741 Medical Park, Boston, MA 02118",
  ];

  const doctors = [];

  for (let i = 0; i < 20; i++) {
    const firstName = firstNames[i % firstNames.length];
    const lastName = lastNames[i % lastNames.length];
    const name = `Dr. ${firstName} ${lastName}`;
    const specialty = specialties[i % specialties.length];
    const distance = (2 + Math.random() * 8).toFixed(1);
    const travelTime = `${Math.floor(10 + Math.random() * 20)} min drive`;
    const doctorLanguages = languages[i % languages.length];
    const telehealth = Math.random() > 0.3; // 70% have telehealth
    const inNetwork = Math.random() > 0.1; // 90% are in-network
    const rating = (4.0 + Math.random() * 1.0).toFixed(1); // 4.0 to 5.0
    const estimatedCost = Math.floor(30 + Math.random() * 50); // $30 to $80

    // Generate available slots
    const slots = [];
    const today = new Date();
    for (let day = 1; day <= 7; day++) {
      const slotDate = new Date(today);
      slotDate.setDate(today.getDate() + day);
      
      const dayName = slotDate.toLocaleDateString('en-US', { weekday: 'short' });
      const month = slotDate.toLocaleDateString('en-US', { month: 'short' });
      const dayNum = slotDate.getDate();
      const dateStr = `${dayName}, ${month} ${dayNum}`;

      // Generate 2-4 slots per day
      const numSlots = Math.floor(2 + Math.random() * 3);
      const times = ["8:00 AM", "9:30 AM", "11:00 AM", "1:30 PM", "3:00 PM", "4:30 PM"];
      
      for (let j = 0; j < numSlots; j++) {
        const time = times[Math.floor(Math.random() * times.length)];
        const mode = Math.random() > 0.5 ? "telehealth" : "in-person";
        
        slots.push({
          id: `${i + 1}-${day}-${j + 1}`,
          date: dateStr,
          time: time,
          available: true,
          mode: mode
        });
      }
    }

    // Generate reasons
    const reasonsList = [
      "In-network with your plan",
      "High patient ratings",
      "Telehealth available",
      "Close to your location",
      "Spanish-speaking provider",
      "Early morning availability",
      "Weekend appointments",
      "Same-day appointments available",
    ];
    
    const numReasons = Math.floor(2 + Math.random() * 3); // 2-4 reasons
    const reasons = [];
    const usedIndices = new Set();
    for (let j = 0; j < numReasons; j++) {
      let idx;
      do {
        idx = Math.floor(Math.random() * reasonsList.length);
      } while (usedIndices.has(idx));
      usedIndices.add(idx);
      reasons.push(reasonsList[idx]);
    }

    // Add specialty-specific reasons
    if (specialty === "Endocrinology") {
      reasons.push("Specializes in diabetes care");
    } else if (specialty === "Cardiology") {
      reasons.push("Cardiac specialist");
    }

    doctors.push({
      id: `doctor-${i + 1}`,
      name: name,
      specialty: specialty,
      address: addresses[i % addresses.length],
      distance: `${distance} miles`,
      travelTime: travelTime,
      languages: doctorLanguages,
      telehealth: telehealth,
      inNetwork: inNetwork,
      rating: parseFloat(rating),
      image: `https://images.unsplash.com/photo-${1559839734 + i}?w=200&h=200&fit=crop&crop=face`,
      slots: slots,
      reasons: reasons,
      estimatedCost: estimatedCost,
    });
  }

  return doctors;
}

async function insertMockDoctors() {
  try {
    console.log("🔄 Generating 20 mock doctors...\n");
    const doctors = generateMockDoctors();
    
    console.log("📊 Generated doctors:");
    doctors.forEach((doctor, index) => {
      console.log(`  ${index + 1}. ${doctor.name} - ${doctor.specialty} (${doctor.slots.length} slots)`);
    });
    
    console.log("\n💾 Inserting into database...\n");
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const doctor of doctors) {
      try {
        await createDoctor(doctor);
        console.log(`  ✅ Inserted: ${doctor.name}`);
        successCount++;
      } catch (error: any) {
        if (error.number === 2627) {
          // Duplicate key error - doctor already exists
          console.log(`  ⏭️  Skipped: ${doctor.name} (already exists)`);
        } else {
          console.error(`  ❌ Error inserting ${doctor.name}:`, error.message);
          errorCount++;
        }
      }
    }
    
    console.log("\n" + "=".repeat(80));
    console.log("📊 INSERTION SUMMARY");
    console.log("=".repeat(80));
    console.log(`  ✅ Successfully inserted: ${successCount}`);
    console.log(`  ❌ Errors: ${errorCount}`);
    console.log(`  📦 Total processed: ${doctors.length}`);
    
    console.log("\n✅ Done!");
    
  } catch (error: any) {
    console.error("❌ Error:", error.message);
    if (error.code) {
      console.error("   Error code:", error.code);
    }
    if (error.number) {
      console.error("   SQL Error number:", error.number);
    }
    process.exit(1);
  } finally {
    await closeConnection();
  }
}

// Check if credentials are provided
const SQL_CONNECTION_STRING = process.env.AZURE_SQL_CONNECTION_STRING || "";
const SQL_USER = process.env.AZURE_SQL_USER || "";
const SQL_PASSWORD = process.env.AZURE_SQL_PASSWORD || "";

if (!SQL_CONNECTION_STRING && (!SQL_USER || !SQL_PASSWORD)) {
  console.error("❌ Error: Azure SQL connection credentials not found!");
  console.error("   Please set one of the following in .env:");
  console.error("   - AZURE_SQL_CONNECTION_STRING (recommended)");
  console.error("   - OR AZURE_SQL_USER and AZURE_SQL_PASSWORD");
  process.exit(1);
}

insertMockDoctors();

