/**
 * Script to view detailed appointment information including patient and doctor details
 * Run with: npx tsx scripts/view-appointment-details.ts user=username password='password'
 */

// Parse command line arguments BEFORE importing dotenv
const args = process.argv.slice(2);
let SQL_USER = "";
let SQL_PASSWORD = "";

args.forEach(arg => {
  if (arg.startsWith("user=")) {
    SQL_USER = arg.split("=").slice(1).join("=");
  } else if (arg.startsWith("password=")) {
    SQL_PASSWORD = arg.split("=").slice(1).join("=");
  } else if (arg.startsWith("username=")) {
    SQL_USER = arg.split("=").slice(1).join("=");
  }
});

if (SQL_USER && SQL_PASSWORD) {
  process.env.AZURE_SQL_USER = SQL_USER;
  process.env.AZURE_SQL_PASSWORD = SQL_PASSWORD;
}

import "dotenv/config";
import { listAppointments, getUserByEmail, getDoctorById, closeConnection } from "@/lib/azure/sql-storage";

async function viewAppointmentDetails() {
  try {
    console.log("🔍 Viewing detailed appointment information...\n");

    const appointments = await listAppointments({});

    if (appointments.length === 0) {
      console.log("❌ No appointments found in the database.");
      return;
    }

    console.log(`✅ Found ${appointments.length} appointment(s):\n`);
    console.log("=" .repeat(100));

    for (const apt of appointments) {
      console.log(`\n📅 Appointment ID: ${apt.appointment_id}`);
      console.log(`   Confirmation Code: ${apt.confirmationCode || 'N/A'}`);
      console.log(`   Date: ${new Date(apt.appointmentDate).toLocaleDateString()}`);
      console.log(`   Time: ${apt.appointmentTime}`);
      console.log(`   Type: ${apt.appointmentType}`);
      console.log(`   Status: ${apt.status}`);
      console.log(`   Estimated Cost: ${apt.estimatedCost ? `$${apt.estimatedCost}` : 'N/A'}`);
      console.log(`   Notes: ${apt.notes || 'N/A'}`);

      // Get patient details
      try {
        const patient = await getUserByEmail(apt.userEmailAddress);
        if (patient) {
          console.log(`\n   👤 Patient Information:`);
          console.log(`      Name: ${patient.FirstName} ${patient.LastName}`);
          console.log(`      Email: ${patient.emailAddress}`);
          console.log(`      Date of Birth: ${patient.DateOfBirth || 'N/A'}`);
          console.log(`      Address: ${patient.StreetAddress || 'N/A'}, ${patient.PatientCity || ''}, ${patient.PatientState || ''}`);
          console.log(`      Insurance: ${patient.InsurancePlanType || 'N/A'}`);
        } else {
          console.log(`\n   👤 Patient: ${apt.userEmailAddress} (Not found in database)`);
        }
      } catch (err) {
        console.log(`\n   👤 Patient: ${apt.userEmailAddress} (Error fetching: ${err})`);
      }

      // Get doctor details
      try {
        const doctor = await getDoctorById(apt.doctorId);
        if (doctor) {
          console.log(`\n   🏥 Doctor Information:`);
          console.log(`      Name: ${doctor.name}`);
          console.log(`      Specialty: ${doctor.specialty}`);
          console.log(`      Address: ${doctor.address}`);
          console.log(`      Telehealth: ${doctor.telehealth ? 'Yes' : 'No'}`);
          console.log(`      In Network: ${doctor.inNetwork ? 'Yes' : 'No'}`);
          console.log(`      Rating: ${doctor.rating || 'N/A'}`);
          const languages = doctor.languages ? JSON.parse(doctor.languages) : [];
          console.log(`      Languages: ${languages.join(', ') || 'N/A'}`);
        } else {
          console.log(`\n   🏥 Doctor ID: ${apt.doctorId} (Not found in database)`);
        }
      } catch (err) {
        console.log(`\n   🏥 Doctor ID: ${apt.doctorId} (Error fetching: ${err})`);
      }

      console.log("\n" + "-".repeat(100));
    }

    console.log("\n✅ Details view completed!\n");

  } catch (error: any) {
    console.error("❌ Error viewing appointment details:", error.message);
    if (error.message.includes("Login failed")) {
      console.error("\n💡 Tip: Provide credentials via command line:");
      console.error("   npx tsx scripts/view-appointment-details.ts user=username password='password'");
    }
    process.exit(1);
  } finally {
    await closeConnection();
  }
}

viewAppointmentDetails();

