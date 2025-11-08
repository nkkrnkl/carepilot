/**
 * Test SQL Database Connection with Fake Data
 * 
 * This script tests the SQL Server connection and inserts fake test data
 * for users, providers, insurers, appointments, lab reports, benefits, and EOBs.
 */

import {
  getConnectionPool,
  closeConnection,
  createInsurer,
  createProvider,
  createUser,
  createDoctor,
  createAppointment,
  createLabReport,
  upsertInsuranceBenefits,
  upsertEOBRecord,
  getUserByEmail,
  listLabReportsByUser,
  getInsuranceBenefitsByUser,
  listEOBRecordsByUser,
  listAppointments,
} from '@/lib/azure/sql-storage';

// Test data generators
function generateTestData() {
  const timestamp = Date.now();
  const randomId = Math.random().toString(36).substring(2, 9);
  
  return {
    // Insurer data
    insurer: {
      unique_id: `insurer-${timestamp}-${randomId}`,
      precheckcover_id: `precheck-${timestamp}-${randomId}`,
    },
    
    // Provider data
    provider: {
      provider_id: `provider-${timestamp}-${randomId}`,
      name: 'Test Medical Center',
      specialty: 'General Medicine',
      address: '123 Medical St, Test City, TS 12345',
      phone: '(555) 123-4567',
      email: 'contact@testmedical.com',
    },
    
    // User data
    user: {
      emailAddress: `testuser-${timestamp}@example.com`,
      FirstName: 'John',
      LastName: 'Doe',
      DateOfBirth: '1990-01-15',
      StreetAddress: '456 Test Street',
      PatientCity: 'Test City',
      PatientState: 'CA',
      InsurancePlanType: 'PPO',
      userRole: 'patient',
      // Note: password_hash is optional - you can add it if testing authentication
      // password_hash: 'hashed_password_here',
    },
    
    // Doctor data
    doctor: {
      id: `doctor-${timestamp}-${randomId}`,
      name: 'Dr. Jane Smith',
      specialty: 'Cardiology',
      address: '789 Health Ave, Test City, TS 12345',
      languages: JSON.stringify(['English', 'Spanish']),
      telehealth: true,
      inNetwork: true,
      rating: 4.8,
      slots: JSON.stringify([
        { id: '1', date: '2025-01-20', time: '10:00 AM', available: true, mode: 'in-person' },
        { id: '2', date: '2025-01-20', time: '2:00 PM', available: true, mode: 'telehealth' },
      ]),
      estimatedCost: 150.00,
    },
    
    // Appointment data
    appointment: {
      userEmailAddress: `testuser-${timestamp}@example.com`,
      doctorId: `doctor-${timestamp}-${randomId}`,
      appointmentDate: new Date('2025-01-20T10:00:00Z'),
      appointmentTime: '10:00 AM',
      appointmentType: 'in-person' as const,
      status: 'scheduled' as const,
      confirmationCode: `CONF-${timestamp}`,
      estimatedCost: 150.00,
    },
    
    // Lab report data
    labReport: {
      id: `lab-${timestamp}-${randomId}`,
      userId: `testuser-${timestamp}@example.com`,
      title: 'Complete Blood Count (CBC)',
      date: '2025-01-10',
      hospital: 'Test Medical Center',
      doctor: 'Dr. Jane Smith',
      fileUrl: `https://storage.example.com/labs/lab-${timestamp}.pdf`,
      rawExtract: JSON.stringify({
        report_meta: {
          date_iso: '2025-01-10',
          doctor_name: 'Dr. Jane Smith',
          medical_center: 'Test Medical Center',
        },
        results: [
          {
            analyte: 'WBC',
            value: 7.2,
            unit: '10^3/uL',
            ref_low: 4.0,
            ref_high: 11.0,
            flag: null,
          },
          {
            analyte: 'RBC',
            value: 4.8,
            unit: '10^6/uL',
            ref_low: 4.2,
            ref_high: 5.4,
            flag: null,
          },
        ],
      }),
      parameters: JSON.stringify({
        white_blood_cells: { value: 7.2, unit: '10^3/uL', normal: true },
        red_blood_cells: { value: 4.8, unit: '10^6/uL', normal: true },
      }),
    },
    
    // Insurance benefits data
    benefits: {
      precheckcover_id: `precheck-${timestamp}-${randomId}`,
      user_id: `testuser-${timestamp}@example.com`,
      plan_name: 'Test Health Plan Premium',
      plan_type: 'PPO',
      insurance_provider: 'Test Insurance Co',
      policy_number: `POL-${timestamp}-${randomId}`,
      group_number: 'GRP-12345',
      effective_date: '2025-01-01',
      expiration_date: '2025-12-31',
      deductibles: JSON.stringify([
        {
          amount: 500,
          type: 'individual',
          applies_to: 'medical',
          annual: true,
          network: 'in_network',
        },
        {
          amount: 1000,
          type: 'individual',
          applies_to: 'medical',
          annual: true,
          network: 'out_of_network',
        },
      ]),
      copays: JSON.stringify([
        {
          amount: 25,
          service_type: 'primary_care',
          network: 'in_network',
        },
        {
          amount: 50,
          service_type: 'specialist',
          network: 'in_network',
        },
      ]),
      coinsurance: JSON.stringify([
        {
          percentage: 20,
          applies_to: 'medical',
          network: 'in_network',
        },
        {
          percentage: 40,
          applies_to: 'medical',
          network: 'out_of_network',
        },
      ]),
      coverage_limits: JSON.stringify([]),
      services: JSON.stringify([
        {
          service_name: 'preventive_care',
          covered: true,
          requires_preauth: false,
          copay: { amount: 0, service_type: 'preventive_care', network: 'in_network' },
          notes: 'Preventive care is covered at 100%',
        },
        {
          service_name: 'emergency_services',
          covered: true,
          requires_preauth: false,
          copay: { amount: 100, service_type: 'emergency', network: 'both_networks' },
          notes: 'Emergency room care: $100 copay/visit',
        },
      ]),
      out_of_pocket_max_individual: 5000,
      out_of_pocket_max_family: 10000,
      in_network_providers: 'See provider directory at testinsurance.com',
      out_of_network_coverage: true,
      network_notes: 'Out-of-network coverage available with higher costs',
      preauth_required_services: JSON.stringify(['surgery', 'imaging']),
      preauth_notes: 'Pre-authorization required for certain services',
      exclusions: JSON.stringify(['cosmetic_surgery', 'experimental_treatment']),
      exclusion_notes: 'Some services are excluded from coverage',
      special_programs: JSON.stringify(['wellness_programs', 'preventive_care']),
      additional_benefits: 'Includes mental health services and prescription drug coverage',
      notes: 'This is a test insurance plan',
      extracted_date: new Date(),
      source_document_id: `doc-${timestamp}-${randomId}`,
    },
    
    // EOB data
    eob: {
      user_id: `testuser-${timestamp}@example.com`,
      claim_number: `CLM-${timestamp}-${randomId}`,
      member_name: 'John Doe',
      member_address: '456 Test Street, Test City, CA 12345',
      member_id: `MEMBER-${timestamp}`,
      group_number: 'GRP-12345',
      claim_date: '2025-01-05',
      provider_name: 'Test Medical Center',
      provider_npi: '1234567890',
      total_billed: 500.00,
      total_benefits_approved: 400.00,
      amount_you_owe: 100.00,
      services: JSON.stringify([
        {
          service_description: 'Office Visit',
          service_date: '2025-01-05',
          amount_billed: 200.00,
          not_covered: 0,
          covered: 200.00,
          cpt_code: '99213',
          icd10_code: null,
        },
        {
          service_description: 'Lab Test',
          service_date: '2025-01-05',
          amount_billed: 300.00,
          not_covered: 0,
          covered: 200.00,
          cpt_code: '80053',
          icd10_code: null,
        },
      ]),
      coverage_breakdown: JSON.stringify({
        total_billed: 500.00,
        total_not_covered: 0,
        total_covered_before_deductions: 500.00,
        total_coinsurance: 100.00,
        total_deductions: 0,
        total_benefits_approved: 400.00,
        amount_you_owe: 100.00,
        notes: 'Deductible has been met',
      }),
      insurance_provider: 'Test Insurance Co',
      plan_name: 'Test Health Plan Premium',
      policy_number: `POL-${timestamp}-${randomId}`,
      alerts: JSON.stringify(['Normal amount']),
      discrepancies: JSON.stringify([]),
      source_document_id: `eob-doc-${timestamp}-${randomId}`,
      extracted_date: new Date(),
    },
  };
}

