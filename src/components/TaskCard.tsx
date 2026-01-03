import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, MessageCircle, User, AlertCircle, Paperclip, Clock } from 'lucide-react';

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
  estimatedHours?: number;
  attachments?: Array<{
    _id: string;
    filename: string;
    originalName: string;
    url: string;
    size: number;
    mimetype: string;
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

interface TaskCardProps {
  task: Task;
  onClick: () => void;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, onClick }) => {
  const getPriorityStyle = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return { bg: 'bg-rose-50', text: 'text-rose-600', border: 'ring-rose-100', label: 'Urgent' };
      case 'high':
        return { bg: 'bg-orange-50', text: 'text-orange-600', border: 'ring-orange-100', label: 'High' };
      case 'medium':
        return { bg: 'bg-amber-50', text: 'text-amber-600', border: 'ring-amber-100', label: 'Medium' };
      case 'low':
        return { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'ring-emerald-100', label: 'Low' };
      default:
        return { bg: 'bg-slate-50', text: 'text-slate-600', border: 'ring-slate-100', label: priority };
    }
  };

  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'done';
  const priorityStyle = getPriorityStyle(task.priority);
  const attachmentCount = task.attachments?.length || 0;
  const commentCount = task.comments?.length || 0;

  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="bg-white rounded-2xl p-4 shadow-sm shadow-slate-200/50 border border-slate-100 hover:shadow-xl hover:shadow-indigo-100/50 hover:border-indigo-100 transition-all cursor-pointer group relative overflow-hidden"
    >
      {/* Hover decoration */}
      <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity" />

      {/* Header Chips */}
      <div className="flex items-start justify-between mb-3">
        <span className={`${priorityStyle.bg} ${priorityStyle.text} ring-1 ${priorityStyle.border} px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider`}>
          {priorityStyle.label}
        </span>
        {isOverdue && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="flex items-center gap-1 text-rose-500 bg-rose-50 px-2 py-0.5 rounded-full ring-1 ring-rose-100"
          >
            <AlertCircle className="h-3 w-3" />
            <span className="text-[10px] font-bold">Overdue</span>
          </motion.div>
        )}
      </div>

      {/* Main Content */}
      <h4 className="font-bold text-slate-900 mb-1.5 leading-snug group-hover:text-indigo-600 transition-colors">
        {task.title}
      </h4>

      {(task.description) && (
        <p className="text-xs text-slate-500 mb-4 line-clamp-2 leading-relaxed">
           {task.description}
        </p>
      )}

      {/* Tags/Meta Row */}
      <div className="flex items-center gap-3 mb-4">
         {task.dueDate && (
            <div className={`flex items-center gap-1.5 text-xs font-medium ${isOverdue ? 'text-rose-500' : 'text-slate-400'}`}>
               <Calendar className="h-3.5 w-3.5" />
               <span>{new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
            </div>
         )}
         {task.estimatedHours && (
            <div className="flex items-center gap-1.5 text-xs font-medium text-slate-400">
               <Clock className="h-3.5 w-3.5" />
               <span>{task.estimatedHours}h</span>
            </div>
         )}
      </div>

      <div className="h-px w-full bg-slate-50 mb-3" />

      {/* Footer */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {task.assignee && task.assignee.name ? (
            <div className="flex items-center gap-2 pl-1">
              <div className="w-6 h-6 rounded-full bg-indigo-100 ring-2 ring-white flex items-center justify-center text-[10px] font-bold text-indigo-700 shadow-sm">
                {task.assignee.name.charAt(0).toUpperCase()}
              </div>
              <span className="text-xs text-slate-600 font-medium truncate max-w-[80px]">
                {task.assignee.name.split(' ')[0]}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-slate-400 px-1">
              <User className="h-3.5 w-3.5" />
              <span className="text-xs font-medium">Unassigned</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 pr-1">
          {commentCount > 0 && (
            <div className="flex items-center gap-1 text-slate-400 hover:text-indigo-500 transition-colors">
              <MessageCircle className="h-3.5 w-3.5" />
              <span className="text-xs font-bold">{commentCount}</span>
            </div>
          )}
          {attachmentCount > 0 && (
            <div className="flex items-center gap-1 text-slate-400 hover:text-indigo-500 transition-colors">
              <Paperclip className="h-3.5 w-3.5" />
              <span className="text-xs font-bold">{attachmentCount}</span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default TaskCard;