// Format currency to Indonesian Rupiah
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
};

// Convert to WIB timezone
export const toWIB = (date: string | Date): Date => {
  const d = typeof date === 'string' ? new Date(date) : date;
  // WIB is UTC+7
  const wibOffset = 7 * 60; // 7 hours in minutes
  const localOffset = d.getTimezoneOffset(); // local timezone offset in minutes
  const totalOffset = wibOffset + localOffset;
  return new Date(d.getTime() + totalOffset * 60 * 1000);
};

// Format date to Indonesian locale (WIB)
export const formatDate = (date: string | Date): string => {
  const wibDate = toWIB(date);
  return wibDate.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    timeZone: 'Asia/Jakarta',
  });
};

// Format date for input field (YYYY-MM-DD) in WIB
export const formatDateInput = (date: Date | string): string => {
  const wibDate = toWIB(date);
  const year = wibDate.getFullYear();
  const month = String(wibDate.getMonth() + 1).padStart(2, '0');
  const day = String(wibDate.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Get today's date in YYYY-MM-DD format
export const getTodayDate = (): string => {
  return formatDateInput(new Date());
};

// Format number with thousand separator
export const formatNumber = (num: number): string => {
  return new Intl.NumberFormat('id-ID').format(num);
};

// Format datetime for display (WIB)
export const formatDateTime = (date: string | Date): string => {
  const d = new Date(date);
  return d.toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Jakarta',
    hour12: false
  }).replace(/\./g, ':');
};

// Format time ago (e.g., "2 jam lalu") in WIB
export const formatTimeAgo = (date: string | Date): string => {
  const now = new Date();
  const past = new Date(date);
  const diffMs = now.getTime() - past.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Baru saja';
  if (diffMins < 60) return `${diffMins} menit lalu`;
  if (diffHours < 24) return `${diffHours} jam lalu`;
  if (diffDays < 7) return `${diffDays} hari lalu`;
  return formatDate(date);
};

// Get badge color based on transaction type
export const getTransactionBadgeColor = (tipe: 'masuk' | 'keluar'): string => {
  return tipe === 'masuk' 
    ? 'bg-green-100 text-green-700' 
    : 'bg-red-100 text-red-700';
};
