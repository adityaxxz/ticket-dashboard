import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import { useSuperToggle } from '../contexts/SuperToggleContext';
import SuperToggleModal from './SuperToggleModal.tsx';

export default function Header() {
  const { user, logout } = useAuth();
  const { notifications, isLoading, fetchNotifications } = useNotifications();
  const { enabled: superModeEnabled } = useSuperToggle();
  const [showSuperToggle, setShowSuperToggle] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const bellRef = useRef<HTMLButtonElement | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const toggleDropdown = async () => {
    const next = !isDropdownOpen;
    setIsDropdownOpen(next);
    if (next) {
      await fetchNotifications();
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        isDropdownOpen &&
        dropdownRef.current &&
        !dropdownRef.current.contains(target) &&
        bellRef.current &&
        !bellRef.current.contains(target)
      ) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isDropdownOpen]);

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold text-gray-900">
              Ticket Dashboard
            </h1>
          </div>

          <div className="flex items-center space-x-4">
            <div className="relative">
              <button
                ref={bellRef}
                onClick={toggleDropdown}
                className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
              <span role="img" aria-label="notifications" className="text-xl">🔔</span>
              </button>

              {isDropdownOpen && (
                <div
                  ref={dropdownRef}
                  className="absolute right-0 top-10 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50"
                >
                <div className="px-4 py-3 border-b border-gray-100">
                  <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {isLoading && (
                    <div className="px-4 py-3 text-sm text-gray-500">Loading...</div>
                  )}
                  {!isLoading && notifications.length === 0 && (
                    <div className="px-4 py-6 text-sm text-gray-500 text-center">No recent activity</div>
                  )}
                  {!isLoading && notifications.length > 0 && (
                    <ul className="divide-y divide-gray-100">
                      {notifications.map((activity) => (
                        <li key={activity.id} className="px-4 py-3 text-sm text-gray-700">
                          {activity.message}
                          <div className="mt-1 text-xs text-gray-400">
                            {new Date(activity.created_at).toLocaleString()}
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                </div>
              )}
            </div>

            <button
              onClick={() => setShowSuperToggle(true)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                superModeEnabled
                  ? 'bg-red-100 text-red-800 hover:bg-red-200'
                  : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
              }`}
            >
              {superModeEnabled ? 'Disable Super Mode' : 'Enable Super Mode'}
            </button>

            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">{user?.email}</span>
              <button
                onClick={logout}
                className="text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 px-2 py-1 rounded transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {showSuperToggle && (
        <SuperToggleModal
          isOpen={showSuperToggle}
          onClose={() => setShowSuperToggle(false)}
        />
      )}
    </header>
  );
}
