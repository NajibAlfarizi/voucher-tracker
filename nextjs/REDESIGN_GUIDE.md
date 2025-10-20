# Voucher & Wallet Redesign Guide

## 🎯 Konsep Sistem Transaksi Baru

### Halaman Voucher
1. **Tab 1: Master Produk** - CRUD produk voucher (operator, jenis_paket)
2. **Tab 2: Transaksi** - Catat transaksi masuk/keluar per produk
3. **Tab 3: History** - Riwayat semua transaksi

### Halaman Wallet
1. **Tab 1: Master Wallet** - CRUD wallet (DANA, OVO, dll)
2. **Tab 2: Transaksi** - Catat transaksi masuk/keluar per wallet
3. **Tab 3: History** - Riwayat semua transaksi

## 📱 UI Components

### Master Produk/Wallet (Card Grid)
```
+----------------+  +----------------+  +----------------+
| Telkomsel 2GB  |  | Telkomsel 5GB  |  | Indosat 2GB   |
| Stok: 95       |  | Stok: 45       |  | Stok: 0       |
| [Tambah]       |  | [Tambah]       |  | [Tambah]      |
| [Jual] [Edit]  |  | [Jual] [Edit]  |  | [Jual] [Edit] |
+----------------+  +----------------+  +----------------+
```

### Form Transaksi (Modal/Drawer)
```
Tambah Stok Voucher Telkomsel 2GB
┌─────────────────────────────┐
│ Tipe: [Masuk ▼]             │
│ Jumlah: [___]               │
│ Tanggal: [2025-10-14]       │
│ Keterangan: [___]           │
│ [Simpan] [Batal]            │
└─────────────────────────────┘
```

### History Table
```
Tanggal       | Produk          | Tipe   | Jumlah | Keterangan
────────────────────────────────────────────────────────────────
14 Okt 10:30  | Telkomsel 2GB   | Masuk  | +50    | Restock
14 Okt 11:15  | Telkomsel 2GB   | Keluar | -5     | Penjualan
```

## 🔄 User Flow

### Flow Tambah Produk Baru
1. Klik "Tambah Produk Voucher"
2. Isi form: Operator, Jenis Paket, Stok Awal
3. Simpan → Produk muncul di grid

### Flow Transaksi Masuk (Restock)
1. Di card produk, klik "Tambah"
2. Modal muncul dengan tipe "Masuk"
3. Isi jumlah + keterangan
4. Simpan → Stok otomatis bertambah

### Flow Transaksi Keluar (Jual)
1. Di card produk, klik "Jual"
2. Modal muncul dengan tipe "Keluar"
3. Isi jumlah + keterangan
4. Validasi stok cukup
5. Simpan → Stok otomatis berkurang

## ✨ Features
- ✅ Real-time stock update
- ✅ Validasi stok tidak boleh minus
- ✅ History transaksi per produk
- ✅ Filter by date range
- ✅ Delete transaction (rollback)
- ✅ Statistics & reports

## 📂 Files to Update
1. `nextjs/app/voucher/page.tsx` - Complete redesign
2. `nextjs/app/wallet/page.tsx` - Complete redesign
3. `nextjs/lib/api.ts` - ✅ Already updated
4. `nextjs/lib/utils.ts` - ✅ Already updated