async function testDatabaseConnection() {
  console.log('🔌 Testing SQL Database Connection...\n');
  
  try {
    const pool = await getConnectionPool();
    console.log('✅ Database connection successful!\n');
    return pool;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    throw error;
  }
}

async function testInsurerCreation(insurer: any) {
  console.log('📋 Testing Insurer Creation...');
  try {
    await createInsurer(insurer);
    console.log(`✅ Insurer created: ${insurer.unique_id} (precheckcover_id: ${insurer.precheckcover_id})\n`);
    return insurer.unique_id;
  } catch (error) {
    console.error('❌ Failed to create insurer:', error);
    throw error;
  }
}

async function testProviderCreation(provider: any) {
  console.log('🏥 Testing Provider Creation...');
  try {
    await createProvider(provider);
    console.log(`✅ Provider created: ${provider.provider_id} (${provider.name})\n`);
    return provider.provider_id;
  } catch (error) {
    console.error('❌ Failed to create provider:', error);
    throw error;
  }
}

async function testUserCreation(user: any, providerId: string, insurerId: string) {
  console.log('👤 Testing User Creation...');
  try {
    const userWithRelations = {
      ...user,
      providerId,
      insurerId,
    };
    await createUser(userWithRelations);
    console.log(`✅ User created: ${user.emailAddress}\n`);
    return user.emailAddress;
  } catch (error) {
    console.error('❌ Failed to create user:', error);
    throw error;
  }
}

