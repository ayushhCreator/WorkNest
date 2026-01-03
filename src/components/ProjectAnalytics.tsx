import React, { useState, useEffect } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, PointElement, LineElement } from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import axios from '../utils/axios';
import { BarChart3, TrendingUp, Users, Clock, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, PointElement, LineElement);

interface ProjectAnalyticsProps {
  projectId: string;
}

interface AnalyticsData {
  taskStats: {
    todo: number;
    inprogress: number;
    done: number;
  };
  priorityStats: {
    low: number;
    medium: number;
    high: number;
    urgent: number;
  };
  assigneeStats: Array<{
    name: string;
    total: number;
    completed: number;
    pending: number;
  }>;
  completionTrend: Array<{
    _id: string;
    count: number;
  }>;
  overdueTasks: number;
  totalTasks: number;
  totalMembers: number;
}

const ProjectAnalytics: React.FC<ProjectAnalyticsProps> = ({ projectId }) => {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('30');

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`/api/analytics/project/${projectId}?timeframe=${timeframe}`);
        setAnalytics(response.data);
      } catch (error) {
        console.error('Error fetching analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [projectId, timeframe]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center py-8 text-gray-500">
        Failed to load analytics data
      </div>
    );
  }

  const taskStatusData = {
    labels: ['To Do', 'In Progress', 'Done'],
    datasets: [
      {
        data: [analytics.taskStats.todo, analytics.taskStats.inprogress, analytics.taskStats.done],
        backgroundColor: ['#F59E0B', '#3B82F6', '#10B981'],
        borderColor: ['#D97706', '#2563EB', '#059669'],
        borderWidth: 2,
      },
    ],
  };

  const priorityData = {
    labels: ['Low', 'Medium', 'High', 'Urgent'],
    datasets: [
      {
        label: 'Tasks by Priority',
        data: [analytics.priorityStats.low, analytics.priorityStats.medium, analytics.priorityStats.high, analytics.priorityStats.urgent],
        backgroundColor: ['#10B981', '#F59E0B', '#EF4444', '#DC2626'],
        borderColor: ['#059669', '#D97706', '#DC2626', '#B91C1C'],
        borderWidth: 1,
      },
    ],
  };

  const assigneeData = {
    labels: analytics.assigneeStats.map(stat => stat.name),
    datasets: [
      {
        label: 'Completed',
        data: analytics.assigneeStats.map(stat => stat.completed),
        backgroundColor: '#10B981',
        borderRadius: 4,
      },
      {
        label: 'Pending',
        data: analytics.assigneeStats.map(stat => stat.pending),
        backgroundColor: '#F59E0B',
        borderRadius: 4,
      },
    ],
  };

  const trendData = {
    labels: analytics.completionTrend.map(item => item._id), // Date strings
    datasets: [
      {
        label: 'Tasks Completed',
        data: analytics.completionTrend.map(item => item.count),
        borderColor: '#3B82F6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
        fill: true,
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
    },
  };

  const completionRate = analytics.totalTasks > 0 
    ? Math.round((analytics.taskStats.done / analytics.totalTasks) * 100) 
    : 0;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-2xl font-bold text-gray-900">Project Overview</h3>
          <p className="text-gray-500 text-sm mt-1">Real-time insights and performance metrics</p>
        </div>
        <div className="flex items-center space-x-3">
          <Calendar className="h-4 w-4 text-gray-500" />
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm font-medium text-gray-700 cursor-pointer hover:border-blue-300 transition-colors"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
          </select>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div 
          whileHover={{ y: -5 }}
          className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-50 rounded-lg">
              <BarChart3 className="h-6 w-6 text-blue-600" />
            </div>
            <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-full">Total</span>
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Total Tasks</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{analytics.totalTasks}</p>
          </div>
        </motion.div>

        <motion.div 
          whileHover={{ y: -5 }}
          className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-50 rounded-lg">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
            <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">Rate</span>
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Completion Rate</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{completionRate}%</p>
          </div>
        </motion.div>

        <motion.div 
          whileHover={{ y: -5 }}
          className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-50 rounded-lg">
              <Users className="h-6 w-6 text-purple-600" />
            </div>
            <span className="text-xs font-medium text-purple-600 bg-purple-50 px-2 py-1 rounded-full">Team</span>
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Team Members</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{analytics.totalMembers}</p>
          </div>
        </motion.div>

        <motion.div 
          whileHover={{ y: -5 }}
          className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-red-50 rounded-lg">
              <Clock className="h-6 w-6 text-red-600" />
            </div>
            <span className="text-xs font-medium text-red-600 bg-red-50 px-2 py-1 rounded-full">Alert</span>
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Overdue Tasks</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{analytics.overdueTasks}</p>
          </div>
        </motion.div>
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend Chart - Spans 2 columns */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-2 bg-white p-6 rounded-xl border border-gray-100 shadow-sm"
        >
          <h4 className="text-lg font-bold text-gray-900 mb-6">Completion Trend</h4>
          <div className="h-80">
            <Line data={trendData} options={{...chartOptions, maintainAspectRatio: false }} />
          </div>
        </motion.div>

        {/* Status Distribution */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm"
        >
          <h4 className="text-lg font-bold text-gray-900 mb-6">Status Overview</h4>
          <div className="h-64 flex items-center justify-center">
            <Doughnut data={taskStatusData} options={chartOptions} />
          </div>
        </motion.div>
      </div>

      {/* Secondary Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm"
        >
          <h4 className="text-lg font-bold text-gray-900 mb-6">Tasks by Priority</h4>
          <div className="h-64">
            <Bar data={priorityData} options={chartOptions} />
          </div>
        </motion.div>

        {analytics.assigneeStats.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm"
          >
            <h4 className="text-lg font-bold text-gray-900 mb-6">Team Performance</h4>
            <div className="h-64">
              <Bar data={assigneeData} options={chartOptions} />
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default ProjectAnalytics;