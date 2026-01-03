import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, FolderOpen, BarChart3, Users, CheckCircle, Clock, TrendingUp, Zap, Layout } from 'lucide-react';
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
      label: 'Active Projects', 
      value: stats.totalProjects, 
      icon: Layout, 
      gradient: 'from-blue-500 to-indigo-500',
      shadow: 'shadow-blue-200'
    },
    { 
      label: 'Total Tasks', 
      value: stats.totalTasks, 
      icon: BarChart3, 
      gradient: 'from-violet-500 to-purple-500',
      shadow: 'shadow-purple-200'
    },
    { 
      label: 'Completed', 
      value: stats.completedTasks, 
      icon: CheckCircle, 
      gradient: 'from-emerald-400 to-emerald-600',
      shadow: 'shadow-emerald-200'
    },
    { 
      label: 'Team Members', 
      value: stats.teamMembers, 
      icon: Users, 
      gradient: 'from-amber-400 to-orange-500',
      shadow: 'shadow-orange-200'
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <motion.div
           initial={{ opacity: 0 }}
           animate={{ opacity: 1 }}
           className="relative"
        >
          <div className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-10 pb-10">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 py-4"
      >
        <div>
          <h1 className="text-4xl font-bold text-slate-900 tracking-tight">
            Hello, {user?.name?.split(' ')[0]} 👋
          </h1>
          <p className="text-slate-500 mt-2 text-lg">
            Let's make today productive.
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowCreateModal(true)}
          className="bg-slate-900 text-white px-6 py-4 rounded-2xl font-bold hover:bg-slate-800 transition-all flex items-center gap-2 shadow-xl shadow-slate-200"
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
        className="grid grid-cols-2 lg:grid-cols-4 gap-6"
      >
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + index * 0.05 }}
            whileHover={{ y: -5 }}
            className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 border border-white/60 shadow-sm hover:shadow-xl transition-all group"
          >
            <div className="flex justify-between items-start mb-4">
               <div className={`p-3 rounded-2xl bg-gradient-to-br ${stat.gradient} text-white shadow-lg ${stat.shadow}`}>
                 <stat.icon className="h-6 w-6" />
               </div>
               {index === 0 && <span className="flex h-3 w-3 rounded-full bg-emerald-500 ring-4 ring-emerald-50"></span>}
            </div>
            <div>
              <p className="text-4xl font-bold text-slate-900 mb-1">{stat.value}</p>
              <p className="text-slate-500 font-medium text-sm">{stat.label}</p>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Momentum Banner */}
      {projects.length > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="relative overflow-hidden bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-3xl p-8 text-white shadow-2xl shadow-indigo-200"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
          
          <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="flex items-center gap-6">
              <div className="bg-white/20 p-4 rounded-2xl backdrop-blur-sm">
                <Zap className="h-8 w-8 text-yellow-300" />
              </div>
              <div>
                <h3 className="font-bold text-2xl mb-1">Weekly Momentum</h3>
                <p className="text-indigo-100 text-lg">
                  You've completed <span className="font-bold text-white">{stats.completedTasks}</span> tasks across {stats.totalProjects} projects.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-white/10 px-6 py-3 rounded-2xl backdrop-blur-sm border border-white/10">
              <Clock className="h-5 w-5 text-indigo-200" />
              <span className="font-medium text-white">
                {stats.totalTasks - stats.completedTasks} tasks remaining
              </span>
            </div>
          </div>
        </motion.div>
      )}

      {/* Projects Grid */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Layout className="h-6 w-6 text-slate-400" />
            Your Projects
          </h2>
          {projects.length > 0 && (
            <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-sm font-bold">
              {projects.length}
            </span>
          )}
        </div>

        {projects.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white/50 border-2 border-dashed border-slate-200 rounded-3xl p-16 text-center"
          >
            <div className="bg-white p-6 rounded-full w-fit mx-auto mb-6 shadow-sm ring-1 ring-slate-100">
              <FolderOpen className="h-10 w-10 text-indigo-500" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">No projects yet</h3>
            <p className="text-slate-500 mb-8 max-w-md mx-auto">
              Create your first project to start organizing tasks and collaborating with your team.
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
            >
              Create Project
            </button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {projects.map((project, index) => (
              <motion.div
                key={project._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
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
