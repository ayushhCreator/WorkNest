import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { useSocket } from '../context/SocketContext';
import axios from '../utils/axios';
import KanbanColumn from '../components/KanbanColumn';
import CreateTaskModal from '../components/CreateTaskModal';
import TaskDetailModal from '../components/TaskDetailModal';
import InviteMemberModal from '../components/InviteMemberModal';
import TaskFilters from '../components/TaskFilters';
import ProjectAnalytics from '../components/ProjectAnalytics';
import { Users, Settings, UserPlus, BarChart3, Activity } from 'lucide-react';

interface Task {
  _id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  assignee?: {
    _id: string;
    name: string;
    email: string;
  };
  dueDate?: string;
  columnId: string;
  attachments: Array<{
    _id: string;
    filename: string;
    originalName: string;
    url: string;
    size: number;
    mimetype: string;
    uploadedBy: {
      _id: string;
      name: string;
      email: string;
    };
    uploadedAt: string;
  }>;
  comments: Array<{
    _id: string;
    user: {
      _id: string;
      name: string;
      email: string;
    };
    text: string;
    timestamp: string;
  }>;
}

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
  columns: Array<{
    id: string;
    title: string;
    taskIds: string[];
  }>;
  activityLogs: Array<{
    _id: string;
    user: {
      name: string;
      email: string;
    };
    action: string;
    description: string;
    createdAt: string;
  }>;
}

