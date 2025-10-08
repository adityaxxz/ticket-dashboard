import { useState } from 'react';
import type { Ticket, TicketUpdate } from '../types';

interface TicketCardProps {
  ticket: Ticket;
  onUpdate: (ticketId: number, updates: Partial<TicketUpdate>) => Promise<void>;
  superModeEnabled: boolean;
}

export default function TicketCard({ ticket, onUpdate, superModeEnabled }: TicketCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editDescription, setEditDescription] = useState(ticket.description);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showMoveMenu, setShowMoveMenu] = useState(false);

  const handleUpdate = async () => {
    if (editDescription.trim() === '') return;

    setIsUpdating(true);
    try {
      await onUpdate(ticket.id, { description: editDescription.trim() });
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update ticket:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancel = () => {
    setEditDescription(ticket.description);
    setIsEditing(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleUpdate();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  const STATUSES: Ticket['status'][] = ['proposed', 'todo', 'inprogress', 'done', 'deployed'];

  const handleMove = async (newStatus: Ticket['status']) => {
    if (newStatus === ticket.status) return;
    setIsUpdating(true);
    try {
      await onUpdate(ticket.id, { status: newStatus });
      setShowMoveMenu(false);
    } catch (error) {
      console.error('Failed to move ticket:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 hover:shadow-md transition-shadow">
      {isEditing ? (
        <div className="space-y-2">
          <textarea
            value={editDescription}
            onChange={(e) => setEditDescription(e.target.value)}
            onKeyDown={handleKeyPress}
            className="w-full text-sm border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
            rows={3}
            autoFocus
          />
          <div className="flex justify-end space-x-2">
            <button
              onClick={handleCancel}
              className="text-xs text-gray-600 hover:text-gray-800 px-2 py-1"
              disabled={isUpdating}
            >
              Cancel
            </button>
            <button
              onClick={handleUpdate}
              className="text-xs bg-primary-600 text-white px-2 py-1 rounded hover:bg-primary-700 disabled:opacity-50"
              disabled={isUpdating || editDescription.trim() === ''}
            >
              {isUpdating ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      ) : (
        <div>
          <div
            className="text-sm text-gray-900 cursor-pointer hover:bg-gray-50 p-1 rounded"
            onClick={() => superModeEnabled && setIsEditing(true)}
            title={superModeEnabled ? 'Click to edit' : ''}
          >
            {ticket.description}
          </div>
          <div className="mt-2 text-xs text-gray-500">
            <div>ID: {ticket.id}</div>
            {superModeEnabled && (
              <>
                <div>Created: {new Date(ticket.created_at).toLocaleDateString()}</div>
                {ticket.updated_at !== ticket.created_at && (
                  <div>Updated: {new Date(ticket.updated_at).toLocaleDateString()}</div>
                )}
              </>
            )}
          </div>

          <div className="mt-3">
            <button
              className="text-xs text-primary-700 hover:text-white hover:bg-primary-600 border border-primary-200 rounded px-2 py-1 transition-colors"
              onClick={() => setShowMoveMenu((v) => !v)}
              disabled={isUpdating}
            >
              {showMoveMenu ? 'Close' : 'Move'}
            </button>

            {showMoveMenu && (
              <div className="mt-2 grid grid-cols-2 gap-2">
                {STATUSES.filter((s) => s !== ticket.status).map((status) => (
                  <button
                    key={status}
                    className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-800 rounded px-2 py-1 disabled:opacity-50"
                    onClick={() => handleMove(status)}
                    disabled={isUpdating}
                    title={`Move to ${status}`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
      {superModeEnabled && (
        <div className="mt-2 text-[11px] text-gray-500">
          <div>
            Created by: {ticket.creator_email ? ticket.creator_email : `User ${ticket.creator_id}`}
          </div>
          {ticket.updated_by_id && (
            <div>
              Updated by: {ticket.updated_by_email ? ticket.updated_by_email : `User ${ticket.updated_by_id}`}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
