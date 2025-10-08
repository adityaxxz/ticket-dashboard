import { useState } from 'react';
import type { TicketCreate } from '../types';

interface CreateTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: number;
  onCreate: (ticket: TicketCreate) => Promise<void>;
}

export default function CreateTicketModal({
  isOpen,
  onClose,
  projectId,
  onCreate,
}: CreateTicketModalProps) {
  const [formData, setFormData] = useState({
    description: '',
  });
  const [isCreating, setIsCreating] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.description.trim() === '') return;

    setIsCreating(true);
    try {
      await onCreate({
        project_id: projectId,
        description: formData.description.trim(),
      });
      setFormData({ description: '' });
    } catch (error) {
      console.error('Failed to create ticket:', error);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <h2 className="text-xl font-semibold mb-4">Create New Ticket</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ description: e.target.value })}
              className="input"
              placeholder="Enter ticket description"
              rows={4}
              required
            />
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
              disabled={isCreating}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={isCreating || formData.description.trim() === ''}
            >
              {isCreating ? 'Creating...' : 'Create Ticket'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
