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
import { Users, UserPlus, BarChart3, Activity, Settings, Layout, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

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
          const taskExists = prev.some(t => t._id === task._id);
          if (taskExists) return prev;
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

    setTasks(prev =>
      prev.map(t =>
        t._id === draggableId
          ? { ...t, status: newStatus, columnId: newStatus }
          : t
      )
    );

    try {
      await axios.put(`/api/tasks/${draggableId}`, {
        status: newStatus,
        columnId: newStatus
      });
    } catch (error) {
      console.error('Error updating task:', error);
      setTasks(prev =>
        prev.map(t =>
          t._id === draggableId
            ? { ...t, status: oldStatus, columnId: oldColumnId }
            : t
        )
      );
    }
  };

  const handleCreateTask = (columnId: string) => {
    setSelectedColumn(columnId);
    setShowCreateModal(true);
  };

  const handleTaskCreated = (newTask: Task) => {
    setShowCreateModal(false);
  };

  const handleTaskClick = (task: Task) => {
    if (!task.attachments) task.attachments = [];
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
    if (!project || !user) return false;
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

  useEffect(() => {
    if (tasks.length > 0) {
      const uniqueTasks = removeDuplicateTasks(tasks);
      if (uniqueTasks.length !== tasks.length) {
        setTasks(uniqueTasks);
      }
    }
  }, [tasks.length, tasks, removeDuplicateTasks]);

  useEffect(() => {
    if (selectedTask) {
      const updatedTask = tasks.find(t => t._id === selectedTask._id);
      if (updatedTask && JSON.stringify(updatedTask) !== JSON.stringify(selectedTask)) {
        setSelectedTask(updatedTask);
      }
    }
  }, [tasks, selectedTask]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Project not found</h2>
        <p className="text-slate-500">The project you're looking for doesn't exist or you don't have access to it.</p>
      </div>
    );
  }

  const columns = [
    { id: 'todo', title: 'To Do', status: 'todo' },
    { id: 'inprogress', title: 'In Progress', status: 'inprogress' },
    { id: 'done', title: 'Done', status: 'done' }
  ];

  return (
    <div className="h-full flex flex-col font-sans">
      {/* Header */}
      <div className="px-4 sm:px-6 lg:px-8 bg-white/70 backdrop-blur-xl border-b border-white/60 pt-6 pb-0 shadow-sm shadow-indigo-100/20 z-10 shrink-0">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 mb-6">
          <div className="flex items-start gap-4">
            <div 
               className="w-12 h-12 rounded-2xl shadow-lg border-2 border-white transform transition-transform hover:scale-105"
               style={{ backgroundColor: project.color }}
            />
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{project.title}</h1>
              <p className="text-slate-500 text-sm max-w-xl line-clamp-1">{project.description}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative group z-20">
              <button
                onClick={() => setShowMemberDropdown(prev => !prev)}
                className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm member-dropdown-button"
              >
                <div className="flex -space-x-2">
                    {project.members.slice(0, 3).map((m, i) => (
                       <div key={i} className="w-6 h-6 rounded-full bg-slate-200 border-2 border-white flex items-center justify-center text-[10px] font-bold text-slate-600">
                          {m.user.name.charAt(0)}
                       </div>
                    ))}
                </div>
                <span className="text-sm font-medium text-slate-600">{project.members.length} members</span>
              </button>

              {showMemberDropdown && (
                <div className="absolute top-full right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 p-2 member-dropdown-list z-50">
                   <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-3 py-2">Team Members</h3>
                   <div className="max-h-64 overflow-y-auto custom-scrollbar space-y-1">
                      {project.members.map((member) => (
                         <div key={member.user._id} className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 transition-colors">
                            <div className="flex items-center gap-3">
                               <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center text-xs font-bold">
                                  {member.user.name.charAt(0)}
                               </div>
                               <div>
                                  <p className="text-sm font-bold text-slate-700">{member.user.name}</p>
                                  <p className="text-xs text-slate-400">{member.role}</p>
                               </div>
                            </div>
                         </div>
                      ))}
                   </div>
                   {canInviteMembers() && (
                      <button 
                        onClick={() => setShowInviteModal(true)}
                        className="w-full mt-2 flex items-center justify-center gap-2 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-sm font-bold hover:bg-indigo-100 transition-colors"
                      >
                         <UserPlus className="w-4 h-4" /> Invite Member
                      </button>
                   )}
                </div>
              )}
            </div>

            {isAdmin() && (
               <Link
                 to={`/project/${project._id}/settings`}
                 className="p-2 bg-white border border-slate-200 text-slate-600 rounded-xl hover:text-indigo-600 hover:border-indigo-200 transition-all shadow-sm"
               >
                 <Settings className="h-5 w-5" />
               </Link>
            )}

            {canCreateTask() && (
               <button
                  onClick={() => handleCreateTask('todo')}
                  className="bg-slate-900 text-white px-4 py-2 rounded-xl font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-200 flex items-center gap-2"
               >
                  <Plus className="h-4 w-4" /> <span className="hidden sm:inline">New Task</span>
               </button>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-8">
           {[
              { id: 'board', label: 'Kanban Board', icon: Layout },
              { id: 'analytics', label: 'Analytics', icon: BarChart3 },
              { id: 'activity', label: 'Activity', icon: Activity }
           ].map((tab) => (
              <button
                 key={tab.id}
                 onClick={() => setActiveTab(tab.id as typeof activeTab)}
                 className={`pb-4 text-sm font-bold flex items-center gap-2 border-b-2 transition-all ${
                    activeTab === tab.id 
                    ? 'border-indigo-600 text-indigo-600' 
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                 }`}
              >
                 <tab.icon className="w-4 h-4" />
                 {tab.label}
              </button>
           ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto md:overflow-hidden bg-[#F8FAFC] p-4 sm:p-6 lg:p-8">
         <AnimatePresence mode="wait">
            {activeTab === 'board' && (
               <motion.div
                  key="board"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="h-full flex flex-col"
               >
                  <div className="mb-6">
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
                  </div>

                  <DragDropContext onDragEnd={handleDragEnd}>
                     {/* Mobile: Vertical Stack */}
                     <div className="block md:hidden space-y-4 pb-4">
                        {columns.map((column) => (
                           <div key={column.id} className="w-full">
                              <KanbanColumn
                                 column={column}
                                 tasks={filteredTasks.filter(task => task.status === column.status)}
                                 onCreateTask={canCreateTask() ? () => handleCreateTask(column.id) : undefined}
                                 onTaskClick={handleTaskClick}
                                 isViewer={isViewer()}
                              />
                           </div>
                        ))}
                     </div>
                     
                     {/* Desktop: Horizontal Scroll */}
                     <div className="hidden md:block flex-1 overflow-x-auto overflow-y-hidden pb-4">
                        <div className="flex h-full gap-6 min-w-[800px]">
                           {columns.map((column) => (
                              <div key={column.id} className="flex-1 min-w-[350px] h-full">
                                 <KanbanColumn
                                    column={column}
                                    tasks={filteredTasks.filter(task => task.status === column.status)}
                                    onCreateTask={canCreateTask() ? () => handleCreateTask(column.id) : undefined}
                                    onTaskClick={handleTaskClick}
                                    isViewer={isViewer()}
                                 />
                              </div>
                           ))}
                        </div>
                     </div>
                  </DragDropContext>
               </motion.div>
            )}

            {activeTab === 'analytics' && (
               <motion.div
                  key="analytics"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="h-full overflow-y-auto custom-scrollbar"
               >
                  <ProjectAnalytics projectId={id!} />
               </motion.div>
            )}

            {activeTab === 'activity' && (
               <motion.div
                  key="activity"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="bg-white rounded-3xl border border-white/60 shadow-sm p-6 overflow-y-auto custom-scrollbar max-w-3xl mx-auto"
               >
                  <h3 className="text-xl font-bold text-slate-900 mb-6">Recent Activity</h3>
                  <div className="space-y-6 relative before:absolute before:inset-y-0 before:left-4 before:w-0.5 before:bg-slate-100">
                     {project.activityLogs?.map((log) => (
                        <div key={log._id} className="relative pl-10">
                           <div className="absolute left-0 top-0 w-8 h-8 rounded-full bg-indigo-50 border-4 border-white flex items-center justify-center text-xs font-bold text-indigo-600">
                              {log.user.name.charAt(0)}
                           </div>
                           <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                              <p className="text-sm font-medium text-slate-900">
                                 <span className="font-bold text-indigo-600">{log.user.name}</span> {log.description.toLowerCase()}
                              </p>
                              <p className="text-xs text-slate-400 mt-2 font-medium">
                                 {new Date(log.createdAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                              </p>
                           </div>
                        </div>
                     ))}
                  </div>
               </motion.div>
            )}
         </AnimatePresence>
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
          onInviteSent={() => { fetchProject(); }}
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