async function testDoctorCreation(doctor: any) {
  console.log('👨‍⚕️ Testing Doctor Creation...');
  try {
    await createDoctor(doctor);
    console.log(`✅ Doctor created: ${doctor.id} (${doctor.name})\n`);
    return doctor.id;
  } catch (error) {
    console.error('❌ Failed to create doctor:', error);
    throw error;
  }
}

async function testAppointmentCreation(appointment: any) {
  console.log('📅 Testing Appointment Creation...');
  try {
    const appointmentId = await createAppointment(appointment);
    console.log(`✅ Appointment created: ${appointmentId}\n`);
    return appointmentId;
  } catch (error) {
    console.error('❌ Failed to create appointment:', error);
    throw error;
  }
}

async function testLabReportCreation(labReport: any) {
  console.log('🔬 Testing Lab Report Creation...');
  try {
    await createLabReport(labReport);
    console.log(`✅ Lab report created: ${labReport.id} (${labReport.title})\n`);
    return labReport.id;
  } catch (error) {
    console.error('❌ Failed to create lab report:', error);
    throw error;
  }
}

async function testBenefitsCreation(benefits: any) {
  console.log('💊 Testing Insurance Benefits Creation...');
  try {
    const benefitsId = await upsertInsuranceBenefits(benefits);
    console.log(`✅ Insurance benefits created: ID ${benefitsId} (plan: ${benefits.plan_name})\n`);
    return benefitsId;
  } catch (error) {
    console.error('❌ Failed to create insurance benefits:', error);
    throw error;
  }
}

async function testEOBCreation(eob: any) {
  console.log('📄 Testing EOB Creation...');
  try {
    const eobId = await upsertEOBRecord(eob);
    console.log(`✅ EOB record created: ID ${eobId} (claim: ${eob.claim_number})\n`);
    return eobId;
  } catch (error) {
    console.error('❌ Failed to create EOB record:', error);
    throw error;
  }
}

