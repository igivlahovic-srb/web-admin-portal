# 🚨 REŠENJE ZA "bun not found" - KONAČNO!

## Problem
Kada kliknete **"Ažuriraj"** dugme na web portalu, dobijate:
```
command failed: bun install
/bin/sh: 1: bun not found
```

---

## ✅ FINALNO REŠENJE - NE KORISTITE "Ažuriraj" DUGME!

Umesto klika na dugme, pokrenite **eksterni script DIREKTNO NA SERVERU**:

### Na Ubuntu Serveru:

```bash
# SSH u server
ssh user@your-server-ip

# Download script
curl -o eksterni_update.sh https://raw.githubusercontent.com/yourusername/yourrepo/main/EKSTERNI_UPDATE.sh

# Ili ako imate pristup fajlu, kopirajte ga
# scp EKSTERNI_UPDATE.sh user@server-ip:~/

# Pokrenite script
chmod +x eksterni_update.sh
./eksterni_update.sh
```

**TO JE SVE!** Script će automatski:
1. ✅ Preuzeti nove izmene
2. ✅ Stopirati portal
3. ✅ Očistiti cache
4. ✅ Instalirati sa **npm** (ne bun)
5. ✅ Build-ovati
6. ✅ Pokrenuti portal
7. ✅ Proveriti status

---

## 📋 Ili Bez Scripta (Manuelno)

```bash
ssh user@your-server-ip

cd ~/webadminportal/web-admin

pm2 stop lafantana-whs-admin
pm2 delete lafantana-whs-admin

rm -rf .next node_modules/.cache bun.lock

npm install
npm run build

pm2 start "npm run start" --name lafantana-whs-admin
pm2 save
pm2 status
```

---

## ⚠️ VAŽNO: Zašto "Ažuriraj" Dugme Ne Radi?

"Ažuriraj" dugme poziva API koji pokušava da pokrene:
```bash
/usr/local/bin/bun install
```

Ali **bun nije instaliran** na serveru!

Izmene koje bi to popravile moraju da se **deploy-uju prvo**, što zahteva da **manuelno** ažurirate pre nego što dugme može da radi.

**Chicken-and-egg problem**: Ne možete da kliknete "Ažuriraj" da dobijete fix za "Ažuriraj" dugme! 🐔🥚

---

## 🎯 Rešenje Za Budućnost

**Nakon što pokrenete EKSTERNI_UPDATE.sh JEDNOM**, "Ažuriraj" dugme će raditi za buduće update-e jer će API biti ažuriran sa npm fallback-om.

---

## 📞 Brza Pomoć

Ako ni ovo ne radi, kopirajte ovu JEDNU liniju:

```bash
cd ~/webadminportal/web-admin && pm2 stop lafantana-whs-admin; pm2 delete lafantana-whs-admin; rm -rf .next node_modules/.cache bun.lock; npm install && npm run build && pm2 start "npm run start" --name lafantana-whs-admin && pm2 save && echo "✅ GOTOVO!"
```

Paste-ujte u terminal na serveru i pritisnite ENTER.

---

**Ključ**: Ne koristite web portal "Ažuriraj" dugme dok ne deploy-ujete fix direktno preko SSH-a! 🔑
