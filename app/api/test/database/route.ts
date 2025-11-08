/**
 * API Route to Test SQL Database Connection with Fake Data
 * 
 * GET /api/test/database - Test database connection and insert fake data
 */

import { NextRequest, NextResponse } from 'next/server';
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

// Generate test data
function generateTestData() {
  const timestamp = Date.now();
  const randomId = Math.random().toString(36).substring(2, 9);
  
  return {
    insurer: {
      unique_id: `insurer-${timestamp}-${randomId}`,
      precheckcover_id: `precheck-${timestamp}-${randomId}`,
    },
    provider: {
      provider_id: `provider-${timestamp}-${randomId}`,
      name: 'Test Medical Center',
      specialty: 'General Medicine',
      address: '123 Medical St, Test City, TS 12345',
      phone: '(555) 123-4567',
      email: 'contact@testmedical.com',
    },
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
    },
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

export async function GET(request: NextRequest) {
  const testResults: any = {
    success: false,
    steps: [],
    data: {},
    errors: [],
  };

  try {
    // Step 1: Test connection
    testResults.steps.push({ step: 'Connection Test', status: 'testing' });
    const pool = await getConnectionPool();
    testResults.steps[testResults.steps.length - 1].status = 'success';
    testResults.steps[testResults.steps.length - 1].message = 'Database connection successful';

    // Generate test data
    const testData = generateTestData();
    testResults.data.testUserEmail = testData.user.emailAddress;

    // Step 2: Create insurer
    testResults.steps.push({ step: 'Create Insurer', status: 'testing' });
    try {
      await createInsurer(testData.insurer);
      testResults.steps[testResults.steps.length - 1].status = 'success';
      testResults.steps[testResults.steps.length - 1].message = `Insurer created: ${testData.insurer.unique_id}`;
      testResults.data.insurerId = testData.insurer.unique_id;
    } catch (error: any) {
      testResults.steps[testResults.steps.length - 1].status = 'error';
      testResults.steps[testResults.steps.length - 1].message = error.message;
      testResults.errors.push(error.message);
    }

    // Step 3: Create provider
    testResults.steps.push({ step: 'Create Provider', status: 'testing' });
    try {
      await createProvider(testData.provider);
      testResults.steps[testResults.steps.length - 1].status = 'success';
      testResults.steps[testResults.steps.length - 1].message = `Provider created: ${testData.provider.provider_id}`;
      testResults.data.providerId = testData.provider.provider_id;
    } catch (error: any) {
      testResults.steps[testResults.steps.length - 1].status = 'error';
      testResults.steps[testResults.steps.length - 1].message = error.message;
      testResults.errors.push(error.message);
    }

    // Step 4: Create user
    testResults.steps.push({ step: 'Create User', status: 'testing' });
    try {
      await createUser({
        ...testData.user,
        providerId: testData.provider.provider_id,
        insurerId: testData.insurer.unique_id,
      });
      testResults.steps[testResults.steps.length - 1].status = 'success';
      testResults.steps[testResults.steps.length - 1].message = `User created: ${testData.user.emailAddress}`;
      testResults.data.userEmail = testData.user.emailAddress;
    } catch (error: any) {
      testResults.steps[testResults.steps.length - 1].status = 'error';
      testResults.steps[testResults.steps.length - 1].message = error.message;
      testResults.errors.push(error.message);
    }

    // Step 5: Create doctor
    testResults.steps.push({ step: 'Create Doctor', status: 'testing' });
    try {
      await createDoctor(testData.doctor);
      testResults.steps[testResults.steps.length - 1].status = 'success';
      testResults.steps[testResults.steps.length - 1].message = `Doctor created: ${testData.doctor.id}`;
      testResults.data.doctorId = testData.doctor.id;
    } catch (error: any) {
      testResults.steps[testResults.steps.length - 1].status = 'error';
      testResults.steps[testResults.steps.length - 1].message = error.message;
      testResults.errors.push(error.message);
    }

    // Step 6: Create appointment
    testResults.steps.push({ step: 'Create Appointment', status: 'testing' });
    try {
      testData.appointment.doctorId = testData.doctor.id;
      const appointmentId = await createAppointment(testData.appointment);
      testResults.steps[testResults.steps.length - 1].status = 'success';
      testResults.steps[testResults.steps.length - 1].message = `Appointment created: ${appointmentId}`;
      testResults.data.appointmentId = appointmentId;
    } catch (error: any) {
      testResults.steps[testResults.steps.length - 1].status = 'error';
      testResults.steps[testResults.steps.length - 1].message = error.message;
      testResults.errors.push(error.message);
    }

    // Step 7: Create lab report
    testResults.steps.push({ step: 'Create Lab Report', status: 'testing' });
    try {
      await createLabReport(testData.labReport);
      testResults.steps[testResults.steps.length - 1].status = 'success';
      testResults.steps[testResults.steps.length - 1].message = `Lab report created: ${testData.labReport.id}`;
      testResults.data.labReportId = testData.labReport.id;
    } catch (error: any) {
      testResults.steps[testResults.steps.length - 1].status = 'error';
      testResults.steps[testResults.steps.length - 1].message = error.message;
      testResults.errors.push(error.message);
    }

    // Step 8: Create insurance benefits
    testResults.steps.push({ step: 'Create Insurance Benefits', status: 'testing' });
    try {
      const benefitsId = await upsertInsuranceBenefits(testData.benefits);
      testResults.steps[testResults.steps.length - 1].status = 'success';
      testResults.steps[testResults.steps.length - 1].message = `Benefits created: ID ${benefitsId}`;
      testResults.data.benefitsId = benefitsId;
    } catch (error: any) {
      testResults.steps[testResults.steps.length - 1].status = 'error';
      testResults.steps[testResults.steps.length - 1].message = error.message;
      testResults.errors.push(error.message);
    }

    // Step 9: Create EOB record
    testResults.steps.push({ step: 'Create EOB Record', status: 'testing' });
    try {
      const eobId = await upsertEOBRecord(testData.eob);
      testResults.steps[testResults.steps.length - 1].status = 'success';
      testResults.steps[testResults.steps.length - 1].message = `EOB created: ID ${eobId}`;
      testResults.data.eobId = eobId;
    } catch (error: any) {
      testResults.steps[testResults.steps.length - 1].status = 'error';
      testResults.steps[testResults.steps.length - 1].message = error.message;
      testResults.errors.push(error.message);
    }

    // Step 10: Retrieve data
    testResults.steps.push({ step: 'Retrieve Data', status: 'testing' });
    try {
      const user = await getUserByEmail(testData.user.emailAddress);
      const labReports = await listLabReportsByUser(testData.user.emailAddress);
      const benefits = await getInsuranceBenefitsByUser(testData.user.emailAddress);
      const eobs = await listEOBRecordsByUser(testData.user.emailAddress);
      const appointments = await listAppointments({ userEmailAddress: testData.user.emailAddress });

      testResults.steps[testResults.steps.length - 1].status = 'success';
      testResults.steps[testResults.steps.length - 1].message = 'Data retrieved successfully';
      testResults.data.retrieved = {
        user: user ? { email: user.emailAddress, name: `${user.FirstName} ${user.LastName}` } : null,
        labReports: labReports.length,
        benefits: benefits.length,
        eobs: eobs.length,
        appointments: appointments.length,
      };
    } catch (error: any) {
      testResults.steps[testResults.steps.length - 1].status = 'error';
      testResults.steps[testResults.steps.length - 1].message = error.message;
      testResults.errors.push(error.message);
    }

    // Determine overall success
    const hasErrors = testResults.steps.some((step: any) => step.status === 'error');
    testResults.success = !hasErrors;

    return NextResponse.json(testResults, { status: testResults.success ? 200 : 500 });

  } catch (error: any) {
    testResults.success = false;
    testResults.errors.push(error.message);
    testResults.steps.push({
      step: 'Overall Test',
      status: 'error',
      message: error.message,
    });

    return NextResponse.json(testResults, { status: 500 });
  } finally {
    // Close connection
    try {
      await closeConnection();
    } catch (error) {
      // Ignore connection close errors
    }
  }
}

