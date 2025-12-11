import type { TFunction } from 'i18next';

export function translateRole(role: string, t: TFunction) {
  switch (role) {
    case 'admin':
      return t('common.admin');
    case 'staff':
      return t('common.staff');
    case 'partner':
      return t('common.partner');
    case 'user':
    default:
      return t('common.user');
  }
}

export function translateStatus(status: string, t: TFunction) {
  switch (status) {
    case 'active':
      return t('common.active');
    case 'pending':
    case 'pending_approval':
      return t('common.pending');
    case 'suspended':
      return t('common.suspended');
    case 'confirmed':
      return t('common.confirmed');
    case 'completed':
      return t('common.completed');
    case 'cancelled':
      return t('common.cancelled');
    case 'refunded':
      return t('common.refunded');
    case 'approved':
      return t('common.approved', 'Đã duyệt');
    case 'rejected':
      return t('common.rejected', 'Bị từ chối');
    default:
      return status;
  }
}

export const translateMonth = (month: string, t: TFunction): string => {
  if (!month) return '';
  const key = `months.${String(month).toLowerCase()}`;
  const translated = t(key);
  return translated === key ? month : translated;
};


