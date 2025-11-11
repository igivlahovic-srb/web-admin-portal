# Login Logo Generator - Uputstvo

## 🎯 Cilj
Generator kreira logo sa **belim slovima** na **transparentnoj pozadini** za login ekran.

## 🚀 Kako koristiti

### Brzi Način (Trenutno Rešenje)
Login ekran sada koristi **direktan text prikaz** umesto slike:
- Bez pozadine (transparentno)
- Bela slova (#FFFFFF)
- Veći fontovi (text-5xl i text-4xl)
- Perfektna vidljivost na plavom gradijent pozadini

**Ne treba ništa dodatno!** Logo je već implementiran u `LoginScreen.tsx`.

### Alternativni Način (PNG Logo)
Ako želite da koristite PNG sliku umesto text-a:

1. Otvorite `generate-login-logo.html` u web browser-u
2. Kliknite "Preuzmi Login Logo (256x256)"
3. Sačuvajte kao `logo-white.png` u `/assets/` folder
4. U `LoginScreen.tsx`, zamenite text sa:
   ```tsx
   <Image
     source={require("../../assets/logo-white.png")}
     style={{ width: 256, height: 256 }}
     resizeMode="contain"
   />
   ```

## 📝 Logo Specifikacije

### Text Verzija (Trenutno)
- **LA FANTANA**: text-5xl (60px), bold, bela (#FFFFFF)
- **WHS**: text-4xl (48px), bold, bela (#FFFFFF)
- **SERVISNI MODUL**: text-lg (18px), light blue (#E0E0E0)

### PNG Verzija (Opciono)
- **Veličina**: 256x256px ili 512x512px
- **Format**: PNG sa alpha transparency
- **Boja teksta**: Bela (#FFFFFF)
- **Pozadina**: Transparentna

## ✅ Šta je urađeno

1. ✅ Uklonjen beli kvadrat oko logoa
2. ✅ Uklonjeni shadow efekti
3. ✅ Uvećan logo (sa 32px na 60px za glavni text)
4. ✅ Postavljena bela boja teksta
5. ✅ Kreiran generator za PNG verziju (ako je potrebna)

## 🔍 Fajlovi

- `src/screens/LoginScreen.tsx` - Glavni login ekran (AŽURIRAN)
- `generate-login-logo.html` - HTML generator za PNG logo (OPCIONO)
- `assets/logo-white.svg` - SVG verzija logoa (KREIRAN)
- `README.md` - Dokumentacija (AŽURIRAN)

---

**Napomena**: Trenutna text verzija je preporučena jer:
- Bolja čitljivost na svim ekranima
- Nema dodatnih asset fajlova
- Lako se menja i stilizuje
- Perfektno se skalira na svim uređajima
