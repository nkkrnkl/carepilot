/**
 * Azure SQL Database client for CarePilot
 * Handles user, insurer, provider, doctor, and appointment data
 */

import sql from "mssql";

// Get SQL configuration dynamically
function getSQLConfig(): {
  server: string;
  database: string;
  user?: string;
  password?: string;
  connectionString?: string;
} {
  const SQL_SERVER = process.env.AZURE_SQL_SERVER || "k2sqldatabaseserver.database.windows.net";
  const SQL_DATABASE = process.env.AZURE_SQL_DATABASE || "K2Database";
  const SQL_USER = process.env.AZURE_SQL_USER || "";
  const SQL_PASSWORD = process.env.AZURE_SQL_PASSWORD || "";
  const SQL_CONNECTION_STRING = process.env.AZURE_SQL_CONNECTION_STRING || "";

  if (SQL_USER && SQL_PASSWORD) {
    return {
      server: SQL_SERVER,
      database: SQL_DATABASE,
      user: SQL_USER,
      password: SQL_PASSWORD,
    };
  } else if (SQL_CONNECTION_STRING) {
    return {
      server: SQL_SERVER,
      database: SQL_DATABASE,
      connectionString: SQL_CONNECTION_STRING,
    };
  } else {
    throw new Error("AZURE_SQL_USER and AZURE_SQL_PASSWORD or AZURE_SQL_CONNECTION_STRING must be set");
  }
}

// Connection pool (singleton)
let pool: sql.ConnectionPool | null = null;

/**
 * Get or create connection pool
 */
async function getConnectionPool(): Promise<sql.ConnectionPool> {
  if (pool && pool.connected) {
    return pool;
  }

  const sqlConfig = getSQLConfig();
  
  let config: sql.config;
  
  if (sqlConfig.user && sqlConfig.password) {
    // Use individual credentials (preferred)
    config = {
      server: sqlConfig.server,
      database: sqlConfig.database,
      user: sqlConfig.user,
      password: sqlConfig.password,
      options: {
        encrypt: true,
        trustServerCertificate: false,
      },
      pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000,
      },
    };
  } else if (sqlConfig.connectionString) {
    // Parse connection string
    const parts = sqlConfig.connectionString.split(";").reduce((acc, part) => {
      const [key, value] = part.split("=").map(s => s.trim());
      if (key && value) {
        acc[key.toLowerCase()] = value;
      }
      return acc;
    }, {} as Record<string, string>);
    
    const server = parts["server"] || sqlConfig.server;
    const database = parts["database"] || sqlConfig.database;
    const user = parts["user id"] || parts["user"] || "";
    const password = parts["password"] || "";
    
    config = {
      server: server,
      database: database,
      user: user,
      password: password,
      options: {
        encrypt: true,
        trustServerCertificate: false,
      },
      pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000,
      },
    };
  } else {
    throw new Error("No SQL credentials provided");
  }

  pool = new sql.ConnectionPool(config);
  await pool.connect();
  return pool;
}

/**
 * Close connection pool
 */
export async function closeConnection(): Promise<void> {
  if (pool) {
    try {
      await pool.close();
      pool = null;
    } catch (error) {
      console.error("Error closing connection:", error);
    }
  }
}

// ============================================================================
// TYPES
// ============================================================================

export interface Document {
  doc_type: string;
  doc_name: string;
  doc_url?: string;
  doc_size?: number;
  uploaded_at?: string;
}

