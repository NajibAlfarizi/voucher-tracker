import apiClient from './apiClient';

// ==================== VOUCHER API ====================

export interface Voucher {
  id: number;
  tanggal: string;
  operator: string;
  jenis_paket: string;
  stok_awal: number;
  masuk: number;
  keluar: number;
  sisa: number;
  catatan?: string;
}

export interface VoucherInput {
  tanggal: string;
  operator: string;
  jenis_paket: string;
  stok_awal: number;
  masuk: number;
  keluar: number;
  catatan?: string;
}

export const voucherApi = {
  getAll: async () => {
    const response = await apiClient.get('/api/vouchers');
    return response.data;
  },

  getById: async (id: number) => {
    const response = await apiClient.get(`/api/vouchers/${id}`);
    return response.data;
  },

  create: async (data: VoucherInput) => {
    const response = await apiClient.post('/api/vouchers', data);
    return response.data;
  },

  update: async (id: number, data: Partial<VoucherInput>) => {
    const response = await apiClient.put(`/api/vouchers/${id}`, data);
    return response.data;
  },

  delete: async (id: number) => {
    const response = await apiClient.delete(`/api/vouchers/${id}`);
    return response.data;
  },

  filter: async (operator?: string, date?: string) => {
    const params = new URLSearchParams();
    if (operator) params.append('operator', operator);
    if (date) params.append('date', date);
    const response = await apiClient.get(`/api/vouchers/filter?${params.toString()}`);
    return response.data;
  },
};

// ==================== WALLET API ====================

export interface Wallet {
  id: number;
  tanggal: string;
  nama_wallet: string;
  saldo_awal: number;
  masuk: number;
  keluar: number;
  sisa: number;
}

export interface WalletInput {
  tanggal: string;
  nama_wallet: string;
  saldo_awal: number;
  masuk: number;
  keluar: number;
}

export const walletApi = {
  getAll: async () => {
    const response = await apiClient.get('/api/wallets');
    return response.data;
  },

  getById: async (id: number) => {
    const response = await apiClient.get(`/api/wallets/${id}`);
    return response.data;
  },

  create: async (data: WalletInput) => {
    const response = await apiClient.post('/api/wallets', data);
    return response.data;
  },

  update: async (id: number, data: Partial<WalletInput>) => {
    const response = await apiClient.put(`/api/wallets/${id}`, data);
    return response.data;
  },

  delete: async (id: number) => {
    const response = await apiClient.delete(`/api/wallets/${id}`);
    return response.data;
  },

  getSummary: async () => {
    const response = await apiClient.get('/api/wallets/summary');
    return response.data;
  },
};

// ==================== MASTER VOUCHER API (NEW SYSTEM) ====================

export interface MasterVoucher {
  id: number;
  operator: string;
  jenis_paket: string;
  stok_saat_ini: number;
  createdAt: string;
  updatedAt: string;
  _count?: {
    transaksi: number;
  };
}

export interface MasterVoucherInput {
  operator: string;
  jenis_paket: string;
  stok_awal?: number;
  // allow updating current stock as well when needed
  stok_saat_ini?: number;
}

export interface VoucherTransactionType {
  id: number;
  voucher_id: number;
  tanggal: string;
  tipe: 'masuk' | 'keluar';
  jumlah: number;
  keterangan?: string;
  createdAt: string;
  voucher?: MasterVoucher;
}

export interface VoucherTransactionInput {
  voucher_id: number;
  tipe: 'masuk' | 'keluar';
  jumlah: number;
  keterangan?: string;
  tanggal?: string;
}

