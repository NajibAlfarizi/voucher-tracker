# Voucher Tracker API Documentation

## 📦 Base URL
```
http://localhost:5000
```

## 🪙 A. Voucher Management

### Base Route: `/api/vouchers`

#### 1. GET /api/vouchers
Ambil semua data voucher harian

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "tanggal": "2025-10-14T00:00:00Z",
      "operator": "Telkomsel",
      "jenis_paket": "2GB/1 Hari",
      "stok_awal": 10,
      "masuk": 5,
      "keluar": 3,
      "sisa": 12,
      "catatan": "stok stabil"
    }
  ],
  "total": 1
}
```

#### 2. GET /api/vouchers/:id
Ambil detail 1 voucher

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "tanggal": "2025-10-14T00:00:00Z",
    "operator": "Telkomsel",
    "jenis_paket": "2GB/1 Hari",
    "stok_awal": 10,
    "masuk": 5,
    "keluar": 3,
    "sisa": 12,
    "catatan": "stok stabil"
  }
}
```

#### 3. POST /api/vouchers
Tambah voucher baru (otomatis hitung sisa = stok_awal + masuk - keluar)

**Request Body:**
```json
{
  "tanggal": "2025-10-14",
  "operator": "Telkomsel",
  "jenis_paket": "2GB/1 Hari",
  "stok_awal": 10,
  "masuk": 5,
  "keluar": 3,
  "catatan": "stok stabil"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Voucher berhasil ditambahkan",
  "data": { ... }
}
```

#### 4. PUT /api/vouchers/:id
Update data voucher

**Request Body:**
```json
{
  "stok_awal": 15,
  "masuk": 10,
  "keluar": 5
}
```

#### 5. DELETE /api/vouchers/:id
Hapus data voucher

**Response:**
```json
{
  "success": true,
  "message": "Voucher berhasil dihapus",
  "data": { ... }
}
```

#### 6. GET /api/vouchers/filter
Filter berdasarkan operator dan tanggal

**Query Params:**
- `operator` (optional): Nama operator (Telkomsel, Indosat, XL, dll)
- `date` (optional): Tanggal dalam format YYYY-MM-DD

**Example:**
```
GET /api/vouchers/filter?operator=Telkomsel&date=2025-10-14
```

**Response:**
```json
{
  "success": true,
  "data": [ ... ],
  "total": 5,
  "filter": {
    "operator": "Telkomsel",
    "date": "2025-10-14"
  }
}
```

---

## 💰 B. Wallet Management

### Base Route: `/api/wallets`

#### 1. GET /api/wallets
Ambil semua saldo e-wallet

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 2,
      "tanggal": "2025-10-14T00:00:00Z",
      "nama_wallet": "DANA",
      "saldo_awal": 500000,
      "masuk": 200000,
      "keluar": 100000,
      "sisa": 600000
    }
  ],
  "total": 1
}
```

#### 2. GET /api/wallets/:id
Ambil detail e-wallet tertentu

#### 3. POST /api/wallets
Tambah catatan saldo baru (otomatis hitung sisa = saldo_awal + masuk - keluar)

**Request Body:**
```json
{
  "tanggal": "2025-10-14",
  "nama_wallet": "DANA",
  "saldo_awal": 500000,
  "masuk": 200000,
  "keluar": 100000
}
```

#### 4. PUT /api/wallets/:id
Update saldo

#### 5. DELETE /api/wallets/:id
Hapus data saldo

#### 6. GET /api/wallets/summary
Rekap total saldo seluruh wallet

**Response:**
```json
{
  "success": true,
  "summary": {
    "total_wallet": 3,
    "total_saldo": 3500000,
    "total_masuk": 500000,
    "total_keluar": 200000
  },
  "wallets": [ ... ]
}
```

---

## 📊 C. Laporan dan Statistik

### Base Route: `/api/statistics`

#### 1. GET /api/statistics/voucher-summary
Ringkasan stok voucher per operator

**Response:**
```json
{
  "success": true,
  "data": {
    "summary_per_operator": [
      {
        "operator": "Telkomsel",
        "jenis_paket": "2GB/1 Hari",
        "total_stok_awal": 100,
        "total_masuk": 50,
        "total_keluar": 45,
        "total_sisa": 105,
        "jumlah_transaksi": 10
      }
    ],
    "total_summary": {
      "total_stok_awal": 500,
      "total_masuk": 200,
      "total_keluar": 180,
      "total_sisa": 520,
      "total_transaksi": 50
    }
  }
}
```

#### 2. GET /api/statistics/wallet-summary
Ringkasan total saldo semua e-wallet

**Response:**
```json
{
  "success": true,
  "data": {
    "total_wallet": 3,
    "total_saldo": 3500000,
    "total_masuk": 500000,
    "total_keluar": 200000,
    "wallets": [ ... ]
  }
}
```

#### 3. GET /api/statistics/daily
Data gabungan voucher & wallet per tanggal

**Query Params:**
- `date` (optional): Format YYYY-MM-DD (default: hari ini)

**Example:**
```
GET /api/statistics/daily?date=2025-10-14
```

**Response:**
```json
{
  "success": true,
  "date": "2025-10-14",
  "data": {
    "voucher": {
      "total_transaksi": 45,
      "total_voucher_masuk": 60,
      "total_voucher_terjual": 45,
      "total_voucher_sisa": 120
    },
    "wallet": {
      "total_transaksi": 12,
      "total_masuk": 500000,
      "total_keluar": 200000,
      "total_sisa": 3500000
    },
    "summary": {
      "total_transaksi_voucher": 45,
      "total_transaksi_wallet": 12,
      "total_voucher_terjual": 45,
      "total_voucher_masuk": 60,
      "total_wallet_sisa": 3500000
    }
  }
}
```

#### 4. GET /api/statistics/dashboard
Dashboard overview (bonus)

**Response:**
```json
{
  "success": true,
  "data": {
    "total_vouchers": 150,
    "total_voucher_sisa": 520,
    "total_voucher_terjual": 180,
    "total_wallet_saldo": 3500000,
    "transaksi_hari_ini": {
      "voucher": 45,
      "wallet": 12
    }
  }
}
```

---

## 🔧 Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "message": "Tanggal, operator, dan jenis paket wajib diisi"
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Voucher tidak ditemukan"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Gagal mengambil data voucher",
  "error": "Error message detail"
}
```

---

## 🚀 Testing dengan cURL

### Create Voucher
```bash
curl -X POST http://localhost:5000/api/vouchers \
  -H "Content-Type: application/json" \
  -d '{
    "tanggal": "2025-10-14",
    "operator": "Telkomsel",
    "jenis_paket": "2GB/1 Hari",
    "stok_awal": 10,
    "masuk": 5,
    "keluar": 3,
    "catatan": "stok stabil"
  }'
```

### Get All Vouchers
```bash
curl http://localhost:5000/api/vouchers
```

### Filter Vouchers
```bash
curl "http://localhost:5000/api/vouchers/filter?operator=Telkomsel&date=2025-10-14"
```

### Get Daily Statistics
```bash
curl "http://localhost:5000/api/statistics/daily?date=2025-10-14"
```
