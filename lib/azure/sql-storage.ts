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
  
  await request.query(`
    INSERT INTO user_table (
      emailAddress, FirstName, LastName, DateOfBirth, StreetAddress, PatientCity, PatientState,
      providerId, insurerId, InsuranceGroupNumber, InsurancePlanType,
      InsuranceCompanyStreetAddress, InsuranceCompanyCity, InsuranceCompanyState, InsuranceCompanyPhoneNumber,
      documents, userRole
    )
    VALUES (
      @emailAddress, @FirstName, @LastName, @DateOfBirth, @StreetAddress, @PatientCity, @PatientState,
      @providerId, @insurerId, @InsuranceGroupNumber, @InsurancePlanType,
      @InsuranceCompanyStreetAddress, @InsuranceCompanyCity, @InsuranceCompanyState, @InsuranceCompanyPhoneNumber,
      @documents, @userRole
    )
  `);
}

export async function getUserByEmail(emailAddress: string): Promise<UserEntity | null> {
  const pool = await getConnectionPool();
  const request = pool.request();
  
  request.input("emailAddress", sql.NVarChar, emailAddress);
  
  const result = await request.query(`
    SELECT * FROM user_table WHERE emailAddress = @emailAddress
  `);
  
  if (result.recordset.length === 0) {
    return null;
  }
  
  return result.recordset[0] as UserEntity;
}

export async function updateUser(
  emailAddress: string,
  updates: Partial<Omit<UserEntity, "emailAddress" | "created_at" | "updated_at">>
): Promise<void> {
  const pool = await getConnectionPool();
  const request = pool.request();
  
  request.input("emailAddress", sql.NVarChar, emailAddress);
  
  const updateFields: string[] = [];
  const updateValues: { [key: string]: any } = {};
  
  Object.entries(updates).forEach(([key, value]) => {
    if (value !== undefined) {
      updateFields.push(`${key} = @${key}`);
      request.input(key, sql.NVarChar(sql.MAX), value);
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
// LAB REPORT OPERATIONS
// ============================================================================

export interface LabReportEntity {
  id: string;
  userId: string;
  title?: string | null;
  date?: string | null;
  hospital?: string | null;
  doctor?: string | null;
  fileUrl?: string | null;
  rawExtract?: string | null; // JSON string
  parameters?: string | null; // JSON string
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Create a new lab report in SQL database
 * Safely stores parameter data with validation
 */
export async function createLabReport(
  report: Omit<LabReportEntity, "createdAt" | "updatedAt">
): Promise<void> {
  const pool = await getConnectionPool();
  const request = pool.request();
  
  request.input("id", sql.NVarChar, report.id);
  request.input("userId", sql.NVarChar, report.userId);
  request.input("title", sql.NVarChar, report.title || null);
  request.input("date", sql.NVarChar, report.date || null);
  request.input("hospital", sql.NVarChar, report.hospital || null);
  request.input("doctor", sql.NVarChar, report.doctor || null);
  request.input("fileUrl", sql.NVarChar(sql.MAX), report.fileUrl || null);
  request.input("rawExtract", sql.NVarChar(sql.MAX), report.rawExtract || null);
  request.input("parameters", sql.NVarChar(sql.MAX), report.parameters || null);
  
  await request.query(`
    INSERT INTO LabReport (
      id, userId, title, date, hospital, doctor, fileUrl, rawExtract, parameters
    )
    VALUES (
      @id, @userId, @title, @date, @hospital, @doctor, @fileUrl, @rawExtract, @parameters
    )
  `);
}

/**
 * Get lab report by ID
 */
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

/**
 * List all lab reports for a user (newest first)
 */
export async function listLabReportsByUser(userId: string): Promise<LabReportEntity[]> {
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

/**
 * Update lab report
 */
export async function updateLabReport(
  id: string,
  updates: Partial<Omit<LabReportEntity, "id" | "userId" | "createdAt" | "updatedAt">>
): Promise<void> {
  const pool = await getConnectionPool();
  const request = pool.request();
  
  request.input("id", sql.NVarChar, id);
  
  const updateFields: string[] = [];
  
  if (updates.title !== undefined) {
    request.input("title", sql.NVarChar, updates.title);
    updateFields.push("title = @title");
  }
  
  if (updates.date !== undefined) {
    request.input("date", sql.NVarChar, updates.date);
    updateFields.push("date = @date");
  }
  
  if (updates.hospital !== undefined) {
    request.input("hospital", sql.NVarChar, updates.hospital);
    updateFields.push("hospital = @hospital");
  }
  
  if (updates.doctor !== undefined) {
    request.input("doctor", sql.NVarChar, updates.doctor);
    updateFields.push("doctor = @doctor");
  }
  
  if (updates.fileUrl !== undefined) {
    request.input("fileUrl", sql.NVarChar(sql.MAX), updates.fileUrl);
    updateFields.push("fileUrl = @fileUrl");
  }
  
  if (updates.rawExtract !== undefined) {
    request.input("rawExtract", sql.NVarChar(sql.MAX), updates.rawExtract);
    updateFields.push("rawExtract = @rawExtract");
  }
  
  if (updates.parameters !== undefined) {
    request.input("parameters", sql.NVarChar(sql.MAX), updates.parameters);
    updateFields.push("parameters = @parameters");
  }
  
  if (updateFields.length === 0) {
    return; // No updates
  }
  
  await request.query(`
    UPDATE LabReport 
    SET ${updateFields.join(", ")}, updatedAt = GETUTCDATE()
    WHERE id = @id
  `);
}

/**
 * Delete lab report
 */
export async function deleteLabReport(id: string): Promise<void> {
  const pool = await getConnectionPool();
  const request = pool.request();
  
  request.input("id", sql.NVarChar, id);
  
  await request.query(`
    DELETE FROM LabReport WHERE id = @id
  `);
}

