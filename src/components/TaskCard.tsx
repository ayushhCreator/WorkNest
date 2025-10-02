import React from 'react';
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

interface TaskCardProps {
  task: Task;
  onClick: () => void;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, onClick }) => {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date();

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
    >
      <div className="flex items-start justify-between mb-3">
        <h4 className="font-medium text-gray-900 line-clamp-2 flex-1 mr-2">{task.title}</h4>
        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(task.priority)} whitespace-nowrap`}>
          {task.priority}
        </span>
      </div>

      {task.description && (
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{task.description}</p>
      )}

      <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
        <div className="flex items-center space-x-3">
          {task.assignee && (
            <div className="flex items-center space-x-1">
              <User className="h-4 w-4" />
              <span className="truncate max-w-20">{task.assignee.name}</span>
            </div>
          )}
          {task.comments.length > 0 && (
            <div className="flex items-center space-x-1">
              <MessageCircle className="h-4 w-4" />
              <span>{task.comments.length}</span>
            </div>
          )}
          {task.attachments.length > 0 && (
            <div className="flex items-center space-x-1">
              <Paperclip className="h-4 w-4" />
              <span>{task.attachments.length}</span>
            </div>
          )}
        </div>

        {task.estimatedHours && (
          <div className="flex items-center space-x-1">
            <Clock className="h-4 w-4" />
            <span className="text-xs">{task.estimatedHours}h</span>
          </div>
        )}
      </div>

      {task.dueDate && (
        <div className={`flex items-center space-x-1 text-xs ${isOverdue ? 'text-red-600' : 'text-gray-500'}`}>
          {isOverdue && <AlertCircle className="h-4 w-4" />}
          <Calendar className="h-4 w-4" />
          <span>
            {new Date(task.dueDate).toLocaleDateString()}
          </span>
        </div>
      )}
    </div>
  );
};

export default TaskCard;