import { useState } from 'react';
import type { Ticket, TicketUpdate } from '../types';

interface TicketCardProps {
  ticket: Ticket;
  onUpdate: (ticketId: number, updates: Partial<TicketUpdate>) => Promise<void>;
  superModeEnabled: boolean;
}

export default function TicketCard({ ticket, onUpdate, superModeEnabled }: TicketCardProps) {

  const [isUpdating, setIsUpdating] = useState(false);
  const [showMoveMenu, setShowMoveMenu] = useState(false);

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
      <div>
        <div className="text-sm text-gray-900 p-1 rounded">
          {ticket.description}
        </div>
        <div className="mt-2 text-xs text-gray-500">
          <div>ID: {ticket.id}</div>
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

      {superModeEnabled && (
        <div className="mt-2 text-[11px] text-gray-500">
          <div>
            Created by: {ticket.creator_email ?? `User ${ticket.creator_id}`}
          </div>
          {ticket.updated_by_id && (
            <div>
              Updated by: {ticket.updated_by_email ?? `User ${ticket.updated_by_id}`}
            </div>
          )}
        </div>
      )}

    </div>
  );
}
