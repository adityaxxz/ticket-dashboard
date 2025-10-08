import { useState } from 'react';
import type { Ticket, TicketCreate, TicketUpdate } from '../types';
import TicketCard from './TicketCard.tsx';
import CreateTicketModal from './CreateTicketModal.tsx';

interface KanbanColumnProps {
  title: string;
  status: Ticket['status'];
  tickets: Ticket[];
  projectId: number;
  onTicketCreate: (ticket: TicketCreate) => Promise<Ticket>;
  onTicketUpdate: (ticketId: number, updates: Partial<TicketUpdate>) => Promise<void>;
  superModeEnabled: boolean;
  color: string;
}

export default function KanbanColumn({
  title,
  status,
  tickets,
  projectId,
  onTicketCreate,
  onTicketUpdate,
  superModeEnabled,
  color,
}: KanbanColumnProps) {
  const [showCreateModal, setShowCreateModal] = useState(false);

  const handleTicketCreate = async (ticketData: TicketCreate) => {
    try {
      const created = await onTicketCreate(ticketData);
      // If creating from Proposed column, immediately move it to proposed; otherwise stays todo
      if (status === 'proposed' && created.status !== 'proposed') {
        await onTicketUpdate(created.id, { status: 'proposed' });
      }
      setShowCreateModal(false);
    } catch (error) {
      console.error('Failed to create ticket:', error);
    }
  };

  return (
    <div className="bg-gray-50 rounded-lg p-4 min-h-[400px]">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900">{title}</h3>
        <span className={`text-xs px-2 py-1 rounded-full ${color} text-gray-700`}>
          {tickets.length}
        </span>
      </div>

      <div className="space-y-3">
        {tickets.map((ticket) => (
          <TicketCard
            key={ticket.id}
            ticket={ticket}
            onUpdate={onTicketUpdate}
            superModeEnabled={superModeEnabled}
          />
        ))}
      </div>

      {tickets.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <p className="text-sm">No tickets</p>
        </div>
      )}

      <div className="mt-4">
        <button
          onClick={() => setShowCreateModal(true)}
          className="w-full text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-200 py-2 px-3 rounded-lg transition-colors"
        >
          + Add ticket
        </button>
      </div>

      {showCreateModal && (
        <CreateTicketModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          projectId={projectId}
          onCreate={handleTicketCreate}
        />
      )}
    </div>
  );
}
