import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { DragDropContext, DropResult } from '@hello-pangea/dnd';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import axios from '../utils/axios';
import KanbanColumn from '../components/KanbanColumn';
import CreateTaskModal from '../components/CreateTaskModal';
import TaskDetailModal from '../components/TaskDetailModal';
import InviteMemberModal from '../components/InviteMemberModal';
import TaskFilters from '../components/TaskFilters';
import ProjectAnalytics from '../components/ProjectAnalytics';
import { Users, UserPlus, BarChart3, Activity, Settings } from 'lucide-react';
import { Link } from 'react-router-dom';

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
  settings?: {
    allowComments: boolean;
    allowFileUploads: boolean;
  };
}

const ProjectBoard: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
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
  const removeDuplicateTasks = useCallback((tasksArray: Task[]): Task[] => {
    const uniqueTasks = new Map<string, Task>();
    tasksArray.forEach(task => {
      uniqueTasks.set(task._id, task);
    });
    return Array.from(uniqueTasks.values());
  }, []);

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
  }, [id, removeDuplicateTasks]);

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

      socket.on('comment-added', (data: { taskId: string; comment: Task['comments'][0] }) => {
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

    // If dropped in same place
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) {
      return;
    }

    const task = tasks.find(t => t._id === draggableId);
    if (!task) return;

    const newStatus = destination.droppableId;
    const oldStatus = task.status;
    const oldColumnId = task.columnId;

    // 1. Optimistic Update: Update UI immediately
    setTasks(prev =>
      prev.map(t =>
        t._id === draggableId
          ? { ...t, status: newStatus, columnId: newStatus }
          : t
      )
    );

    try {
      // 2. Call API in background
      await axios.put(`/api/tasks/${draggableId}`, {
        status: newStatus,
        columnId: newStatus
      });
    } catch (error) {
      console.error('Error updating task:', error);
      
      // 3. Rollback on error
      setTasks(prev =>
        prev.map(t =>
          t._id === draggableId
            ? { ...t, status: oldStatus, columnId: oldColumnId }
            : t
        )
      );
      // Optional: Show error toast
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
    console.log('📝 ProjectBoard: handleTaskUpdated called', updatedTask);
    setTasks(prev => prev.map(t => t._id === updatedTask._id ? updatedTask : t));
  };

  const handleTaskDeleted = (taskId: string) => {
    setTasks(prev => prev.filter(t => t._id !== taskId));
    setSelectedTask(null);
  };

  const canInviteMembers = () => {
    if (!project || !user) return false;
    const userMember = project.members.find(member => 
      member.user._id === user.id || member.user._id === user.id // Check ID match
      // Note: user.id from AuthContext might be string, member.user._id might be string.
    );
    // Actually, let's look at user object structure in AuthContext.
    // user.id
    // member.user might be populated object OR id string.
    // In ProjectBoard fetch: .populate('members.user', 'name email')
    // So member.user is an object with _id.
    
    // Let's rely on robust check:
    const memberRecord = project.members.find(m => m.user._id === user.id);
    return memberRecord && ['admin', 'member'].includes(memberRecord.role);
  };

  const isAdmin = () => {
    if (!project || !user) return false;
    const memberRecord = project.members.find(m => m.user._id === user.id);
    return memberRecord && memberRecord.role === 'admin';
  };

  const canCreateTask = () => {
    if (!project || !user) return false;
    const memberRecord = project.members.find(m => m.user._id === user.id);
    return memberRecord && ['admin', 'member'].includes(memberRecord.role);
  };
  
  const isViewer = () => {
     if (!project || !user) return false;
     const memberRecord = project.members.find(m => m.user._id === user.id);
     return memberRecord?.role === 'viewer';
  };

  // Clean up tasks on component mount to remove any existing duplicates
  useEffect(() => {
    if (tasks.length > 0) {
      const uniqueTasks = removeDuplicateTasks(tasks);
      if (uniqueTasks.length !== tasks.length) {
        setTasks(uniqueTasks);
      }
    }
  }, [tasks.length, tasks, removeDuplicateTasks]);

  // Keep selectedTask in sync with tasks state
  useEffect(() => {
    if (selectedTask) {
      const updatedTask = tasks.find(t => t._id === selectedTask._id);
      if (updatedTask && JSON.stringify(updatedTask) !== JSON.stringify(selectedTask)) {
        console.log('🔄 ProjectBoard: Syncing selectedTask', {
          current: selectedTask,
          updated: updatedTask,
          diff_attachments: updatedTask.attachments.length !== selectedTask.attachments.length
        });
        setSelectedTask(updatedTask);
      }
    }
  }, [tasks, selectedTask]);

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
    <div className="h-[calc(100vh-6rem)] flex flex-col">
      <div className="space-y-6 mb-6">
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
              <div className="absolute right-0 mt-2 w-72 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                <div className="p-2 max-h-80 overflow-y-auto custom-scrollbar">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-2">Project Members</h3>
                  {project.members.length > 0 ? (
                    project.members.map(({ user: memberUser, role }) => (
                      <div key={memberUser._id} className="p-2 hover:bg-gray-50 rounded flex items-center justify-between group">
                        <div className="flex-1 min-w-0 mr-2">
                          <p className="text-sm font-medium text-gray-800 truncate">{memberUser.name}</p>
                          <p className="text-xs text-gray-500 truncate">{memberUser.email}</p>
                        </div>
                        
                        {/* Role Management */}
                        {(user?.id && project.members.find(m => m.user._id === user.id)?.role.match(/^(owner|admin)$/)) && memberUser._id !== user.id && role !== 'owner' ? (
                          <select
                            value={role}
                            onChange={async (e) => {
                              try {
                                await axios.put(`/api/projects/${id}/members/${memberUser._id}/role`, {
                                  role: e.target.value
                                });
                                fetchProject(); // Refresh
                              } catch (err) {
                                console.error('Failed to update role', err);
                                alert('Failed to update role');
                              }
                            }}
                            className="text-xs border border-gray-200 rounded px-1 py-0.5 bg-white focus:outline-none focus:border-blue-500 cursor-pointer"
                          >
                            <option value="member">Member</option>
                            <option value="viewer">Viewer</option>
                            <option value="admin">Admin</option>
                          </select>
                        ) : (
                          <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${
                            role === 'owner' ? 'bg-purple-100 text-purple-700' :
                            role === 'admin' ? 'bg-blue-100 text-blue-700' :
                            role === 'viewer' ? 'bg-gray-100 text-gray-700' :
                            'bg-green-100 text-green-700'
                          }`}>
                            {role}
                          </span>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500 p-2">No members yet</p>
                  )}
                </div>
              </div>
            )}
          </div>

            {/* Settings Button */}
            {isAdmin() && (
              <Link
                to={`/project/${project._id}/settings`}
                className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Settings className="h-4 w-4" />
                <span>Settings</span>
              </Link>
            )}

            {canInviteMembers() && (
              <button
                onClick={() => setShowInviteModal(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                disabled={loading}
              >
                <UserPlus className="h-4 w-4" />
                <span>Invite</span>
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
                  onCreateTask={canCreateTask() ? () => handleCreateTask(column.id) : undefined}
                  onTaskClick={handleTaskClick}
                  isViewer={isViewer()}
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

      </div>


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
          settings={project.settings}
        />
      )}
    </div>
  );
};

export default ProjectBoard;