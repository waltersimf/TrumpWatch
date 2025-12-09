import React from 'react';
import { Bell } from 'lucide-react';

interface NotificationBannerProps {
  onEnable: () => void;
}

const NotificationBanner: React.FC<NotificationBannerProps> = ({ onEnable }) => {
  return (
    <div className="mt-8 bg-gradient-to-r from-slate-800/80 to-slate-900/80 rounded-2xl p-6 text-center border border-slate-700/50">
      <div className="flex items-center justify-center gap-2 mb-2">
        <Bell size={20} className="text-yellow-500" />
        <h4 className="text-white font-semibold text-lg">Never Miss a Moment</h4>
      </div>
      <p className="text-slate-400 text-sm mb-4">
        Get daily notifications, breaking news alerts, and exclusive stats
      </p>
      <button
        onClick={onEnable}
        className="bg-red-600 hover:bg-red-700 text-white px-6 py-2.5 rounded-full font-semibold transition-colors text-sm"
      >
        Enable Notifications
      </button>
    </div>
  );
};

export default NotificationBanner;
