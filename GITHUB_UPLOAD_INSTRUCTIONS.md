# GitHub Upload Instructions

## Opcija 1: Upload preko GitHub Web Interface (najjednostavnije)

1. Idi na: https://github.com/igivlahovic-srb/webadminportal
2. Klikni "Add file" → "Upload files"
3. Prevuci sve fajlove iz `web-admin/` foldera
4. Dodaj commit message: "Add complete web admin installation package"
5. Klikni "Commit changes"

## Opcija 2: Git Push sa lokalnog računara

```bash
# Preuzmi web-admin-github.tar.gz sa Vibecode sistema
# Lokacija: /home/user/workspace/web-admin-github.tar.gz

# Na svom računaru:
cd ~/Downloads  # ili gde si download-ovao
tar -xzf web-admin-github.tar.gz

# Inicijalizuj Git
cd web-admin
git init
git add .
git commit -m "Add complete web admin installation package"

# Dodaj remote i push
git remote add origin https://github.com/igivlahovic-srb/webadminportal.git
git branch -M main
git push -u origin main
```

Uneseće te GitHub username i password (ili personal access token).

## Opcija 3: Na Ubuntu serveru direktno

```bash
# Na serveru (root@lftaserver-appserver)
cd /root/webadminportal

# Kreiraj sve fajlove ručno ili kopiraj iz Vibecode
# Zatim:
git init
git add .
git commit -m "Initial commit with web admin installation package"
git branch -M main
git remote add origin https://github.com/igivlahovic-srb/webadminportal.git
git push -u origin main
```

Biće potreban GitHub username i personal access token.

---

## Kreiranje GitHub Personal Access Token

1. Idi na: https://github.com/settings/tokens
2. Klikni "Generate new token" → "Generate new token (classic)"
3. Ime: `webadminportal-upload`
4. Scope: Označi `repo` (full control)
5. Klikni "Generate token"
6. Kopiraj token (videćeš ga samo jednom!)
7. Koristi ga kao password pri git push

---

## Fajlovi koji treba da budu na GitHub-u:

```
webadminportal/
├── web-admin/
│   ├── UBUNTU_INSTALL.md
│   ├── install-ubuntu.sh
│   ├── QUICK_START.md
│   ├── INSTALL_CHECKLIST.md
│   ├── SYSTEMD_SERVICE.md
│   ├── DOCUMENTATION_INDEX.md
│   ├── START_HERE.md
│   ├── FILES_OVERVIEW.md
│   ├── INSTALLATION_SUMMARY.md
│   ├── QUICK_REFERENCE.txt
│   ├── test-deployment.sh
│   ├── diagnose.sh
│   ├── diagnose.bat
│   ├── README.md
│   ├── package.json
│   ├── next.config.js
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   ├── postcss.config.js
│   ├── app/ (Next.js app directory)
│   ├── lib/ (helper functions)
│   └── types/ (TypeScript types)
├── README.md
└── CLAUDE.md
```

---

## Nakon upload-a na GitHub:

Na Ubuntu serveru (192.168.60.209):

```bash
cd ~
git clone https://github.com/igivlahovic-srb/webadminportal.git
cd webadminportal/web-admin
chmod +x install-ubuntu.sh
./install-ubuntu.sh
```

---

Arhiva: `/home/user/workspace/web-admin-github.tar.gz` (66KB)
