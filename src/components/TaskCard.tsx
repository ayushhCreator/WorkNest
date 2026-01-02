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
        return { bg: 'bg-red-500', text: 'text-white', label: 'Urgent' };
      case 'high':
        return { bg: 'bg-orange-100', text: 'text-orange-700', label: 'High' };
      case 'medium':
        return { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Medium' };
      case 'low':
        return { bg: 'bg-green-100', text: 'text-green-700', label: 'Low' };
      default:
        return { bg: 'bg-gray-100', text: 'text-gray-700', label: priority };
    }
  };

  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'done';
  const priorityStyle = getPriorityStyle(task.priority);
  const attachmentCount = task.attachments?.length || 0;
  const commentCount = task.comments?.length || 0;

  return (
    <motion.div
      whileHover={{ y: -2 }}
      onClick={onClick}
      className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md hover:border-gray-200 transition-all cursor-pointer group"
    >
      {/* Priority Badge */}
      <div className="flex items-start justify-between mb-3">
        <span className={`${priorityStyle.bg} ${priorityStyle.text} px-2 py-0.5 rounded-md text-xs font-medium`}>
          {priorityStyle.label}
        </span>
        {isOverdue && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="flex items-center gap-1 text-red-500"
          >
            <AlertCircle className="h-4 w-4" />
          </motion.div>
        )}
      </div>

      {/* Title */}
      <h4 className="font-medium text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
        {task.title}
      </h4>

      {/* Description */}
      {task.description && (
        <p className="text-sm text-gray-500 mb-3 line-clamp-2">{task.description}</p>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between">
        {/* Left side - Assignee */}
        <div className="flex items-center gap-2">
          {task.assignee ? (
            <div className="flex items-center gap-1.5">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-medium">
                {task.assignee.name.charAt(0).toUpperCase()}
              </div>
              <span className="text-xs text-gray-500 hidden sm:inline truncate max-w-[80px]">
                {task.assignee.name.split(' ')[0]}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-gray-400">
              <User className="h-4 w-4" />
              <span className="text-xs">Unassigned</span>
            </div>
          )}
        </div>

        {/* Right side - Meta info */}
        <div className="flex items-center gap-3 text-gray-400">
          {commentCount > 0 && (
            <div className="flex items-center gap-1">
              <MessageCircle className="h-3.5 w-3.5" />
              <span className="text-xs">{commentCount}</span>
            </div>
          )}
          {attachmentCount > 0 && (
            <div className="flex items-center gap-1">
              <Paperclip className="h-3.5 w-3.5" />
              <span className="text-xs">{attachmentCount}</span>
            </div>
          )}
          {task.estimatedHours && (
            <div className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              <span className="text-xs">{task.estimatedHours}h</span>
            </div>
          )}
        </div>
      </div>

      {/* Due Date */}
      {task.dueDate && (
        <div className={`mt-3 pt-3 border-t border-gray-100 flex items-center gap-1.5 text-xs ${
          isOverdue ? 'text-red-500' : 'text-gray-500'
        }`}>
          <Calendar className="h-3.5 w-3.5" />
          <span>
            {isOverdue ? 'Overdue: ' : 'Due: '}
            {new Date(task.dueDate).toLocaleDateString('en-US', { 
              month: 'short', 
              day: 'numeric' 
            })}
          </span>
        </div>
      )}
    </motion.div>
  );
};

export default TaskCard;