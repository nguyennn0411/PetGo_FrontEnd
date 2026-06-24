import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { AuthProvider } from './context/AuthContext'
import { FeedbackProvider } from './components/AppFeedback'
import Swal from 'sweetalert2'

window.alert = (message) => {
  Swal.fire({
    text: message,
    icon: 'info',
    confirmButtonColor: '#f97316',
    confirmButtonText: 'Đóng'
  });
};

window.confirmAsync = async (message) => {
  const result = await Swal.fire({
    title: 'Xác nhận',
    text: message,
    icon: 'question',
    showCancelButton: true,
    confirmButtonColor: '#f97316',
    cancelButtonColor: '#9ca3af',
    confirmButtonText: 'Đồng ý',
    cancelButtonText: 'Hủy',
    focusCancel: true
  });
  return result.isConfirmed;
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <FeedbackProvider>
        <App />
      </FeedbackProvider>
    </AuthProvider>
  </React.StrictMode>,
)