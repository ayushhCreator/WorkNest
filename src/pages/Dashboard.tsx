import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, FolderOpen, BarChart3, Users, CheckCircle, Clock, TrendingUp } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import axios from '../utils/axios';
import ProjectCard from '../components/ProjectCard';
import CreateProjectModal from '../components/CreateProjectModal';

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

interface Stats {
  totalProjects: number;
  totalTasks: number;
  completedTasks: number;
  teamMembers: number;
}

const Dashboard: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [stats, setStats] = useState<Stats>({ totalProjects: 0, totalTasks: 0, completedTasks: 0, teamMembers: 0 });
  const { user } = useAuth();

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await axios.get('/api/projects');
      const projectsData = response.data;
      setProjects(projectsData);
      
      // Calculate stats
      let totalTasks = 0;
      let completedTasks = 0;
      const memberSet = new Set<string>();
      
      projectsData.forEach((project: Project) => {
        if (project.tasks) {
          totalTasks += project.tasks.length;
          completedTasks += project.tasks.filter(t => t.status === 'done').length;
        }
        project.members?.forEach(m => memberSet.add(m.user._id));
      });

      setStats({
        totalProjects: projectsData.length,
        totalTasks,
        completedTasks,
        teamMembers: memberSet.size
      });
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProjectCreated = (newProject: Project) => {
    setProjects([newProject, ...projects]);
    setStats(prev => ({ ...prev, totalProjects: prev.totalProjects + 1 }));
    setShowCreateModal(false);
  };

  const handleProjectDeleted = (projectId: string) => {
    setProjects(projects.filter(p => p._id !== projectId));
    setStats(prev => ({ ...prev, totalProjects: prev.totalProjects - 1 }));
  };

  const statCards = [
    { 
      label: 'Total Projects', 
      value: stats.totalProjects, 
      icon: FolderOpen, 
      color: 'bg-blue-500',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600'
    },
    { 
      label: 'Total Tasks', 
      value: stats.totalTasks, 
      icon: BarChart3, 
      color: 'bg-purple-500',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-600'
    },
    { 
      label: 'Completed', 
      value: stats.completedTasks, 
      icon: CheckCircle, 
      color: 'bg-green-500',
      bgColor: 'bg-green-50',
      textColor: 'text-green-600'
    },
    { 
      label: 'Team Members', 
      value: stats.teamMembers, 
      icon: Users, 
      color: 'bg-orange-500',
      bgColor: 'bg-orange-50',
      textColor: 'text-orange-600'
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center"
        >
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-500">Loading your dashboard...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {user?.name?.split(' ')[0]}! 👋
          </h1>
          <p className="text-gray-500 mt-1">
            Here's what's happening with your projects today.
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowCreateModal(true)}
          className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl font-medium hover:from-blue-700 hover:to-indigo-700 transition-all flex items-center gap-2 shadow-lg shadow-blue-500/25"
        >
          <Plus className="h-5 w-5" />
          <span>New Project</span>
        </motion.button>
      </motion.div>

      {/* Stats Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + index * 0.05 }}
            className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">{stat.label}</p>
                <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
              </div>
              <div className={`${stat.bgColor} p-3 rounded-xl`}>
                <stat.icon className={`h-6 w-6 ${stat.textColor}`} />
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Quick Actions */}
      {projects.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 text-white"
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="bg-white/20 p-3 rounded-xl">
                <TrendingUp className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Keep up the momentum!</h3>
                <p className="text-blue-100">
                  {stats.completedTasks} of {stats.totalTasks} tasks completed
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-200" />
              <span className="text-blue-100">
                {stats.totalTasks - stats.completedTasks} tasks remaining
              </span>
            </div>
          </div>
        </motion.div>
      )}

      {/* Projects Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Your Projects</h2>
          {projects.length > 0 && (
            <span className="text-sm text-gray-500">{projects.length} project{projects.length !== 1 ? 's' : ''}</span>
          )}
        </div>

        {projects.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl border border-dashed border-gray-300 p-12 text-center"
          >
            <div className="bg-gray-100 rounded-full p-4 w-fit mx-auto mb-4">
              <FolderOpen className="h-12 w-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No projects yet</h3>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">
              Create your first project to start organizing tasks and collaborating with your team.
            </p>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
            >
              <Plus className="h-5 w-5" />
              Create Your First Project
            </motion.button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project, index) => (
              <motion.div
                key={project._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + index * 0.05 }}
              >
                <ProjectCard
                  project={project}
                  onProjectDeleted={handleProjectDeleted}
                />
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {showCreateModal && (
        <CreateProjectModal
          onClose={() => setShowCreateModal(false)}
          onProjectCreated={handleProjectCreated}
        />
      )}
    </div>
  );
};

export default Dashboard;