export const masterVoucherApi = {
  // Master Voucher CRUD
  getAll: async () => {
    const response = await apiClient.get('/api/master-vouchers/master');
    // Backend returns { success: true, data: [...] }
    return response.data.data || response.data;
  },

  getById: async (id: number) => {
    const response = await apiClient.get(`/api/master-vouchers/master/${id}`);
    return response.data;
  },

  create: async (data: MasterVoucherInput) => {
    const response = await apiClient.post('/api/master-vouchers/master', data);
    return response.data;
  },

  update: async (id: number, data: Partial<MasterVoucherInput>) => {
    const response = await apiClient.put(`/api/master-vouchers/master/${id}`, data);
    return response.data;
  },

  delete: async (id: number) => {
    const response = await apiClient.delete(`/api/master-vouchers/master/${id}`);
    return response.data;
  },

  // Transactions
  getTransactions: async (params?: { voucher_id?: number; tipe?: string; tanggal_dari?: string; tanggal_sampai?: string; scope?: string }) => {
    const query = new URLSearchParams();
    if (params?.voucher_id) query.append('voucher_id', params.voucher_id.toString());
    if (params?.tipe) query.append('tipe', params.tipe);
    if (params?.tanggal_dari) query.append('tanggal_dari', params.tanggal_dari);
    if (params?.tanggal_sampai) query.append('tanggal_sampai', params.tanggal_sampai);
    if (params?.scope) query.append('scope', params.scope);
    const response = await apiClient.get(`/api/master-vouchers/transactions?${query.toString()}`);
    // Backend returns { success: true, data: [...] }
    return response.data.data || response.data;
  },

  createTransaction: async (data: VoucherTransactionInput) => {
    const response = await apiClient.post('/api/master-vouchers/transactions', data);
    return response.data;
  },

  deleteTransaction: async (id: number) => {
    const response = await apiClient.delete(`/api/master-vouchers/transactions/${id}`);
    return response.data;
  },

  getStatistics: async (params?: { tanggal_dari?: string; tanggal_sampai?: string }) => {
    const query = new URLSearchParams();
    if (params?.tanggal_dari) query.append('tanggal_dari', params.tanggal_dari);
    if (params?.tanggal_sampai) query.append('tanggal_sampai', params.tanggal_sampai);
    const response = await apiClient.get(`/api/master-vouchers/statistics?${query.toString()}`);
    // Backend returns { success: true, data: {...} }
    return response.data.data || response.data;
  },
};

// ==================== MASTER WALLET API (NEW SYSTEM) ====================

export interface MasterWallet {
  id: number;
  nama_wallet: string;
  saldo_saat_ini: number;
  createdAt: string;
  updatedAt: string;
  _count?: {
    transaksi: number;
  };
}

export interface MasterWalletInput {
  nama_wallet: string;
  saldo_awal?: number;
}

export interface WalletTransactionType {
  id: number;
  wallet_id: number;
  tanggal: string;
  tipe: 'masuk' | 'keluar';
  jumlah: number;
  keterangan?: string;
  createdAt: string;
  wallet?: MasterWallet;
}

export interface WalletTransactionInput {
  wallet_id: number;
  tipe: 'masuk' | 'keluar';
  jumlah: number;
  keterangan?: string;
  tanggal?: string;
}

export const masterWalletApi = {
  // Master Wallet CRUD
  getAll: async () => {
    const response = await apiClient.get('/api/master-wallets/master');
    return response.data.data || response.data;
  },

  getById: async (id: number) => {
    const response = await apiClient.get(`/api/master-wallets/master/${id}`);
    return response.data;
  },

  create: async (data: MasterWalletInput) => {
    const response = await apiClient.post('/api/master-wallets/master', data);
    return response.data;
  },

  update: async (id: number, data: Partial<MasterWalletInput>) => {
    const response = await apiClient.put(`/api/master-wallets/master/${id}`, data);
    return response.data;
  },

  delete: async (id: number) => {
    const response = await apiClient.delete(`/api/master-wallets/master/${id}`);
    return response.data;
  },

  // Transactions
  getTransactions: async (params?: { wallet_id?: number; tipe?: string; tanggal_dari?: string; tanggal_sampai?: string; scope?: string }) => {
    const query = new URLSearchParams();
    if (params?.wallet_id) query.append('wallet_id', params.wallet_id.toString());
    if (params?.tipe) query.append('tipe', params.tipe);
    if (params?.tanggal_dari) query.append('tanggal_dari', params.tanggal_dari);
    if (params?.tanggal_sampai) query.append('tanggal_sampai', params.tanggal_sampai);
    if (params?.scope) query.append('scope', params.scope);
    const response = await apiClient.get(`/api/master-wallets/transactions?${query.toString()}`);
    return response.data.data || response.data;
  },

  createTransaction: async (data: WalletTransactionInput) => {
    const response = await apiClient.post('/api/master-wallets/transactions', data);
    return response.data;
  },

  deleteTransaction: async (id: number) => {
    const response = await apiClient.delete(`/api/master-wallets/transactions/${id}`);
    return response.data;
  },

  getStatistics: async (params?: { tanggal_dari?: string; tanggal_sampai?: string }) => {
    const query = new URLSearchParams();
    if (params?.tanggal_dari) query.append('tanggal_dari', params.tanggal_dari);
    if (params?.tanggal_sampai) query.append('tanggal_sampai', params.tanggal_sampai);
    const response = await apiClient.get(`/api/master-wallets/statistics?${query.toString()}`);
    return response.data.data || response.data;
  },
};

// ==================== STATISTICS API ====================

export const statisticsApi = {
  getVoucherSummary: async () => {
    const response = await apiClient.get('/api/statistics/voucher-summary');
    return response.data;
  },

  getWalletSummary: async () => {
    const response = await apiClient.get('/api/statistics/wallet-summary');
    return response.data;
  },

  getDaily: async (date?: string) => {
    const params = date ? `?date=${date}` : '';
    const response = await apiClient.get(`/api/statistics/daily${params}`);
    return response.data;
  },

  getDashboard: async () => {
    const response = await apiClient.get('/api/statistics/dashboard');
    return response.data;
  },
};

