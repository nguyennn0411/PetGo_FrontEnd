import { useState } from 'react';
import Swal from 'sweetalert2';
import { toast } from 'react-hot-toast';

export const useAdminToast = () => {
  const showToast = ({ tone, title, message }) => {
    const text = title ? `${title}: ${message}` : message;
    if (tone === 'error') toast.error(text, { duration: 4000 });
    else if (tone === 'success') toast.success(text, { duration: 3000 });
    else toast(text, { duration: 3000 });
  };
  const toastObj = {
    success: (msg) => toast.success(msg, { duration: 3000 }),
    error: (msg) => toast.error(msg, { duration: 4000 }),
    info: (msg) => toast(msg, { duration: 3000 }),
  };
  return { toast: toastObj, showToast };
};

export const getAdminErrorMessage = (err, fallback) => {
  return err?.response?.data?.message || err?.message || fallback || 'Có lỗi xảy ra';
};

export const useAdminDialog = () => {
  const [dialog, setDialog] = useState(null);
  const confirmDialog = async ({ tone, title, message, confirmLabel, cancelLabel }) => {
    const result = await Swal.fire({
      icon: tone === 'warning' ? 'warning' : tone === 'error' ? 'error' : 'question',
      title: title || 'Xác nhận',
      text: message,
      showCancelButton: true,
      confirmButtonText: confirmLabel || 'Xác nhận',
      cancelButtonText: cancelLabel || 'Hủy',
      confirmButtonColor: '#f97316',
      reverseButtons: true,
    });
    return result.isConfirmed;
  };
  const closeDialog = () => setDialog(null);
  return { dialog, setDialog, confirmDialog, closeDialog };
};

export const AdminDialog = ({ dialog, onResolve }) => {
  if (!dialog) return null;
  return null;
};
