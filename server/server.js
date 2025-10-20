import express from "express";
import cors from "cors";
import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";

// Import routes
import voucherRoutes from './routes/voucherRoutes.js';
import walletRoutes from './routes/walletRoutes.js';
import statisticsRoutes from './routes/statisticsRoutes.js';
import masterVoucherRoutes from './routes/masterVoucherRoutes.js';
import masterWalletRoutes from './routes/masterWalletRoutes.js';
import operatorRoutes from './routes/operatorRoutes.js';
import walletTypeRoutes from './routes/walletTypeRoutes.js';
import voucherDailyStockRoutes from './routes/voucherDailyStockRoutes.js';
import walletDailyStockRoutes from './routes/walletDailyStockRoutes.js';

dotenv.config();

// Set timezone to Asia/Jakarta (WIB)
process.env.TZ = 'Asia/Jakarta';

const app = express();
const prisma = new PrismaClient();

// Middleware
app.use(cors());
app.use(express.json());

// Logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Health check endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Voucher Tracker API v1.0',
    timestamp: new Date().toISOString(),
    endpoints: {
      vouchers: '/api/vouchers',
      wallets: '/api/wallets',
      statistics: '/api/statistics'
    }
  });
});

// API Routes
app.use('/api/vouchers', voucherRoutes);
app.use('/api/voucher-daily', voucherDailyStockRoutes);
app.use('/api/wallet-daily', walletDailyStockRoutes);
app.use('/api/wallets', walletRoutes);
app.use('/api/statistics', statisticsRoutes);
app.use('/api/master-vouchers', masterVoucherRoutes);
app.use('/api/master-wallets', masterWalletRoutes);
app.use('/api/operators', operatorRoutes);
app.use('/api/wallet-types', walletTypeRoutes);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint tidak ditemukan',
    path: req.url
  });
});

// Error Handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    message: 'Terjadi kesalahan server',
    error: err.message
  });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n🚀 Server berjalan di http://localhost:${PORT}`);
  console.log(`📊 API Documentation:`);
  console.log(`   - Vouchers: http://localhost:${PORT}/api/vouchers`);
  console.log(`   - Wallets: http://localhost:${PORT}/api/wallets`);
  console.log(`   - Statistics: http://localhost:${PORT}/api/statistics\n`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n⚠️  Menutup server...');
  await prisma.$disconnect();
  process.exit(0);
});
