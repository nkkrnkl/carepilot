/**
 * Script to test Azure Table Storage connectivity and operations
 * 
 * Usage: npx tsx scripts/test-table-storage.ts
 */

import "dotenv/config";
import {
  createAllTables,
  createUser,
  getUserByEmail,
  createInsurer,
  createProvider,
  listUsers,
  updateUser,
  type Document,
} from "../lib/azure/table-storage";

async function testTableStorage() {
  try {
    console.log("🧪 Testing Azure Table Storage...\n");

    // 1. Create tables
    console.log("1. Creating tables...");
    await createAllTables();
    console.log("✅ Tables created\n");

    // 2. Create a test insurer
    console.log("2. Creating test insurer...");
    await createInsurer({
      unique_id: "insurer-test-001",
      precheckcover_id: "precheck-001",
    });
    console.log("✅ Insurer created\n");

    // 3. Create a test provider
    console.log("3. Creating test provider...");
    await createProvider({
      provider_id: "provider-test-001",
      name: "Dr. Test Provider",
      specialty: "General Practice",
    });
    console.log("✅ Provider created\n");

    // 4. Create a test user
    console.log("4. Creating test user...");
    const testEmail = "test@example.com";
    await createUser({
      firstName: "John",
      lastName: "Doe",
      dateOfBirth: "1990-01-01",
      preferredLanguage: "English",
      email: testEmail,
      phoneNumber: "+1234567890",
      address: "123 Test St",
      city: "Test City",
      state: "CA",
      zipCode: "12345",
      insuranceCompany: "Test Insurance",
      accountNumber: "TEST123",
      planType: "PPO",
      providerId: "provider-test-001",
      insurerId: "insurer-test-001",
    });
    console.log("✅ User created\n");

    // 5. Retrieve user
    console.log("5. Retrieving user...");
    const user = await getUserByEmail(testEmail);
    if (user) {
      console.log("✅ User retrieved:", user.firstName, user.lastName);
    } else {
      console.log("❌ User not found");
    }
    console.log();

    // 6. Add a test document to user
    console.log("6. Adding test document to user...");
    const userWithDoc = await getUserByEmail(testEmail);
    if (userWithDoc) {
      const documents: Document[] = userWithDoc.documents ? JSON.parse(userWithDoc.documents) : [];
      documents.push({
        doc_type: "insurance_card",
        doc_name: "insurance_card_front.jpg",
        doc_url: "https://example.com/doc.jpg",
        uploaded_at: new Date().toISOString(),
      });
      await updateUser(testEmail, {
        documents: JSON.stringify(documents),
      });
      console.log("✅ Document added to user\n");

      // 7. Retrieve user documents
      console.log("7. Retrieving user documents...");
      const updatedUser = await getUserByEmail(testEmail);
      if (updatedUser && updatedUser.documents) {
        const userDocuments: Document[] = JSON.parse(updatedUser.documents);
        console.log(`✅ Found ${userDocuments.length} document(s)`);
        userDocuments.forEach((doc) => {
          console.log(`   - ${doc.doc_name} (${doc.doc_type})`);
        });
      }
      console.log();
    }

    // 8. List all users
    console.log("8. Listing all users...");
    const users = await listUsers();
    console.log(`✅ Found ${users.length} user(s)\n`);

    console.log("🎉 All tests passed!");
  } catch (error: any) {
    console.error("❌ Test failed:", error.message);
    console.error(error);
    process.exit(1);
  }
}

testTableStorage();

