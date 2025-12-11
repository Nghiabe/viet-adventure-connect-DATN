import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

export function formatDate(date: string | number | Date | null | undefined, pattern = "d 'tháng' M, yyyy") {
  if (!date) return '';
  try {
    const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
    return format(d as Date, pattern, { locale: vi });
  } catch {
    return '';
  }
}

export function formatCurrencyVND(amount: number | null | undefined) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0);
}


