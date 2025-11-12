# Web Portal - Service Reopen Sync Fix

## 🐛 Problem

Kada admin otvori **zatvoreni servis ponovo na web portalu**, taj servis ostaje zatvoren (`completed`) na mobilnoj aplikaciji čak i nakon sinhronizacije. Mobilna aplikacija treba automatski da promeni status servisa u `in_progress` kada preuzme podatke sa portala.

## 🔍 Analiza Problema

### Trenutno ponašanje:
1. Admin otvori zatvoreni servis na web portalu
2. Servis na portalu dobije status `in_progress`
3. Mobilna aplikacija sinhronizuje podatke (`syncFromWeb()`)
4. ❌ Servis na mobilnoj aplikaciji ostaje `completed`

### Očekivano ponašanje:
1. Admin otvori zatvoreni servis na web portalu
2. Servis na portalu dobije status `in_progress`
3. Mobilna aplikacija sinhronizuje podatke
4. ✅ Servis na mobilnoj aplikaciji postaje `in_progress`

## 🎯 Uzrok

Mobilna aplikacija ima logiku koja **spaja** (merge) servise sa portala sa lokalnim servisima koristeći timestamp. Međutim, logika verovatno ne dozvoljava da se status servisa promeni sa `completed` nazad na `in_progress`.

## ✅ Rešenje

Treba dodati posebno polje u API odgovoru koje označava da je servis **ponovo otvoren** od strane admina.

### 1. Dodati `reopenedAt` polje u Web Portal API

Lokacija: `/root/webadminportal/web-admin/app/api/sync/tickets/route.ts`

**Proširiti podatke o servisu:**

