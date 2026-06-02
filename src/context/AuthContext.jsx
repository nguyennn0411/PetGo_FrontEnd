import React, { createContext, useEffect, useMemo, useState } from 'react';
import { getMyAccount } from '../api/auth';

const PARTNER_ROLE_CODES = ['SHOP', 'PARTNER', 'PROVIDER'];

const normalizeRoleCode = (role) => {
  if (!role) return '';
  if (typeof role === 'string') return role.toUpperCase();
  return String(role.code?.code || role.code || role.roleCode || role.name || role.authority || role.role || '').toUpperCase();
};

const hasPartnerRole = (account) => {
  const roles = account?.roles || account?.user?.roles || account?.authorities || [];
  const roleList = Array.isArray(roles) ? roles : [roles];
  return roleList.some((role) => PARTNER_ROLE_CODES.includes(normalizeRoleCode(role)));
};

const syncOwnerUserId = (account) => {
  if (hasPartnerRole(account)) {
    localStorage.removeItem('petgo_owner_user_id');
    return;
  }

  const ownerId = account?.ownerUserId || account?.userId || account?.id;
  if (ownerId) {
    localStorage.setItem('petgo_owner_user_id', String(ownerId));
  }
};

export const AuthContext = createContext();

const clearAuthStorage = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('account');
  localStorage.removeItem('user');
  localStorage.removeItem('petgo_owner_user_id');
};

export function AuthProvider({ children }) {
  const [account, setAccount] = useState(undefined);
  const [loadingAccount, setLoadingAccount] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    const hydrate = async () => {
      const token = localStorage.getItem('token');
      const stored = localStorage.getItem('account');

      if (!token) {
        setAccount(null);
        setLoadingAccount(false);
        return;
      }

      if (stored) {
        try {
          setAccount(JSON.parse(stored));
        } catch {
          setAccount(null);
        }
      }

      try {
        const me = await getMyAccount();
        setAccount(me);
        localStorage.setItem('account', JSON.stringify(me));
        syncOwnerUserId(me);
      } catch (error) {
        clearAuthStorage();
        setAccount(null);
      } finally {
        setLoadingAccount(false);
      }
    };

    hydrate();
  }, []);

  const login = (authData) => {
    const result = authData?.result || authData || {};
    const token = result.token || authData?.token;
    const refreshToken = result.refreshToken || authData?.refreshToken;
    const userAccount = result.user || result.account || authData?.user || authData?.account;
    let nextAccount = null;

    if (token) localStorage.setItem('token', token);
    if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
    if (userAccount) {
      localStorage.setItem('account', JSON.stringify(userAccount));
      syncOwnerUserId(userAccount);
      setAccount(userAccount);
      nextAccount = userAccount;
    }

    setIsLoggingOut(false);
    return nextAccount;
  };

  const updateAccount = (updated) => {
    setAccount((prev) => {
      const next = { ...(prev || {}), ...(updated || {}) };
      localStorage.setItem('account', JSON.stringify(next));
      syncOwnerUserId(next);
      return next;
    });
  };

  const logout = () => {
    setIsLoggingOut(true);
    clearAuthStorage();
    setAccount(null);
    setTimeout(() => setIsLoggingOut(false), 0);
  };

  const value = useMemo(() => ({
    account,
    login,
    logout,
    updateAccount,
    loadingAccount,
    isLoggingOut,
  }), [account, loadingAccount, isLoggingOut]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
