
import React from 'react';
import { usePageData } from '../hooks/usePageData';

const Notifications: React.FC = () => {
  const { pageData, dismissNotification } = usePageData();
  const { notifications } = pageData;

  if (notifications.length === 0) {
    return null;
  }
  
  const getIconAndColor = (type: 'info' | 'success' | 'warning') => {
      switch (type) {
          case 'success':
              return { icon: 'fa-check-circle', color: 'bg-green-500' };
          case 'warning':
              return { icon: 'fa-exclamation-triangle', color: 'bg-yellow-500' };
          default:
              return { icon: 'fa-info-circle', color: 'bg-blue-500' };
      }
  }

  return (
    <div className="fixed top-20 right-4 z-[100] w-full max-w-sm space-y-2">
      {notifications.map(notif => {
        const { icon, color } = getIconAndColor(notif.type);
        return (
            <div
                key={notif.id}
                className={`relative flex items-center p-4 pr-10 rounded-lg shadow-lg text-white ${color} animate-fade-in-down`}
                role="alert"
            >
                <i className={`fas ${icon} text-xl mr-3`}></i>
                <p className="text-sm font-medium">{notif.message}</p>
                <button
                    onClick={() => dismissNotification(notif.id)}
                    className="absolute top-1/2 right-2 -translate-y-1/2 w-7 h-7 flex items-center justify-center rounded-full hover:bg-white/20 transition-colors"
                    aria-label="Dismiss"
                >
                    &times;
                </button>
            </div>
        );
      })}
      <style>{`
        @keyframes fade-in-down {
            0% { opacity: 0; transform: translateY(-10px); }
            100% { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-down { animation: fade-in-down 0.3s ease-out forwards; }
      `}</style>
    </div>
  );
};

export default Notifications;