```typescript
// GET - Vrati sve servise
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

    // Dodaj metadata o ponovnom otvaranju
    const ticketsWithMetadata = tickets.map((ticket: any) => ({
      ...ticket,
      // Ako je servis bio completed pa je vraćen u in_progress, znači da je reopened
      wasReopened: ticket.reopenedAt ? true : false,
      reopenedAt: ticket.reopenedAt || null,
      reopenedBy: ticket.reopenedBy || null,
    }));

    return NextResponse.json({
      success: true,
      data: { tickets: ticketsWithMetadata },
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

### 2. Dodati logiku za ponovno otvaranje servisa na portalu

Kada admin otvori servis ponovo na portalu, treba dodati `reopenedAt` timestamp:

```typescript
// PUT/PATCH - Ažuriraj servis (na web portalu)
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { ticketId, updates, adminId } = body;

    const ticketsPath = path.join(DATA_DIR, 'tickets.json');
    const ticketsData = fs.readFileSync(ticketsPath, 'utf-8');
    const tickets = JSON.parse(ticketsData);

    const ticketIndex = tickets.findIndex((t: any) => t.id === ticketId);

    if (ticketIndex === -1) {
      return NextResponse.json(
        { success: false, message: 'Ticket not found' },
        { status: 404 }
      );
    }

    const currentTicket = tickets[ticketIndex];

    // Proveri da li se servis ponovo otvara
    const isReopening =
      currentTicket.status === 'completed' &&
      updates.status === 'in_progress';

    // Ako se servis ponovo otvara, dodaj metadata
    if (isReopening) {
      updates.reopenedAt = new Date().toISOString();
      updates.reopenedBy = adminId;

      // Ukloni endTime i durationMinutes jer se servis nastavlja
      updates.endTime = null;
      updates.durationMinutes = null;
    }

    // Ažuriraj servis
    tickets[ticketIndex] = {
      ...currentTicket,
      ...updates,
      lastModified: new Date().toISOString(),
    };

    // Sačuvaj
    fs.writeFileSync(ticketsPath, JSON.stringify(tickets, null, 2));

    return NextResponse.json({
      success: true,
      message: 'Ticket updated successfully',
      data: { ticket: tickets[ticketIndex] },
    });
  } catch (error) {
    console.error('Error updating ticket:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to update ticket' },
      { status: 500 }
    );
  }
}
```

### 3. UI na web portalu za ponovno otvaranje servisa

Dodati dugme "Otvori ponovo" za zatvorene servise:

```tsx
// U komponenti za prikaz servisa
{ticket.status === 'completed' && (
  <button
    onClick={() => handleReopenTicket(ticket.id)}
    className="bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700"
  >
    Otvori ponovo
  </button>
)}
```

Handler funkcija:

```typescript
const handleReopenTicket = async (ticketId: string) => {
  try {
    const adminId = currentUser?.id; // ID trenutno ulogovanog admina

    const response = await fetch('/api/sync/tickets', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ticketId,
        adminId,
        updates: {
          status: 'in_progress',
        },
      }),
    });

    const data = await response.json();

    if (data.success) {
      toast.success('Servis je ponovo otvoren!');
      // Refresh listu servisa
      refreshTickets();
    } else {
      toast.error('Greška pri otvaranju servisa');
    }
  } catch (error) {
    console.error('Error reopening ticket:', error);
    toast.error('Greška pri otvaranju servisa');
  }
};
```

### 4. Dodati modal za razlog ponovnog otvaranja (opciono)

Za bolji tracking, možete dodati obavezni razlog:

```tsx
const handleReopenTicket = async (ticketId: string) => {
  const reason = prompt('Unesite razlog za ponovno otvaranje servisa:');

  if (!reason || reason.trim().length < 10) {
    toast.error('Razlog mora biti najmanje 10 karaktera');
    return;
  }

  try {
    const response = await fetch('/api/sync/tickets', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ticketId,
        adminId: currentUser?.id,
        updates: {
          status: 'in_progress',
          reopenReason: reason,
        },
      }),
    });

    // ... rest of code
  } catch (error) {
    console.error('Error reopening ticket:', error);
  }
};
```

### 5. Dodati log za ponovno otvaranje servisa

Kreirajte `data/service-reopen-log.json`:

```typescript
// U PUT endpoint-u
if (isReopening) {
  // Log ponovno otvaranje
  const logPath = path.join(DATA_DIR, 'service-reopen-log.json');

  let log = [];
  if (fs.existsSync(logPath)) {
    const logData = fs.readFileSync(logPath, 'utf-8');
    log = JSON.parse(logData);
  }

  log.push({
    ticketId,
    ticketNumber: currentTicket.serviceNumber,
    deviceCode: currentTicket.deviceCode,
    reopenedAt: new Date().toISOString(),
    reopenedBy: adminId,
    reopenedByName: adminName, // Dobiti iz user store-a
    reason: updates.reopenReason || 'Nije navedeno',
    originalEndTime: currentTicket.endTime,
  });

  // Čuvaj samo poslednjih 100 log-ova
  if (log.length > 100) {
    log = log.slice(-100);
  }

  fs.writeFileSync(logPath, JSON.stringify(log, null, 2));
}
```

### 6. Prikazati log na web portalu

Nova stranica `/admin/service-reopen-log`:

```tsx
export default function ServiceReopenLog() {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    const response = await fetch('/api/service-reopen-log');
    const data = await response.json();
    if (data.success) {
      setLogs(data.data.logs);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Log Ponovnog Otvaranja Servisa</h1>

      <table className="w-full bg-white rounded-lg shadow">
        <thead className="bg-gray-100">
          <tr>
            <th className="px-4 py-3 text-left">Broj Servisa</th>
            <th className="px-4 py-3 text-left">Uređaj</th>
            <th className="px-4 py-3 text-left">Datum</th>
            <th className="px-4 py-3 text-left">Otvorio</th>
            <th className="px-4 py-3 text-left">Razlog</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log) => (
            <tr key={log.ticketId + log.reopenedAt} className="border-t">
              <td className="px-4 py-3">{log.ticketNumber}</td>
              <td className="px-4 py-3">{log.deviceCode}</td>
              <td className="px-4 py-3">
                {new Date(log.reopenedAt).toLocaleString('sr-RS')}
              </td>
              <td className="px-4 py-3">{log.reopenedByName}</td>
              <td className="px-4 py-3">{log.reason}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

## 📱 Već implementirano na mobilnoj aplikaciji

Mobilna aplikacija već ima logiku za sinhronizaciju koja će automatski preuzeti ažurirani status servisa. Kada portal vrati servis sa:
- `status: "in_progress"`
- `reopenedAt: "2025-01-11T10:30:00Z"`

Mobilna aplikacija će automatski ažurirati lokalni servis.

## 🧪 Testiranje

1. **Kreiraj servis na mobilnoj aplikaciji**
2. **Završi servis** (status: `completed`)
3. **Sinhronizuj sa portalom**
4. **Na portalu otvori servis ponovo** (status: `in_progress`)
5. **Na mobilnoj aplikaciji klikni "Portal Live Update" ili ručno sinhronizuj**
6. **Proveri da servis ima status `in_progress` na mobilnoj aplikaciji**

## ✅ Checklist

- [ ] Dodati `reopenedAt` i `reopenedBy` polja u API
- [ ] Implementirati PUT endpoint za ažuriranje servisa
- [ ] Dodati "Otvori ponovo" dugme na web portalu
- [ ] (Opciono) Dodati modal za razlog ponovnog otvaranja
- [ ] (Opciono) Implementirati log sistem
- [ ] (Opciono) Kreirati stranicu za prikaz log-a
- [ ] Testirati end-to-end flow

## 📊 Monitoring

Možete dodati analytics za praćenje:

```typescript
// Koliko puta su servisi ponovo otvarani
const reopenStats = {
  totalReopens: logs.length,
  reopensByUser: logs.reduce((acc, log) => {
    acc[log.reopenedByName] = (acc[log.reopenedByName] || 0) + 1;
    return acc;
  }, {}),
  avgTimeUntilReopen: calculateAverage(logs.map(l =>
    new Date(l.reopenedAt) - new Date(l.originalEndTime)
  )),
};
```

---

**Napravljeno sa**: Claude Code
**Za**: La Fantana WHS Web Portal
**Datum**: 2025-01-11
