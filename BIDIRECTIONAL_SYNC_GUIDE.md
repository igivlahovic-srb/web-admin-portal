# Bidirekciona Sinhronizacija - Uputstvo

## 🔄 Šta je promenjeno?

Mobilna aplikacija sada ima **bidirekcionalnu sinhronizaciju** umesto jednostrane.

### Pre (Staro ponašanje):
```
Mobilna App  ────►  Web Portal
    (samo slanje)
```
- Mobilna aplikacija **SAMO ŠALJE** servise na web portal
- Ako otvorite servis na portalu, mobilna aplikacija **NE ZNA** za to
- Nema preuzimanja sa portala

### Sada (Novo ponašanje):
```
Mobilna App  ◄────►  Web Portal
  (preuzimanje i slanje)
```
- Mobilna aplikacija **PRVO PREUZIMA** servise sa web portala
- Zatim **ŠALJE** svoje lokalne servise na portal
- Servisi otvoreni na portalu se **AUTOMATSKI** prikazuju u aplikaciji

## 🎯 Kako funkcioniše?

### 1. Sync dugme u Profilu
Kada kliknete **"Sinhronizuj podatke"** u Profil ekranu:

```typescript
bidirectionalSync() {
  // Step 1: Fetch from web (preuzmi servise sa portala)
  syncFromWeb()

  // Step 2: Push to web (pošalji svoje servise na portal)
  syncToWeb()
}
```

### 2. Merge logika (Inteligentno spajanje)

**Scenario A: Novi servis na portalu**
- Portal ima servis ID: `abc123`
- Mobilna app nema taj servis
- **Rezultat**: Dodaje se u mobilnu app ✅

**Scenario B: Servis postoji na oba mesta**
- Mobilna app: servis završen 10:00
- Portal: servis ponovo otvoren 10:30
- **Rezultat**: Portal verzija je novija, koristi se portal verzija ✅

**Scenario C: Lokalni servisi**
- Mobilna app ima servis koji portal nema
- **Rezultat**: Šalje se na portal nakon preuzimanja ✅

### 3. Date comparison (Poređenje datuma)

```typescript
const webUpdated = webTicket.endTime || webTicket.startTime
const localUpdated = localTicket.endTime || localTicket.startTime

if (webUpdated > localUpdated) {
  // Portal verzija je novija - koristi portal
  useWebVersion()
}
```

## 📱 Kako koristiti?

### Za Servisere:
1. Idite na **Profil** ekran
2. Kliknite **"Sinhronizuj podatke"**
3. Sačekajte poruku "Servisi su sinhronizovani u oba smera"
4. Servisi otvoreni na portalu će se pojaviti u vašoj aplikaciji

### Za Super Administratore:
1. Idite na **Profil** ekran
2. Kliknite **"Sinhronizuj podatke"**
3. Sinhronizuju se:
   - ✅ Korisnici (poslato na portal)
   - ✅ Servisi (preuzeto sa portala + poslato na portal)

## 🔍 Primeri

### Primer 1: Otvaranje servisa na portalu
```
1. Na web portalu otvorite servis koji je bio završen
2. Na mobilnoj app idite na Profil
3. Kliknite "Sinhronizuj podatke"
4. Servis se pojavljuje kao "U toku" u mobilnoj app ✅
```

### Primer 2: Završavanje servisa na mobilnoj app
```
1. Na mobilnoj app završite servis
2. Kliknite "Sinhronizuj podatke"
3. Servis se prikazuje kao "Završen" na web portalu ✅
```

### Primer 3: Konflikt (verzije se razlikuju)
```
1. Na portalu: servis otvoren u 10:30
2. Na mobilnoj: isti servis završen u 10:00
3. Kliknite "Sinhronizuj podatke"
4. Portal verzija (10:30) je novija → koristi se portal verzija ✅
```

## 🛠️ Tehnički detalji

### Nove funkcije u `serviceStore.ts`:

**1. `syncFromWeb()`** - Preuzimanje sa portala
```typescript
- Fetch servise sa web portala
- Merge sa lokalnim servisima
- Dodaje nove servise
- Ažurira postojeće ako je portal verzija novija
```

**2. `bidirectionalSync()`** - Puna sinhronizacija
```typescript
- Poziva syncFromWeb() (preuzimanje)
- Zatim poziva syncToWeb() (slanje)
- Vraća true/false za uspeh
```

### API endpoint koji se koristi:

**GET /api/sync/tickets** - Preuzimanje servisa
```typescript
Response: {
  success: true,
  data: {
    tickets: [...]
  }
}
```

**POST /api/sync/tickets** - Slanje servisa
```typescript
Body: { tickets: [...] }
Response: { success: true }
```

## ✅ Prednosti

1. **Automatsko preuzimanje**: Servisi otvoreni na portalu se automatski prikazuju
2. **Inteligentno spajanje**: Koristi se najnovija verzija svakog servisa
3. **Bez gubitka podataka**: Lokalni i portal podaci se čuvaju
4. **Konflikt rezolucija**: Automatski rešava konflikte na osnovu datuma

## 🚨 Napomene

- iOS i Android koriste **isti kod** - identična funkcionalnost
- Sinhronizacija radi **samo ako je web portal dostupan**
- Super admini sinhronizuju i korisnike i servise
- Serviseri sinhronizuju samo servise
- Merge logika koristi `endTime` ili `startTime` za poređenje

## 📊 Logovi

Za debugging, pogledajte console logove:
```javascript
[ServiceStore] Starting bidirectional sync...
[ServiceStore] Fetching tickets from web...
[ServiceStore] Fetched tickets from web. Count: 10
[ServiceStore] Adding new ticket from web: abc123
[ServiceStore] Updating ticket from web (newer): def456
[ServiceStore] Merged tickets. Total count: 15
[ServiceStore] Syncing tickets to web. Count: 15
[ServiceStore] Bidirectional sync completed successfully
```

---

**Verzija**: 2.1.0
**Poslednje ažurirano**: 2025-01-11
