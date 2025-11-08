/**
 * Script to check scheduled appointments in the database
 * Run with: npx tsx scripts/check-appointments.ts
 * Or with credentials: npx tsx scripts/check-appointments.ts user=username password='password'
 */

// Parse command line arguments BEFORE importing dotenv
const args = process.argv.slice(2);
let SQL_USER = "";
let SQL_PASSWORD = "";

// Parse command line arguments: user=username password=password
args.forEach(arg => {
  if (arg.startsWith("user=")) {
    SQL_USER = arg.split("=").slice(1).join("=");
  } else if (arg.startsWith("password=")) {
    SQL_PASSWORD = arg.split("=").slice(1).join("=");
  } else if (arg.startsWith("username=")) {
    SQL_USER = arg.split("=").slice(1).join("=");
  }
});

// Set environment variables BEFORE importing dotenv/config
if (SQL_USER && SQL_PASSWORD) {
  process.env.AZURE_SQL_USER = SQL_USER;
  process.env.AZURE_SQL_PASSWORD = SQL_PASSWORD;
}

import "dotenv/config";
import { listAppointments, closeConnection } from "@/lib/azure/sql-storage";

async function checkAppointments() {
  try {
    console.log("🔍 Checking scheduled appointments in the database...\n");

    // Get all appointments using the listAppointments function
    const appointments = await listAppointments({});

    if (appointments.length === 0) {
      console.log("❌ No appointments found in the database.");
      return;
    }

    console.log(`✅ Found ${appointments.length} appointment(s):\n`);
    console.log("=" .repeat(80));

    appointments.forEach((apt, index) => {
      console.log(`\n📅 Appointment ${index + 1}:`);
      console.log(`   ID: ${apt.appointment_id}`);
      console.log(`   Patient Email: ${apt.userEmailAddress}`);
      console.log(`   Doctor ID: ${apt.doctorId}`);
      console.log(`   Date: ${apt.appointmentDate}`);
      console.log(`   Time: ${apt.appointmentTime}`);
      console.log(`   Type: ${apt.appointmentType}`);
      console.log(`   Status: ${apt.status}`);
      console.log(`   Confirmation Code: ${apt.confirmationCode || 'N/A'}`);
      console.log(`   Estimated Cost: ${apt.estimatedCost ? `$${apt.estimatedCost}` : 'N/A'}`);
      console.log(`   Notes: ${apt.notes || 'N/A'}`);
      console.log(`   Created: ${apt.createdAt}`);
      console.log(`   Updated: ${apt.updatedAt}`);
      console.log("-".repeat(80));
    });

    // Get summary statistics
    console.log("\n📊 Summary Statistics:\n");
    
    const totalCount = appointments.length;
    const byStatus = appointments.reduce((acc: Record<string, number>, apt: any) => {
      acc[apt.status] = (acc[apt.status] || 0) + 1;
      return acc;
    }, {});
    
    const byType = appointments.reduce((acc: Record<string, number>, apt: any) => {
      acc[apt.appointmentType] = (acc[apt.appointmentType] || 0) + 1;
      return acc;
    }, {});

    console.log(`   Total Appointments: ${totalCount}`);
    console.log(`   By Status:`);
    Object.entries(byStatus).forEach(([status, count]) => {
      console.log(`     - ${status}: ${count}`);
    });
    console.log(`   By Type:`);
    Object.entries(byType).forEach(([type, count]) => {
      console.log(`     - ${type}: ${count}`);
    });

    // Get appointments for today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayAppointments = appointments.filter((apt: any) => {
      const aptDate = new Date(apt.appointmentDate);
      return aptDate >= today && aptDate < tomorrow;
    });

    console.log(`\n   Today's Appointments: ${todayAppointments.length}`);

    // Get unique patients
    const uniquePatients = new Set(appointments.map((apt: any) => apt.userEmailAddress));
    console.log(`   Unique Patients: ${uniquePatients.size}`);

    // Get unique doctors
    const uniqueDoctors = new Set(appointments.map((apt: any) => apt.doctorId));
    console.log(`   Unique Doctors: ${uniqueDoctors.size}`);

    console.log("\n✅ Appointment check completed!\n");

  } catch (error: any) {
    console.error("❌ Error checking appointments:", error.message);
    if (error.message.includes("Login failed")) {
      console.error("\n💡 Tip: Provide credentials via command line:");
      console.error("   npx tsx scripts/check-appointments.ts user=username password='password'");
    }
    if (error.stack) {
      console.error("   Stack:", error.stack);
    }
    process.exit(1);
  } finally {
    await closeConnection();
  }
}

checkAppointments();

