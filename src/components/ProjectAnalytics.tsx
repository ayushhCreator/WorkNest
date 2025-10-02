import React, { useState, useEffect } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import axios from '../utils/axios';
import { BarChart3, TrendingUp, Users, Clock } from 'lucide-react';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

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
    fetchAnalytics();
  }, [projectId, timeframe]);

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
      },
      {
        label: 'Pending',
        data: analytics.assigneeStats.map(stat => stat.pending),
        backgroundColor: '#F59E0B',
      },
    ],
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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">Project Analytics</h3>
        <select
          value={timeframe}
          onChange={(e) => setTimeframe(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="7">Last 7 days</option>
          <option value="30">Last 30 days</option>
          <option value="90">Last 90 days</option>
        </select>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Tasks</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.totalTasks}</p>
            </div>
            <BarChart3 className="h-8 w-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Completion Rate</p>
              <p className="text-2xl font-bold text-green-600">{completionRate}%</p>
            </div>
            <TrendingUp className="h-8 w-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Team Members</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.totalMembers}</p>
            </div>
            <Users className="h-8 w-8 text-purple-500" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Overdue Tasks</p>
              <p className="text-2xl font-bold text-red-600">{analytics.overdueTasks}</p>
            </div>
            <Clock className="h-8 w-8 text-red-500" />
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Task Status Distribution</h4>
          <div className="h-64">
            <Doughnut data={taskStatusData} options={chartOptions} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Priority Distribution</h4>
          <div className="h-64">
            <Bar data={priorityData} options={chartOptions} />
          </div>
        </div>
      </div>

      {analytics.assigneeStats.length > 0 && (
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Team Performance</h4>
          <div className="h-64">
            <Bar data={assigneeData} options={chartOptions} />
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectAnalytics;