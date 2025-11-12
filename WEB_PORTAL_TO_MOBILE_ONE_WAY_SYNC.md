# Web Portal - One-Way Sync: Portal → Mobilna Aplikacija

## 🎯 Cilj

Kada admin otvori servis na **web portalu**, mobilna aplikacija treba **automatski** da preuzme tu izmenu i otvori servis.

**Smer sinhronizacije**: Portal → Mobilna (SAMO u jednom pravcu)

## 📋 Trenutna situacija

### Problem:
1. Admin otvori zatvoreni servis na portalu
2. Servis na portalu dobije status `in_progress`
3. Mobilna aplikacija ima "Portal Live Update" funkcionalnost
4. ❌ Ali servis ostaje `completed` na mobilnoj aplikaciji

### Uzrok:
Mobilna aplikacija već ima `syncFromWeb()` funkcionalnost, ali verovatno **ne overwrite-uje** servise koji su već `completed`.

## ✅ Rešenje

### 1. Portal API - Označavanje ponovnog otvaranja

Kada admin otvori servis ponovo na portalu, treba dodati specijalno polje koje označava da je servis **ponovo otvoren**.

**Lokacija**: `/root/webadminportal/web-admin/app/api/services/reopen/route.ts`

```typescript
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');

export async function POST(request: Request) {
  try {
    const { ticketId, adminId, adminName, reason } = await request.json();

    if (!ticketId || !adminId) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Učitaj servise
    const ticketsPath = path.join(DATA_DIR, 'tickets.json');
    const ticketsData = fs.readFileSync(ticketsPath, 'utf-8');
    const tickets = JSON.parse(ticketsData);

    // Pronađi servis
    const ticketIndex = tickets.findIndex((t: any) => t.id === ticketId);

    if (ticketIndex === -1) {
      return NextResponse.json(
        { success: false, message: 'Service not found' },
        { status: 404 }
      );
    }

    const ticket = tickets[ticketIndex];

    // Proveri da li je servis već completed
    if (ticket.status !== 'completed') {
      return NextResponse.json(
        { success: false, message: 'Service is not completed' },
        { status: 400 }
      );
    }

    // Otvori servis ponovo
    const now = new Date().toISOString();

    tickets[ticketIndex] = {
      ...ticket,
      status: 'in_progress',
      reopenedAt: now,
      reopenedBy: adminId,
      reopenedByName: adminName,
      reopenReason: reason || 'Nije navedeno',
      // Ukloni endTime i durationMinutes jer se servis nastavlja
      endTime: null,
      durationMinutes: null,
      // Dodaj flag koji označava da je servis ponovo otvoren
      wasReopened: true,
      lastModified: now,
    };

    // Sačuvaj
    fs.writeFileSync(ticketsPath, JSON.stringify(tickets, null, 2));

    // Log akciju
    const logPath = path.join(DATA_DIR, 'service-reopen-log.json');
    let logs = [];

    if (fs.existsSync(logPath)) {
      logs = JSON.parse(fs.readFileSync(logPath, 'utf-8'));
    }

    logs.push({
      ticketId,
      serviceNumber: ticket.serviceNumber,
      deviceCode: ticket.deviceCode,
      reopenedAt: now,
      reopenedBy: adminId,
      reopenedByName: adminName,
      reason: reason || 'Nije navedeno',
      originalEndTime: ticket.endTime,
    });

    // Čuvaj samo poslednjih 100 log-ova
    if (logs.length > 100) {
      logs = logs.slice(-100);
    }

    fs.writeFileSync(logPath, JSON.stringify(logs, null, 2));

    return NextResponse.json({
      success: true,
      message: 'Service reopened successfully',
      data: {
        ticket: tickets[ticketIndex],
      },
    });
  } catch (error) {
    console.error('Error reopening service:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to reopen service' },
      { status: 500 }
    );
  }
}
```

### 2. Portal API - GET servisi sa metadata

Proširiti `/api/sync/tickets` endpoint da vraća `wasReopened` flag:

**Lokacija**: `/root/webadminportal/web-admin/app/api/sync/tickets/route.ts`

```typescript
export async function GET() {
  try {
    const ticketsPath = path.join(DATA_DIR, 'tickets.json');

    if (!fs.existsSync(ticketsPath)) {
      return NextResponse.json({
        success: true,
        data: { tickets: [] },
      });
    }

    const ticketsData = fs.readFileSync(ticketsPath, 'utf-8');
    const tickets = JSON.parse(ticketsData);

    // Servisi se vraćaju sa svim poljima, uključujući wasReopened, reopenedAt, itd.
    return NextResponse.json({
      success: true,
      data: { tickets },
    });
  } catch (error) {
    console.error('Error fetching tickets:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch tickets' },
      { status: 500 }
    );
  }
}
```

