import { useState } from 'react';
import { useSuperToggle } from '../contexts/SuperToggleContext';
import type { SuperToggleFormData } from '../types';

interface SuperToggleModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SuperToggleModal({ isOpen, onClose }: SuperToggleModalProps) {
  const { enabled, toggleSuperMode, isLoading } = useSuperToggle();
  const [formData, setFormData] = useState<SuperToggleFormData>({ password: '' });
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      // When disabling, do not require password; send empty string
      await toggleSuperMode({
        enable: !enabled,
        password: enabled ? '' : formData.password,
      });
      onClose();
      setFormData({ password: '' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to toggle super mode');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <h2 className="text-xl font-semibold mb-4">
          {enabled ? 'Disable Super Mode' : 'Enable Super Mode'}
        </h2>
        
        <form onSubmit={handleSubmit}>
          {!enabled && (
            <div className="mb-4">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                type="password"
                id="password"
                value={formData.password}
                onChange={(e) => setFormData({ password: e.target.value })}
                className="input"
                placeholder="Enter password"
                required={!enabled}
              />
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={isLoading}
            >
              {isLoading ? 'Processing...' : (enabled ? 'Disable' : 'Enable')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
