## 🔄 Dodatni endpoint-i za sinhronizaciju mobilne aplikacije

Dodajte sledeće endpoint-e u **server.js** odmah nakon postojećih ruta:

```javascript
// Health check endpoint (za testiranje konekcije)
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Get users endpoint (za povlačenje korisnika sa weba)
app.get('/api/sync/users', (req, res) => {
  // Remove passwords from response for security
  const usersWithoutPasswords = users.map(u => {
    const { password, ...userWithoutPassword } = u;
    return userWithoutPassword;
  });
  res.json({ users: usersWithoutPasswords });
});

// Sync users from mobile app
app.post('/api/sync/users', (req, res) => {
  const { users: mobileUsers } = req.body;

  if (mobileUsers && Array.isArray(mobileUsers)) {
    // Merge users (mobile users override web users by id)
    const userMap = new Map();

    // First add all web users
    users.forEach(u => userMap.set(u.id, u));

    // Then override/add mobile users
    mobileUsers.forEach(u => userMap.set(u.id, u));

    // Update users array
    users = Array.from(userMap.values());

    res.json({ success: true, message: 'Users synced successfully', users });
  } else {
    res.status(400).json({ error: 'Invalid users data' });
  }
});

// Sync tickets from mobile app
app.post('/api/sync/tickets', (req, res) => {
  const { tickets: mobileTickets } = req.body;

  if (mobileTickets && Array.isArray(mobileTickets)) {
    // Merge tickets (mobile tickets override web tickets by id)
    const ticketMap = new Map();

    // First add all web tickets
    serviceTickets.forEach(t => ticketMap.set(t.id, t));

    // Then override/add mobile tickets
    mobileTickets.forEach(t => ticketMap.set(t.id, t));

    // Update tickets array
    serviceTickets = Array.from(ticketMap.values());

    res.json({ success: true, message: 'Tickets synced successfully', tickets: serviceTickets });
  } else {
    res.status(400).json({ error: 'Invalid tickets data' });
  }
});
```

## 📝 Kompletna ažurirana server.js datoteka

Evo kompletne server.js datoteke sa svim potrebnim endpoint-ima:

