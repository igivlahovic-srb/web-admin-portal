# MS SQL Database Integration

## Overview

Web Admin Panel sada može da se poveže sa MS SQL Server bazom podataka. Ova dokumentacija objašnjava kako da konfigurišete i koristite MS SQL integraciju.

---

## 📦 Instalirane Biblioteke

- **mssql** (v12.1.0) - MS SQL driver za Node.js
- **@types/mssql** (v9.1.8) - TypeScript type definitions

---

## ⚙️ Konfiguracija

### 1. Environment Variables

Kreirajte `.env.local` fajl u `web-admin` folderu:

```bash
# MS SQL Database Configuration
DB_USER=sa
DB_PASSWORD=your_password_here
DB_SERVER=localhost
DB_NAME=your_database_name
DB_PORT=1433
DB_ENCRYPT=false
DB_TRUST_CERT=true
```

**Napomena:** Za Azure SQL Database, postavite `DB_ENCRYPT=true`

### 2. Konfiguracija Parametara

Parametri se nalaze u `/lib/db.ts`:

- **user** - SQL Server username
- **password** - SQL Server password
- **server** - Server hostname ili IP adresa
- **database** - Ime baze podataka
- **port** - Port (default: 1433)
- **encrypt** - Da li koristiti encryption (true za Azure)
- **trustServerCertificate** - Da li verovati self-signed sertifikatima (true za local dev)

---

## 🚀 Korišćenje

### Test Konekcije

Testirajte da li je konekcija uspešna:

```bash
curl http://localhost:3002/api/database/test
```

Odgovor:
```json
{
  "success": true,
  "message": "Database connection successful",
  "data": {
    "Version": "Microsoft SQL Server 2019...",
    "CurrentDateTime": "2025-11-09T22:00:00.000Z"
  }
}
```

---

## 💻 API Primeri

### 1. Basic Query

```typescript
import { query } from "@/lib/db";

// Simple SELECT query
const result = await query("SELECT * FROM Users");
console.log(result.recordset); // Array of results
```

### 2. Parametrizovani Query

```typescript
import { query } from "@/lib/db";

// Query sa parametrima (zaštita od SQL injection)
const result = await query(
  "SELECT * FROM Users WHERE Username = @username AND Active = @active",
  {
    username: "admin",
    active: 1
  }
);
```

### 3. INSERT Query

```typescript
import { query } from "@/lib/db";

const result = await query(
  `INSERT INTO Users (Username, Name, Role, Active)
   VALUES (@username, @name, @role, @active)`,
  {
    username: "newuser",
    name: "New User",
    role: "technician",
    active: 1
  }
);

console.log("Rows affected:", result.rowsAffected[0]);
```

### 4. UPDATE Query

```typescript
import { query } from "@/lib/db";

const result = await query(
  "UPDATE Users SET Active = @active WHERE UserId = @userId",
  {
    active: 0,
    userId: 123
  }
);
```

### 5. Stored Procedure

```typescript
import { executeProcedure } from "@/lib/db";

// Pozivanje stored procedure
const result = await executeProcedure("sp_GetUsersByRole", {
  role: "admin"
});

console.log(result.recordset);
```

---

## 🔌 Kreiranje API Ruta

### Primer: Get Korisnici

Kreirajte fajl: `/app/api/users/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { query } from "../../../lib/db";

export async function GET(request: NextRequest) {
  try {
    const result = await query("SELECT * FROM Users WHERE Active = 1");

    return NextResponse.json({
      success: true,
      data: result.recordset,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: error.message,
      },
      { status: 500 }
    );
  }
}
```

### Primer: Create Korisnik

```typescript
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, name, role } = body;

    const result = await query(
      `INSERT INTO Users (Username, Name, Role, Active, CreatedAt)
       VALUES (@username, @name, @role, 1, GETDATE())`,
      { username, name, role }
    );

    return NextResponse.json({
      success: true,
      message: "User created successfully",
      rowsAffected: result.rowsAffected[0],
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: error.message,
      },
      { status: 500 }
    );
  }
}
```

---

## 🗄️ Primer SQL Šeme

### Tabela Korisnika

```sql
CREATE TABLE Users (
    UserId INT IDENTITY(1,1) PRIMARY KEY,
    Username NVARCHAR(50) NOT NULL UNIQUE,
    Name NVARCHAR(100) NOT NULL,
    Role NVARCHAR(20) NOT NULL,
    Active BIT DEFAULT 1,
    CreatedAt DATETIME DEFAULT GETDATE(),
    UpdatedAt DATETIME DEFAULT GETDATE()
);

-- Insert demo data
INSERT INTO Users (Username, Name, Role) VALUES
('admin', 'Administrator', 'admin'),
('marko', 'Marko Marković', 'technician'),
('jovan', 'Jovan Jovanović', 'technician');
```

### Tabela Servisa

