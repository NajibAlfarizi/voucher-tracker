# Voucher Tracker - Deployment Guide

## 📋 Panduan Instalasi di PC Kasir

### Persyaratan Sistem
- **Node.js** versi 18 atau lebih baru
- **npm** (sudah termasuk dengan Node.js)
- **PostgreSQL** (opsional, bisa pakai SQLite)

### 1. Download dan Install Node.js
1. Download Node.js dari: https://nodejs.org/
2. Pilih versi **LTS (Long Term Support)**
3. Install dengan setting default

### 2. Copy Project ke PC Kasir
1. Copy seluruh folder `voucher-tracker` ke PC kasir
2. Letakkan di folder yang mudah diakses, misalnya:
   ```
   C:\Apps\voucher-tracker\
   ```

### 3. Install Dependencies
Buka **Command Prompt** atau **PowerShell** di folder project, lalu jalankan:
```bash
npm install
```

### 4. Setup Database
#### Opsi A: SQLite (Recommended - Lebih Mudah)
1. Edit file `.env`:
   ```
   DATABASE_URL="file:./dev.db"
   ```

#### Opsi B: PostgreSQL
1. Install PostgreSQL
2. Edit file `.env`:
   ```
   DATABASE_URL="postgresql://username:password@localhost:5432/voucher_tracker"
   ```

### 5. Setup Database Schema
```bash
cd server
npx prisma migrate dev
```

### 6. Jalankan Aplikasi
```bash
npm run dev
```

Aplikasi akan jalan di:
- **Backend**: http://localhost:5000
- **Frontend**: http://localhost:3000

### 7. Akses Aplikasi
Buka browser dan pergi ke: **http://localhost:3000**

---

## 🚀 Mode Production (Opsional)

Untuk performa lebih baik di production:

### 1. Build Frontend
```bash
npm run build
```

### 2. Jalankan Production Mode
```bash
npm run start
```

---

## 🔧 Troubleshooting

### Port Sudah Digunakan
Jika port 3000 atau 5000 sudah digunakan, edit file:
- **Frontend**: `nextjs/package.json` - ubah port di script dev
- **Backend**: `server/server.js` - ubah PORT

### Database Connection Error
- Pastikan PostgreSQL berjalan (jika pakai PostgreSQL)
- Cek file `.env` - pastikan DATABASE_URL benar
- Untuk SQLite, pastikan folder memiliki permission write

### Dependencies Error
```bash
npm install --legacy-peer-deps
```

---

## 📱 Akses dari PC Lain

Untuk akses dari PC lain di jaringan yang sama:

### 1. Cari IP Address PC Server
```bash
ipconfig
```

### 2. Edit Backend untuk Allow External Access
Di file `server/server.js`, ubah:
```javascript
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
});
```

### 3. Akses dari PC Lain
Buka browser di PC lain dan pergi ke:
```
http://[IP_ADDRESS_SERVER]:3000
```
Contoh: `http://192.168.1.100:3000`

---

## 📋 Checklist Setup

- [ ] Node.js terinstall
- [ ] Project di-copy ke PC kasir
- [ ] `npm install` berhasil
- [ ] Database setup selesai
- [ ] `npm run dev` berjalan tanpa error
- [ ] Aplikasi bisa diakses di browser
- [ ] Data bisa disimpan dan ditampilkan

---

## 💡 Tips
1. **Shortcut Desktop**: Buat file `.bat` berisi:
   ```batch
   @echo off
   cd /d "C:\Apps\voucher-tracker"
   npm run dev
   pause
   ```

2. **Auto Start**: Tambahkan shortcut ke Startup folder Windows

3. **Backup Database**: 
   - SQLite: Copy file `dev.db`
   - PostgreSQL: `pg_dump voucher_tracker > backup.sql`

---

**Voucher Tracker v1.0.0**  
*by Alfabyte 2025*