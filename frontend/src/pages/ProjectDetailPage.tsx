import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useProjects } from '../contexts/ProjectContext';
import { useSuperToggle } from '../contexts/SuperToggleContext';
import type { Project, Ticket, TicketCreate, TicketUpdate } from '../types';
import { projectAPI, ticketAPI } from '../services/api';
import KanbanBoard from '../components/KanbanBoard.tsx';

export default function ProjectDetailPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { setCurrentProject } = useProjects();
  const { enabled: superModeEnabled } = useSuperToggle();
  
  const [project, setProject] = useState<Project | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Track connection implicitly; do not store state to avoid unused warnings

  useEffect(() => {
    if (projectId) {
      fetchProjectDetails();
    }
  }, [projectId]);

  const fetchProjectDetails = async () => {
    if (!projectId) return;
    
    setIsLoading(true);
    setError(null);

    try {
      const response = await projectAPI.getProject(parseInt(projectId));
      setProject(response.project);
      setTickets(response.tickets);
      setCurrentProject(response.project);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch project details');
    } finally {
      setIsLoading(false);
    }
  };

  // Simple WebSocket: connect and listen for activity updates
  useEffect(() => {
    if (!projectId) return;

    const token = localStorage.getItem('token');
    if (!token) return;

    // Simple WebSocket connection
    const wsUrl = `ws://localhost:8000/ws/activity?token=${token}&project_id=${projectId}`;
    const ws = new WebSocket(wsUrl);

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.event === 'activity' && data.data?.project_id == projectId) {
          // Simple refresh without debouncing - WebSocket messages are already infrequent
          fetchProjectDetails();
        }
      } catch {
        // Ignore parse errors
      }
    };

    // Simple cleanup
    return () => {
      ws.close();
    };
  }, [projectId]);

  const handleTicketCreate = async (ticketData: TicketCreate): Promise<Ticket> => {
    try {
      const newTicket = await ticketAPI.createTicket(ticketData);
      setTickets(prev => [...prev, newTicket]);
      return newTicket;
    } catch (err) {
      console.error('Failed to create ticket:', err);
      throw err;
    }
  };

  const handleTicketUpdate = async (ticketId: number, updates: Partial<TicketUpdate>) => {
    try {
      const updatedTicket = await ticketAPI.updateTicket(ticketId, updates);
      setTickets(prev => 
        prev.map(ticket => 
          ticket.id === ticketId ? updatedTicket : ticket
        )
      );
    } catch (err) {
      console.error('Failed to update ticket:', err);
      throw err;
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8 text-gray-700">Loading...</div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-red-600 mb-4">{error}</div>
        <button
          onClick={() => navigate('/')}
          className="btn-primary"
        >
          Back to Projects
        </button>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-500 mb-4">Project not found</div>
        <button
          onClick={() => navigate('/')}
          className="btn-primary"
        >
          Back to Projects
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <button
            onClick={() => navigate('/')}
            className="text-primary-600 hover:text-primary-700 mb-2"
          >
            ← Back to Projects
          </button>
          <h1 className="text-3xl font-bold text-gray-900">{project.name}</h1>
          <p className="text-gray-500">
            Created: {new Date(project.created_at).toLocaleDateString()}
          </p>
        </div>
        {superModeEnabled && (
          <div className="bg-red-100 text-red-800 text-sm font-medium px-3 py-1 rounded-full">
            SUPER MODE ACTIVE
          </div>
        )}
      </div>

      <KanbanBoard
        projectId={parseInt(projectId!)}
        tickets={tickets}
        onTicketCreate={handleTicketCreate}
        onTicketUpdate={handleTicketUpdate}
        superModeEnabled={superModeEnabled}
      />
    </div>
  );
}
