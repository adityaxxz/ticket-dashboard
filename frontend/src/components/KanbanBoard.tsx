import type { Ticket, TicketCreate, TicketUpdate } from '../types';
import KanbanColumn from './KanbanColumn.tsx';

interface KanbanBoardProps {
  projectId: number;
  tickets: Ticket[];
  onTicketCreate: (ticket: TicketCreate) => Promise<Ticket>;
  onTicketUpdate: (ticketId: number, updates: Partial<TicketUpdate>) => Promise<void>;
  superModeEnabled: boolean;
}

const COLUMNS = [
  { status: 'proposed' as const, title: 'Proposed', color: 'bg-gray-100' },
  { status: 'todo' as const, title: 'To Do', color: 'bg-blue-100' },
  { status: 'inprogress' as const, title: 'In Progress', color: 'bg-yellow-100' },
  { status: 'done' as const, title: 'Done', color: 'bg-purple-100' },
  { status: 'deployed' as const, title: 'Deployed', color: 'bg-green-100' },
];

export default function KanbanBoard({
  projectId,
  tickets,
  onTicketCreate,
  onTicketUpdate,
  superModeEnabled,
}: KanbanBoardProps) {
  const getTicketsByStatus = (status: Ticket['status']) => {
    return tickets.filter(ticket => ticket.status === status);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Tickets</h2>
        <div className="text-sm text-gray-500">
          Total: {tickets.length} tickets
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {COLUMNS.map((column) => (
          <KanbanColumn
            key={column.status}
            title={column.title}
            status={column.status}
            tickets={getTicketsByStatus(column.status)}
            projectId={projectId}
            onTicketCreate={onTicketCreate}
            onTicketUpdate={onTicketUpdate}
            superModeEnabled={superModeEnabled}
            color={column.color}
          />
        ))}
      </div>
    </div>
  );
}
