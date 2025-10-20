# 🎟️ Voucher Tracker - Backend Server

Backend API untuk aplikasi pencatatan harian stok voucher kuota dan saldo e-wallet toko. Dibangun dengan **Express.js + Prisma + PostgreSQL**, berjalan lokal (offline) tanpa autentikasi.

## 🚀 Fitur Utama

- ✅ CRUD Voucher Harian (Telkomsel, Indosat, XL, dll)
- ✅ CRUD Saldo E-Wallet (DANA, OVO, GoPay, dll)
- ✅ Perhitungan otomatis sisa stok/saldo
- ✅ Filter data berdasarkan operator dan tanggal
- ✅ Statistik dan laporan harian
- ✅ Dashboard overview
- ✅ Offline-first (database lokal)

## 📦 Tech Stack

- **Node.js** v18+
- **Express.js** - Web framework
- **Prisma** - ORM
- **PostgreSQL** - Database

## 🛠️ Setup & Installation

### 1. Install Dependencies

```bash
cd server
npm install
```

### 2. Setup Database

Pastikan PostgreSQL sudah terinstall dan berjalan.

**Buat database baru:**
```sql
CREATE DATABASE voucher_tracker;
```

### 3. Setup Environment Variables

Copy file `.env.example` menjadi `.env`:
```bash
copy .env.example .env
```

Edit `.env` dan sesuaikan dengan konfigurasi PostgreSQL Anda:
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/voucher_tracker"
PORT=5000
```

### 4. Generate Prisma Client & Run Migration

```bash
# Generate Prisma Client
npm run prisma:generate

# Jalankan migration (buat tabel di database)
npm run prisma:migrate
```

### 5. Run Server

**Development mode (dengan auto-reload):**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

Server akan berjalan di: **http://localhost:5000**

## 📚 API Documentation

Lihat dokumentasi lengkap di: [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)

### Quick Reference

#### Voucher Endpoints
- `GET /api/vouchers` - Ambil semua voucher
- `GET /api/vouchers/:id` - Detail voucher
- `POST /api/vouchers` - Tambah voucher
- `PUT /api/vouchers/:id` - Update voucher
- `DELETE /api/vouchers/:id` - Hapus voucher
- `GET /api/vouchers/filter?operator=Telkomsel&date=2025-10-14` - Filter

#### Wallet Endpoints
- `GET /api/wallets` - Ambil semua wallet
- `GET /api/wallets/:id` - Detail wallet
- `POST /api/wallets` - Tambah wallet
- `PUT /api/wallets/:id` - Update wallet
- `DELETE /api/wallets/:id` - Hapus wallet
- `GET /api/wallets/summary` - Rekap total saldo

#### Statistics Endpoints
- `GET /api/statistics/voucher-summary` - Ringkasan voucher per operator
- `GET /api/statistics/wallet-summary` - Ringkasan total saldo
- `GET /api/statistics/daily?date=2025-10-14` - Data gabungan harian
- `GET /api/statistics/dashboard` - Dashboard overview

## 🧪 Testing API

### Menggunakan cURL

**Tambah Voucher:**
```bash
curl -X POST http://localhost:5000/api/vouchers -H "Content-Type: application/json" -d "{\"tanggal\":\"2025-10-14\",\"operator\":\"Telkomsel\",\"jenis_paket\":\"2GB/1 Hari\",\"stok_awal\":10,\"masuk\":5,\"keluar\":3,\"catatan\":\"stok stabil\"}"
```

**Ambil Semua Voucher:**
```bash
curl http://localhost:5000/api/vouchers
```

**Dashboard Statistics:**
```bash
curl http://localhost:5000/api/statistics/dashboard
```

### Menggunakan Postman / Thunder Client

1. Import collection atau buat request manual
2. Base URL: `http://localhost:5000`
3. Gunakan endpoint sesuai dokumentasi

## 📊 Database Schema

### VoucherHarian
```prisma
model VoucherHarian {
  id          Int      @id @default(autoincrement())
  tanggal     DateTime
  operator    String
  jenis_paket String
  stok_awal   Int
  masuk       Int
  keluar      Int
  sisa        Int      // Auto calculated: stok_awal + masuk - keluar
  catatan     String?
}
```

### SaldoWallet
```prisma
model SaldoWallet {
  id           Int      @id @default(autoincrement())
  tanggal      DateTime
  nama_wallet  String
  saldo_awal   Float
  masuk        Float
  keluar       Float
  sisa         Float    // Auto calculated: saldo_awal + masuk - keluar
}
```

## 🔧 Prisma Commands

```bash
# Generate Prisma Client
npm run prisma:generate

# Create migration
npm run prisma:migrate

# Open Prisma Studio (GUI untuk database)
npm run prisma:studio

# Reset database
npx prisma migrate reset
```

## 🗂️ Project Structure

```
server/
├── controllers/
│   ├── voucherController.js      # Logic CRUD voucher
│   ├── walletController.js       # Logic CRUD wallet
│   └── statisticsController.js   # Logic statistik & laporan
├── routes/
│   ├── voucherRoutes.js          # Router voucher
│   ├── walletRoutes.js           # Router wallet
│   └── statisticsRoutes.js       # Router statistik
├── middleware/                   # (untuk future use)
├── prisma/
│   └── schema.prisma             # Database schema
├── .env                          # Environment variables (gitignore)
├── .env.example                  # Template env
├── server.js                     # Entry point
├── package.json
├── API_DOCUMENTATION.md          # Dokumentasi API lengkap
└── README.md                     # File ini
```

## 🎯 Contoh Penggunaan

### 1. Tambah Voucher Telkomsel

```javascript
// POST /api/vouchers
{
  "tanggal": "2025-10-14",
  "operator": "Telkomsel",
  "jenis_paket": "2GB/1 Hari",
  "stok_awal": 10,
  "masuk": 5,
  "keluar": 3,
  "catatan": "stok stabil"
}
// Sisa akan otomatis dihitung: 10 + 5 - 3 = 12
```

### 2. Tambah Saldo DANA

```javascript
// POST /api/wallets
{
  "tanggal": "2025-10-14",
  "nama_wallet": "DANA",
  "saldo_awal": 500000,
  "masuk": 200000,
  "keluar": 100000
}
// Sisa akan otomatis dihitung: 500000 + 200000 - 100000 = 600000
```

### 3. Lihat Statistik Harian

```bash
GET /api/statistics/daily?date=2025-10-14
```

## 🐛 Troubleshooting

### Error: "Can't reach database server"
- Pastikan PostgreSQL berjalan
- Cek koneksi database di `.env`
- Verifikasi username, password, dan port

### Error: "Unknown argument: `--name`"
- Gunakan: `npx prisma migrate dev --name init` (dengan spasi)

### Port sudah digunakan
- Ubah PORT di `.env` atau matikan aplikasi yang menggunakan port 5000

## 📝 Notes

- ✅ Aplikasi berjalan **offline** tanpa koneksi internet
- ✅ Tidak ada sistem autentikasi (untuk penggunaan lokal)
- ✅ Database disimpan di PostgreSQL lokal
- ✅ Semua perhitungan otomatis dilakukan di backend

## 📄 License

ISC

---

**Happy Coding! 🚀**
