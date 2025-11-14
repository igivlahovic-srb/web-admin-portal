import fs from "fs";
import path from "path";
import { getPortalDB, transaction } from "../lib/portal-db";

/**
 * Migrate data from JSON files to SQLite database
 */
async function migrateJSONToSQLite() {
  console.log("🚀 Starting migration from JSON to SQLite...\n");

  const dataDir = path.join(process.cwd(), "data");
  const db = getPortalDB();

  try {
    // 1. Migrate Users
    console.log("📁 Migrating users...");
    const usersPath = path.join(dataDir, "users.json");
    if (fs.existsSync(usersPath)) {
      const usersData = JSON.parse(fs.readFileSync(usersPath, "utf-8"));

      transaction(() => {
        const insertUser = db.prepare(`
          INSERT OR REPLACE INTO users (
            id, charismaId, username, password, name, role, depot,
            isActive, createdAt, workdayStatus, workdayClosedAt,
            workdayOpenedBy, workdayReopenReason
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        for (const user of usersData) {
          insertUser.run(
            user.id,
            user.charismaId,
            user.username,
            user.password,
            user.name,
            user.role,
            user.depot,
            user.isActive ? 1 : 0,
            user.createdAt || new Date().toISOString(),
            user.workdayStatus || null,
            user.workdayClosedAt || null,
            user.workdayOpenedBy || null,
            user.workdayReopenReason || null
          );
        }
      });

      console.log(`✅ Migrated ${usersData.length} users`);
    } else {
      console.log("⚠️  users.json not found, skipping");
    }

    // 2. Migrate Operation Templates
    console.log("\n📁 Migrating operation templates...");
    const operationsPath = path.join(dataDir, "operations.json");
    if (fs.existsSync(operationsPath)) {
      const operationsData = JSON.parse(fs.readFileSync(operationsPath, "utf-8"));

      transaction(() => {
        const insertOp = db.prepare(`
          INSERT OR REPLACE INTO operation_templates (
            id, code, name, description, isActive, createdAt
          ) VALUES (?, ?, ?, ?, ?, ?)
        `);

        for (const op of operationsData) {
          insertOp.run(
            op.id,
            op.code,
            op.name,
            op.description || "",
            op.isActive ? 1 : 0,
            op.createdAt || new Date().toISOString()
          );
        }
      });

      console.log(`✅ Migrated ${operationsData.length} operation templates`);
    } else {
      console.log("⚠️  operations.json not found, skipping");
    }

    // 3. Migrate Spare Part Templates
    console.log("\n📁 Migrating spare part templates...");
    const sparePartsPath = path.join(dataDir, "spare-parts.json");
    if (fs.existsSync(sparePartsPath)) {
      const sparePartsData = JSON.parse(fs.readFileSync(sparePartsPath, "utf-8"));

      transaction(() => {
        const insertPart = db.prepare(`
          INSERT OR REPLACE INTO spare_part_templates (
            id, code, name, unit, isActive, createdAt
          ) VALUES (?, ?, ?, ?, ?, ?)
        `);

        for (const part of sparePartsData) {
          insertPart.run(
            part.id,
            part.code,
            part.name,
            part.unit,
            part.isActive ? 1 : 0,
            part.createdAt || new Date().toISOString()
          );
        }
      });

      console.log(`✅ Migrated ${sparePartsData.length} spare part templates`);
    } else {
      console.log("⚠️  spare-parts.json not found, skipping");
    }

    // 4. Migrate Service Tickets
    console.log("\n📁 Migrating service tickets...");
    const ticketsPath = path.join(dataDir, "tickets.json");
    if (fs.existsSync(ticketsPath)) {
      const ticketsData = JSON.parse(fs.readFileSync(ticketsPath, "utf-8"));

      transaction(() => {
        const insertTicket = db.prepare(`
          INSERT OR REPLACE INTO service_tickets (
            id, ticketNumber, technicianId, customerName, customerPhone,
            customerAddress, deviceType, deviceSerialNumber, problemDescription,
            status, startTime, endTime, durationMinutes, createdAt
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        const insertOperation = db.prepare(`
          INSERT OR REPLACE INTO ticket_operations (
            id, ticketId, operationId, operationCode, operationName, operationDescription
          ) VALUES (?, ?, ?, ?, ?, ?)
        `);

        const insertSparePart = db.prepare(`
          INSERT OR REPLACE INTO ticket_spare_parts (
            id, ticketId, sparePartId, sparePartCode, sparePartName, quantity, unit
          ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `);

        for (const ticket of ticketsData) {
          // Insert ticket
          insertTicket.run(
            ticket.id,
            ticket.ticketNumber || ticket.id,
            ticket.technicianId,
            ticket.customerName || "",
            ticket.customerPhone || null,
            ticket.customerAddress || null,
            ticket.deviceType || null,
            ticket.deviceSerialNumber || null,
            ticket.problemDescription || null,
            ticket.status,
            ticket.startTime,
            ticket.endTime || null,
            ticket.durationMinutes || null,
            ticket.createdAt || new Date().toISOString()
          );

          // Insert operations for this ticket
          if (ticket.operations && Array.isArray(ticket.operations)) {
            for (const op of ticket.operations) {
              insertOperation.run(
                op.id || `${ticket.id}-op-${Math.random().toString(36).substr(2, 9)}`,
                ticket.id,
                op.id,
                op.code || "",
                op.name || "",
                op.description || ""
              );
            }
          }

          // Insert spare parts for this ticket
          if (ticket.spareParts && Array.isArray(ticket.spareParts)) {
            for (const part of ticket.spareParts) {
              insertSparePart.run(
                part.id || `${ticket.id}-part-${Math.random().toString(36).substr(2, 9)}`,
                ticket.id,
                part.id,
                part.code || "",
                part.name || "",
                part.quantity || 0,
                part.unit || ""
              );
            }
          }
        }
      });

      console.log(`✅ Migrated ${ticketsData.length} service tickets`);
    } else {
      console.log("⚠️  tickets.json not found, skipping");
    }

    // 5. Migrate Workday Log
    console.log("\n📁 Migrating workday log...");
    const workdayPath = path.join(dataDir, "workday-log.json");
    if (fs.existsSync(workdayPath)) {
      const workdayData = JSON.parse(fs.readFileSync(workdayPath, "utf-8"));

      transaction(() => {
        const insertLog = db.prepare(`
          INSERT OR REPLACE INTO workday_log (
            id, userId, action, timestamp, openedBy, reason
          ) VALUES (?, ?, ?, ?, ?, ?)
        `);

        for (const log of workdayData) {
          insertLog.run(
            log.id || `log-${Math.random().toString(36).substr(2, 9)}`,
            log.userId,
            log.action,
            log.timestamp,
            log.openedBy || null,
            log.reason || null
          );
        }
      });

      console.log(`✅ Migrated ${workdayData.length} workday log entries`);
    } else {
      console.log("⚠️  workday-log.json not found, skipping");
    }

    console.log("\n✅ Migration completed successfully!");
    console.log(`\n📊 Database location: ${path.join(dataDir, "portal.db")}`);

    // Show stats
    const userCount = db.prepare("SELECT COUNT(*) as count FROM users").get() as { count: number };
    const ticketCount = db.prepare("SELECT COUNT(*) as count FROM service_tickets").get() as { count: number };
    const opCount = db.prepare("SELECT COUNT(*) as count FROM operation_templates").get() as { count: number };
    const partCount = db.prepare("SELECT COUNT(*) as count FROM spare_part_templates").get() as { count: number };

    console.log("\n📈 Database Statistics:");
    console.log(`   Users: ${userCount.count}`);
    console.log(`   Service Tickets: ${ticketCount.count}`);
    console.log(`   Operation Templates: ${opCount.count}`);
    console.log(`   Spare Part Templates: ${partCount.count}`);

  } catch (error) {
    console.error("\n❌ Migration failed:", error);
    throw error;
  }
}

// Run migration if called directly
if (require.main === module) {
  migrateJSONToSQLite()
    .then(() => {
      console.log("\n🎉 All done!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("\n💥 Migration error:", error);
      process.exit(1);
    });
}

export default migrateJSONToSQLite;