```sql
CREATE TABLE ServiceTickets (
    TicketId INT IDENTITY(1,1) PRIMARY KEY,
    DeviceCode NVARCHAR(50) NOT NULL,
    TechnicianId INT NOT NULL,
    Status NVARCHAR(20) DEFAULT 'pending',
    StartTime DATETIME NOT NULL,
    EndTime DATETIME NULL,
    Notes NVARCHAR(MAX) NULL,
    CreatedAt DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (TechnicianId) REFERENCES Users(UserId)
);
```

---

## 🔒 Sigurnost

### ✅ Parametrizovani Queries

**UVEK** koristite parametrizovane queries da izbegnete SQL injection:

```typescript
// ✅ DOBRO - Parametrizovano
const result = await query(
  "SELECT * FROM Users WHERE Username = @username",
  { username: userInput }
);

// ❌ LOŠE - SQL Injection ranjivost
const result = await query(
  `SELECT * FROM Users WHERE Username = '${userInput}'`
);
```

### 🔐 Environment Variables

- NIKAD ne commit-ujte `.env.local` fajl u Git
- Dodajte `.env.local` u `.gitignore`
- Koristite jake lozinke za production

---

## 🐛 Troubleshooting

### Problem: "Login failed for user"

**Rešenje:**
1. Proverite username i password u `.env.local`
2. Proverite da li SQL Server Authentication je omogućen
3. Proverite da li korisnik ima pristup bazi

```sql
-- Kreiraj novog SQL Server korisnika
CREATE LOGIN admin_user WITH PASSWORD = 'StrongPassword123!';
CREATE USER admin_user FOR LOGIN admin_user;
ALTER ROLE db_owner ADD MEMBER admin_user;
```

### Problem: "Cannot connect to SQL Server"

**Rešenje:**
1. Proverite da li SQL Server radi:
   ```bash
   # Windows
   services.msc
   # Linux
   sudo systemctl status mssql-server
   ```

2. Proverite firewall:
   ```bash
   # Windows
   netsh advfirewall firewall add rule name="SQL Server" dir=in action=allow protocol=TCP localport=1433

   # Linux
   sudo ufw allow 1433/tcp
   ```

3. Proverite da li SQL Server sluša na TCP:
   - Otvori **SQL Server Configuration Manager**
   - **SQL Server Network Configuration → Protocols**
   - Omogući **TCP/IP**

### Problem: "Self signed certificate"

**Rešenje:**
U `.env.local` postavi:
```
DB_TRUST_CERT=true
```

---

## 📊 Connection Pooling

Connection pool automatski upravlja konekcijama:

- **Max connections:** 10
- **Min connections:** 0
- **Idle timeout:** 30 sekundi
- **Request timeout:** 30 sekundi

Pool se automatski zatvara kada aplikacija završi.

---

## 🧪 Testiranje

### Test Konekcije

```bash
curl http://localhost:3002/api/database/test
```

### Custom Query Test

```bash
curl -X POST http://localhost:3002/api/database/test \
  -H "Content-Type: application/json" \
  -d '{"query": "SELECT COUNT(*) as Total FROM Users"}'
```

---

## 🔄 Integration sa Postojećim Sistemom

### Sinhronizacija sa Mobilnom Aplikacijom

Možete kreirati API endpoint koji čita podatke iz SQL baze i sinhronizuje ih sa mobilnom aplikacijom:

```typescript
// /app/api/sync/database/route.ts
import { NextRequest, NextResponse } from "next/server";
import { query } from "../../../../lib/db";

export async function GET(request: NextRequest) {
  try {
    // Učitaj korisnike iz SQL baze
    const usersResult = await query("SELECT * FROM Users WHERE Active = 1");

    // Učitaj servise iz SQL baze
    const ticketsResult = await query(`
      SELECT t.*, u.Name as TechnicianName
      FROM ServiceTickets t
      JOIN Users u ON t.TechnicianId = u.UserId
      WHERE t.CreatedAt > DATEADD(day, -30, GETDATE())
    `);

    return NextResponse.json({
      success: true,
      data: {
        users: usersResult.recordset,
        tickets: ticketsResult.recordset
      }
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
```

---

## 📚 Dodatni Resursi

- **mssql dokumentacija:** https://www.npmjs.com/package/mssql
- **SQL Server dokumentacija:** https://docs.microsoft.com/en-us/sql/
- **TypeScript SQL patterns:** https://github.com/tediousjs/node-mssql

---

## ✅ Čeklist za Production

- [ ] Konfigurisane environment variables
- [ ] Korišćeni parametrizovani queries (ne string concatenation)
- [ ] Enabled SSL/TLS encryption (za Azure)
- [ ] Konfigurisane jake lozinke
- [ ] Testirane sve query funkcije
- [ ] Postavljeni odgovarajući SQL Server permisije
- [ ] Konfigurisani firewall rules
- [ ] Implementiran error handling
- [ ] Dodati logovi za debugging

---

**Napravljeno za La Fantana WHS projekat**
Datum: 09.11.2025
