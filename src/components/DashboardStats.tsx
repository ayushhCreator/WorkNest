import React, { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import axios from '../utils/axios';
import {
  BarChart3,
  CheckCircle,
  Clock,
  FolderOpen,
} from 'lucide-react';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

interface Project {
  _id: string;
  title: string;
}

interface DashboardStatsProps {
  projects: Project[];
}

interface Task {
  _id: string;
  title: string;
  status: 'todo' | 'inprogress' | 'done';
}

interface TaskStats {
  total: number;
  todo: number;
  inprogress: number;
  done: number;
  perProject: Record<string, number>;
}

const DashboardStats: React.FC<DashboardStatsProps> = ({ projects }) => {
  const [taskStats, setTaskStats] = useState<TaskStats>({
    total: 0,
    todo: 0,
    inprogress: 0,
    done: 0,
    perProject: {},
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTaskStats();
  }, [projects]);

  const fetchTaskStats = async () => {
    try {
      setLoading(true);
      const responses = await Promise.all(
        projects.map((project) => axios.get(`/api/tasks/project/${project._id}`))
      );

      let total = 0,
        todo = 0,
        inprogress = 0,
        done = 0;
      const perProject: Record<string, number> = {};

      responses.forEach((res, index) => {
        const tasks: Task[] = res.data.tasks || res.data;
        total += tasks.length;
        perProject[projects[index].title] = tasks.length;

        tasks.forEach((task) => {
          if (task.status === 'todo') todo++;
          else if (task.status === 'inprogress') inprogress++;
          else if (task.status === 'done') done++;
        });
      });

      setTaskStats({ total, todo, inprogress, done, perProject });
    } catch (error) {
      console.error('Error fetching task stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const doughnutData = {
    labels: ['To Do', 'In Progress', 'Done'],
    datasets: [
      {
        data: [taskStats.todo, taskStats.inprogress, taskStats.done],
        backgroundColor: ['#F59E0B', '#3B82F6', '#10B981'],
        borderColor: ['#D97706', '#2563EB', '#059669'],
        borderWidth: 2,
      },
    ],
  };

  const barData = {
    labels: Object.keys(taskStats.perProject),
    datasets: [
      {
        label: 'Total Tasks',
        data: Object.values(taskStats.perProject),
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 1,
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

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard label="Total Projects" value={projects.length} icon={<FolderOpen className="h-6 w-6 text-blue-600" />} color="blue" />
        <StatCard label="Total Tasks" value={taskStats.total} icon={<BarChart3 className="h-6 w-6 text-gray-600" />} color="gray" />
        <StatCard label="In Progress" value={taskStats.inprogress} icon={<Clock className="h-6 w-6 text-blue-600" />} color="blue" />
        <StatCard label="Completed" value={taskStats.done} icon={<CheckCircle className="h-6 w-6 text-green-600" />} color="green" />
      </div>

      {taskStats.total > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Task Status Distribution</h3>
            <div className="h-64">
              <Doughnut data={doughnutData} options={chartOptions} />
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Tasks by Project</h3>
            <div className="h-64">
              <Bar data={barData} options={chartOptions} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const StatCard = ({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: string;
}) => (
  <div className="bg-white rounded-xl p-6 border border-gray-200">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-600">{label}</p>
        <p className={`text-2xl font-bold text-${color}-600`}>{value}</p>
      </div>
      <div className={`p-3 bg-${color}-100 rounded-lg`}>{icon}</div>
    </div>
  </div>
);

export default DashboardStats;