async function testDataRetrieval(userEmail: string) {
  console.log('🔍 Testing Data Retrieval...\n');
  
  try {
    // Get user
    const user = await getUserByEmail(userEmail);
    if (user) {
      console.log(`✅ User retrieved: ${user.emailAddress} (${user.FirstName} ${user.LastName})`);
    } else {
      console.log(`❌ User not found: ${userEmail}`);
    }
    
    // Get lab reports
    const labReports = await listLabReportsByUser(userEmail);
    console.log(`✅ Lab reports retrieved: ${labReports.length} report(s)`);
    labReports.forEach((report) => {
      console.log(`   - ${report.title} (${report.date})`);
    });
    
    // Get insurance benefits
    const benefits = await getInsuranceBenefitsByUser(userEmail);
    console.log(`✅ Insurance benefits retrieved: ${benefits.length} benefit record(s)`);
    benefits.forEach((benefit) => {
      console.log(`   - ${benefit.plan_name} (${benefit.insurance_provider})`);
    });
    
    // Get EOB records
    const eobs = await listEOBRecordsByUser(userEmail);
    console.log(`✅ EOB records retrieved: ${eobs.length} record(s)`);
    eobs.forEach((eob) => {
      console.log(`   - Claim ${eob.claim_number} (${eob.provider_name}) - $${eob.amount_you_owe}`);
    });
    
    // Get appointments
    const appointments = await listAppointments({ userEmailAddress: userEmail });
    console.log(`✅ Appointments retrieved: ${appointments.length} appointment(s)`);
    appointments.forEach((apt) => {
      console.log(`   - ${apt.appointmentDate.toISOString().split('T')[0]} - ${apt.status}`);
    });
    
    console.log('');
  } catch (error) {
    console.error('❌ Failed to retrieve data:', error);
    throw error;
  }
}

async function runTests() {
  console.log('🚀 Starting SQL Database Connection Tests with Fake Data\n');
  console.log('=' .repeat(60));
  console.log('');
  
  let pool;
  
  try {
    // Test connection
    pool = await testDatabaseConnection();
    
    // Generate test data
    const testData = generateTestData();
    console.log('📦 Generated test data for user:', testData.user.emailAddress);
    console.log('');
    
    // Create insurer
    const insurerId = await testInsurerCreation(testData.insurer);
    
    // Create provider
    const providerId = await testProviderCreation(testData.provider);
    
    // Create user (with provider and insurer)
    const userEmail = await testUserCreation(testData.user, providerId, insurerId);
    
    // Create doctor
    const doctorId = await testDoctorCreation(testData.doctor);
    
    // Update appointment with correct doctor ID
    testData.appointment.doctorId = doctorId;
    
    // Create appointment
    await testAppointmentCreation(testData.appointment);
    
    // Create lab report
    await testLabReportCreation(testData.labReport);
    
    // Create insurance benefits
    await testBenefitsCreation(testData.benefits);
    
    // Create EOB record
    await testEOBCreation(testData.eob);
    
    // Test data retrieval
    await testDataRetrieval(userEmail);
    
    console.log('=' .repeat(60));
    console.log('✅ All tests passed successfully!');
    console.log('');
    console.log('📊 Test Summary:');
    console.log(`   - User: ${userEmail}`);
    console.log(`   - Provider: ${providerId}`);
    console.log(`   - Insurer: ${insurerId}`);
    console.log(`   - Doctor: ${doctorId}`);
    console.log(`   - Lab Report: ${testData.labReport.id}`);
    console.log(`   - Benefits: ${testData.benefits.plan_name}`);
    console.log(`   - EOB: ${testData.eob.claim_number}`);
    console.log('');
    
  } catch (error) {
    console.error('');
    console.error('=' .repeat(60));
    console.error('❌ Test failed with error:');
    console.error(error);
    console.error('');
    process.exit(1);
  } finally {
    // Close connection
    if (pool) {
      await closeConnection();
      console.log('🔌 Database connection closed.');
    }
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests()
    .then(() => {
      console.log('✨ Test script completed.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Test script failed:', error);
      process.exit(1);
    });
}

export { runTests, generateTestData };

