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
          bg: 'bg-slate-50/50',
          headerBg: 'bg-white',
          border: 'border-slate-200/60',
          badge: 'bg-indigo-100 text-indigo-700',
          indicator: 'bg-indigo-500'
        };
      case 'inprogress':
        return {
          bg: 'bg-slate-50/50',
          headerBg: 'bg-white',
          border: 'border-slate-200/60',
          badge: 'bg-amber-100 text-amber-700',
          indicator: 'bg-amber-500'
        };
      case 'done':
        return {
           bg: 'bg-slate-50/50',
           headerBg: 'bg-white',
           border: 'border-slate-200/60',
           badge: 'bg-emerald-100 text-emerald-700',
           indicator: 'bg-emerald-500'
        };
      default:
        return {
           bg: 'bg-slate-50/50',
           headerBg: 'bg-white',
           border: 'border-slate-200/60',
           badge: 'bg-slate-100 text-slate-700',
           indicator: 'bg-slate-500'
        };
    }
  };

  const style = getColumnStyle(column.status);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl md:rounded-3xl border ${style.border} ${style.bg} backdrop-blur-sm p-3 md:p-4 h-full flex flex-col shadow-sm w-full`}
    >
      {/* Column Header */}
      <div className={`flex justify-between items-center mb-3 md:mb-4 p-2 md:p-3 rounded-2xl ${style.headerBg} shadow-sm border border-slate-100`}>
        <div className="flex items-center gap-2 md:gap-3">
          <div className={`w-2 h-2 md:w-2.5 md:h-2.5 rounded-full ring-2 md:ring-4 ring-opacity-20 ${style.indicator} ring-${style.indicator.split('-')[1]}-200`} />
          <h3 className="font-bold text-slate-900 text-xs md:text-sm tracking-wide">{column.title}</h3>
          <span className={`${style.badge} rounded-full px-2 md:px-2.5 py-0.5 text-xs font-bold`}>
            {tasks.length}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {!isViewer && onCreateTask && (
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={onCreateTask}
              className="p-1 md:p-1.5 rounded-lg hover:bg-slate-50 transition-colors"
            >
              <Plus className="h-3.5 w-3.5 md:h-4 md:w-4 text-slate-500" />
            </motion.button>
          )}
        </div>
      </div>

      {/* Droppable Area */}
      <Droppable droppableId={column.status} isDropDisabled={isViewer}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`flex-1 space-y-3 rounded-2xl p-1 transition-all ${
              snapshot.isDraggingOver 
                ? 'bg-indigo-50/50 ring-2 ring-indigo-200 ring-dashed' 
                : ''
            }`}
          >
            {tasks.length === 0 && !snapshot.isDraggingOver && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onClick={onCreateTask}
                className={`flex flex-col items-center justify-center py-12 text-center rounded-2xl border-2 border-dashed border-slate-200 ${!isViewer && onCreateTask ? 'cursor-pointer hover:border-indigo-300 hover:bg-indigo-50/50' : ''} transition-all`}
              >
                <div className="text-slate-400 text-sm font-medium">No tasks yet</div>
                {!isViewer && onCreateTask && (
                  <span className="mt-2 text-xs text-indigo-500 font-bold">
                    + Add Task
                  </span>
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
                      snapshot.isDragging ? 'rotate-2 scale-105 shadow-2xl z-50' : ''
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

      {/* Quick Add Button Footer */}
      {!isViewer && onCreateTask && (
      <motion.button
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        onClick={onCreateTask}
        className="mt-2 w-full py-3 rounded-xl hover:bg-white/80 text-slate-400 hover:text-indigo-600 text-sm font-bold transition-all flex items-center justify-center gap-2"
      >
        <Plus className="h-4 w-4" />
        <span className="opacity-0 hover:opacity-100 transition-opacity">Add Task</span>
      </motion.button>
      )}
    </motion.div>
  );
};

export default KanbanColumn;
