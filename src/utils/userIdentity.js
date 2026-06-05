export const resolveUserId = (account) => {
  const roles = account?.roles || account?.user?.roles || account?.authorities || [];
  const roleList = Array.isArray(roles) ? roles : [roles];
  const hasPartnerRole = roleList.some((role) => {
    const normalized = typeof role === 'string'
      ? role.toUpperCase()
      : String(role?.code?.code || role?.code || role?.roleCode || role?.name || role?.authority || role?.role || '').toUpperCase();
    return ['SHOP', 'PARTNER', 'PROVIDER'].includes(normalized);
  });

  if (hasPartnerRole) return null;

  const candidates = [
    account?.userId,
    account?.userId,
    account?.id,
    account?.accountId,
    account?.user?.id,
    account?.user?.userId,
  ];

  const localCandidate = typeof window !== 'undefined'
    ? window.localStorage.getItem('petgo_user_id')
    : null;

  for (const candidate of [...candidates, localCandidate]) {
    if (candidate === undefined || candidate === null || candidate === '') continue;
    const parsed = Number(candidate);
    if (Number.isFinite(parsed) && parsed > 0) return parsed;
  }

  return null;
};

export const getAccountDisplayName = (account) =>
  account?.fullName || account?.name || account?.username || 'PetGo User';

export const getAccountEmail = (account) => account?.email || 'Chưa có email';

export const getAccountPhone = (account) => account?.phoneNumber || account?.phone || 'Chưa có số điện thoại';

export const getAccountAvatar = (account) =>
  account?.avatarUrl ||
  account?.avatar ||
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=300';

export const getAccountCover = (account) =>
  account?.coverUrl ||
  account?.cover ||
  'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&q=80&w=1600';

export const getAccountAddress = (account) => {
  const parts = [
    account?.addressLine1,
    account?.addressLine2,
    account?.ward,
    account?.district,
    account?.city,
    account?.province,
  ].filter(Boolean);

  return parts.length > 0 ? parts.join(', ') : account?.address || 'Chưa cập nhật địa chỉ';
};

export const formatJoinDate = (value) => {
  if (!value) return 'Tháng này';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Tháng này';

  return new Intl.DateTimeFormat('vi-VN', {
    month: 'long',
    year: 'numeric',
  }).format(date);
};
