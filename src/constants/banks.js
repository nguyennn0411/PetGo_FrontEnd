export const VIETNAM_BANKS = [
  { shortName: 'VCB', name: 'Vietcombank - Ngân hàng TMCP Ngoại thương Việt Nam' },
  { shortName: 'CTG', name: 'VietinBank - Ngân hàng TMCP Công thương Việt Nam' },
  { shortName: 'BIDV', name: 'BIDV - Ngân hàng TMCP Đầu tư và Phát triển Việt Nam' },
  { shortName: 'AGR', name: 'Agribank - Ngân hàng Nông nghiệp và Phát triển Nông thôn' },
  { shortName: 'MB', name: 'MB Bank - Ngân hàng TMCP Quân đội' },
  { shortName: 'TCB', name: 'Techcombank - Ngân hàng TMCP Kỹ thương Việt Nam' },
  { shortName: 'ACB', name: 'ACB - Ngân hàng TMCP Á Châu' },
  { shortName: 'VPB', name: 'VPBank - Ngân hàng TMCP Việt Nam Thịnh Vượng' },
  { shortName: 'HDB', name: 'HDBank - Ngân hàng TMCP Phát triển TP. Hồ Chí Minh' },
  { shortName: 'STB', name: 'Sacombank - Ngân hàng TMCP Sài Gòn Thương Tín' },
  { shortName: 'VIB', name: 'VIB - Ngân hàng TMCP Quốc tế Việt Nam' },
  { shortName: 'SHB', name: 'SHB - Ngân hàng TMCP Sài Gòn - Hà Nội' },
  { shortName: 'MSB', name: 'MSB - Ngân hàng TMCP Hàng Hải Việt Nam' },
  { shortName: 'LPB', name: 'LPBank - Ngân hàng TMCP Bưu điện Liên Việt' },
  { shortName: 'TPB', name: 'TPBank - Ngân hàng TMCP Tiên Phong' },
  { shortName: 'OCB', name: 'OCB - Ngân hàng TMCP Phương Đông' },
  { shortName: 'SSB', name: 'SeABank - Ngân hàng TMCP Đông Nam Á' },
  { shortName: 'NAB', name: 'Nam A Bank - Ngân hàng TMCP Nam Á' },
  { shortName: 'KLB', name: 'KienLongBank - Ngân hàng TMCP Kiên Long' },
  { shortName: 'BAB', name: 'Bac A Bank - Ngân hàng TMCP Bắc Á' },
  { shortName: 'ABB', name: 'ABBANK - Ngân hàng TMCP An Bình' },
  { shortName: 'PVCB', name: 'PVcomBank - Ngân hàng TMCP Đại chúng Việt Nam' },
  { shortName: 'EIB', name: 'Eximbank - Ngân hàng TMCP Xuất Nhập khẩu Việt Nam' },
  { shortName: 'SCB', name: 'SCB - Ngân hàng TMCP Sài Gòn' },
  { shortName: 'PGB', name: 'PGBank - Ngân hàng TMCP Xăng dầu Petrolimex' },
  { shortName: 'VRB', name: 'VRB - Ngân hàng Liên doanh Việt - Nga' },
  { shortName: 'CBB', name: 'CBBank - Ngân hàng TNHH MTV Xây dựng Việt Nam' },
  { shortName: 'OCEANBANK', name: 'OceanBank - Ngân hàng TNHH MTV Đại Dương' },
  { shortName: 'GPB', name: 'GPBank - Ngân hàng TNHH MTV Dầu khí Toàn Cầu' },
  { shortName: 'DAB', name: 'DongA Bank - Ngân hàng TMCP Đông Á' },
  { shortName: 'VAB', name: 'Viet A Bank - Ngân hàng TMCP Việt Á' },
  { shortName: 'NCB', name: 'NCB - Ngân hàng TMCP Quốc Dân' },
  { shortName: 'WOO', name: 'Woori Bank Việt Nam' },
  { shortName: 'SHINHAN', name: 'Shinhan Bank Việt Nam' },
  { shortName: 'KEBHANA', name: 'KEB Hana Bank Việt Nam' },
  { shortName: 'IBK', name: 'IBK Việt Nam - Ngân hàng Công nghiệp Hàn Quốc' },
  { shortName: 'HSBC', name: 'HSBC Việt Nam' },
  { shortName: 'CITIBANK', name: 'Citibank Việt Nam' },
  { shortName: 'STANDARD_CHARTERED', name: 'Standard Chartered Việt Nam' },
];

export const searchBanks = (query) => {
  if (!query || !query.trim()) return VIETNAM_BANKS;
  const q = query.toLowerCase().trim();
  return VIETNAM_BANKS.filter(b =>
    b.shortName.toLowerCase().includes(q) ||
    b.name.toLowerCase().includes(q)
  );
};