### 3. Portal UI - Dugme za ponovno otvaranje

**Lokacija**: `/root/webadminportal/web-admin/app/admin/services/page.tsx`

```tsx
'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';

export default function ServicesPage() {
  const [reopenReason, setReopenReason] = useState('');
  const [showReopenModal, setShowReopenModal] = useState(false);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);

  const handleReopenClick = (ticketId: string) => {
    setSelectedTicketId(ticketId);
    setShowReopenModal(true);
  };

  const handleReopenConfirm = async () => {
    if (!reopenReason || reopenReason.trim().length < 10) {
      toast.error('Razlog mora biti najmanje 10 karaktera');
      return;
    }

    try {
      const response = await fetch('/api/services/reopen', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ticketId: selectedTicketId,
          adminId: currentUser.id,
          adminName: currentUser.name,
          reason: reopenReason,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Servis je ponovo otvoren!');
        setShowReopenModal(false);
        setReopenReason('');
        setSelectedTicketId(null);

        // Refresh listu servisa
        fetchTickets();
      } else {
        toast.error(data.message || 'Greška pri otvaranju servisa');
      }
    } catch (error) {
      console.error('Error reopening service:', error);
      toast.error('Greška pri otvaranju servisa');
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Servisi</h1>

      {/* Lista servisa */}
      <div className="space-y-4">
        {tickets.map((ticket) => (
          <div key={ticket.id} className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold">{ticket.serviceNumber}</h3>
                <p className="text-sm text-gray-600">{ticket.deviceCode}</p>
                <p className="text-xs text-gray-500">{ticket.technicianName}</p>
              </div>

              <div className="flex items-center gap-3">
                {/* Status badge */}
                <span
                  className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                    ticket.status === 'completed'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-amber-100 text-amber-700'
                  }`}
                >
                  {ticket.status === 'completed' ? 'Završeno' : 'U toku'}
                </span>

                {/* Dugme za ponovno otvaranje */}
                {ticket.status === 'completed' && (
                  <button
                    onClick={() => handleReopenClick(ticket.id)}
                    className="bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700 text-sm"
                  >
                    Otvori ponovo
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal za razlog */}
      {showReopenModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Razlog za ponovno otvaranje</h2>

            <p className="text-sm text-gray-600 mb-4">
              Unesite razlog zašto ponovno otvarate ovaj servis (minimum 10 karaktera):
            </p>

            <textarea
              value={reopenReason}
              onChange={(e) => setReopenReason(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-3 text-sm mb-4"
              rows={4}
              placeholder="Npr: Klijent prijavio dodatni problem sa..."
            />

            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setShowReopenModal(false);
                  setReopenReason('');
                  setSelectedTicketId(null);
                }}
                className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300"
              >
                Otkaži
              </button>

              <button
                onClick={handleReopenConfirm}
                className="flex-1 bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700"
                disabled={reopenReason.trim().length < 10}
              >
                Otvori ponovo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
```

### 4. Mobilna Aplikacija - Ažuriranje logike sinhronizacije

**VAŽNO**: Mobilna aplikacija već ima `syncFromWeb()` funkcionalnost, ali treba da **overwrite-uje** servise koji imaju `wasReopened: true` flag.

**Lokacija**: `/home/user/workspace/src/state/serviceStore.ts`

Pronađi `syncFromWeb` ili `bidirectionalSync` funkciju i **DODAJ** ovu logiku:

```typescript
syncFromWeb: async () => {
  try {
    const response = await webAdminAPI.fetchTickets();

    if (!response.success || !response.data?.tickets) {
      return false;
    }

    const webTickets = response.data.tickets;

    set((state) => {
      const localTickets = state.tickets;
      const mergedTickets = [...localTickets];

      webTickets.forEach((webTicket: any) => {
        const localIndex = mergedTickets.findIndex(
          (t) => t.id === webTicket.id
        );

        if (localIndex >= 0) {
          const localTicket = mergedTickets[localIndex];

          // NOVA LOGIKA: Ako je servis ponovo otvoren na portalu,
          // OVERWRITE-uj lokalni servis bez obzira na timestamp
          if (webTicket.wasReopened && localTicket.status === 'completed') {
            console.log('[ServiceStore] Servis ponovo otvoren sa portala:', webTicket.serviceNumber);

            mergedTickets[localIndex] = {
              ...webTicket,
              // Očisti flag nakon što je preuzet
              wasReopened: undefined,
            };
          } else {
            // Standardno merge-ovanje - koristi najnoviju verziju
            const webTime = new Date(webTicket.lastModified || webTicket.startTime);
            const localTime = new Date(localTicket.lastModified || localTicket.startTime);

            if (webTime > localTime) {
              mergedTickets[localIndex] = webTicket;
            }
          }
        } else {
          // Novi servis sa portala - dodaj ga
          mergedTickets.push(webTicket);
        }
      });

      return { tickets: mergedTickets };
    });

    console.log('[ServiceStore] Sync from web completed');
    return true;
  } catch (error) {
    console.error('[ServiceStore] Error syncing from web:', error);
    return false;
  }
},
```

### 5. Mobilna Aplikacija - Portal Live Update sa boljim polling-om

Već postoji `Portal Live Update` funkcionalnost u Settings. Samo treba obezbediti da se poziva često:

**Lokacija**: `/home/user/workspace/src/screens/SettingsScreen.tsx`

```typescript
// Live update polling (već postoji, samo verifikuj da radi)
useEffect(() => {
  if (!liveUpdateEnabled || !apiUrl) return;

  const interval = setInterval(async () => {
    try {
      const connectionOk = await testConnection();
      if (connectionOk) {
        // Pozovi syncFromWeb koja će preuzeti ponovano otvorene servise
        await Promise.all([
          fetchUsersFromWeb(),
          fetchTicketsFromWeb(), // Ovo poziva syncFromWeb
        ]);
        setLastSyncTime(new Date());
      }
    } catch (error) {
      console.error('Live update error:', error);
    }
  }, 30000); // 30 sekundi

  return () => clearInterval(interval);
}, [liveUpdateEnabled, apiUrl]);
```

## 🧪 Testiranje One-Way Sync

### Test Scenario:

1. **Na mobilnoj aplikaciji**:
   - Kreiraj servis
   - Završi servis (status: `completed`)
   - Uključi "Portal Live Update" u Settings

2. **Na web portalu**:
   - Otvori listu servisa
   - Pronađi završeni servis
   - Klikni "Otvori ponovo"
   - Unesi razlog (npr. "Dodatni problem")
   - Potvrdi

3. **Na mobilnoj aplikaciji**:
   - Sačekaj 30 sekundi (ili ručno sinhronizuj)
   - Servis bi trebalo da se automatski otvori (status: `in_progress`)
   - Servis bi trebalo da nema `endTime` i `durationMinutes`

### Provera:

```bash
# Na portalu - proveri da servis ima wasReopened flag
curl http://localhost:3002/api/sync/tickets | jq '.data.tickets[] | select(.id == "TICKET_ID")'

# Očekivani output:
{
  "id": "...",
  "status": "in_progress",
  "wasReopened": true,
  "reopenedAt": "2025-01-11T16:30:00Z",
  "reopenedBy": "admin",
  "reopenReason": "Dodatni problem",
  "endTime": null,
  "durationMinutes": null
}
```

## 📊 Flow Dijagram

```
Portal (Admin):
  └─> Klik "Otvori ponovo"
       └─> Modal za razlog
            └─> POST /api/services/reopen
                 └─> Update tickets.json
                      └─> status: "in_progress"
                      └─> wasReopened: true
                      └─> reopenedAt: timestamp
                      └─> endTime: null

Mobilna Aplikacija (Tehnician):
  └─> Portal Live Update (30 sec)
       └─> fetchTicketsFromWeb()
            └─> GET /api/sync/tickets
                 └─> syncFromWeb()
                      └─> Proveri wasReopened flag
                           └─> Ako TRUE: OVERWRITE lokalni servis
                                └─> status: "in_progress"
                                └─> Servis ponovo otvoren!
```

## ✅ Checklist

### Portal strana:
- [ ] Dodati `/api/services/reopen` endpoint
- [ ] Proširiti `/api/sync/tickets` da vraća `wasReopened`
- [ ] Dodati "Otvori ponovo" dugme u UI
- [ ] Dodati modal za unos razloga
- [ ] Dodati log sistem za praćenje

### Mobilna aplikacija strana:
- [ ] Ažurirati `syncFromWeb()` logiku
- [ ] Dodati proveru za `wasReopened` flag
- [ ] Overwrite-ovati servise sa `wasReopened: true`
- [ ] Verifikovati da "Portal Live Update" radi

### Testiranje:
- [ ] Test: Završiti servis na mobilnoj
- [ ] Test: Otvoriti servis na portalu
- [ ] Test: Mobilna automatski preuzima izmenu
- [ ] Test: Servis ima status `in_progress` na mobilnoj

---

**Kreirao**: Claude Code
**Za**: La Fantana WHS - Portal → Mobilna Sync
**Smer**: Jednosmerna sinhronizacija (Portal → Mobilna)
**Datum**: 2025-01-11
