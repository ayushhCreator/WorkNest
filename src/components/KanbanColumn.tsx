import React from 'react';
import { Droppable, Draggable } from '@hello-pangea/dnd';

import TaskCard from './TaskCard';
import { Plus } from 'lucide-react';

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
  onCreateTask: () => void;
  onTaskClick: (task: Task) => void;
}

const KanbanColumn: React.FC<KanbanColumnProps> = ({ column, tasks, onCreateTask, onTaskClick }) => {
  const getColumnColor = (status: string) => {
    switch (status) {
      case 'todo': return 'border-amber-300 bg-amber-50';
      case 'inprogress': return 'border-blue-300 bg-blue-50';
      case 'done': return 'border-green-300 bg-green-50';
      default: return 'border-gray-300 bg-gray-50';
    }
  };

  return (
    <div className={`rounded-lg border-2 ${getColumnColor(column.status)} p-4`}>
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center space-x-2">
          <h3 className="font-semibold text-gray-900">{column.title}</h3>
          <span className="bg-white rounded-full px-2 py-1 text-xs font-medium text-gray-600">
            {tasks.length}
          </span>
        </div>
        <button
          onClick={onCreateTask}
          className="p-1 rounded-lg hover:bg-white hover:shadow-sm transition-colors"
        >
          <Plus className="h-4 w-4 text-gray-500" />
        </button>
      </div>

      <Droppable droppableId={column.status}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`space-y-3 min-h-32 ${
              snapshot.isDraggingOver ? 'bg-white bg-opacity-50 rounded-lg' : ''
            }`}
          >
            {tasks.map((task, index) => (
              <Draggable key={task._id} draggableId={String(task._id)} index={index}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    className={`${
                      snapshot.isDragging ? 'rotate-2 shadow-lg' : ''
                    } transition-transform`}
                  >
                    <TaskCard task={task} onClick={() => onTaskClick(task)} />
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
};

export default KanbanColumn;
