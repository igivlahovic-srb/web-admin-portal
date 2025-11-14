# Portal Dual Database System

Portal ima **DUAL** bazu podataka sistem:

## 1. **Portal Database (SQLite)** - Sopstvena baza portala
- **Lokacija**: `data/portal.db`
- **Tip**: SQLite (file-based, bez potrebe za serverom)
- **Svrha**: Čuvanje svih podataka portala
- **Sadržaj**:
  - ✅ Korisnici (users)
  - ✅ Servisi (service_tickets)
  - ✅ Operacije (operation_templates)
  - ✅ Rezervni delovi (spare_part_templates)
  - ✅ Workday log

## 2. **ERP Database (MS SQL Server)** - Samo za čitanje
- **Lokacija**: External MS SQL Server
- **Tip**: Microsoft SQL Server
- **Svrha**: **SAMO** za učitavanje rezervnih delova iz ERP sistema
- **Pristup**: Read-only (samo SELECT queries)

---

## 🚀 Setup - Migracija iz JSON u SQLite

### Korak 1: Instaliraj dependencies

```bash
cd D:\web-admin-portal
npm install
```

Ovo će instalirati:
- `better-sqlite3` - SQLite database driver
- `tsx` - TypeScript execution tool

### Korak 2: Pokreni migraciju

```bash
npm run migrate
```

Ova komanda će:
1. Kreirati `data/portal.db` SQLite bazu
2. Kreirati sve tabele (users, service_tickets, itd.)
3. Preneti sve podatke iz JSON fajlova u bazu
4. Prikazati statistiku o migriranim podacima

**Primer output-a:**
```
🚀 Starting migration from JSON to SQLite...

📁 Migrating users...
✅ Migrated 4 users

📁 Migrating operation templates...
✅ Migrated 6 operation templates

📁 Migrating spare part templates...
✅ Migrated 6 spare part templates

📁 Migrating service tickets...
✅ Migrated 0 service tickets

✅ Migration completed successfully!

📊 Database Statistics:
   Users: 4
   Service Tickets: 0
   Operation Templates: 6
   Spare Part Templates: 6

🎉 All done!
```

### Korak 3: Proveri bazu

SQLite baza se nalazi na: `D:\web-admin-portal\data\portal.db`