export interface InsurerEntity {
  unique_id: string;
  precheckcover_id: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface ProviderEntity {
  provider_id: string;
  name?: string;
  specialty?: string;
  address?: string;
  phone?: string;
  email?: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface UserEntity {
  emailAddress: string;
  FirstName: string;
  LastName: string;
  DateOfBirth: string; // Date string
  StreetAddress: string;
  PatientCity: string;
  PatientState: string;
  providerId?: string;
  insurerId?: string;
  InsuranceGroupNumber?: string;
  InsurancePlanType: string; // 'HMO' | 'PPO' | 'EPO' | 'POS' | 'HDHP' | 'Other'
  InsuranceCompanyStreetAddress?: string;
  InsuranceCompanyCity?: string;
  InsuranceCompanyState?: string;
  InsuranceCompanyPhoneNumber?: string;
  documents?: string; // JSON string
  userRole?: string; // 'patient' | 'doctor'
  password_hash?: string; // Hashed password (bcrypt) - Optional, for non-OAuth users
  oauth_provider?: string; // OAuth provider: 'google', 'facebook', 'auth0', 'microsoft', etc.
  oauth_provider_id?: string; // User ID from OAuth provider
  oauth_email?: string; // Email from OAuth provider (may differ from emailAddress)
  created_at?: Date;
  updated_at?: Date;
}

export interface DoctorSlot {
  id: string;
  date: string;
  time: string;
  available: boolean;
  mode: "in-person" | "telehealth";
}

export interface DoctorEntity {
  id: string;
  name: string;
  specialty: string;
  address: string;
  distance?: string;
  travelTime?: string;
  languages: string; // JSON string
  telehealth: boolean;
  inNetwork: boolean;
  rating?: number;
  image?: string;
  slots: string; // JSON string
  reasons?: string; // JSON string
  estimatedCost?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export type AppointmentStatus = "scheduled" | "confirmed" | "completed" | "cancelled" | "rescheduled" | "no_show" | "waiting";
export type AppointmentType = "in-person" | "telehealth";

export interface AppointmentEntity {
  appointment_id: string;
  userEmailAddress: string;
  doctorId: string;
  appointmentDate: Date;
  appointmentTime?: string;
  appointmentType: AppointmentType;
  status: AppointmentStatus;
  confirmationCode?: string;
  notes?: string;
  estimatedCost?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

// ============================================================================
// INSURER OPERATIONS
// ============================================================================

export async function createInsurer(insurer: InsurerEntity): Promise<void> {
  const pool = await getConnectionPool();
  const request = pool.request();
  
  request.input("unique_id", sql.NVarChar, insurer.unique_id);
  request.input("precheckcover_id", sql.NVarChar, insurer.precheckcover_id);
  
  await request.query(`
    INSERT INTO insurer_table (unique_id, precheckcover_id)
    VALUES (@unique_id, @precheckcover_id)
  `);
}

export async function getInsurer(uniqueId: string): Promise<InsurerEntity | null> {
  const pool = await getConnectionPool();
  const request = pool.request();
  
  request.input("unique_id", sql.NVarChar, uniqueId);
  
  const result = await request.query(`
    SELECT * FROM insurer_table WHERE unique_id = @unique_id
  `);
  
  if (result.recordset.length === 0) {
    return null;
  }
  
  return result.recordset[0] as InsurerEntity;
}

// ============================================================================
// PROVIDER OPERATIONS
// ============================================================================

export async function createProvider(provider: ProviderEntity): Promise<void> {
  const pool = await getConnectionPool();
  const request = pool.request();
  
  request.input("provider_id", sql.NVarChar, provider.provider_id);
  request.input("name", sql.NVarChar, provider.name || null);
  request.input("specialty", sql.NVarChar, provider.specialty || null);
  request.input("address", sql.NVarChar, provider.address || null);
  request.input("phone", sql.NVarChar, provider.phone || null);
  request.input("email", sql.NVarChar, provider.email || null);
  
  await request.query(`
    INSERT INTO provider_table (provider_id, name, specialty, address, phone, email)
    VALUES (@provider_id, @name, @specialty, @address, @phone, @email)
  `);
}

export async function getProvider(providerId: string): Promise<ProviderEntity | null> {
  const pool = await getConnectionPool();
  const request = pool.request();
  
  request.input("provider_id", sql.NVarChar, providerId);
  
  const result = await request.query(`
    SELECT * FROM provider_table WHERE provider_id = @provider_id
  `);
  
  if (result.recordset.length === 0) {
    return null;
  }
  
  return result.recordset[0] as ProviderEntity;
}

// ============================================================================
// USER OPERATIONS
// ============================================================================

export async function createUser(user: Omit<UserEntity, "created_at" | "updated_at">): Promise<void> {
  const pool = await getConnectionPool();
  const request = pool.request();
  
  // Basic required fields
  request.input("emailAddress", sql.NVarChar, user.emailAddress);
  request.input("FirstName", sql.NVarChar, user.FirstName);
  request.input("LastName", sql.NVarChar, user.LastName);
  request.input("DateOfBirth", sql.Date, user.DateOfBirth);
  request.input("StreetAddress", sql.NVarChar, user.StreetAddress);
  request.input("PatientCity", sql.NVarChar, user.PatientCity);
  request.input("PatientState", sql.NVarChar, user.PatientState);
  request.input("providerId", sql.NVarChar, user.providerId || null);
  request.input("insurerId", sql.NVarChar, user.insurerId || null);
  request.input("InsuranceGroupNumber", sql.NVarChar, user.InsuranceGroupNumber || null);
  request.input("InsurancePlanType", sql.NVarChar, user.InsurancePlanType);
  request.input("InsuranceCompanyStreetAddress", sql.NVarChar, user.InsuranceCompanyStreetAddress || null);
  request.input("InsuranceCompanyCity", sql.NVarChar, user.InsuranceCompanyCity || null);
  request.input("InsuranceCompanyState", sql.NVarChar, user.InsuranceCompanyState || null);
  request.input("InsuranceCompanyPhoneNumber", sql.NVarChar, user.InsuranceCompanyPhoneNumber || null);
  request.input("documents", sql.NVarChar(sql.MAX), user.documents || null);
  request.input("userRole", sql.NVarChar, user.userRole || null);
  request.input("password_hash", sql.NVarChar, user.password_hash || null);
  
  // Check if OAuth columns exist before trying to insert
  const checkOAuthColumns = await request.query(`
    SELECT COLUMN_NAME 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = 'user_table' 
    AND COLUMN_NAME IN ('oauth_provider', 'oauth_provider_id', 'oauth_email')
  `);
  
  const hasOAuthColumns = checkOAuthColumns.recordset.length > 0;
  const oauthColumns = checkOAuthColumns.recordset.map((r: any) => r.COLUMN_NAME);
  
  // Build dynamic INSERT statement based on which columns exist
  const baseColumns = [
    'emailAddress', 'FirstName', 'LastName', 'DateOfBirth', 'StreetAddress', 'PatientCity', 'PatientState',
    'providerId', 'insurerId', 'InsuranceGroupNumber', 'InsurancePlanType',
    'InsuranceCompanyStreetAddress', 'InsuranceCompanyCity', 'InsuranceCompanyState', 'InsuranceCompanyPhoneNumber',
    'documents', 'userRole', 'password_hash'
  ];
  
  const baseValues = [
    '@emailAddress', '@FirstName', '@LastName', '@DateOfBirth', '@StreetAddress', '@PatientCity', '@PatientState',
    '@providerId', '@insurerId', '@InsuranceGroupNumber', '@InsurancePlanType',
    '@InsuranceCompanyStreetAddress', '@InsuranceCompanyCity', '@InsuranceCompanyState', '@InsuranceCompanyPhoneNumber',
    '@documents', '@userRole', '@password_hash'
  ];
  
  if (hasOAuthColumns) {
    request.input("oauth_provider", sql.NVarChar, user.oauth_provider || null);
    request.input("oauth_provider_id", sql.NVarChar, user.oauth_provider_id || null);
    request.input("oauth_email", sql.NVarChar, user.oauth_email || null);
    
    if (oauthColumns.includes('oauth_provider')) {
      baseColumns.push('oauth_provider');
      baseValues.push('@oauth_provider');
    }
    if (oauthColumns.includes('oauth_provider_id')) {
      baseColumns.push('oauth_provider_id');
      baseValues.push('@oauth_provider_id');
    }
    if (oauthColumns.includes('oauth_email')) {
      baseColumns.push('oauth_email');
      baseValues.push('@oauth_email');
    }
  }
  
  await request.query(`
    INSERT INTO user_table (${baseColumns.join(', ')})
    VALUES (${baseValues.join(', ')})
  `);
}

export async function getUserByEmail(emailAddress: string): Promise<UserEntity | null> {
  const pool = await getConnectionPool();
  const request = pool.request();
  
  // Normalize email address (trim for consistency, but preserve case for exact match)
  const normalizedEmail = emailAddress.trim();
  
  console.log("getUserByEmail - Searching for email:", normalizedEmail);
  console.log("getUserByEmail - Email length:", normalizedEmail.length);
  console.log("getUserByEmail - Email bytes:", Buffer.from(normalizedEmail).toString('hex'));
  
  request.input("emailAddress", sql.NVarChar, normalizedEmail);
  
  // Use case-insensitive comparison with LOWER and trim to handle any whitespace issues
  // Also try exact match first, then fall back to case-insensitive
  let result = await request.query(`
    SELECT * FROM user_table 
    WHERE emailAddress = @emailAddress
  `);
  
  // If no exact match, try case-insensitive
  if (result.recordset.length === 0) {
    console.log("Exact match not found, trying case-insensitive match");
    result = await request.query(`
      SELECT * FROM user_table 
      WHERE LOWER(LTRIM(RTRIM(emailAddress))) = LOWER(LTRIM(RTRIM(@emailAddress)))
    `);
  }
  
  console.log("Database query returned", result.recordset.length, "row(s)");
  
  if (result.recordset.length === 0) {
    console.log("No user found with email:", normalizedEmail);
    
    // Debug: Let's see what emails exist in the database
    const allUsers = await request.query(`
      SELECT TOP 5 emailAddress, FirstName, LastName FROM user_table
    `);
    console.log("Sample users in database:", allUsers.recordset.map((u: any) => ({
      email: u.emailAddress,
      firstName: u.FirstName,
      lastName: u.LastName
    })));
    
    return null;
  }
  
  const user = result.recordset[0] as any;
  
  console.log("Found user in database:", {
    email: user.emailAddress,
    firstName: user.FirstName,
    lastName: user.LastName,
    hasDateOfBirth: !!user.DateOfBirth,
    emailMatches: user.emailAddress === normalizedEmail,
    emailLowercaseMatches: user.emailAddress.toLowerCase() === normalizedEmail.toLowerCase()
  });
  
  // Convert DateOfBirth from Date object to string if needed
  // SQL Server DATE columns are returned as Date objects by mssql library
  if (user.DateOfBirth instanceof Date) {
    user.DateOfBirth = user.DateOfBirth.toISOString().split('T')[0]; // YYYY-MM-DD format
  } else if (user.DateOfBirth && typeof user.DateOfBirth === 'string') {
    // If it's already a string, ensure it's in YYYY-MM-DD format
    user.DateOfBirth = user.DateOfBirth.split('T')[0];
  }
  
  return user as UserEntity;
}

export async function updateUser(
  emailAddress: string,
  updates: Partial<Omit<UserEntity, "emailAddress" | "created_at" | "updated_at">>
): Promise<void> {
  const pool = await getConnectionPool();
  const request = pool.request();
  
  request.input("emailAddress", sql.NVarChar, emailAddress);
  
  // Check which columns exist in the table
  const checkColumns = await request.query(`
    SELECT COLUMN_NAME 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = 'user_table'
  `);
  
  const existingColumns = checkColumns.recordset.map((r: any) => r.COLUMN_NAME);
  
  const updateFields: string[] = [];
  
  // Handle each field based on its type
  Object.entries(updates).forEach(([key, value]) => {
    if (value !== undefined && existingColumns.includes(key)) {
      // Map JavaScript field names to SQL column names (they're the same in our case)
      const sqlColumnName = key;
      
      updateFields.push(`${sqlColumnName} = @${key}`);
      
      // Use appropriate SQL type based on field
      if (key === "DateOfBirth") {
        request.input(key, sql.Date, value);
      } else if (key === "documents") {
        request.input(key, sql.NVarChar(sql.MAX), value);
      } else {
        request.input(key, sql.NVarChar, value);
      }
    }
  });
  
  if (updateFields.length === 0) {
    return;
  }
  
  updateFields.push("updated_at = GETUTCDATE()");
  
  await request.query(`
    UPDATE user_table
    SET ${updateFields.join(", ")}
    WHERE emailAddress = @emailAddress
  `);
}

export async function listUsers(): Promise<UserEntity[]> {
  const pool = await getConnectionPool();
  const request = pool.request();
  
  const result = await request.query(`
    SELECT * FROM user_table
  `);
  
  return result.recordset as UserEntity[];
}

// ============================================================================
// DOCTOR OPERATIONS
// ============================================================================

export async function createDoctor(doctor: Omit<DoctorEntity, "createdAt" | "updatedAt">): Promise<void> {
  const pool = await getConnectionPool();
  const request = pool.request();
  
  request.input("id", sql.NVarChar, doctor.id);
  request.input("name", sql.NVarChar, doctor.name);
  request.input("specialty", sql.NVarChar, doctor.specialty);
  request.input("address", sql.NVarChar, doctor.address);
  request.input("distance", sql.NVarChar, doctor.distance || null);
  request.input("travelTime", sql.NVarChar, doctor.travelTime || null);
  request.input("languages", sql.NVarChar(sql.MAX), JSON.stringify(doctor.languages || []));
  request.input("telehealth", sql.Bit, doctor.telehealth ? 1 : 0);
  request.input("inNetwork", sql.Bit, doctor.inNetwork ? 1 : 0);
  request.input("rating", sql.Float, doctor.rating || null);
  request.input("image", sql.NVarChar, doctor.image || null);
  request.input("slots", sql.NVarChar(sql.MAX), JSON.stringify(doctor.slots || []));
  request.input("reasons", sql.NVarChar(sql.MAX), JSON.stringify(doctor.reasons || []));
  request.input("estimatedCost", sql.Float, doctor.estimatedCost || null);
  
  await request.query(`
    INSERT INTO doctorInformation_table (
      id, name, specialty, address, distance, travelTime, languages, telehealth, inNetwork,
      rating, image, slots, reasons, estimatedCost
    )
    VALUES (
      @id, @name, @specialty, @address, @distance, @travelTime, @languages, @telehealth, @inNetwork,
      @rating, @image, @slots, @reasons, @estimatedCost
    )
  `);
}

export async function getDoctorById(id: string): Promise<DoctorEntity | null> {
  const pool = await getConnectionPool();
  const request = pool.request();
  
  request.input("id", sql.NVarChar, id);
  
  const result = await request.query(`
    SELECT * FROM doctorInformation_table WHERE id = @id
  `);
  
  if (result.recordset.length === 0) {
    return null;
  }
  
  return result.recordset[0] as DoctorEntity;
}

export async function listDoctors(filters?: {
  search?: string;
  specialty?: string;
  telehealth?: boolean;
  language?: string;
  inNetwork?: boolean;
}): Promise<DoctorEntity[]> {
  const pool = await getConnectionPool();
  const request = pool.request();
  
  let query = "SELECT * FROM doctorInformation_table WHERE 1=1";
  
  if (filters?.specialty) {
    request.input("specialty", sql.NVarChar, `%${filters.specialty}%`);
    query += " AND specialty LIKE @specialty";
  }
  
  if (filters?.telehealth !== undefined) {
    request.input("telehealth", sql.Bit, filters.telehealth ? 1 : 0);
    query += " AND telehealth = @telehealth";
  }
  
  if (filters?.inNetwork !== undefined) {
    request.input("inNetwork", sql.Bit, filters.inNetwork ? 1 : 0);
    query += " AND inNetwork = @inNetwork";
  }
  
  if (filters?.search) {
    request.input("search", sql.NVarChar, `%${filters.search}%`);
    query += " AND (name LIKE @search OR specialty LIKE @search OR address LIKE @search)";
  }
  
  const result = await request.query(query);
  let doctors = result.recordset as DoctorEntity[];
  
  // Apply language filter in application layer (JSON parsing)
  if (filters?.language) {
    doctors = doctors.filter((doctor) => {
      try {
        const languages: string[] = doctor.languages ? JSON.parse(doctor.languages) : [];
        return languages.some((lang: string) => 
          lang.toLowerCase().includes(filters.language!.toLowerCase())
        );
      } catch {
        return false;
      }
    });
  }
  
  return doctors;
}

// ============================================================================
// APPOINTMENT OPERATIONS
// ============================================================================

export async function createAppointment(
  appointment: Omit<AppointmentEntity, "appointment_id" | "createdAt" | "updatedAt">
): Promise<string> {
  const pool = await getConnectionPool();
  const request = pool.request();
  
  // Generate appointment ID
  const appointmentId = `apt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  request.input("appointment_id", sql.NVarChar, appointmentId);
  request.input("userEmailAddress", sql.NVarChar, appointment.userEmailAddress);
  request.input("doctorId", sql.NVarChar, appointment.doctorId);
  request.input("appointmentDate", sql.DateTime2, appointment.appointmentDate);
  request.input("appointmentTime", sql.NVarChar, appointment.appointmentTime || null);
  request.input("appointmentType", sql.NVarChar, appointment.appointmentType);
  request.input("status", sql.NVarChar, appointment.status);
  request.input("confirmationCode", sql.NVarChar, appointment.confirmationCode || null);
  request.input("notes", sql.NVarChar(sql.MAX), appointment.notes || null);
  request.input("estimatedCost", sql.Float, appointment.estimatedCost || null);
  
  await request.query(`
    INSERT INTO userAppointmentScheduled_table (
      appointment_id, userEmailAddress, doctorId, appointmentDate, appointmentTime,
      appointmentType, status, confirmationCode, notes, estimatedCost
    )
    VALUES (
      @appointment_id, @userEmailAddress, @doctorId, @appointmentDate, @appointmentTime,
      @appointmentType, @status, @confirmationCode, @notes, @estimatedCost
    )
  `);
  
  return appointmentId;
}

export async function getAppointmentById(appointmentId: string): Promise<AppointmentEntity | null> {
  const pool = await getConnectionPool();
  const request = pool.request();
  
  request.input("appointment_id", sql.NVarChar, appointmentId);
  
  const result = await request.query(`
    SELECT * FROM userAppointmentScheduled_table WHERE appointment_id = @appointment_id
  `);
  
  if (result.recordset.length === 0) {
    return null;
  }
  
  return result.recordset[0] as AppointmentEntity;
}

export async function listAppointments(filters?: {
  userEmailAddress?: string;
  doctorId?: string;
  status?: AppointmentStatus;
  appointmentType?: AppointmentType;
  startDate?: string;
  endDate?: string;
}): Promise<AppointmentEntity[]> {
  const pool = await getConnectionPool();
  const request = pool.request();
  
  let query = "SELECT * FROM userAppointmentScheduled_table WHERE 1=1";
  
  if (filters?.userEmailAddress) {
    request.input("userEmailAddress", sql.NVarChar, filters.userEmailAddress);
    query += " AND userEmailAddress = @userEmailAddress";
  }
  
  if (filters?.doctorId) {
    request.input("doctorId", sql.NVarChar, filters.doctorId);
    query += " AND doctorId = @doctorId";
  }
  
  if (filters?.status) {
    request.input("status", sql.NVarChar, filters.status);
    query += " AND status = @status";
  }
  
  if (filters?.appointmentType) {
    request.input("appointmentType", sql.NVarChar, filters.appointmentType);
    query += " AND appointmentType = @appointmentType";
  }
  
  if (filters?.startDate) {
    request.input("startDate", sql.DateTime2, filters.startDate);
    query += " AND appointmentDate >= @startDate";
  }
  
  if (filters?.endDate) {
    request.input("endDate", sql.DateTime2, filters.endDate);
    query += " AND appointmentDate < @endDate";
  }
  
  query += " ORDER BY appointmentDate ASC";
  
  const result = await request.query(query);
  return result.recordset as AppointmentEntity[];
}

export async function updateAppointment(
  appointmentId: string,
  updates: Partial<Omit<AppointmentEntity, "appointment_id" | "createdAt" | "updatedAt">>
): Promise<void> {
  const pool = await getConnectionPool();
  const request = pool.request();
  
  request.input("appointment_id", sql.NVarChar, appointmentId);
  
  const updateFields: string[] = [];
  
  if (updates.userEmailAddress !== undefined) {
    request.input("userEmailAddress", sql.NVarChar, updates.userEmailAddress);
    updateFields.push("userEmailAddress = @userEmailAddress");
  }
  
  if (updates.doctorId !== undefined) {
    request.input("doctorId", sql.NVarChar, updates.doctorId);
    updateFields.push("doctorId = @doctorId");
  }
  
  if (updates.appointmentDate !== undefined) {
    request.input("appointmentDate", sql.DateTime2, updates.appointmentDate);
    updateFields.push("appointmentDate = @appointmentDate");
  }
  
  if (updates.appointmentTime !== undefined) {
    request.input("appointmentTime", sql.NVarChar, updates.appointmentTime);
    updateFields.push("appointmentTime = @appointmentTime");
  }
  
  if (updates.appointmentType !== undefined) {
    request.input("appointmentType", sql.NVarChar, updates.appointmentType);
    updateFields.push("appointmentType = @appointmentType");
  }
  
  if (updates.status !== undefined) {
    request.input("status", sql.NVarChar, updates.status);
    updateFields.push("status = @status");
  }
  
  if (updates.confirmationCode !== undefined) {
    request.input("confirmationCode", sql.NVarChar, updates.confirmationCode);
    updateFields.push("confirmationCode = @confirmationCode");
  }
  
  if (updates.notes !== undefined) {
    request.input("notes", sql.NVarChar(sql.MAX), updates.notes);
    updateFields.push("notes = @notes");
  }
  
  if (updates.estimatedCost !== undefined) {
    request.input("estimatedCost", sql.Float, updates.estimatedCost);
    updateFields.push("estimatedCost = @estimatedCost");
  }
  
  if (updateFields.length === 0) {
    return;
  }
  
  updateFields.push("updatedAt = GETUTCDATE()");
  
  await request.query(`
    UPDATE userAppointmentScheduled_table
    SET ${updateFields.join(", ")}
    WHERE appointment_id = @appointment_id
  `);
}

export async function deleteAppointment(appointmentId: string): Promise<void> {
  const pool = await getConnectionPool();
  const request = pool.request();
  
  request.input("appointment_id", sql.NVarChar, appointmentId);
  
  await request.query(`
    DELETE FROM userAppointmentScheduled_table WHERE appointment_id = @appointment_id
  `);
}

// ============================================================================
// INSURANCE BENEFITS OPERATIONS
// ============================================================================

export interface InsuranceBenefitsEntity {
  id?: number;
  precheckcover_id?: string;
  user_id: string;
  plan_name: string;
  plan_type?: string;
  insurance_provider?: string;
  policy_number?: string;
  group_number?: string;
  effective_date?: string;
  expiration_date?: string;
  deductibles?: string; // JSON string
  copays?: string; // JSON string
  coinsurance?: string; // JSON string
  coverage_limits?: string; // JSON string
  services?: string; // JSON string
  out_of_pocket_max_individual?: number;
  out_of_pocket_max_family?: number;
  in_network_providers?: string;
  out_of_network_coverage?: boolean;
  network_notes?: string;
  preauth_required_services?: string; // JSON string
  preauth_notes?: string;
  exclusions?: string; // JSON string
  exclusion_notes?: string;
  special_programs?: string; // JSON string
  additional_benefits?: string;
  notes?: string;
  extracted_date?: Date;
  source_document_id?: string;
  created_at?: Date;
  updated_at?: Date;
}

export async function upsertInsuranceBenefits(
  benefits: InsuranceBenefitsEntity
): Promise<void> {
  const pool = await getConnectionPool();
  const request = pool.request();

  // Generate precheckcover_id if not provided
  const precheckcover_id = benefits.precheckcover_id || `benefits-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // Prepare inputs
  request.input("precheckcover_id", sql.NVarChar, precheckcover_id);
  request.input("user_id", sql.NVarChar, benefits.user_id);
  request.input("plan_name", sql.NVarChar, benefits.plan_name);
  request.input("plan_type", sql.NVarChar, benefits.plan_type || null);
  request.input("insurance_provider", sql.NVarChar, benefits.insurance_provider || null);
  request.input("policy_number", sql.NVarChar, benefits.policy_number || null);
  request.input("group_number", sql.NVarChar, benefits.group_number || null);
  request.input("effective_date", sql.Date, benefits.effective_date ? new Date(benefits.effective_date) : null);
  request.input("expiration_date", sql.Date, benefits.expiration_date ? new Date(benefits.expiration_date) : null);
  request.input("deductibles", sql.NVarChar(sql.MAX), benefits.deductibles || null);
  request.input("copays", sql.NVarChar(sql.MAX), benefits.copays || null);
  request.input("coinsurance", sql.NVarChar(sql.MAX), benefits.coinsurance || null);
  request.input("coverage_limits", sql.NVarChar(sql.MAX), benefits.coverage_limits || null);
  request.input("services", sql.NVarChar(sql.MAX), benefits.services || null);
  request.input("out_of_pocket_max_individual", sql.Decimal(10, 2), benefits.out_of_pocket_max_individual || null);
  request.input("out_of_pocket_max_family", sql.Decimal(10, 2), benefits.out_of_pocket_max_family || null);
  request.input("in_network_providers", sql.NVarChar(sql.MAX), benefits.in_network_providers || null);
  request.input("out_of_network_coverage", sql.Bit, benefits.out_of_network_coverage ? 1 : 0);
  request.input("network_notes", sql.NVarChar(sql.MAX), benefits.network_notes || null);
  request.input("preauth_required_services", sql.NVarChar(sql.MAX), benefits.preauth_required_services || null);
  request.input("preauth_notes", sql.NVarChar(sql.MAX), benefits.preauth_notes || null);
  request.input("exclusions", sql.NVarChar(sql.MAX), benefits.exclusions || null);
  request.input("exclusion_notes", sql.NVarChar(sql.MAX), benefits.exclusion_notes || null);
  request.input("special_programs", sql.NVarChar(sql.MAX), benefits.special_programs || null);
  request.input("additional_benefits", sql.NVarChar(sql.MAX), benefits.additional_benefits || null);
  request.input("notes", sql.NVarChar(sql.MAX), benefits.notes || null);
  request.input("source_document_id", sql.NVarChar, benefits.source_document_id || null);

  // Use MERGE (UPSERT) to handle unique constraint
  // Note: Unique constraint is on (plan_name, policy_number, user_id)
  // Handle NULL policy_number correctly in the ON clause
  await request.query(`
    MERGE [dbo].[insurance_benefits] AS target
    USING (SELECT 
      @precheckcover_id AS precheckcover_id,
      @user_id AS user_id,
      @plan_name AS plan_name,
      @policy_number AS policy_number
    ) AS source
    ON target.[plan_name] = source.[plan_name] 
      AND target.[user_id] = source.[user_id]
      AND (target.[policy_number] = source.[policy_number] OR (target.[policy_number] IS NULL AND source.[policy_number] IS NULL))
    WHEN MATCHED THEN
      UPDATE SET
        [precheckcover_id] = @precheckcover_id,
        [plan_type] = @plan_type,
        [insurance_provider] = @insurance_provider,
        [policy_number] = @policy_number,
        [group_number] = @group_number,
        [effective_date] = @effective_date,
        [expiration_date] = @expiration_date,
        [deductibles] = @deductibles,
        [copays] = @copays,
        [coinsurance] = @coinsurance,
        [coverage_limits] = @coverage_limits,
        [services] = @services,
        [out_of_pocket_max_individual] = @out_of_pocket_max_individual,
        [out_of_pocket_max_family] = @out_of_pocket_max_family,
        [in_network_providers] = @in_network_providers,
        [out_of_network_coverage] = @out_of_network_coverage,
        [network_notes] = @network_notes,
        [preauth_required_services] = @preauth_required_services,
        [preauth_notes] = @preauth_notes,
        [exclusions] = @exclusions,
        [exclusion_notes] = @exclusion_notes,
        [special_programs] = @special_programs,
        [additional_benefits] = @additional_benefits,
        [notes] = @notes,
        [source_document_id] = @source_document_id,
        [updated_at] = GETUTCDATE()
    WHEN NOT MATCHED THEN
      INSERT (
        [precheckcover_id], [user_id], [plan_name], [plan_type], [insurance_provider],
        [policy_number], [group_number], [effective_date], [expiration_date],
        [deductibles], [copays], [coinsurance], [coverage_limits], [services],
        [out_of_pocket_max_individual], [out_of_pocket_max_family],
        [in_network_providers], [out_of_network_coverage], [network_notes],
        [preauth_required_services], [preauth_notes],
        [exclusions], [exclusion_notes],
        [special_programs], [additional_benefits], [notes],
        [source_document_id]
      )
      VALUES (
        @precheckcover_id, @user_id, @plan_name, @plan_type, @insurance_provider,
        @policy_number, @group_number, @effective_date, @expiration_date,
        @deductibles, @copays, @coinsurance, @coverage_limits, @services,
        @out_of_pocket_max_individual, @out_of_pocket_max_family,
        @in_network_providers, @out_of_network_coverage, @network_notes,
        @preauth_required_services, @preauth_notes,
        @exclusions, @exclusion_notes,
        @special_programs, @additional_benefits, @notes,
        @source_document_id
      );
  `);
}

export async function getInsuranceBenefitsByUserId(userId: string): Promise<InsuranceBenefitsEntity[]> {
  const pool = await getConnectionPool();
  const request = pool.request();
  
  request.input("user_id", sql.NVarChar, userId);
  
  const result = await request.query(`
    SELECT * FROM insurance_benefits 
    WHERE user_id = @user_id
    ORDER BY extracted_date DESC
  `);
  
  return result.recordset as InsuranceBenefitsEntity[];
}

export async function getInsuranceBenefitsById(id: number): Promise<InsuranceBenefitsEntity | null> {
  const pool = await getConnectionPool();
  const request = pool.request();
  
  request.input("id", sql.Int, id);
  
  const result = await request.query(`
    SELECT * FROM insurance_benefits WHERE id = @id
  `);
  
  if (result.recordset.length === 0) {
    return null;
  }
  
  return result.recordset[0] as InsuranceBenefitsEntity;
}

// ============================================================================
// LAB REPORT OPERATIONS
// ============================================================================

export interface LabReportEntity {
  id: string;
  userId: string;
  title?: string;
  date?: string;
  hospital?: string;
  doctor?: string;
  fileUrl?: string;
  rawExtract?: string; // JSON string
  parameters?: string; // JSON string
  createdAt?: Date;
  updatedAt?: Date;
}

export async function upsertLabReport(
  labReport: LabReportEntity
): Promise<void> {
  const pool = await getConnectionPool();
  const request = pool.request();

  // Prepare inputs
  request.input("id", sql.NVarChar, labReport.id);
  request.input("userId", sql.NVarChar, labReport.userId);
  request.input("title", sql.NVarChar, labReport.title ?? null);
  request.input("date", sql.Date, labReport.date ? new Date(labReport.date) : null);
  request.input("hospital", sql.NVarChar, labReport.hospital ?? null);
  request.input("doctor", sql.NVarChar, labReport.doctor ?? null);
  request.input("fileUrl", sql.NVarChar(sql.MAX), labReport.fileUrl ?? null);
  request.input("rawExtract", sql.NVarChar(sql.MAX), labReport.rawExtract ?? null);
  request.input("parameters", sql.NVarChar(sql.MAX), labReport.parameters ?? null);

  // Use MERGE (UPSERT) to handle existing records
  await request.query(`
    MERGE [dbo].[LabReport] AS target
    USING (SELECT 
      @id AS id,
      @userId AS userId
    ) AS source
    ON target.[id] = source.[id]
    WHEN MATCHED THEN
      UPDATE SET
        [title] = @title,
        [date] = @date,
        [hospital] = @hospital,
        [doctor] = @doctor,
        [fileUrl] = @fileUrl,
        [rawExtract] = @rawExtract,
        [parameters] = @parameters,
        [updatedAt] = GETUTCDATE()
    WHEN NOT MATCHED THEN
      INSERT (
        [id], [userId], [title], [date], [hospital], [doctor], 
        [fileUrl], [rawExtract], [parameters]
      )
      VALUES (
        @id, @userId, @title, @date, @hospital, @doctor,
        @fileUrl, @rawExtract, @parameters
      );
  `);
}

export async function getLabReportById(id: string): Promise<LabReportEntity | null> {
  const pool = await getConnectionPool();
  const request = pool.request();
  
  request.input("id", sql.NVarChar, id);
  
  const result = await request.query(`
    SELECT * FROM LabReport WHERE id = @id
  `);
  
  if (result.recordset.length === 0) {
    return null;
  }
  
  return result.recordset[0] as LabReportEntity;
}

export async function getLabReportsByUserId(userId: string): Promise<LabReportEntity[]> {
  const pool = await getConnectionPool();
  const request = pool.request();
  
  request.input("userId", sql.NVarChar, userId);
  
  const result = await request.query(`
    SELECT * FROM LabReport 
    WHERE userId = @userId
    ORDER BY date DESC, createdAt DESC
  `);
  
  return result.recordset as LabReportEntity[];
}

// ============================================================================
// EOB RECORDS OPERATIONS
// ============================================================================

export interface EOBRecordEntity {
  id?: number;
  user_id: string;
  claim_number: string;
  member_name: string;
  member_address?: string;
  member_id?: string;
  group_number?: string;
  claim_date?: string;
  provider_name: string;
  provider_npi?: string;
  total_billed: number;
  total_benefits_approved: number;
  amount_you_owe: number;
  services?: string; // JSON string
  coverage_breakdown?: string; // JSON string
  insurance_provider?: string;
  plan_name?: string;
  policy_number?: string;
  alerts?: string; // JSON string
  discrepancies?: string; // JSON string
  source_document_id?: string;
  extracted_date?: Date;
  created_at?: Date;
  updated_at?: Date;
}

export async function upsertEOBRecord(
  eobRecord: EOBRecordEntity
): Promise<void> {
  const pool = await getConnectionPool();
  const request = pool.request();

  // Prepare inputs
  request.input("user_id", sql.NVarChar, eobRecord.user_id);
  request.input("claim_number", sql.NVarChar, eobRecord.claim_number);
  request.input("member_name", sql.NVarChar, eobRecord.member_name);
  request.input("member_address", sql.NVarChar(sql.MAX), eobRecord.member_address ?? null);
  request.input("member_id", sql.NVarChar, eobRecord.member_id ?? null);
  request.input("group_number", sql.NVarChar, eobRecord.group_number ?? null);
  request.input("claim_date", sql.Date, eobRecord.claim_date ? new Date(eobRecord.claim_date) : null);
  request.input("provider_name", sql.NVarChar, eobRecord.provider_name);
  request.input("provider_npi", sql.NVarChar, eobRecord.provider_npi ?? null);
  request.input("total_billed", sql.Decimal(10, 2), eobRecord.total_billed);
  request.input("total_benefits_approved", sql.Decimal(10, 2), eobRecord.total_benefits_approved);
  request.input("amount_you_owe", sql.Decimal(10, 2), eobRecord.amount_you_owe);
  request.input("services", sql.NVarChar(sql.MAX), eobRecord.services ?? null);
  request.input("coverage_breakdown", sql.NVarChar(sql.MAX), eobRecord.coverage_breakdown ?? null);
  request.input("insurance_provider", sql.NVarChar, eobRecord.insurance_provider ?? null);
  request.input("plan_name", sql.NVarChar, eobRecord.plan_name ?? null);
  request.input("policy_number", sql.NVarChar, eobRecord.policy_number ?? null);
  request.input("alerts", sql.NVarChar(sql.MAX), eobRecord.alerts ?? null);
  request.input("discrepancies", sql.NVarChar(sql.MAX), eobRecord.discrepancies ?? null);
  request.input("source_document_id", sql.NVarChar, eobRecord.source_document_id ?? null);

  // Use MERGE (UPSERT) to handle unique constraint on (claim_number, user_id)
  await request.query(`
    MERGE [dbo].[eob_records] AS target
    USING (SELECT 
      @claim_number AS claim_number,
      @user_id AS user_id
    ) AS source
    ON target.[claim_number] = source.[claim_number] 
      AND target.[user_id] = source.[user_id]
    WHEN MATCHED THEN
      UPDATE SET
        [member_name] = @member_name,
        [member_address] = @member_address,
        [member_id] = @member_id,
        [group_number] = @group_number,
        [claim_date] = @claim_date,
        [provider_name] = @provider_name,
        [provider_npi] = @provider_npi,
        [total_billed] = @total_billed,
        [total_benefits_approved] = @total_benefits_approved,
        [amount_you_owe] = @amount_you_owe,
        [services] = @services,
        [coverage_breakdown] = @coverage_breakdown,
        [insurance_provider] = @insurance_provider,
        [plan_name] = @plan_name,
        [policy_number] = @policy_number,
        [alerts] = @alerts,
        [discrepancies] = @discrepancies,
        [source_document_id] = @source_document_id,
        [updated_at] = GETUTCDATE()
    WHEN NOT MATCHED THEN
      INSERT (
        [user_id], [claim_number], [member_name], [member_address], [member_id], [group_number],
        [claim_date], [provider_name], [provider_npi], [total_billed], [total_benefits_approved],
        [amount_you_owe], [services], [coverage_breakdown], [insurance_provider], [plan_name],
        [policy_number], [alerts], [discrepancies], [source_document_id]
      )
      VALUES (
        @user_id, @claim_number, @member_name, @member_address, @member_id, @group_number,
        @claim_date, @provider_name, @provider_npi, @total_billed, @total_benefits_approved,
        @amount_you_owe, @services, @coverage_breakdown, @insurance_provider, @plan_name,
        @policy_number, @alerts, @discrepancies, @source_document_id
      );
  `);
}

export async function getEOBRecordById(id: number): Promise<EOBRecordEntity | null> {
  const pool = await getConnectionPool();
  const request = pool.request();
  
  request.input("id", sql.Int, id);
  
  const result = await request.query(`
    SELECT * FROM eob_records WHERE id = @id
  `);
  
  if (result.recordset.length === 0) {
    return null;
  }
  
  return result.recordset[0] as EOBRecordEntity;
}

export async function getEOBRecordByClaimNumber(
  claimNumber: string,
  userId: string
): Promise<EOBRecordEntity | null> {
  const pool = await getConnectionPool();
  const request = pool.request();
  
  request.input("claim_number", sql.NVarChar, claimNumber);
  request.input("user_id", sql.NVarChar, userId);
  
  const result = await request.query(`
    SELECT * FROM eob_records 
    WHERE claim_number = @claim_number AND user_id = @user_id
  `);
  
  if (result.recordset.length === 0) {
    return null;
  }
  
  return result.recordset[0] as EOBRecordEntity;
}

export async function getEOBRecordsByUserId(userId: string): Promise<EOBRecordEntity[]> {
  const pool = await getConnectionPool();
  const request = pool.request();
  
  request.input("user_id", sql.NVarChar, userId);
  
  const result = await request.query(`
    SELECT * FROM eob_records 
    WHERE user_id = @user_id
    ORDER BY claim_date DESC, created_at DESC
  `);
  
  return result.recordset as EOBRecordEntity[];
}

export async function getEOBRecordByDocumentId(
  documentId: string,
  userId: string
): Promise<EOBRecordEntity | null> {
  const pool = await getConnectionPool();
  const request = pool.request();
  
  request.input("source_document_id", sql.NVarChar, documentId);
  request.input("user_id", sql.NVarChar, userId);
  
  const result = await request.query(`
    SELECT * FROM eob_records 
    WHERE source_document_id = @source_document_id AND user_id = @user_id
  `);
  
  if (result.recordset.length === 0) {
    return null;
  }
  
  return result.recordset[0] as EOBRecordEntity;
}

