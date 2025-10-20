# Voucher Tracker - Frontend Guide

## 📁 Struktur yang Sudah Dibuat

### ✅ API Layer (`lib/`)
- `apiClient.ts` - Axios instance dengan base URL configuration
- `api.ts` - API functions untuk Voucher, Wallet, dan Statistics
- `utils.ts` - Helper functions (formatCurrency, formatDate, dll)

### ✅ Pages
- `app/dashboard/page.tsx` - Dashboard dengan statistik real-time
- `app/components/Navbar.tsx` - Navbar dengan waktu & tanggal
- `app/components/Sidebar.tsx` - Sidebar dengan menu navigasi

## 🔧 Setup yang Diperlukan

### 1. Install Dependencies (Sudah)
```bash
npm install axios react-toastify
```

### 2. Environment Variables
File `.env.local`:
```
NEXT_PUBLIC_API_URL=http://localhost:5000
```

## 📝 Cara Menjalankan Aplikasi

### 1. Jalankan Backend Server
```bash
cd server
npm install
npm run dev
```
Server akan berjalan di http://localhost:5000

### 2. Jalankan Frontend Next.js
```bash
cd nextjs
npm install
npm run dev
```
Frontend akan berjalan di http://localhost:3000

## 🎯 Halaman yang Perlu Dilengkapi

### 1. Voucher Page (`app/voucher/page.tsx`)
Fitur:
- ✅ CRUD Voucher (Create, Read, Update, Delete)
- ✅ Filter berdasarkan Operator dan Tanggal
- ✅ Form input dengan validasi
- ✅ Tabel dengan sorting
- ✅ Toast notifications

### 2. Wallet Page (`app/wallet/page.tsx`)
Fitur:
- ✅ CRUD E-Wallet
- ✅ Summary total saldo
- ✅ Form input
- ✅ Tabel data

### 3. Laporan Page (`app/laporan/page.tsx`)
Fitur:
- Statistik voucher per operator
- Statistik wallet summary
- Data harian (daily statistics)
- Export/print (bonus)

## 🚀 API Endpoints yang Tersedia

### Voucher API
```typescript
import { voucherApi } from '@/lib/api';

// Get all vouchers
const response = await voucherApi.getAll();

// Create voucher
await voucherApi.create({
  tanggal: '2025-10-14',
  operator: 'Telkomsel',
  jenis_paket: '2GB/1 Hari',
  stok_awal: 10,
  masuk: 5,
  keluar: 3,
  catatan: 'stok stabil'
});

// Update voucher
await voucherApi.update(id, { masuk: 10 });

// Delete voucher
await voucherApi.delete(id);

// Filter vouchers
await voucherApi.filter('Telkomsel', '2025-10-14');
```

### Wallet API
```typescript
import { walletApi } from '@/lib/api';

// Get all wallets
const response = await walletApi.getAll();

// Create wallet
await walletApi.create({
  tanggal: '2025-10-14',
  nama_wallet: 'DANA',
  saldo_awal: 500000,
  masuk: 200000,
  keluar: 100000
});

// Get summary
const summary = await walletApi.getSummary();
```

### Statistics API
```typescript
import { statisticsApi } from '@/lib/api';

// Dashboard overview
const dashboard = await statisticsApi.getDashboard();

// Voucher summary
const voucherSummary = await statisticsApi.getVoucherSummary();

// Wallet summary
const walletSummary = await statisticsApi.getWalletSummary();

// Daily statistics
const daily = await statisticsApi.getDaily('2025-10-14');
```

## 💡 Tips Development

### 1. Error Handling
```typescript
try {
  const response = await voucherApi.create(data);
  if (response.success) {
    toast.success('Berhasil!');
  }
} catch (error) {
  toast.error('Gagal menyimpan data');
  console.error(error);
}
```

### 2. Format Data
```typescript
import { formatCurrency, formatDate, formatNumber } from '@/lib/utils';

// Format currency
formatCurrency(500000); // Rp500.000

// Format date
formatDate('2025-10-14'); // 14 Oktober 2025

// Format number
formatNumber(1234); // 1.234
```

### 3. Loading State
```typescript
const [loading, setLoading] = useState(true);

const fetchData = async () => {
  setLoading(true);
  try {
    const data = await voucherApi.getAll();
    setVouchers(data);
  } finally {
    setLoading(false);
  }
};
```

## 🎨 Design Pattern

Semua halaman menggunakan layout yang sama:
```tsx
<div className="min-h-screen bg-gray-100 flex">
  <Sidebar />
  <div className="flex-1 flex flex-col min-h-screen" style={{ marginLeft: '14rem' }}>
    <Navbar />
    <main className="flex-1 px-6 pt-28 pb-8">
      {/* Content here */}
    </main>
  </div>
</div>
```

## ✅ Status Pengembangan

- [x] Backend API lengkap
- [x] API Client & Utilities
- [x] Dashboard Page
- [ ] Voucher Page (CRUD lengkap)
- [ ] Wallet Page (CRUD lengkap)
- [ ] Laporan/Statistics Page

## 📚 Referensi

- Backend API: `server/API_DOCUMENTATION.md`
- Database Schema: `prisma/schema.prisma`
- Prisma Client: Auto-generated types

---

**Next Steps:**
1. Lengkapi Voucher Page dengan CRUD
2. Lengkapi Wallet Page dengan CRUD  
3. Buat Laporan Page
4. Testing integrasi frontend-backend
5. Polish UI/UX

**Happy Coding! 🚀**
