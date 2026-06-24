const FAVORITE_STORAGE_KEY = 'petgo_favorite_provider_ids';

export const providerFallbackImage =
  'https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?auto=format&fit=crop&q=80&w=800';

export const formatCurrencyVnd = (value) => {
  if (value === null || value === undefined || value === '') return 'Liên hệ';

  const number = Number(value);
  if (Number.isNaN(number)) return String(value);

  return new Intl.NumberFormat('vi-VN').format(number);
};

export const loadFavoriteProviderIds = () => {
  try {
    const raw = localStorage.getItem(FAVORITE_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const saveFavoriteProviderIds = (ids) => {
  localStorage.setItem(FAVORITE_STORAGE_KEY, JSON.stringify(ids));
};

export const toggleFavoriteProviderId = (providerId) => {
  const current = loadFavoriteProviderIds();
  const next = current.includes(providerId)
    ? current.filter((id) => id !== providerId)
    : [...current, providerId];

  saveFavoriteProviderIds(next);
  return next;
};

export const mapSortValueToApi = (value) => {
  const map = {
    FEATURED: 'FEATURED',
    NEAREST: 'NEAREST',
    TOP_RATED: 'TOP_RATED',
    LOWEST_PRICE: 'LOWEST_PRICE',
    nearest: 'NEAREST',
    rating: 'TOP_RATED',
    price: 'LOWEST_PRICE',
  };

  return map[value] || 'FEATURED';
};

export const mapTimeOfDayLabel = (value) => {
  const map = {
    MORNING: 'Sáng',
    NOON: 'Trưa',
    AFTERNOON: 'Chiều',
    EVENING: 'Tối',
  };

  return map[value] || value;
};

export const buildProviderAddress = (provider) => {
  if (provider?.address) return provider.address;
  const parts = [provider?.city, provider?.province].filter(Boolean);
  return parts.length ? parts.join(', ') : 'Đang cập nhật';
};

export const pickProviderImage = (provider) => provider?.image || providerFallbackImage;

export const buildFakeMapCoords = (index) => {
  const presets = [
    { x: '24%', y: '34%' },
    { x: '57%', y: '28%' },
    { x: '72%', y: '54%' },
    { x: '40%', y: '64%' },
    { x: '62%', y: '68%' },
    { x: '28%', y: '52%' },
    { x: '76%', y: '38%' },
    { x: '48%', y: '20%' },
  ];

  return presets[index % presets.length];
};
