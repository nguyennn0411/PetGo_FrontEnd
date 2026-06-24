export const PARTNER_ROLE_CODES = ['SHOP', 'PARTNER', 'PROVIDER'];

const normalizeRoleCode = (role) => {
    if (!role) return '';
    if (typeof role === 'string') return role.toUpperCase();

    return String(role.code?.code || role.code || role.roleCode || role.name || role.authority || role.role || '').toUpperCase();
};

export const getAccountRoles = (account) => {
    const roles = account?.roles || account?.user?.roles || account?.authorities || [];
    return Array.isArray(roles) ? roles : [roles];
};

export const hasPartnerRole = (account) => (
    getAccountRoles(account).some((role) => PARTNER_ROLE_CODES.includes(normalizeRoleCode(role)))
);

export const hasAdminRole = (account) => (
    getAccountRoles(account).some((role) => normalizeRoleCode(role) === 'ADMIN')
);

export const getRoleLandingPath = (account, fallback = '/') => {
    if (hasAdminRole(account)) return '/admin/dashboard';
    if (hasPartnerRole(account)) return '/partner/dashboard';
    return fallback;
};

export const canAccessPartnerArea = (account) => hasPartnerRole(account);