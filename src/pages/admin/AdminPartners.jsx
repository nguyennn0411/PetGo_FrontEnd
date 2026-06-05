import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { AdminDialog, AdminToastStack, getAdminErrorMessage, useAdminDialog, useAdminToast } from '../../components/admin/AdminFeedback';
import {
  getPendingProviders,
  getVerifiedProviders,
  getAdminProviderDetail,
  updateProviderAccountStatus
} from '../../api/admin';
import {
  approveRegistration,
  getAdminRegistrationDetail,
  getAdminRegistrations,
  rejectRegistration,
  requestRegistrationAdditionalInfo,
} from '../../api/registrations';
import {
  REGISTRATION_STATUS,
  REGISTRATION_STATUS_LABEL,
  REGISTRATION_TYPE,
} from '../../constants/registration';

const AdminPartners = () => {
  const [partners, setPartners] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [modalType, setModalType] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [fetchingDetail, setFetchingDetail] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchField, setSearchField] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sourceFilter, setSourceFilter] = useState('ALL');
  const [dateFilter, setDateFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('NEWEST');
  const { toasts, showToast, dismissToast } = useAdminToast();
  const { dialog, confirmDialog, promptDialog, closeDialog } = useAdminDialog();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [verifiedProvidersResult, pendingProvidersResult, registrationsResult] = await Promise.allSettled([
        getVerifiedProviders(),
        getPendingProviders(),
        getAdminRegistrations({
          type: REGISTRATION_TYPE.PARTNER,
        })
      ]);

      if (verifiedProvidersResult.status === 'rejected') {
        console.error('Lỗi khi lấy danh sách đối tác verified:', verifiedProvidersResult.reason);
      }
      if (pendingProvidersResult.status === 'rejected') {
        console.error('Lỗi khi lấy danh sách provider pending:', pendingProvidersResult.reason);
      }

      const verifiedProviders = verifiedProvidersResult.status === 'fulfilled' ? verifiedProvidersResult.value?.result || [] : [];
      const pendingProviders = pendingProvidersResult.status === 'fulfilled' ? pendingProvidersResult.value?.result || [] : [];
      const mergedProviders = [...verifiedProviders, ...pendingProviders].reduce((acc, provider) => {
        if (provider?.id && !acc.some((item) => item.id === provider.id)) acc.push(provider);
        return acc;
      }, []);
      setPartners(mergedProviders);

      if (registrationsResult.status === 'fulfilled') {
        const registrationData = registrationsResult.value;
        setApplications(Array.isArray(registrationData) ? registrationData : registrationData?.result || []);
      } else {
        console.error('Lỗi khi lấy hồ sơ đăng ký partner:', registrationsResult.reason);
        setApplications([]);
        showToast({
          tone: 'error',
          title: 'Không tải được hồ sơ đăng ký',
          message: getAdminErrorMessage(registrationsResult.reason, 'Không thể tải hồ sơ đăng ký partner. Hãy đăng nhập lại tài khoản admin nếu token đã cũ.'),
        });
      }
    } catch (error) {
      console.error('Lỗi khi lấy dữ liệu đối tác:', error);
      showToast({
        tone: 'error',
        title: 'Không tải được dữ liệu đối tác',
        message: getAdminErrorMessage(error, 'Không thể tải dữ liệu đối tác lúc này.'),
      });
    } finally {
      setLoading(false);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setModalType(null);
    setSelectedProvider(null);
    setSelectedApplication(null);
  };

  const handleViewProviderDetail = async (providerId) => {
    setFetchingDetail(true);
    setShowModal(true);
    setModalType('provider');
    setSelectedProvider(null);
    setSelectedApplication(null);
    try {
      const data = await getAdminProviderDetail(providerId);
      setSelectedProvider(data);
    } catch (error) {
      console.error('Lỗi khi lấy chi tiết nhà cung cấp:', error);
      showToast({
        tone: 'error',
        title: 'Không mở được chi tiết nhà cung cấp',
        message: getAdminErrorMessage(error, 'Không thể tải chi tiết nhà cung cấp.'),
      });
      closeModal();
    } finally {
      setFetchingDetail(false);
    }
  };

  const handleViewApplicationDetail = async (applicationId) => {
    setFetchingDetail(true);
    setShowModal(true);
    setModalType('application');
    setSelectedProvider(null);
    setSelectedApplication(null);
    try {
      const data = await getAdminRegistrationDetail(applicationId);
      setSelectedApplication(data);
    } catch (error) {
      console.error('Lỗi khi lấy chi tiết hồ sơ đăng ký:', error);
      showToast({
        tone: 'error',
        title: 'Không mở được hồ sơ đăng ký',
        message: getAdminErrorMessage(error, 'Không thể tải chi tiết hồ sơ đăng ký.'),
      });
      closeModal();
    } finally {
      setFetchingDetail(false);
    }
  };

  const handleCloseModal = () => {
    closeModal();
  };

  const handleApproveApplication = async (applicationId) => {
    const message = await promptDialog({
      tone: 'success',
      title: 'Duyệt hồ sơ partner',
      message: 'Nhập ghi chú gửi đến partner sau khi hồ sơ được duyệt.',
      defaultValue: 'Hồ sơ đã được duyệt.',
      confirmLabel: 'Duyệt hồ sơ',
      cancelLabel: 'Hủy',
      helperText: 'Có thể để trống nếu không cần gửi thêm ghi chú.',
    });
    if (message === null) return;
    try {
      await approveRegistration(applicationId, { message });
      showToast({
        tone: 'success',
        title: 'Đã duyệt hồ sơ partner',
        message: 'Partner sẽ nhận được thông báo và có thể tiếp tục thiết lập nhà cung cấp.',
      });
      closeModal();
      fetchData();
    } catch (error) {
      console.error('Lỗi khi duyệt hồ sơ partner:', error);
      showToast({
        tone: 'error',
        title: 'Duyệt hồ sơ thất bại',
        message: getAdminErrorMessage(error, 'Duyệt hồ sơ partner thất bại.'),
      });
    }
  };

  const handleRejectApplication = async (applicationId) => {
    const message = await promptDialog({
      tone: 'error',
      title: 'Từ chối hồ sơ partner',
      message: 'Nhập lý do từ chối để partner biết cần điều chỉnh nội dung nào.',
      placeholder: 'Ví dụ: Thiếu giấy tờ xác minh hoặc thông tin cửa hàng chưa đầy đủ...',
      required: true,
      confirmLabel: 'Từ chối hồ sơ',
      cancelLabel: 'Hủy',
    });
    if (!message) return;
    try {
      await rejectRegistration(applicationId, { message });
      showToast({
        tone: 'success',
        title: 'Đã từ chối hồ sơ',
        message: 'Lý do từ chối đã được ghi nhận để partner theo dõi.',
      });
      closeModal();
      fetchData();
    } catch (error) {
      console.error('Lỗi khi từ chối hồ sơ partner:', error);
      showToast({
        tone: 'error',
        title: 'Từ chối hồ sơ thất bại',
        message: getAdminErrorMessage(error, 'Từ chối hồ sơ partner thất bại.'),
      });
    }
  };


  const handleRequestAdditionalInfoApplication = async (applicationId) => {
    const message = await promptDialog({
      tone: 'warning',
      title: 'Yêu cầu partner bổ sung',
      message: 'Nhập rõ các thông tin hoặc giấy tờ partner cần bổ sung.',
      placeholder: 'Ví dụ: Vui lòng bổ sung ảnh mặt tiền cửa hàng và giấy phép kinh doanh...',
      required: true,
      confirmLabel: 'Gửi yêu cầu',
      cancelLabel: 'Hủy',
    });
    if (!message?.trim()) return;
    try {
      await requestRegistrationAdditionalInfo(applicationId, { message: message.trim() });
      showToast({
        tone: 'success',
        title: 'Đã gửi yêu cầu bổ sung',
        message: 'Partner sẽ nhận được thông báo kèm nội dung admin vừa nhập.',
      });
      closeModal();
      fetchData();
    } catch (error) {
      console.error('Lỗi khi yêu cầu bổ sung thông tin:', error);
      showToast({
        tone: 'error',
        title: 'Gửi yêu cầu bổ sung thất bại',
        message: getAdminErrorMessage(error, 'Yêu cầu bổ sung thông tin thất bại.'),
      });
    }
  };

  const handleToggleAccountStatus = async (providerId, currentStatus) => {
    const isLocked = currentStatus === 'INACTIVE' || currentStatus === 'LOCKED';
    const newStatus = isLocked ? 'ACTIVE' : 'INACTIVE';

    const accepted = await confirmDialog({
      tone: isLocked ? 'success' : 'error',
      title: isLocked ? 'Mở khóa nhà cung cấp?' : 'Khóa nhà cung cấp?',
      message: `Bạn có chắc muốn ${isLocked ? 'mở khóa' : 'khóa'} provider này?`,
      confirmLabel: isLocked ? 'Mở khóa nhà cung cấp' : 'Khóa nhà cung cấp',
      cancelLabel: 'Hủy',
    });
    if (!accepted) return;

    try {
      await updateProviderAccountStatus(providerId, newStatus);
      showToast({
        tone: 'success',
        title: 'Đã cập nhật trạng thái nhà cung cấp',
        message: isLocked ? 'Nhà cung cấp đã được mở khóa và có thể hoạt động lại.' : 'Nhà cung cấp đã được khóa/tạm dừng thành công.',
      });
      fetchData(); // Refresh list
    } catch (error) {
      console.error('Lỗi khi cập nhật trạng thái:', error);
      showToast({
        tone: 'error',
        title: 'Cập nhật trạng thái thất bại',
        message: getAdminErrorMessage(error, 'Thao tác thất bại.'),
      });
    }
  };

  const partnerStatusBadge = (verificationStatus, accountStatus) => {
    if (accountStatus === 'INACTIVE' || accountStatus === 'LOCKED') {
      return <span className="badge badge-danger">Đã khóa</span>;
    }

    const map = {
      VERIFIED: ['badge-success', 'Đã xác minh'],
      PENDING: ['badge-warning', 'Chờ duyệt'],
      REJECTED: ['badge-danger', 'Bị từ chối'],
    };
    const [cls, label] = map[verificationStatus] || ['badge-gray', verificationStatus];
    return <span className={`badge ${cls}`}>{label}</span>;
  };

  const applicationStatusBadge = (status) => {
    const map = {
      [REGISTRATION_STATUS.AWAITING_APPROVAL]: ['badge-warning', REGISTRATION_STATUS_LABEL[REGISTRATION_STATUS.AWAITING_APPROVAL]],
      [REGISTRATION_STATUS.NEEDS_MORE_INFO]: ['badge-info', REGISTRATION_STATUS_LABEL[REGISTRATION_STATUS.NEEDS_MORE_INFO]],
      [REGISTRATION_STATUS.APPROVED]: ['badge-success', REGISTRATION_STATUS_LABEL[REGISTRATION_STATUS.APPROVED]],
      [REGISTRATION_STATUS.REJECTED]: ['badge-danger', REGISTRATION_STATUS_LABEL[REGISTRATION_STATUS.REJECTED]],
      [REGISTRATION_STATUS.DRAFT]: ['badge-gray', REGISTRATION_STATUS_LABEL[REGISTRATION_STATUS.DRAFT]],
    };
    const [cls, label] = map[status] || ['badge-gray', status || 'Không rõ'];
    return <span className={`badge ${cls}`}>{label}</span>;
  };

  const formatDateTime = (value) => {
    if (!value) return '—';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value : date.toLocaleString('vi-VN');
  };

  const normalizeSearchText = (value) => String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'd')
    .replace(/[^a-z0-9@._#+\-\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .toLowerCase()
    .trim();

  const getProviderStatusGroup = (provider) => {
    const accountStatus = String(provider?.status || '').toUpperCase();
    const verificationStatus = String(provider?.verificationStatus || '').toUpperCase();
    if (accountStatus === 'INACTIVE' || accountStatus === 'LOCKED') return 'CANCEL';
    if (verificationStatus === 'VERIFIED') return 'VERIFIED';
    if (verificationStatus === 'PENDING') return 'PENDING';
    if (verificationStatus === 'REJECTED' || verificationStatus === 'CANCELLED') return 'CANCEL';
    return verificationStatus || accountStatus || 'UNKNOWN';
  };

  const getApplicationStatusGroup = (status) => {
    switch (status) {
      case REGISTRATION_STATUS.AWAITING_APPROVAL:
        return 'PENDING';
      case REGISTRATION_STATUS.NEEDS_MORE_INFO:
        return 'PENDING';
      case REGISTRATION_STATUS.REJECTED:
        return 'CANCEL';
      case REGISTRATION_STATUS.APPROVED:
        return 'VERIFIED';
      case REGISTRATION_STATUS.DRAFT:
        return 'DRAFT';
      default:
        return status || 'UNKNOWN';
    }
  };

  const unifiedStatusBadge = (statusGroup) => {
    const map = {
      VERIFIED: ['badge-success', 'Đã xác minh'],
      PENDING: ['badge-warning', 'Chờ xử lý'],
      CANCEL: ['badge-danger', 'Tạm dừng / từ chối'],
      DRAFT: ['badge-gray', 'Draft'],
      UNKNOWN: ['badge-gray', 'Không rõ'],
    };
    const [cls, label] = map[statusGroup] || ['badge-gray', statusGroup || 'Không rõ'];
    return <span className={`badge ${cls}`}>{label}</span>;
  };

  const toTime = (value) => {
    if (!value) return 0;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? 0 : date.getTime();
  };

  const isInDateFilter = (value) => {
    if (dateFilter === 'ALL') return true;
    if (!value) return dateFilter === 'NO_DATE';
    const time = toTime(value);
    if (!time) return dateFilter === 'NO_DATE';
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    if (dateFilter === 'TODAY') return time >= startOfToday;
    const days = dateFilter === '7D' ? 7 : dateFilter === '30D' ? 30 : null;
    if (!days) return true;
    return time >= now.getTime() - days * 24 * 60 * 60 * 1000;
  };

  const buildSearchBlob = (values) => normalizeSearchText(values.filter(Boolean).join(' '));

  const buildPrimarySearchBlob = (values) => buildSearchBlob(values);

  const buildSearchFields = ({
    code,
    title,
    userName,
    email,
    phone,
    address,
    rawStatus,
    accountStatus,
    sourceLabel,
    statusGroup,
    statusLabel,
    sourceAliases,
    statusAliases,
  }) => ({
    CODE: buildSearchBlob([code]),
    NAME: buildSearchBlob([title]),
    OWNER: buildSearchBlob([userName]),
    EMAIL: buildSearchBlob([email]),
    PHONE: buildSearchBlob([phone]),
    ADDRESS: buildSearchBlob([address]),
    STATUS: buildSearchBlob([rawStatus, accountStatus, statusGroup, statusLabel, statusAliases]),
    SOURCE: buildSearchBlob([sourceLabel, sourceAliases]),
    ALL: buildSearchBlob([code, title, userName, email, phone, address, rawStatus, accountStatus, statusGroup, statusLabel, sourceLabel, sourceAliases, statusAliases]),
  });

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
    // Khi admin gõ tìm kiếm, ưu tiên tìm trên toàn bộ danh sách thay vì bị filter cũ che kết quả.
    setStatusFilter('ALL');
    setSourceFilter('ALL');
    setDateFilter('ALL');
  };

  const handleSearchFieldChange = (event) => {
    setSearchField(event.target.value);
  };

  const providerRows = partners.map((provider) => {
    const statusGroup = getProviderStatusGroup(provider);
    const row = {
      key: `provider-${provider.id}`,
      source: 'PROVIDER',
      sourceLabel: 'Provider đã tạo',
      entity: provider,
      id: provider.id,
      code: provider.providerCode,
      title: provider.businessName || 'Partner nhà cung cấp',
      userName: provider.userName,
      email: provider.email,
      phone: provider.phoneNumber,
      address: provider.address,
      date: provider.createdAt,
      rawStatus: provider.verificationStatus,
      accountStatus: provider.status,
      statusGroup,
      avatar: '🏪',
    };
    return {
      ...row,
      searchFields: buildSearchFields({
        ...row,
        sourceAliases: 'provider da tao dich vu',
        statusAliases: [
          statusGroup === 'VERIFIED' ? 'verified da xac minh hoat dong active' : '',
          statusGroup === 'PENDING' ? 'pending cho duyet dang cho xu ly' : '',
          statusGroup === 'CANCEL' ? 'cancel huy khoa tu choi rejected inactive locked' : '',
        ].join(' '),
      }),
      primarySearchBlob: buildPrimarySearchBlob([
        row.code,
        row.title,
        row.userName,
        row.email,
        row.rawStatus,
        row.accountStatus,
        row.sourceLabel,
        'provider da tao dich vu',
        statusGroup === 'VERIFIED' ? 'verified da xac minh hoat dong active' : '',
        statusGroup === 'PENDING' ? 'pending cho duyet dang cho xu ly' : '',
        statusGroup === 'CANCEL' ? 'cancel huy khoa tu choi rejected inactive locked' : '',
        statusGroup,
      ]),
      searchBlob: buildSearchBlob([
        row.id,
        row.code,
        row.title,
        row.userName,
        row.email,
        row.phone,
        row.address,
        row.rawStatus,
        row.accountStatus,
        row.sourceLabel,
        'provider da tao dich vu',
        statusGroup === 'VERIFIED' ? 'verified da xac minh hoat dong active' : '',
        statusGroup === 'PENDING' ? 'pending cho duyet dang cho xu ly' : '',
        statusGroup === 'CANCEL' ? 'cancel huy khoa tu choi rejected inactive locked' : '',
        statusGroup,
      ]),
    };
  });

  const applicationRows = applications
    .filter((application) => application.status !== REGISTRATION_STATUS.APPROVED
      && application.status !== REGISTRATION_STATUS.DRAFT)
    .map((application) => {
      const statusGroup = getApplicationStatusGroup(application.status);
      const row = {
        key: `application-${application.id}`,
        source: 'APPLICATION',
        sourceLabel: 'Hồ sơ đăng ký',
        entity: application,
        id: application.id,
        code: `APP-${application.id}`,
        title: application.businessName || 'Partner application',
        userName: application.userName,
        email: application.businessEmail || application.userEmail,
        phone: application.businessPhone || application.userPhone,
        address: application.businessAddress,
        date: application.submittedAt || application.reviewedAt,
        rawStatus: application.status,
        accountStatus: null,
        statusGroup,
        avatar: statusGroup === 'CANCEL' ? '🚫' : '🆕',
      };
      return {
        ...row,
        searchFields: buildSearchFields({
          ...row,
          statusLabel: REGISTRATION_STATUS_LABEL[row.rawStatus],
          sourceAliases: 'registration application ho so dang ky don dang ky doi tac partner',
          statusAliases: [
            statusGroup === 'VERIFIED' ? 'verified da xac minh da duyet approved' : '',
            statusGroup === 'PENDING' ? 'pending cho duyet dang cho xu ly can bo sung awaiting approval needs more info' : '',
            statusGroup === 'CANCEL' ? 'cancel huy tu choi rejected bi tu choi' : '',
          ].join(' '),
        }),
        primarySearchBlob: buildPrimarySearchBlob([
          row.code,
          row.title,
          row.userName,
          row.email,
          row.rawStatus,
          row.sourceLabel,
          REGISTRATION_STATUS_LABEL[row.rawStatus],
          'registration application ho so dang ky don dang ky doi tac partner',
          statusGroup === 'VERIFIED' ? 'verified da xac minh da duyet approved' : '',
          statusGroup === 'PENDING' ? 'pending cho duyet dang cho xu ly can bo sung awaiting approval needs more info' : '',
          statusGroup === 'CANCEL' ? 'cancel huy tu choi rejected bi tu choi' : '',
          statusGroup,
          application.userEmail,
        ]),
        searchBlob: buildSearchBlob([
          row.id,
          row.code,
          row.title,
          row.userName,
          row.email,
          row.phone,
          row.address,
          row.rawStatus,
          row.sourceLabel,
          REGISTRATION_STATUS_LABEL[row.rawStatus],
          'registration application ho so dang ky don dang ky doi tac partner',
          statusGroup === 'VERIFIED' ? 'verified da xac minh da duyet approved' : '',
          statusGroup === 'PENDING' ? 'pending cho duyet dang cho xu ly can bo sung awaiting approval needs more info' : '',
          statusGroup === 'CANCEL' ? 'cancel huy tu choi rejected bi tu choi' : '',
          statusGroup,
          application.userEmail,
          application.userPhone,
        ]),
      };
    });

  const allRows = [...providerRows, ...applicationRows];
  const searchKeyword = normalizeSearchText(searchTerm);
  const searchTokens = searchKeyword.split(' ').filter(Boolean);
  const isShortNumericSearch = searchTokens.length === 1 && /^\d{1,2}$/.test(searchTokens[0]);
  const filteredRows = allRows
    .filter((row) => {
      if (searchTokens.length === 0) return true;
      const searchableText = searchField === 'ALL'
        ? (isShortNumericSearch ? row.primarySearchBlob : row.searchBlob)
        : row.searchFields?.[searchField] || '';
      return searchTokens.every((token) => searchableText.includes(token));
    })
    .filter((row) => statusFilter === 'ALL' || row.statusGroup === statusFilter)
    .filter((row) => sourceFilter === 'ALL' || row.source === sourceFilter)
    .filter((row) => isInDateFilter(row.date))
    .sort((a, b) => {
      if (sortBy === 'OLDEST') return toTime(a.date) - toTime(b.date);
      if (sortBy === 'NAME_ASC') return a.title.localeCompare(b.title, 'vi');
      if (sortBy === 'STATUS') return a.statusGroup.localeCompare(b.statusGroup, 'vi') || b.id - a.id;
      return toTime(b.date) - toTime(a.date);
    });

  const pendingCount = allRows.filter((row) => row.statusGroup === 'PENDING').length;
  const verifiedCount = allRows.filter((row) => row.statusGroup === 'VERIFIED').length;
  const cancelCount = allRows.filter((row) => row.statusGroup === 'CANCEL').length;
  const activeFilterCount = [statusFilter, sourceFilter, dateFilter]
    .filter((value) => value !== 'ALL').length + (searchTerm.trim() ? 1 : 0) + (searchField !== 'ALL' ? 1 : 0);
  const activeControlCount = activeFilterCount + (sortBy !== 'NEWEST' ? 1 : 0);
  const pendingApplicationCount = applicationRows.filter((row) => row.statusGroup === 'PENDING').length;
  const providerCount = providerRows.length;
  const applicationCount = applicationRows.length;

  const statusCards = [
    {
      filter: 'VERIFIED',
      label: 'Đã xác minh',
      value: verifiedCount,
      description: 'Nhà cung cấp đủ điều kiện hoạt động',
      icon: '✅',
      tone: 'success',
    },
    {
      filter: 'PENDING',
      label: 'Chờ xử lý',
      value: pendingCount,
      description: `${pendingApplicationCount} hồ sơ cần duyệt`,
      icon: '⏳',
      tone: 'warning',
    },
    {
      filter: 'CANCEL',
      label: 'Tạm dừng / từ chối',
      value: cancelCount,
      description: 'Nhà cung cấp đã khóa hoặc hồ sơ bị từ chối',
      icon: '⛔',
      tone: 'danger',
    },
    {
      filter: 'ALL',
      label: 'Tổng hồ sơ',
      value: allRows.length,
      description: `${providerCount} provider · ${applicationCount} đăng ký`,
      icon: '📋',
      tone: 'orange',
    },
  ];

  const resetFilters = () => {
    setSearchTerm('');
    setSearchField('ALL');
    setStatusFilter('ALL');
    setSourceFilter('ALL');
    setDateFilter('ALL');
    setSortBy('NEWEST');
  };

  return (
    <AdminLayout title="Quản lý đối tác">
      <AdminToastStack toasts={toasts} onDismiss={dismissToast} />
      <AdminDialog dialog={dialog} onResolve={closeDialog} />

      <div className="metrics">
        <div
          className="metric-card"
          style={{ cursor: 'pointer', borderColor: statusFilter === 'ALL' ? 'var(--petgo-orange)' : undefined }}
          onClick={() => setStatusFilter('ALL')}
        >
          <div className="metric-label">Tổng hồ sơ</div>
          <div className="metric-value">{allRows.length}</div>
          <div className="metric-change metric-up">Verified + Pending + Cancel</div>
        </div>
        <div
          className="metric-card"
          style={{ cursor: 'pointer', borderColor: statusFilter === 'VERIFIED' ? 'var(--border-success)' : undefined }}
          onClick={() => setStatusFilter('VERIFIED')}
        >
          <div className="metric-label">Verified</div>
          <div className="metric-value">{verifiedCount}</div>
          <div className="metric-change metric-up">Đã xác minh / đang hoạt động</div>
        </div>
        <div
          className="metric-card"
          style={{ cursor: 'pointer', borderColor: statusFilter === 'PENDING' ? 'var(--border-warning)' : undefined }}
          onClick={() => setStatusFilter('PENDING')}
        >
          <div className="metric-label">Pending</div>
          <div className="metric-value">{pendingCount}</div>
          <div className="metric-change metric-down">Cần admin xử lý</div>
        </div>
        <div
          className="metric-card"
          style={{ cursor: 'pointer', borderColor: statusFilter === 'CANCEL' ? 'var(--border-danger)' : undefined }}
          onClick={() => setStatusFilter('CANCEL')}
        >
          <div className="metric-label">Cancel</div>
          <div className="metric-value">{cancelCount}</div>
          <div className="metric-change metric-down">Bị từ chối / đã khóa</div>
        </div>
      </div>

      <div className="search-bar" style={{ alignItems: 'stretch', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', flex: '1 1 420px', minWidth: 360 }}>
          <select
            value={searchField}
            onChange={handleSearchFieldChange}
            title="Chọn trường tìm kiếm"
            style={{ borderTopRightRadius: 0, borderBottomRightRadius: 0, borderRight: 0, minWidth: 150 }}
          >
            <option value="ALL">Tìm tất cả</option>
            <option value="NAME">Tên nhà cung cấp</option>
            <option value="CODE">Mã hồ sơ/code</option>
            <option value="EMAIL">Email</option>
            <option value="PHONE">Số điện thoại</option>
            <option value="OWNER">Chủ sở hữu</option>
            <option value="ADDRESS">Địa chỉ</option>
            <option value="STATUS">Trạng thái</option>
            <option value="SOURCE">Nguồn</option>
          </select>
          <input
            type="text"
            placeholder={`🔍 ${searchField === 'ALL' ? 'Tìm trên tất cả trường...' : 'Nhập từ khóa theo trường đã chọn...'}`}
            value={searchTerm}
            onChange={handleSearchChange}
            style={{ minWidth: 0, borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }}
          />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="ALL">Tất cả trạng thái</option>
          <option value="VERIFIED">Verified</option>
          <option value="PENDING">Pending</option>
          <option value="CANCEL">Cancel</option>
        </select>
        <select value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value)}>
          <option value="ALL">Tất cả nguồn</option>
          <option value="PROVIDER">Provider đã tạo</option>
          <option value="APPLICATION">Hồ sơ đăng ký</option>
        </select>
        <select value={dateFilter} onChange={(e) => setDateFilter(e.target.value)}>
          <option value="ALL">Mọi thời gian</option>
          <option value="TODAY">Hôm nay</option>
          <option value="7D">7 ngày gần đây</option>
          <option value="30D">30 ngày gần đây</option>
          <option value="NO_DATE">Không có ngày</option>
        </select>
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
          <option value="NEWEST">Mới nhất</option>
          <option value="OLDEST">Cũ nhất</option>
          <option value="NAME_ASC">Tên A-Z</option>
          <option value="STATUS">Theo trạng thái</option>
        </select>
        <button className="btn btn-sm" onClick={fetchData}>↻ Làm mới</button>
        <button className="btn btn-sm" onClick={resetFilters} disabled={activeFilterCount === 0}>
          Xóa lọc{activeFilterCount ? ` (${activeFilterCount})` : ''}
        </button>
        <button className="btn btn-primary">Xuất danh sách</button>
      </div>

      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">Danh sách đối tác thống nhất</div>
            <div className="text-muted text-small">
              Gộp provider đã verified và hồ sơ đăng ký theo 3 trạng thái chính: Verified, Pending, Cancel.
            </div>
          </div>
          <span className="badge badge-info">{filteredRows.length}/{allRows.length} hồ sơ</span>
        </div>
        <div className="stack-list">
          {loading ? (
            <p style={{ padding: 20 }}>Đang tải...</p>
          ) : filteredRows.length > 0 ? filteredRows.map((row) => {
            const isProvider = row.source === 'PROVIDER';
            const canReviewApplication = row.source === 'APPLICATION'
              && row.rawStatus === REGISTRATION_STATUS.AWAITING_APPROVAL;
            const isWaitingAdditionalInfo = row.source === 'APPLICATION'
              && row.rawStatus === REGISTRATION_STATUS.NEEDS_MORE_INFO;
            const sourceBadgeClass = isProvider ? 'badge-info' : 'badge-gray';
            const rawStatusLabel = row.source === 'APPLICATION'
              ? REGISTRATION_STATUS_LABEL[row.rawStatus] || row.rawStatus
              : row.accountStatus || row.rawStatus || '—';

            return (
              <div key={row.key} className="partner-card" style={{ borderStyle: isProvider ? 'solid' : 'dashed' }}>
                <div className="partner-avatar">{row.avatar}</div>
                <div className="partner-info">
                  <div className="partner-name" style={{ justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      {row.title}
                      {unifiedStatusBadge(row.statusGroup)}
                      <span className={`badge ${sourceBadgeClass}`}>{row.sourceLabel}</span>
                    </span>
                    <span className="text-tiny" style={{ whiteSpace: 'nowrap' }}>{formatDateTime(row.date)}</span>
                  </div>
                  <div className="partner-meta">
                    {row.code || `#${row.id}`} · {row.email || 'Chưa có email'} · {row.userName || 'Chưa có chủ sở hữu'}
                  </div>
                  <div className="partner-meta">
                    {row.phone ? `SĐT: ${row.phone}` : 'Chưa có SĐT'} · {row.address || 'Chưa có địa chỉ'} · Trạng thái gốc: {rawStatusLabel}
                  </div>
                  <div className="partner-actions flex-wrap">
                    <button
                      className="btn btn-sm"
                      onClick={() => isProvider ? handleViewProviderDetail(row.id) : handleViewApplicationDetail(row.id)}
                    >
                      👁 Chi tiết
                    </button>
                    {isProvider && (
                      <>
                        <button className="btn btn-sm btn-warning">⭐ Nổi bật</button>
                        <button
                          className={`btn btn-sm ${row.accountStatus === 'INACTIVE' || row.accountStatus === 'LOCKED' ? 'btn-success' : 'btn-danger'}`}
                          onClick={() => handleToggleAccountStatus(row.id, row.accountStatus)}
                        >
                          {row.accountStatus === 'INACTIVE' || row.accountStatus === 'LOCKED' ? '🔓 Mở khóa' : '🔒 Khóa'}
                        </button>
                      </>
                    )}
                    {canReviewApplication && (
                      <>
                        <button className="btn btn-sm btn-success" onClick={() => handleApproveApplication(row.id)}>✓ Duyệt hồ sơ</button>
                        <button className="btn btn-sm btn-warning" onClick={() => handleRequestAdditionalInfoApplication(row.id)}>↗ Yêu cầu bổ sung</button>
                        <button className="btn btn-sm btn-danger" onClick={() => handleRejectApplication(row.id)}>✗ Từ chối</button>
                      </>
                    )}
                    {isWaitingAdditionalInfo && (
                      <span className="badge badge-info">Đang chờ partner bổ sung</span>
                    )}
                  </div>
                </div>
              </div>
            );
          }) : (
            <div style={{ padding: 32, textAlign: 'center' }}>
              <p style={{ marginBottom: 12 }}>Không tìm thấy hồ sơ phù hợp với từ khóa/bộ lọc hiện tại.</p>
              <button className="btn btn-sm" onClick={resetFilters}>Xóa bộ lọc</button>
            </div>
          )}
        </div>
      </div>

      {/* PROVIDER DETAIL MODAL */}
      {showModal && (
        <div className="modal-overlay" style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }} onClick={handleCloseModal}>
          <div className="modal" style={{
            background: '#fff', width: 600, maxHeight: '90vh', borderRadius: 20, boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
            overflowY: 'auto', animation: 'modalFadeIn 0.3s ease'
          }} onClick={e => e.stopPropagation()}>
            {fetchingDetail ? (
              <div style={{ padding: 40, textAlign: 'center' }}>Đang tải chi tiết nhà cung cấp...</div>
            ) : selectedProvider ? (
              <>
                <div className="modal-header" style={{ padding: '20px 24px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontWeight: 700, fontSize: 18 }}>Chi tiết nhà cung cấp</div>
                  <button onClick={handleCloseModal} style={{ border: 'none', background: 'none', fontSize: 24, cursor: 'pointer', color: '#999' }}>✕</button>
                </div>
                <div className="modal-body" style={{ padding: 24 }}>
                  <div style={{ display: 'flex', gap: 20, marginBottom: 24 }}>
                    <img src={selectedProvider.mainImage} alt="" style={{ width: 120, height: 120, borderRadius: 12, objectFit: 'cover', background: '#f5f5f5' }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)' }}>{selectedProvider.name}</div>
                      <div style={{ color: 'var(--petgo-orange)', fontWeight: 600, marginBottom: 8 }}>{selectedProvider.headline}</div>
                      <div>{partnerStatusBadge(selectedProvider.verificationStatus, selectedProvider.status)}</div>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
                    <div className="info-item">
                      <label style={{ display: 'block', fontSize: 12, color: '#888', marginBottom: 4 }}>Mô tả</label>
                      <div style={{ fontSize: 14, lineHeight: 1.5 }}>{selectedProvider.description || 'Chưa có mô tả.'}</div>
                    </div>
                    <div className="info-item">
                      <label style={{ display: 'block', fontSize: 12, color: '#888', marginBottom: 4 }}>Loại hình</label>
                      <div style={{ fontSize: 14 }}>{selectedProvider.providerType}</div>
                    </div>
                    <div className="info-item">
                      <label style={{ display: 'block', fontSize: 12, color: '#888', marginBottom: 4 }}>Địa chỉ</label>
                      <div style={{ fontSize: 14 }}>{selectedProvider.address}</div>
                    </div>
                    <div className="info-item">
                      <label style={{ display: 'block', fontSize: 12, color: '#888', marginBottom: 4 }}>SĐT Khẩn cấp</label>
                      <div style={{ fontSize: 14 }}>{selectedProvider.emergencyPhone || '—'}</div>
                    </div>
                    <div className="info-item">
                      <label style={{ display: 'block', fontSize: 12, color: '#888', marginBottom: 4 }}>Kinh nghiệm</label>
                      <div style={{ fontSize: 14 }}>{selectedProvider.yearsExperience} năm</div>
                    </div>
                    <div className="info-item">
                      <label style={{ display: 'block', fontSize: 12, color: '#888', marginBottom: 4 }}>Đánh giá</label>
                      <div style={{ fontSize: 14 }}>⭐ {selectedProvider.rating} ({selectedProvider.reviewsCount} đánh giá)</div>
                    </div>
                  </div>

                  {/* Dịch vụ cung cấp */}
                  <div style={{ marginBottom: 24 }}>
                    <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Dịch vụ cung cấp ({selectedProvider.services?.length})</label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {selectedProvider.services?.map(s => (
                        <span key={s.id} className="badge badge-info" style={{ fontSize: 12 }}>{s.name} - {s.priceDisplay}đ</span>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="modal-footer" style={{ padding: 24, borderTop: '1px solid #eee', display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                  <button className="btn" onClick={handleCloseModal}>Đóng</button>
                </div>
              </>
            ) : modalType === 'application' && selectedApplication ? (
              <>
                <div className="modal-header" style={{ padding: '20px 24px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontWeight: 700, fontSize: 18 }}>Chi tiết hồ sơ đăng ký partner</div>
                  <button onClick={handleCloseModal} style={{ border: 'none', background: 'none', fontSize: 24, cursor: 'pointer', color: '#999' }}>✕</button>
                </div>
                <div className="modal-body" style={{ padding: 24 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'flex-start', marginBottom: 24 }}>
                    <div>
                      <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)' }}>{selectedApplication.businessName || 'Partner application'}</div>
                      <div style={{ color: '#666', fontWeight: 600, marginTop: 6 }}>
                        #{selectedApplication.id} · {selectedApplication.userName || 'Chưa có tên user'} · {selectedApplication.userEmail || 'Chưa có email user'}
                      </div>
                    </div>
                    {applicationStatusBadge(selectedApplication.status)}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
                    <div className="info-item">
                      <label style={{ display: 'block', fontSize: 12, color: '#888', marginBottom: 4 }}>SĐT nhà cung cấp</label>
                      <div style={{ fontSize: 14 }}>{selectedApplication.businessPhone || '—'}</div>
                    </div>
                    <div className="info-item">
                      <label style={{ display: 'block', fontSize: 12, color: '#888', marginBottom: 4 }}>Email nhà cung cấp</label>
                      <div style={{ fontSize: 14 }}>{selectedApplication.businessEmail || '—'}</div>
                    </div>
                    <div className="info-item" style={{ gridColumn: '1 / -1' }}>
                      <label style={{ display: 'block', fontSize: 12, color: '#888', marginBottom: 4 }}>Địa chỉ nhà cung cấp</label>
                      <div style={{ fontSize: 14 }}>{selectedApplication.businessAddress || '—'}</div>
                    </div>
                    <div className="info-item">
                      <label style={{ display: 'block', fontSize: 12, color: '#888', marginBottom: 4 }}>Mã số thuế</label>
                      <div style={{ fontSize: 14 }}>{selectedApplication.taxCode || '—'}</div>
                    </div>
                    <div className="info-item">
                      <label style={{ display: 'block', fontSize: 12, color: '#888', marginBottom: 4 }}>Ngày gửi</label>
                      <div style={{ fontSize: 14 }}>{formatDateTime(selectedApplication.submittedAt)}</div>
                    </div>
                    <div className="info-item">
                      <label style={{ display: 'block', fontSize: 12, color: '#888', marginBottom: 4 }}>Người đại diện</label>
                      <div style={{ fontSize: 14 }}>{selectedApplication.representativeName || '—'}</div>
                    </div>
                    <div className="info-item">
                      <label style={{ display: 'block', fontSize: 12, color: '#888', marginBottom: 4 }}>SĐT đại diện</label>
                      <div style={{ fontSize: 14 }}>{selectedApplication.representativePhone || '—'}</div>
                    </div>
                    <div className="info-item" style={{ gridColumn: '1 / -1' }}>
                      <label style={{ display: 'block', fontSize: 12, color: '#888', marginBottom: 4 }}>Email đại diện</label>
                      <div style={{ fontSize: 14 }}>{selectedApplication.representativeEmail || '—'}</div>
                    </div>
                    <div className="info-item" style={{ gridColumn: '1 / -1' }}>
                      <label style={{ display: 'block', fontSize: 12, color: '#888', marginBottom: 4 }}>Nhóm dịch vụ</label>
                      <div style={{ fontSize: 14 }}>
                        {(selectedApplication.serviceCategories || []).map(category => category.name).join(', ') || '—'}
                      </div>
                    </div>
                    <div className="info-item" style={{ gridColumn: '1 / -1' }}>
                      <label style={{ display: 'block', fontSize: 12, color: '#888', marginBottom: 4 }}>Mô tả</label>
                      <div style={{ fontSize: 14, lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{selectedApplication.description || '—'}</div>
                    </div>
                    {selectedApplication.adminMessage && (
                      <div className="info-item" style={{ gridColumn: '1 / -1' }}>
                        <label style={{ display: 'block', fontSize: 12, color: '#888', marginBottom: 4 }}>Yêu cầu/Ghi chú admin</label>
                        <div style={{ fontSize: 14, lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{selectedApplication.adminMessage}</div>
                      </div>
                    )}
                    {selectedApplication.additionalInformation && (
                      <div className="info-item" style={{ gridColumn: '1 / -1' }}>
                        <label style={{ display: 'block', fontSize: 12, color: '#888', marginBottom: 4 }}>Thông tin partner bổ sung</label>
                        <div style={{ fontSize: 14, lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{selectedApplication.additionalInformation}</div>
                      </div>
                    )}
                    {selectedApplication.rejectionReason && (
                      <div className="info-item" style={{ gridColumn: '1 / -1' }}>
                        <label style={{ display: 'block', fontSize: 12, color: '#888', marginBottom: 4 }}>Lý do từ chối</label>
                        <div style={{ fontSize: 14, lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{selectedApplication.rejectionReason}</div>
                      </div>
                    )}
                  </div>

                  <div style={{ marginBottom: 8 }}>
                    <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Ảnh địa điểm ({selectedApplication.locationImageUrls?.length || 0})</label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      {(selectedApplication.locationImageUrls || []).map((url, index) => (
                        <a key={`${url}-${index}`} href={url} target="_blank" rel="noreferrer" className="badge badge-info" style={{ fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          Ảnh {index + 1}: {url}
                        </a>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="modal-footer" style={{ padding: 24, borderTop: '1px solid #eee', display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                  <button className="btn" onClick={handleCloseModal}>Đóng</button>
                  {selectedApplication.status === REGISTRATION_STATUS.AWAITING_APPROVAL && (
                    <>
                      <button className="btn btn-danger" onClick={() => handleRejectApplication(selectedApplication.id)}>✗ Từ chối</button>
                      <button className="btn btn-warning" onClick={() => handleRequestAdditionalInfoApplication(selectedApplication.id)}>↗ Yêu cầu bổ sung</button>
                      <button className="btn btn-success" onClick={() => handleApproveApplication(selectedApplication.id)}>✓ Duyệt hồ sơ</button>
                    </>
                  )}
                  {selectedApplication.status === REGISTRATION_STATUS.NEEDS_MORE_INFO && (
                    <span className="badge badge-info">Đang chờ partner bổ sung thông tin</span>
                  )}
                </div>
              </>
            ) : null}
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminPartners;