const ProjectBoard: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [selectedColumn, setSelectedColumn] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'board' | 'analytics' | 'activity'>('board');
  const [showMemberDropdown, setShowMemberDropdown] = useState(false);

  // Filters
  const [search, setSearch] = useState('');
  const [assigneeFilter, setAssigneeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');

  const { socket } = useSocket();


  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.member-dropdown-button') && !target.closest('.member-dropdown-list')) {
        setShowMemberDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);




  // Helper function to remove duplicates from tasks array
  const removeDuplicateTasks = (tasksArray: Task[]): Task[] => {
    const uniqueTasks = new Map<string, Task>();
    tasksArray.forEach(task => {
      uniqueTasks.set(task._id, task);
    });
    return Array.from(uniqueTasks.values());
  };

  const fetchProject = useCallback(async () => {
    try {
      const response = await axios.get(`/api/projects/${id}`);
      setProject(response.data);
    } catch (error) {
      console.error('Error fetching project:', error);
    }
  }, [id]);

  const fetchTasks = useCallback(async () => {
    try {
      const response = await axios.get(`/api/tasks/project/${id}`);
      const tasksData = response.data.tasks || response.data;
      // Remove duplicates when setting tasks
      setTasks(removeDuplicateTasks(tasksData));
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      fetchProject();
      fetchTasks();
    }
  }, [id, fetchProject, fetchTasks]);

  const applyFilters = useCallback(() => {
    let filtered = [...tasks];

    if (search) {
      filtered = filtered.filter(task =>
        task.title.toLowerCase().includes(search.toLowerCase()) ||
        task.description.toLowerCase().includes(search.toLowerCase())
      );
    }

    if (assigneeFilter !== 'all') {
      if (assigneeFilter === '') {
        filtered = filtered.filter(task => !task.assignee);
      } else {
        filtered = filtered.filter(task => task.assignee?._id === assigneeFilter);
      }
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(task => task.status === statusFilter);
    }

    if (priorityFilter !== 'all') {
      filtered = filtered.filter(task => task.priority === priorityFilter);
    }

    setFilteredTasks(filtered);
  }, [tasks, search, assigneeFilter, statusFilter, priorityFilter]);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  useEffect(() => {
    if (socket && id) {
      socket.emit('join-project', id);

      socket.on('task-created', (task: Task) => {
        setTasks(prev => {
          // Check if task already exists to prevent duplicates
          const taskExists = prev.some(t => t._id === task._id);
          if (taskExists) {
            return prev;
          }
          return [task, ...prev];
        });
      });

      socket.on('task-updated', (task: Task) => {
        setTasks(prev => prev.map(t => t._id === task._id ? task : t));
      });

      socket.on('task-deleted', (data: { taskId: string }) => {
        setTasks(prev => prev.filter(t => t._id !== data.taskId));
      });

      socket.on('comment-added', (data: { taskId: string; comment: any }) => {
        setTasks(prev => prev.map(t =>
          t._id === data.taskId
            ? { ...t, comments: [...t.comments, data.comment] }
            : t
        ));
      });

      return () => {
        socket.emit('leave-project', id);
        socket.off('task-created');
        socket.off('task-updated');
        socket.off('task-deleted');
        socket.off('comment-added');
      };
    }
  }, [socket, id]);

  const clearFilters = () => {
    setSearch('');
    setAssigneeFilter('all');
    setStatusFilter('all');
    setPriorityFilter('all');
  };

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return;

    const { source, destination, draggableId } = result;

    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) {
      return;
    }

    const task = tasks.find(t => t._id === draggableId);
    if (!task) return;

    const newStatus = destination.droppableId;

    try {
      await axios.put(`/api/tasks/${draggableId}`, {
        status: newStatus,
        columnId: newStatus
      });

      setTasks(prev =>
        prev.map(t =>
          t._id === draggableId
            ? { ...t, status: newStatus, columnId: newStatus }
            : t
        )
      );
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };



  const handleCreateTask = (columnId: string) => {
    setSelectedColumn(columnId);
    setShowCreateModal(true);
  };

  const handleTaskCreated = (newTask: Task) => {
    setTasks(prev => {
      // Check if task already exists to prevent duplicates
      const taskExists = prev.some(t => t._id === newTask._id);
      if (taskExists) {
        return prev;
      }
      return [newTask, ...prev];
    });
    setShowCreateModal(false);
  };

  const handleTaskClick = (task: Task) => {
    if (!task.attachments) {
      task.attachments = [];
    }
    setSelectedTask(task);
  };

  const handleTaskUpdated = (updatedTask: Task) => {
    setTasks(prev => prev.map(t => t._id === updatedTask._id ? updatedTask : t));
  };

  const handleTaskDeleted = (taskId: string) => {
    setTasks(prev => prev.filter(t => t._id !== taskId));
    setSelectedTask(null);
  };

  const canInviteMembers = () => {
    if (!project) return false;
    const userMember = project.members.find(member =>
      ['owner', 'admin'].includes(member.role)
    );
    return !!userMember;
  };

  // Clean up tasks on component mount to remove any existing duplicates
  useEffect(() => {
    if (tasks.length > 0) {
      const uniqueTasks = removeDuplicateTasks(tasks);
      if (uniqueTasks.length !== tasks.length) {
        setTasks(uniqueTasks);
      }
    }
  }, [tasks.length]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Project not found</h2>
        <p className="text-gray-600">The project you're looking for doesn't exist or you don't have access to it.</p>
      </div>
    );
  }

  const columns = [
    { id: 'todo', title: 'To Do', status: 'todo' },
    { id: 'inprogress', title: 'In Progress', status: 'inprogress' },
    { id: 'done', title: 'Done', status: 'done' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <div
            className="w-4 h-4 rounded-full"
            style={{ backgroundColor: project.color }}
          />
          <div>
            <h1 className="text- font-bold text-gray-900">{project.title}</h1>
            <p className="text-gray-600 mt-1">{project.description}</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          {/* to see all memebers */}
          <div className="relative">
            <button
              onClick={() => setShowMemberDropdown(prev => !prev)}
              className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-800"
            >
              <Users className="h-5 w-5 text-gray-500" />
              <span>{project.members.length} members</span>
            </button>

            {showMemberDropdown && (
              <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                <div className="p-2 max-h-60 overflow-y-auto">
                  {project.members.length > 0 ? (
                    project.members.map(({ user, role }) => (
                      <div key={user._id} className="p-2 hover:bg-gray-100 rounded">
                        <p className="text-sm font-medium text-gray-800">{user.name}</p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                        <p className="text-xs italic text-gray-400">{role}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500 p-2">No members yet</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {canInviteMembers() && (
            <button
              onClick={() => setShowInviteModal(true)}
              className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <UserPlus className="h-4 w-4" />
              {/* <span>Invite</span> */}
            </button>
          )}
          {/* <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <Settings className="h-5 w-5 text-gray-500" />
          </button> */}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('board')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'board'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
          >
            Kanban Board
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${activeTab === 'analytics'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
          >
            <BarChart3 className="h-4 w-4" />
            <span>Analytics</span>
          </button>
          <button
            onClick={() => setActiveTab('activity')}
            className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${activeTab === 'activity'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
          >
            <Activity className="h-4 w-4" />
            <span>Activity</span>
          </button>
        </nav>
      </div>

      {activeTab === 'board' && (
        <>
          <TaskFilters
            search={search}
            setSearch={setSearch}
            assigneeFilter={assigneeFilter}
            setAssigneeFilter={setAssigneeFilter}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            priorityFilter={priorityFilter}
            setPriorityFilter={setPriorityFilter}
            members={project.members}
            onClearFilters={clearFilters}
          />

          <DragDropContext onDragEnd={handleDragEnd}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {columns.map((column) => (
                <KanbanColumn
                  key={column.id}
                  column={column}
                  tasks={filteredTasks.filter(task => task.status === column.status)}
                  onCreateTask={() => handleCreateTask(column.id)}
                  onTaskClick={handleTaskClick}
                />
              ))}
            </div>
          </DragDropContext>
        </>
      )}

      {activeTab === 'analytics' && (
        <ProjectAnalytics projectId={id!} />
      )}

      {activeTab === 'activity' && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
          <div className="space-y-4">
            {project.activityLogs?.map((log) => (
              <div key={log._id} className="flex items-start space-x-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                  <span className="text-xs font-medium text-blue-600">
                    {log.user.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-900">{log.description}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(log.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {showCreateModal && (
        <CreateTaskModal
          projectId={id!}
          columnId={selectedColumn}
          members={project.members}
          onClose={() => setShowCreateModal(false)}
          onTaskCreated={handleTaskCreated}
        />
      )}

      {showInviteModal && (
        <InviteMemberModal
          projectId={id!}
          onClose={() => setShowInviteModal(false)}
          onInviteSent={() => {
            setShowInviteModal(false);
            fetchProject();
          }}
        />
      )}

      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          members={project.members}
          onClose={() => setSelectedTask(null)}
          onTaskUpdated={handleTaskUpdated}
          onTaskDeleted={handleTaskDeleted}
        />
      )}
    </div>
  );
};

export default ProjectBoard;