Možeš je otvoriti sa:
- **DB Browser for SQLite** (https://sqlitebrowser.org/) - GUI tool
- **VS Code SQLite extension**
- **DBeaver** - Universal database tool

---

## 📊 Database Schema

### **users** table
```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  charismaId TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('super_user', 'gospodar', 'technician')),
  depot TEXT NOT NULL,
  isActive INTEGER NOT NULL DEFAULT 1,
  createdAt TEXT NOT NULL,
  workdayStatus TEXT CHECK (workdayStatus IN ('open', 'closed')),
  workdayClosedAt TEXT,
  workdayOpenedBy TEXT,
  workdayReopenReason TEXT,
  updatedAt TEXT,
  FOREIGN KEY (workdayOpenedBy) REFERENCES users(id)
);
```

### **service_tickets** table
```sql
CREATE TABLE service_tickets (
  id TEXT PRIMARY KEY,
  ticketNumber TEXT UNIQUE NOT NULL,
  technicianId TEXT NOT NULL,
  customerName TEXT NOT NULL,
  customerPhone TEXT,
  customerAddress TEXT,
  deviceType TEXT,
  deviceSerialNumber TEXT,
  problemDescription TEXT,
  status TEXT NOT NULL CHECK (status IN ('in_progress', 'completed', 'cancelled')),
  startTime TEXT NOT NULL,
  endTime TEXT,
  durationMinutes INTEGER,
  createdAt TEXT NOT NULL,
  updatedAt TEXT,
  FOREIGN KEY (technicianId) REFERENCES users(id)
);
```

### **operation_templates** table
```sql
CREATE TABLE operation_templates (
  id TEXT PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  isActive INTEGER NOT NULL DEFAULT 1,
  createdAt TEXT NOT NULL,
  updatedAt TEXT
);
```

### **spare_part_templates** table
```sql
CREATE TABLE spare_part_templates (
  id TEXT PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  unit TEXT NOT NULL,
  isActive INTEGER NOT NULL DEFAULT 1,
  createdAt TEXT NOT NULL,
  updatedAt TEXT
);
```

### **ticket_operations** (many-to-many)
```sql
CREATE TABLE ticket_operations (
  id TEXT PRIMARY KEY,
  ticketId TEXT NOT NULL,
  operationId TEXT NOT NULL,
  operationCode TEXT,
  operationName TEXT,
  operationDescription TEXT,
  createdAt TEXT NOT NULL,
  FOREIGN KEY (ticketId) REFERENCES service_tickets(id) ON DELETE CASCADE,
  FOREIGN KEY (operationId) REFERENCES operation_templates(id)
);
```

### **ticket_spare_parts** (many-to-many)
```sql
CREATE TABLE ticket_spare_parts (
  id TEXT PRIMARY KEY,
  ticketId TEXT NOT NULL,
  sparePartId TEXT NOT NULL,
  sparePartCode TEXT,
  sparePartName TEXT,
  quantity REAL NOT NULL,
  unit TEXT,
  createdAt TEXT NOT NULL,
  FOREIGN KEY (ticketId) REFERENCES service_tickets(id) ON DELETE CASCADE,
  FOREIGN KEY (sparePartId) REFERENCES spare_part_templates(id)
);
```

### **workday_log** table
```sql
CREATE TABLE workday_log (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('opened', 'closed')),
  timestamp TEXT NOT NULL,
  openedBy TEXT,
  reason TEXT,
  FOREIGN KEY (userId) REFERENCES users(id),
  FOREIGN KEY (openedBy) REFERENCES users(id)
);
```

---

## 🔄 Kako funkcioniše dual database sistem?

### Portal Database (SQLite)
- Sve operacije u portalu koriste SQLite bazu
- CRUD operacije: Create, Read, Update, Delete
- Automatski sync sa mobilnom aplikacijom
- Backup se pravi od `data/portal.db` fajla

### ERP Database (MS SQL)
- **Samo čitanje** rezervnih delova iz ERP-a
- Koristi se samo za import/sync delova
- Konfiguriše se kroz portal UI:
  - Idi na: `/configuration?tab=erp`
  - Unesi MS SQL Server podatke
  - Test konekciju
  - Import delove

---

## 📝 Razvoj - Korišćenje baze u kodu

### Import
```typescript
import { query, exec, get, transaction } from '../lib/portal-db';
```

### SELECT query
```typescript
// Get all active users
const users = query("SELECT * FROM users WHERE isActive = 1");

// Get single user by ID
const user = get("SELECT * FROM users WHERE id = ?", [userId]);

// Get with params
const tickets = query(
  "SELECT * FROM service_tickets WHERE technicianId = ? AND status = ?",
  [technicianId, 'in_progress']
);
```

### INSERT/UPDATE/DELETE
```typescript
// Insert new user
exec(
  "INSERT INTO users (id, charismaId, username, password, name, role, depot, isActive, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
  [id, charismaId, username, password, name, role, depot, 1, new Date().toISOString()]
);

// Update user
exec(
  "UPDATE users SET name = ?, depot = ?, updatedAt = ? WHERE id = ?",
  [name, depot, new Date().toISOString(), userId]
);

// Delete user
exec("DELETE FROM users WHERE id = ?", [userId]);
```

### Transactions
```typescript
transaction(() => {
  // Insert ticket
  exec("INSERT INTO service_tickets (...) VALUES (...)", [...]);

  // Insert operations for ticket
  for (const op of operations) {
    exec("INSERT INTO ticket_operations (...) VALUES (...)", [...]);
  }

  // Insert spare parts for ticket
  for (const part of spareParts) {
    exec("INSERT INTO ticket_spare_parts (...) VALUES (...)", [...]);
  }
});
```

---

## ✅ Prednosti SQLite za Portal

1. **Zero configuration** - Nema server setup, samo fajl
2. **Fast** - Brži od JSON za velike količine podataka
3. **ACID compliant** - Transakcije, rollback, consistency
4. **Relationships** - Foreign keys, joins, validations
5. **Portable** - Jedan fajl, lako za backup
6. **Cross-platform** - Radi identično na Windows i Linux
7. **No network** - Sve lokalno, nema network issues

---

## 🔒 Backup Strategy

### Portal Database (SQLite)
```bash
# Simple file copy
cp data/portal.db data/portal.db.backup

# Or with timestamp
cp data/portal.db data/portal-$(date +%Y%m%d-%H%M%S).db
```

### Automatski backup kroz portal UI
Portal će automatski backup-ovati `data/portal.db` zajedno sa ostalim fajlovima.

---

## 🚨 Important Notes

- ⚠️ **JSON fajlovi se NE MENJAJU automatski** nakon migracije - baza postaje source of truth
- ⚠️ **Restartuj server** nakon migracije da bi se učitala nova baza
- ⚠️ **SQLite podržava do ~1 milion redova** - više nego dovoljno za portal
- ⚠️ **BACKUP `data/portal.db` fajl** redovno!

---

## 📞 Support

Za pitanja ili probleme, kontaktiraj development tim.