```javascript
const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// In-memory database (matching mobile app structure)
let users = [
  {
    id: "1",
    username: "admin",
    password: "admin123",
    name: "Administrator",
    role: "super_user",
    isActive: true,
    createdAt: new Date("2024-01-01")
  },
  {
    id: "2",
    username: "marko",
    password: "marko123",
    name: "Marko Petrović",
    role: "technician",
    isActive: true,
    createdAt: new Date("2024-01-15")
  },
  {
    id: "3",
    username: "jovan",
    password: "jovan123",
    name: "Jovan Nikolić",
    role: "technician",
    isActive: true,
    createdAt: new Date("2024-02-01")
  }
];

let serviceTickets = [];
let currentSession = null;

// ============= WEB ROUTES =============

app.get('/', (req, res) => {
  if (!currentSession) {
    return res.redirect('/login');
  }

  const stats = {
    totalUsers: users.length,
    activeUsers: users.filter(u => u.isActive).length,
    inactiveUsers: users.filter(u => !u.isActive).length,
    totalTickets: serviceTickets.length,
    activeTickets: serviceTickets.filter(t => t.status === 'in_progress').length,
    completedTickets: serviceTickets.filter(t => t.status === 'completed').length
  };

  res.render('dashboard', { user: currentSession, stats });
});

app.get('/login', (req, res) => {
  res.render('login', { error: null });
});

app.post('/login', (req, res) => {
  const { username, password } = req.body;

  const user = users.find(u =>
    u.username === username &&
    u.password === password &&
    u.role === 'super_user' &&
    u.isActive
  );

  if (user) {
    currentSession = { ...user };
    delete currentSession.password;
    res.redirect('/');
  } else {
    res.render('login', { error: 'Neispravni pristupni podaci ili nemate admin ovlašćenja' });
  }
});

app.get('/logout', (req, res) => {
  currentSession = null;
  res.redirect('/login');
});

// User Management Routes
app.get('/users', (req, res) => {
  if (!currentSession) {
    return res.redirect('/login');
  }
  res.render('users', { users, currentUser: currentSession });
});

app.post('/api/users', (req, res) => {
  if (!currentSession) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { username, password, name, role } = req.body;

  if (users.find(u => u.username === username)) {
    return res.status(400).json({ error: 'Korisničko ime već postoji' });
  }

  const newUser = {
    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    username,
    password,
    name,
    role,
    isActive: true,
    createdAt: new Date()
  };

  users.push(newUser);
  res.json({ success: true, user: newUser });
});

app.put('/api/users/:id', (req, res) => {
  if (!currentSession) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { id } = req.params;
  const updates = req.body;

  const userIndex = users.findIndex(u => u.id === id);
  if (userIndex === -1) {
    return res.status(404).json({ error: 'Korisnik nije pronađen' });
  }

  users[userIndex] = { ...users[userIndex], ...updates };
  res.json({ success: true, user: users[userIndex] });
});

app.delete('/api/users/:id', (req, res) => {
  if (!currentSession) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { id } = req.params;

  if (id === currentSession.id) {
    return res.status(400).json({ error: 'Ne možete obrisati svoj nalog' });
  }

  users = users.filter(u => u.id !== id);
  res.json({ success: true });
});

app.post('/api/users/:id/toggle-active', (req, res) => {
  if (!currentSession) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { id } = req.params;

  if (id === currentSession.id) {
    return res.status(400).json({ error: 'Ne možete deaktivirati svoj nalog' });
  }

  const user = users.find(u => u.id === id);
  if (user) {
    user.isActive = !user.isActive;
    res.json({ success: true, user });
  } else {
    res.status(404).json({ error: 'Korisnik nije pronađen' });
  }
});

// Service Tickets Routes
app.get('/services', (req, res) => {
  if (!currentSession) {
    return res.redirect('/login');
  }
  res.render('services', { tickets: serviceTickets, users });
});

app.get('/api/services', (req, res) => {
  if (!currentSession) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  res.json({ tickets: serviceTickets });
});

// ============= MOBILE APP SYNC API =============

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Get users endpoint
app.get('/api/sync/users', (req, res) => {
  res.json({ users });
});

// Sync users from mobile app
app.post('/api/sync/users', (req, res) => {
  const { users: mobileUsers } = req.body;

  if (mobileUsers && Array.isArray(mobileUsers)) {
    const userMap = new Map();
    users.forEach(u => userMap.set(u.id, u));
    mobileUsers.forEach(u => userMap.set(u.id, u));
    users = Array.from(userMap.values());

    res.json({ success: true, message: 'Users synced successfully', users });
  } else {
    res.status(400).json({ error: 'Invalid users data' });
  }
});

// Sync tickets from mobile app
app.post('/api/sync/tickets', (req, res) => {
  const { tickets: mobileTickets } = req.body;

  if (mobileTickets && Array.isArray(mobileTickets)) {
    const ticketMap = new Map();
    serviceTickets.forEach(t => ticketMap.set(t.id, t));
    mobileTickets.forEach(t => ticketMap.set(t.id, t));
    serviceTickets = Array.from(ticketMap.values());

    res.json({ success: true, message: 'Tickets synced successfully', tickets: serviceTickets });
  } else {
    res.status(400).json({ error: 'Invalid tickets data' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Water Service Admin Panel running on http://localhost:${PORT}`);
  console.log(`📱 Admin credentials: admin / admin123`);
  console.log(`🔄 Mobile sync API available on /api/sync/*`);
});
```

## 🎯 Kako testirati sinhronizaciju

### 1. Pokrenite web admin panel
```bash
npm start
```

### 2. U mobilnoj aplikaciji:
1. Prijavite se kao **admin**
2. Idite na **Profil** tab
3. Kliknite na **Web Admin Sync** dugme
4. Unesite URL (npr. `http://192.168.1.100:3000`)
5. Kliknite **Testiraj** da proverite konekciju
6. Kliknite **Sinhronizuj sada**

### 3. Proverite na webu:
1. Osvežite web admin panel
2. Idite na **Korisnici** - trebalo bi da vidite sve korisnike iz mobilne aplikacije
3. Idite na **Servisi** - trebalo bi da vidite sve servise iz mobilne aplikacije

## 📱 Važne napomene za mobilnu aplikaciju

- Za lokalno testiranje, koristite **IP adresu računara** umesto `localhost`
- Primer: `http://192.168.1.100:3000` (proverite vašu IP adresu)
- Mobilni uređaj i računar moraju biti na istoj mreži
- Firewall na računaru mora dozvoliti pristup na portu 3000

## 🔍 Pronalaženje IP adrese

### Windows:
```cmd
ipconfig
```
Tražite "IPv4 Address"

### Mac/Linux:
```bash
ifconfig | grep "inet "
```

### Alternativno - koristite tunneling servis:
Za remote pristup možete koristiti [ngrok](https://ngrok.com/):
```bash
ngrok http 3000
```
Ngrok će vam dati javni URL koji možete koristiti u mobilnoj aplikaciji.
