import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from '../utils/axios';
import { 
  Calendar, 
  Users, 
  MoreVertical, 
  Edit2, 
  Trash2, 
  ExternalLink 
} from 'lucide-react';

interface Project {
  _id: string;
  title: string;
  description: string;
  color: string;
  members: Array<{
    user: {
      _id: string;
      name: string;
      email: string;
    };
    role: string;
  }>;
  createdAt: string;
}

interface ProjectCardProps {
  project: Project;
  onProjectDeleted: (projectId: string) => void;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project, onProjectDeleted }) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const isOwner = project.members.find(
    member => member.user._id === user?.id && member.role === 'admin'
  );

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this project?')) return;

    setLoading(true);
    try {
      await axios.delete(`/api/projects/${project._id}`);
      onProjectDeleted(project._id);
    } catch (error) {
      console.error('Error deleting project:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center space-x-3">
            <div
              className="w-4 h-4 rounded-full"
              style={{ backgroundColor: project.color }}
            />
            <h3 className="font-semibold text-gray-900 truncate">{project.title}</h3>
          </div>
          
          {isOwner && (
            <div className="relative">
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <MoreVertical className="h-4 w-4 text-gray-500" />
              </button>
              
              {showDropdown && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
                  <button
                    onClick={handleDelete}
                    disabled={loading}
                    className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2 disabled:opacity-50"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span>Delete Project</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
          {project.description || 'No description provided'}
        </p>

        <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
          <div className="flex items-center space-x-2">
            <Users className="h-4 w-4" />
            <span>{project.members.length} members</span>
          </div>
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4" />
            <span>{new Date(project.createdAt).toLocaleDateString()}</span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex -space-x-2">
            {project.members.slice(0, 3).map((member) => (
              <div
                key={member.user._id}
                className="w-8 h-8 rounded-full bg-blue-100 border-2 border-white flex items-center justify-center"
                title={member.user.name}
              >
                <span className="text-xs font-medium text-blue-600">
                  {member.user.name.charAt(0).toUpperCase()}
                </span>
              </div>
            ))}
            {project.members.length > 3 && (
              <div className="w-8 h-8 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center">
                <span className="text-xs font-medium text-gray-600">
                  +{project.members.length - 3}
                </span>
              </div>
            )}
          </div>
          
          <Link
            to={`/project/${project._id}`}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <ExternalLink className="h-4 w-4" />
            <span>Open</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ProjectCard;