// Operator API
export const operatorApi = {
  getAll: async () => {
    const response = await apiClient.get('/api/operators');
    return response.data.data || response.data;
  },
  
  create: async (data: { name: string }) => {
    const response = await apiClient.post('/api/operators', { nama: data.name });
    return response.data.data || response.data;
  },
  
  update: async (id: number, data: { name: string }) => {
    const response = await apiClient.put(`/api/operators/${id}`, { nama: data.name });
    return response.data.data || response.data;
  },
  
  delete: async (id: number) => {
    const response = await apiClient.delete(`/api/operators/${id}`);
    return response.data.data || response.data;
  },
};

// Wallet Type API
export const walletTypeApi = {
  getAll: async () => {
    const response = await apiClient.get('/api/wallet-types');
    return response.data.data || response.data;
  },
  
  create: async (data: { name: string; phone?: string }) => {
    const response = await apiClient.post('/api/wallet-types', { nama: data.name, nomor_hp: data.phone });
    return response.data.data || response.data;
  },
  
  update: async (id: number, data: { name: string; phone?: string }) => {
    const response = await apiClient.put(`/api/wallet-types/${id}`, { nama: data.name, nomor_hp: data.phone });
    return response.data.data || response.data;
  },
  
  delete: async (id: number) => {
    const response = await apiClient.delete(`/api/wallet-types/${id}`);
    return response.data.data || response.data;
  },
};

// ==================== DAILY VOUCHER STOCK API ====================
export interface VoucherDailyStock {
  id: number;
  voucher_id: number;
  tanggal: string;
  sisa: number;
  terjual: number;
  stok_awal: number;
  masuk: number;
  catatan?: string;
  createdAt: string;
  updatedAt: string;
  voucher?: MasterVoucher;
}

export interface VoucherDailyStockInput {
  voucher_id: number;
  tanggal: string;
  sisa: number;
  masuk?: number;
  catatan?: string;
}

export const dailyVoucherApi = {
  getAll: async () => {
    const response = await apiClient.get('/api/voucher-daily');
    return response.data.data || response.data;
  },
  getById: async (id: number) => {
    const response = await apiClient.get(`/api/voucher-daily/${id}`);
    return response.data.data || response.data;
  },
  create: async (data: VoucherDailyStockInput) => {
    const response = await apiClient.post('/api/voucher-daily', data);
    return response.data.data || response.data;
  },
  update: async (id: number, data: Partial<VoucherDailyStockInput>) => {
    const response = await apiClient.put(`/api/voucher-daily/${id}`, data);
    return response.data.data || response.data;
  },
  delete: async (id: number) => {
    const response = await apiClient.delete(`/api/voucher-daily/${id}`);
    return response.data.data || response.data;
  },
  getByVoucher: async (voucher_id: number) => {
    const response = await apiClient.get(`/api/voucher-daily/by-voucher/${voucher_id}`);
    return response.data.data || response.data;
  },
};

// ==================== DAILY WALLET STOCK API ====================
export interface WalletDailyStock {
  id: number;
  wallet_id: number;
  tanggal: string;
  saldo_awal: number;
  masuk: number;
  keluar: number;
  sisa: number;
  catatan?: string;
  createdAt: string;
  updatedAt: string;
  wallet?: MasterWallet;
}

export interface WalletDailyStockInput {
  wallet_id: number;
  tanggal: string;
  sisa: number;
  saldo_awal?: number;
  masuk?: number;
  keluar?: number;
  catatan?: string;
}

export const dailyWalletApi = {
  getAll: async () => {
    const response = await apiClient.get('/api/wallet-daily');
    return response.data.data || response.data;
  },
  getById: async (id: number) => {
    const response = await apiClient.get(`/api/wallet-daily/${id}`);
    return response.data.data || response.data;
  },
  create: async (data: WalletDailyStockInput) => {
    const response = await apiClient.post('/api/wallet-daily', data);
    return response.data.data || response.data;
  },
  update: async (id: number, data: Partial<WalletDailyStockInput>) => {
    const response = await apiClient.put(`/api/wallet-daily/${id}`, data);
    return response.data.data || response.data;
  },
  delete: async (id: number) => {
    const response = await apiClient.delete(`/api/wallet-daily/${id}`);
    return response.data.data || response.data;
  },
  getByWallet: async (wallet_id: number) => {
    const response = await apiClient.get(`/api/wallet-daily/by-wallet/${wallet_id}`);
    return response.data.data || response.data;
  },
};