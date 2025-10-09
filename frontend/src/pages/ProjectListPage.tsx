import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProjects } from '../contexts/ProjectContext';
// Removed ProjectFormData - using inline type instead

export default function ProjectListPage() {
  const { projects, fetchProjects, createProject, isLoading } = useProjects();
  const navigate = useNavigate();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({ name: '' });
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    fetchProjects();
  }, []); // Only run on mount - simpler for beginners

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    await createProject(formData);
    setFormData({ name: '' });
    setShowCreateForm(false);
    setIsCreating(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Projects</h1>
        <button
          onClick={() => setShowCreateForm(true)}
          className="btn-primary"
        >
          Create Project
        </button>
      </div>

      {showCreateForm && (
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Create New Project</h2>
          <form onSubmit={handleCreateProject} className="space-y-4">
            <div>
              <label htmlFor="projectName" className="block text-sm font-medium text-gray-700 mb-2">
                Project Name
              </label>
              <input
                id="projectName"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ name: e.target.value })}
                className="input"
                placeholder="Enter project name"
                required
              />
            </div>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="btn-secondary"
                disabled={isCreating}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary"
                disabled={isCreating}
              >
                {isCreating ? 'Creating...' : 'Create Project'}
              </button>
            </div>
          </form>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-8 text-gray-700">Loading...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project: any) => (
            <div
              key={project.id}
              onClick={() => navigate(`/projects/${project.id}`)}
              className="card hover:shadow-md transition-shadow cursor-pointer"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {project.name}
              </h3>
              <p className="text-sm text-gray-500">
                Created: {new Date(project.created_at).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
      )}

      {projects.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <div className="text-gray-500 mb-4">
            <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No projects yet</h3>
          <p className="text-gray-500 mb-4">Get started by creating your first project.</p>
          <button
            onClick={() => setShowCreateForm(true)}
            className="btn-primary"
          >
            Create Project
          </button>
        </div>
      )}
    </div>
  );
}
