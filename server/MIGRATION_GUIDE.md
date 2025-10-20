# Migration Guide - Sistem Transaksi Voucher & Wallet

## 🚀 Langkah-langkah Migrasi

### 1. Generate dan Jalankan Migration
```bash
cd server
npx prisma migrate dev --name add_transaction_system
npx prisma generate
```

### 2. Restart Backend Server
```bash
npm run dev
```

### 3. Test Endpoints Baru

## 📡 Endpoints Baru

### Master Voucher
- `GET /api/master-vouchers/master` - List semua produk voucher
- `GET /api/master-vouchers/master/:id` - Detail 1 produk
- `POST /api/master-vouchers/master` - Tambah produk baru
  ```json
  {
    "operator": "Telkomsel",
    "jenis_paket": "2GB/1 Hari",
    "stok_awal": 100
  }
  ```
- `PUT /api/master-vouchers/master/:id` - Update produk
- `DELETE /api/master-vouchers/master/:id` - Hapus produk

### Transaksi Voucher
- `GET /api/master-vouchers/transactions` - List transaksi (query: voucher_id, tipe, tanggal_dari, tanggal_sampai)
- `POST /api/master-vouchers/transactions` - Catat transaksi (masuk/keluar)
  ```json
  {
    "voucher_id": 1,
    "tipe": "masuk",
    "jumlah": 50,
    "keterangan": "Restock dari supplier",
    "tanggal": "2025-10-14"
  }
  ```
- `DELETE /api/master-vouchers/transactions/:id` - Hapus transaksi (otomatis kembalikan stok)

### Statistics Voucher
- `GET /api/master-vouchers/statistics` - Statistik total (query: tanggal_dari, tanggal_sampai)

### Master Wallet
- `GET /api/master-wallets/master` - List semua wallet
- `GET /api/master-wallets/master/:id` - Detail 1 wallet
- `POST /api/master-wallets/master` - Tambah wallet baru
  ```json
  {
    "nama_wallet": "DANA",
    "saldo_awal": 1000000
  }
  ```
- `PUT /api/master-wallets/master/:id` - Update wallet
- `DELETE /api/master-wallets/master/:id` - Hapus wallet

### Transaksi Wallet
- `GET /api/master-wallets/transactions` - List transaksi
- `POST /api/master-wallets/transactions` - Catat transaksi
  ```json
  {
    "wallet_id": 1,
    "tipe": "masuk",
    "jumlah": 500000,
    "keterangan": "Deposit awal",
    "tanggal": "2025-10-14"
  }
  ```
- `DELETE /api/master-wallets/transactions/:id` - Hapus transaksi

### Statistics Wallet
- `GET /api/master-wallets/statistics` - Statistik total

## 🔄 Perubahan Database

### Tabel Baru:
1. **MasterVoucher** - Produk voucher (operator, jenis_paket, stok_saat_ini)
2. **VoucherTransaction** - Transaksi masuk/keluar voucher
3. **MasterWallet** - Dompet digital (nama_wallet, saldo_saat_ini)
4. **WalletTransaction** - Transaksi masuk/keluar wallet

### Tabel Lama (Tetap Ada):
- VoucherHarian - Untuk backward compatibility
- SaldoWallet - Untuk backward compatibility

## 🎯 Cara Kerja Sistem Baru

### Voucher:
1. **Buat Produk** - Tambah master voucher (Telkomsel 2GB)
2. **Catat Transaksi Masuk** - Restock dari supplier (auto update stok)
3. **Catat Transaksi Keluar** - Penjualan voucher (auto kurangi stok)
4. **Validasi Otomatis** - Tidak bisa jual jika stok < jumlah

### Wallet:
1. **Buat Wallet** - Tambah wallet (DANA, OVO, dll)
2. **Catat Transaksi Masuk** - Deposit, pembayaran masuk
3. **Catat Transaksi Keluar** - Withdraw, pembelian
4. **Validasi Otomatis** - Tidak bisa keluar jika saldo < jumlah

## 📊 Keuntungan Sistem Baru

✅ **Detail Tracking** - Setiap transaksi tercatat dengan timestamp
✅ **History Lengkap** - Bisa lihat riwayat transaksi per produk
✅ **Validasi Otomatis** - Tidak bisa overselling atau overdraft
✅ **Hapus Transaksi** - Bisa rollback transaksi dengan aman
✅ **Statistik Real-time** - Data selalu akurat
✅ **Scalable** - Mudah ditambah fitur laporan

## 🧪 Testing

### Test Voucher Flow:
```bash
# 1. Buat produk
POST /api/master-vouchers/master
{"operator": "Telkomsel", "jenis_paket": "2GB", "stok_awal": 0}

# 2. Tambah stok
POST /api/master-vouchers/transactions
{"voucher_id": 1, "tipe": "masuk", "jumlah": 100, "keterangan": "Restock"}

# 3. Jual voucher
POST /api/master-vouchers/transactions
{"voucher_id": 1, "tipe": "keluar", "jumlah": 5, "keterangan": "Penjualan"}

# 4. Cek stok
GET /api/master-vouchers/master/1
# Harusnya stok_saat_ini = 95
```

## 🔜 Next Steps

1. ✅ Generate migration
2. ✅ Test endpoints di Postman/Thunder Client
3. ⏳ Update Frontend (lib/api.ts)
4. ⏳ Redesign UI untuk sistem transaksi
5. ⏳ Migrate data lama (optional)
