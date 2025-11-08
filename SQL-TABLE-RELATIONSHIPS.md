# SQL Database Table Relationships

## Table Relationships

### 1. insurer_table → user_table

**Relationship**: One-to-Many (one insurer can have many users)

- **insurer_table.unique_id** (PRIMARY KEY) 
  - References: `user_table.insurerId` (FOREIGN KEY)
  - **Important**: The `unique_id` in `insurer_table` is the same as `insurerId` in `user_table`

**Example**:
```sql
-- insurer_table
unique_id: "insurer-001"
precheckcover_id: "precheck-001"

-- user_table
insurerId: "insurer-001"  -- References insurer_table.unique_id
email: "user@example.com"
```

### 2. provider_table → user_table

**Relationship**: One-to-Many (one provider can have many users)

- **provider_table.provider_id** (PRIMARY KEY)
  - References: `user_table.providerId` (FOREIGN KEY)

**Example**:
```sql
-- provider_table
provider_id: "provider-001"
name: "Dr. Smith"

-- user_table
providerId: "provider-001"  -- References provider_table.provider_id
email: "user@example.com"
```

## Foreign Key Constraints

The following foreign key constraints are enforced:

1. **user_table.insurerId** → **insurer_table.unique_id**
   - When creating a user with `insurerId`, the insurer must exist in `insurer_table`
   - The `insurerId` value must match an existing `unique_id` in `insurer_table`

2. **user_table.providerId** → **provider_table.provider_id**
   - When creating a user with `providerId`, the provider must exist in `provider_table`
   - The `providerId` value must match an existing `provider_id` in `provider_table`

## Usage Examples

### Create an Insurer and Link to User

```typescript
// 1. Create insurer first
await createInsurer({
  unique_id: "insurer-001",
  precheckcover_id: "precheck-001",
});

// 2. Create user with insurerId = unique_id from insurer_table
await createUser({
  email: "user@example.com",
  // ... other fields
  insurerId: "insurer-001", // Must match insurer_table.unique_id
});
```

### Create a Provider and Link to User

```typescript
// 1. Create provider first
await createProvider({
  provider_id: "provider-001",
  name: "Dr. Smith",
});

// 2. Create user with providerId = provider_id from provider_table
await createUser({
  email: "user@example.com",
  // ... other fields
  providerId: "provider-001", // Must match provider_table.provider_id
});
```

### Get User with Related Insurer and Provider

```typescript
// Get user
const user = await getUserByEmail("user@example.com");

// Get related insurer
if (user.insurerId) {
  const insurer = await getInsurer(user.insurerId); // user.insurerId = insurer_table.unique_id
}

// Get related provider
if (user.providerId) {
  const provider = await getProvider(user.providerId); // user.providerId = provider_table.provider_id
}
```

## Important Notes

1. **insurerId = unique_id**: 
   - The `insurerId` field in `user_table` stores the `unique_id` from `insurer_table`
   - These values must match exactly for the foreign key relationship to work

2. **Foreign Key Enforcement**:
   - SQL Server enforces foreign key constraints
   - You cannot create a user with an `insurerId` that doesn't exist in `insurer_table`
   - You cannot create a user with a `providerId` that doesn't exist in `provider_table`

3. **Nullable Foreign Keys**:
   - Both `insurerId` and `providerId` are optional (nullable) in `user_table`
   - A user can exist without an insurer or provider
   - But if provided, they must reference existing records

## Database Schema Diagram

```
insurer_table
├── unique_id (PK) ─────────┐
└── precheckcover_id        │
                            │
                            │ (Foreign Key)
                            │
user_table                  │
├── email (PK)              │
├── insurerId (FK) ─────────┘ (references insurer_table.unique_id)
├── providerId (FK) ────────┐
└── documents (JSON)        │
                            │
provider_table              │
├── provider_id (PK) ───────┘ (references provider_table.provider_id)
└── name, specialty, etc.
```

## Verification

To verify the foreign key relationships:

```sql
-- Check foreign keys
SELECT 
    OBJECT_NAME(f.parent_object_id) AS TableName,
    COL_NAME(fc.parent_object_id, fc.parent_column_id) AS ColumnName,
    OBJECT_NAME(f.referenced_object_id) AS ReferencedTable,
    COL_NAME(fc.referenced_object_id, fc.referenced_column_id) AS ReferencedColumn
FROM sys.foreign_keys AS f
INNER JOIN sys.foreign_key_columns AS fc ON f.object_id = fc.constraint_object_id
WHERE OBJECT_NAME(f.parent_object_id) = 'user_table';
```

This will show:
- `user_table.insurerId` → `insurer_table.unique_id`
- `user_table.providerId` → `provider_table.provider_id`

