/**
 * Script to test Azure SQL Database connectivity and operations
 * 
 * Usage: npx tsx scripts/test-sql-storage.ts
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
import {
  createInsurer,
  getInsurer,
  createProvider,
  getProvider,
  createUser,
  getUserByEmail,
  updateUser,
  listUsers,
  closeConnection,
  type Document,
} from "../lib/azure/sql-storage";

async function testSQLStorage() {
  try {
    console.log("🧪 Testing Azure SQL Database...\n");
    console.log("ℹ️  Note: If test data already exists, you may see duplicate key errors.\n");

    // 1. Create a test insurer (or skip if exists)
    console.log("1. Creating test insurer...");
    try {
      await createInsurer({
        unique_id: "insurer-test-001",
        precheckcover_id: "precheck-001",
      });
      console.log("✅ Insurer created\n");
    } catch (error: any) {
      if (error.number === 2627) {
        console.log("ℹ️  Insurer already exists, skipping...\n");
      } else {
        throw error;
      }
    }

    // 2. Create a test provider (or skip if exists)
    console.log("2. Creating test provider...");
    try {
      await createProvider({
        provider_id: "provider-test-001",
        name: "Dr. Test Provider",
        specialty: "General Practice",
      });
      console.log("✅ Provider created\n");
    } catch (error: any) {
      if (error.number === 2627) {
        console.log("ℹ️  Provider already exists, skipping...\n");
      } else {
        throw error;
      }
    }

    // 3. Create a test user (or skip if exists)
    console.log("3. Creating test user...");
    const testEmail = "test@example.com";
    try {
      await createUser({
        emailAddress: testEmail,
        FirstName: "John",
        LastName: "Doe",
        DateOfBirth: "1990-01-01",
        StreetAddress: "123 Test St",
        PatientCity: "Test City",
        PatientState: "CA",
        InsurancePlanType: "PPO",
        providerId: "provider-test-001",
        insurerId: "insurer-test-001",
        InsuranceGroupNumber: "GRP123",
        InsuranceCompanyStreetAddress: "456 Insurance Ave",
        InsuranceCompanyCity: "Boston",
        InsuranceCompanyState: "MA",
        InsuranceCompanyPhoneNumber: "+1 (555) 987-6543",
      });
      console.log("✅ User created\n");
    } catch (error: any) {
      if (error.number === 2627) {
        console.log("ℹ️  User already exists, skipping creation...\n");
      } else {
        throw error;
      }
    }

    // 4. Retrieve user
    console.log("4. Retrieving user...");
    const user = await getUserByEmail(testEmail);
    if (user) {
      console.log("✅ User retrieved:", user.FirstName, user.LastName);
      console.log(`   Email: ${user.emailAddress}`);
      console.log(`   City: ${user.PatientCity}`);
      console.log(`   State: ${user.PatientState}`);
    } else {
      console.log("❌ User not found");
    }
    console.log();

    // 5. Add a test document to user (documents have doc_type and doc_name)
    console.log("5. Adding test document to user...");
    console.log("   Document structure: { doc_type: string, doc_name: string }");
    
    // Get existing documents or create new array
    const existingUser = await getUserByEmail(testEmail);
    const existingDocuments: Document[] = existingUser?.documents 
      ? JSON.parse(existingUser.documents) 
      : [];
    
    // Create new document with required fields: doc_type and doc_name
    const newDocument: Document = {
      doc_type: "insurance_card", // Required field
      doc_name: "insurance_card_front.jpg", // Required field
      doc_url: "https://example.com/doc.jpg", // Optional
      uploaded_at: new Date().toISOString(), // Optional
    };
    
    // Add to existing documents (avoid duplicates)
    const docExists = existingDocuments.some(
      doc => doc.doc_type === newDocument.doc_type && doc.doc_name === newDocument.doc_name
    );
    
    if (!docExists) {
      existingDocuments.push(newDocument);
      await updateUser(testEmail, {
        documents: JSON.stringify(existingDocuments),
      });
      console.log("✅ Document added to user\n");
    } else {
      console.log("ℹ️  Document already exists, skipping...\n");
    }

    // 6. Retrieve user with documents
    console.log("6. Retrieving user documents...");
    const updatedUser = await getUserByEmail(testEmail);
    if (updatedUser && updatedUser.documents) {
      const userDocuments: Document[] = JSON.parse(updatedUser.documents);
      console.log(`✅ Found ${userDocuments.length} document(s)`);
      userDocuments.forEach((doc) => {
        console.log(`   - ${doc.doc_name} (${doc.doc_type})`);
      });
    }
    console.log();

    // 7. List all users
    console.log("7. Listing all users...");
    const users = await listUsers();
    console.log(`✅ Found ${users.length} user(s)\n`);

    // 8. Test insurer retrieval
    console.log("8. Retrieving insurer...");
    const insurer = await getInsurer("insurer-test-001");
    if (insurer) {
      console.log("✅ Insurer retrieved:", insurer.unique_id);
    }
    console.log();

    // 9. Test provider retrieval
    console.log("9. Retrieving provider...");
    const provider = await getProvider("provider-test-001");
    if (provider) {
      console.log("✅ Provider retrieved:", provider.name);
    }
    console.log();

    console.log("🎉 All tests passed!");
  } catch (error: any) {
    console.error("❌ Test failed:", error.message);
    if (error.code) {
      console.error("   Error code:", error.code);
    }
    if (error.number) {
      console.error("   SQL Error number:", error.number);
    }
    console.error(error);
    process.exit(1);
  } finally {
    await closeConnection();
  }
}

testSQLStorage();

