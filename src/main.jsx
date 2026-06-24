import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { AuthProvider } from './context/AuthContext'
import { NotificationProvider } from './context/NotificationContext'
import { FeedbackProvider } from './components/AppFeedback'
import { toast } from 'react-hot-toast';

window.alert = (message) => {
  toast.error(message, { duration: 4000 });
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <NotificationProvider>
        <FeedbackProvider>
          <App />
        </FeedbackProvider>
      </NotificationProvider>
    </AuthProvider>
  </React.StrictMode>,
)