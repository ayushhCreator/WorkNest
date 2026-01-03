import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import axios from '../utils/axios';
import { 
  Calendar, 
  Users, 
  MoreVertical, 
  Trash2, 
  ArrowRight,
  Settings
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
  tasks?: Array<{ status: string }>;
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

  const isAdmin = project.members.find(
    member => member.user._id === user?.id && member.role === 'admin'
  );

  const taskCount = project.tasks?.length || 0;
  const completedTasks = project.tasks?.filter(t => t.status === 'done').length || 0;
  const progress = taskCount > 0 ? Math.round((completedTasks / taskCount) * 100) : 0;

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this project? This action cannot be undone.')) return;

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
    <motion.div 
      whileHover={{ y: -4 }}
      className="bg-white rounded-3xl border border-indigo-50 shadow-sm shadow-indigo-100/50 hover:shadow-xl hover:shadow-indigo-200/50 transition-all duration-300 group overflow-hidden"
    >
      {/* Color Bar */}
      <div 
        className="h-2"
        style={{ backgroundColor: project.color }}
      />

      <div className="p-6">
        {/* Header */}
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg text-gray-900 truncate">{project.title}</h3>
          </div>
          
          {isAdmin && (
            <div className="relative ml-2">
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
              >
                <MoreVertical className="h-4 w-4 text-gray-400" />
              </button>
              
              {showDropdown && (
                <>
                  <div 
                    className="fixed inset-0 z-10" 
                    onClick={() => setShowDropdown(false)}
                  />
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 py-1 z-20"
                  >
                    <Link
                      to={`/project/${project._id}/settings`}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                    >
                      <Settings className="h-4 w-4" />
                      <span>Settings</span>
                    </Link>
                    <button
                      onClick={handleDelete}
                      disabled={loading}
                      className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 disabled:opacity-50"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span>{loading ? 'Deleting...' : 'Delete Project'}</span>
                    </button>
                  </motion.div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Description */}
        <p className="text-gray-500 text-sm mb-4 line-clamp-2 min-h-[2.5rem]">
          {project.description || 'No description provided'}
        </p>

        {/* Progress Bar */}
        {taskCount > 0 && (
          <div className="mb-4">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>Progress</span>
              <span>{completedTasks}/{taskCount} tasks</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="h-full rounded-full"
                style={{ backgroundColor: project.color }}
              />
            </div>
          </div>
        )}

        {/* Meta Info */}
        <div className="flex items-center justify-between text-sm text-gray-400 mb-4">
          <div className="flex items-center gap-1.5">
            <Users className="h-4 w-4" />
            <span>{project.members.length}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Calendar className="h-4 w-4" />
            <span>{new Date(project.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between">
          {/* Member Avatars */}
          <div className="flex -space-x-2">
            {project.members.slice(0, 4).map((member, index) => (
              <div
                key={member.user._id}
                className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-xs font-medium"
                style={{ 
                  backgroundColor: `hsl(${(index * 60) + 200}, 70%, 90%)`,
                  color: `hsl(${(index * 60) + 200}, 70%, 40%)`,
                  zIndex: 4 - index
                }}
                title={member.user.name}
              >
                {member.user.name.charAt(0).toUpperCase()}
              </div>
            ))}
            {project.members.length > 4 && (
              <div className="w-8 h-8 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center">
                <span className="text-xs font-medium text-gray-600">
                  +{project.members.length - 4}
                </span>
              </div>
            )}
          </div>
          
          <Link
            to={`/project/${project._id}`}
            className="flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-xl transition-all hover:gap-3"
            style={{ color: project.color }}
          >
            <span>Open</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </motion.div>
  );
};

export default ProjectCard;