import React from 'react';
import { motion } from 'framer-motion';
import { Droppable, Draggable } from '@hello-pangea/dnd';
import TaskCard from './TaskCard';
import { Plus, MoreHorizontal } from 'lucide-react';

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

interface Column {
  id: string;
  title: string;
  status: string;
}

interface KanbanColumnProps {
  column: Column;
  tasks: Task[];
  onCreateTask?: () => void;
  onTaskClick: (task: Task) => void;
  isViewer?: boolean;
}

const KanbanColumn: React.FC<KanbanColumnProps> = ({ column, tasks, onCreateTask, onTaskClick, isViewer = false }) => {
  const getColumnStyle = (status: string) => {
    switch (status) {
      case 'todo':
        return {
          bg: 'bg-gradient-to-b from-amber-50 to-orange-50',
          border: 'border-amber-200',
          badge: 'bg-amber-100 text-amber-700',
          dot: 'bg-amber-500'
        };
      case 'inprogress':
        return {
          bg: 'bg-gradient-to-b from-blue-50 to-indigo-50',
          border: 'border-blue-200',
          badge: 'bg-blue-100 text-blue-700',
          dot: 'bg-blue-500'
        };
      case 'review':
        return {
          bg: 'bg-gradient-to-b from-purple-50 to-pink-50',
          border: 'border-purple-200',
          badge: 'bg-purple-100 text-purple-700',
          dot: 'bg-purple-500'
        };
      case 'done':
        return {
          bg: 'bg-gradient-to-b from-green-50 to-emerald-50',
          border: 'border-green-200',
          badge: 'bg-green-100 text-green-700',
          dot: 'bg-green-500'
        };
      default:
        return {
          bg: 'bg-gradient-to-b from-gray-50 to-slate-50',
          border: 'border-gray-200',
          badge: 'bg-gray-100 text-gray-700',
          dot: 'bg-gray-500'
        };
    }
  };

  const style = getColumnStyle(column.status);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl border ${style.border} ${style.bg} p-4 min-h-[500px] flex flex-col`}
    >
      {/* Column Header */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${style.dot}`} />
          <h3 className="font-semibold text-gray-900">{column.title}</h3>
          <span className={`${style.badge} rounded-full px-2.5 py-0.5 text-xs font-medium`}>
            {tasks.length}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {!isViewer && onCreateTask && (
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={onCreateTask}
              className="p-1.5 rounded-lg hover:bg-white/60 transition-colors"
            >
              <Plus className="h-4 w-4 text-gray-500" />
            </motion.button>
          )}
          <button className="p-1.5 rounded-lg hover:bg-white/60 transition-colors">
            <MoreHorizontal className="h-4 w-4 text-gray-400" />
          </button>
        </div>
      </div>

      {/* Droppable Area */}
      <Droppable droppableId={column.status} isDropDisabled={isViewer}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`flex-1 space-y-3 rounded-xl p-2 transition-all ${
              snapshot.isDraggingOver 
                ? 'bg-white/60 ring-2 ring-blue-300 ring-dashed' 
                : ''
            }`}
          >
            {tasks.length === 0 && !snapshot.isDraggingOver && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-8 text-center"
              >
                <div className="text-gray-400 text-sm">No tasks yet</div>
                {!isViewer && onCreateTask && (
                  <button
                    onClick={onCreateTask}
                    className="mt-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    + Add a task
                  </button>
                )}
              </motion.div>
            )}

            {tasks.map((task, index) => (
              <Draggable key={task._id} draggableId={String(task._id)} index={index} isDragDisabled={isViewer}>
                {(provided, snapshot) => (
                  <motion.div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`transition-transform ${
                      snapshot.isDragging ? 'rotate-2 scale-105 shadow-xl z-50' : ''
                    } ${isViewer ? 'cursor-default' : 'cursor-grab active:cursor-grabbing'}`}
                  >
                    <TaskCard task={task} onClick={() => onTaskClick(task)} />
                  </motion.div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>

      {/* Quick Add Button */}
      {!isViewer && onCreateTask && (
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={onCreateTask}
        className="mt-3 w-full py-2.5 rounded-xl border-2 border-dashed border-gray-200 text-gray-500 text-sm font-medium hover:border-gray-300 hover:text-gray-600 hover:bg-white/50 transition-all flex items-center justify-center gap-2"
      >
        <Plus className="h-4 w-4" />
        Add Task
      </motion.button>
      )}
    </motion.div>
  );
};

export default KanbanColumn;
