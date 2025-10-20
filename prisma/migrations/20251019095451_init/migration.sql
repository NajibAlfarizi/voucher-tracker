-- CreateTable
CREATE TABLE "MasterVoucher" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "operator" TEXT NOT NULL,
    "jenis_paket" TEXT NOT NULL,
    "stok_saat_ini" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "VoucherTransaction" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "voucher_id" INTEGER NOT NULL,
    "tanggal" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tipe" TEXT NOT NULL,
    "jumlah" INTEGER NOT NULL,
    "keterangan" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "VoucherTransaction_voucher_id_fkey" FOREIGN KEY ("voucher_id") REFERENCES "MasterVoucher" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "VoucherDailyStock" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "voucher_id" INTEGER NOT NULL,
    "tanggal" DATETIME NOT NULL,
    "sisa" INTEGER NOT NULL,
    "terjual" INTEGER NOT NULL,
    "stok_awal" INTEGER NOT NULL,
    "masuk" INTEGER NOT NULL,
    "catatan" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "VoucherDailyStock_voucher_id_fkey" FOREIGN KEY ("voucher_id") REFERENCES "MasterVoucher" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MasterWallet" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nama_wallet" TEXT NOT NULL,
    "saldo_saat_ini" REAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "WalletTransaction" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "wallet_id" INTEGER NOT NULL,
    "tanggal" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tipe" TEXT NOT NULL,
    "jumlah" REAL NOT NULL,
    "keterangan" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "WalletTransaction_wallet_id_fkey" FOREIGN KEY ("wallet_id") REFERENCES "MasterWallet" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Operator" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nama" TEXT NOT NULL,
    "kode" TEXT NOT NULL,
    "aktif" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "WalletType" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nama" TEXT NOT NULL,
    "nomor_hp" TEXT,
    "aktif" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "SaldoWallet" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "tanggal" DATETIME NOT NULL,
    "nama_wallet" TEXT NOT NULL,
    "saldo_awal" REAL NOT NULL,
    "masuk" REAL NOT NULL,
    "keluar" REAL NOT NULL,
    "sisa" REAL NOT NULL
);

-- CreateTable
CREATE TABLE "WalletDailyStock" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "wallet_id" INTEGER NOT NULL,
    "tanggal" DATETIME NOT NULL,
    "saldo_awal" REAL NOT NULL,
    "masuk" REAL NOT NULL,
    "keluar" REAL NOT NULL,
    "sisa" REAL NOT NULL,
    "catatan" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "WalletDailyStock_wallet_id_fkey" FOREIGN KEY ("wallet_id") REFERENCES "MasterWallet" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "MasterVoucher_operator_jenis_paket_key" ON "MasterVoucher"("operator", "jenis_paket");

-- CreateIndex
CREATE UNIQUE INDEX "VoucherDailyStock_voucher_id_tanggal_key" ON "VoucherDailyStock"("voucher_id", "tanggal");

-- CreateIndex
CREATE UNIQUE INDEX "MasterWallet_nama_wallet_key" ON "MasterWallet"("nama_wallet");

-- CreateIndex
CREATE UNIQUE INDEX "Operator_nama_key" ON "Operator"("nama");

-- CreateIndex
CREATE UNIQUE INDEX "Operator_kode_key" ON "Operator"("kode");

-- CreateIndex
CREATE UNIQUE INDEX "WalletType_nama_key" ON "WalletType"("nama");

-- CreateIndex
CREATE UNIQUE INDEX "WalletDailyStock_wallet_id_tanggal_key" ON "WalletDailyStock"("wallet_id", "tanggal");
