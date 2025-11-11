# Komande Za Debug CSS Problema

## Na Ubuntu Serveru, pokrenite REDOM:

### 1. Provera CSS linkova u HTML-u
```bash
cd /root/webadminportal/web-admin
cat test.html | grep -i "stylesheet\|css"
```
**Kopirajte mi output!**

---

### 2. Provera da li CSS fajlovi postoje
```bash
find .next -name "*.css" | head -10
```
**Kopirajte mi output!**

---

### 3. Provera _next/static foldera
```bash
ls -la .next/static/
```
**Kopirajte mi output!**

---

### 4. Test pristupa CSS fajlu
```bash
# Prvo pogledajte koji CSS fajl se koristi iz komande #1
# Zatim testirajte pristup (zamenite XXX sa pravim imenom):
curl -I http://localhost:3002/_next/static/css/XXX.css
```
**Kopirajte mi output!**

---

### 5. PM2 Logovi
```bash
pm2 logs lafantana-whs-admin --lines 50 --nostream
```
**Kopirajte mi output!**

---

## Takođe - U Browser-u:

### 6. F12 → Console Tab
- Pritisnite F12
- Idite na Console
- Osvežite stranicu
- **Screenshot ili copy-paste greške**

### 7. F12 → Network Tab
- Pritisnite F12
- Idite na Network
- Filtrirajte: CSS
- Osvežite stranicu
- **Screenshot ili lista CSS fajlova sa statusima**

---

**Pošaljite mi output od komandi 1-5, i info iz browser-a (6-7)!**
