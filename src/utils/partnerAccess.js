const normalizeRoleCode = (role) => {
    if (!role) return '';
    if (typeof role === 'string') return role.toUpperCase();
    return String(role.code?.code || role.code || role.roleCode || role.name || role.authority || role.role || '').toUpperCase();
};

export const hasAdminRole = (account) => {
    const roles = account?.roles || account?.user?.roles || account?.authorities || [];
    const roleList = Array.isArray(roles) ? roles : [roles];
    return roleList.some((role) => normalizeRoleCode(role) === 'ADMIN');
};