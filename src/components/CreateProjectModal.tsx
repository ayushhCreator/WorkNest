import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from '../utils/axios';
import { X, Folder, Palette, FileText, Sparkles } from 'lucide-react';

interface CreateProjectModalProps {
  onClose: () => void;
  onProjectCreated: (project: { _id: string; title: string; [key: string]: unknown }) => void;
}

const colors = [
  { value: '#3B82F6', name: 'Blue' },
  { value: '#10B981', name: 'Green' },
  { value: '#F59E0B', name: 'Amber' },
  { value: '#EF4444', name: 'Red' },
  { value: '#8B5CF6', name: 'Purple' },
  { value: '#06B6D4', name: 'Cyan' },
  { value: '#F97316', name: 'Orange' },
  { value: '#EC4899', name: 'Pink' }
];

const templates = [
  { id: 'blank', name: 'Blank Project', icon: Folder, description: 'Start from scratch' },
  { id: 'kanban', name: 'Kanban Board', icon: Sparkles, description: 'With default columns' },
];

const CreateProjectModal: React.FC<CreateProjectModalProps> = ({ onClose, onProjectCreated }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState(colors[0].value);
  const [template, setTemplate] = useState('blank');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const projectData: { title: string; description: string; color: string; columns?: { id: string; title: string; taskIds: string[] }[] } = {
        title,
        description,
        color
      };

      // Add default columns for kanban template
      if (template === 'kanban') {
        projectData.columns = [
          { id: 'todo', title: 'To Do', taskIds: [] },
          { id: 'in-progress', title: 'In Progress', taskIds: [] },
          { id: 'review', title: 'Review', taskIds: [] },
          { id: 'done', title: 'Done', taskIds: [] }
        ];
      }

      const response = await axios.post('/api/projects', projectData);
      onProjectCreated(response.data);
    } catch (error: unknown) {
      const errMsg = error instanceof Error && 'response' in error 
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ? (error as any).response?.data?.message 
        : 'Failed to create project';
      setError(errMsg || 'Failed to create project');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', duration: 0.5 }}
          className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden"
        >
          {/* Header with gradient */}
          <div 
            className="p-6 text-white"
            style={{ background: `linear-gradient(135deg, ${color}, ${color}dd)` }}
          >
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-bold">Create New Project</h2>
                <p className="text-white/80 mt-1">Set up your project in seconds</p>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-xl transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="p-6">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 p-4 bg-red-50 border border-red-100 rounded-xl"
              >
                <p className="text-red-600 text-sm font-medium">{error}</p>
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Project Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Project Name
                </label>
                <div className="relative">
                  <Folder className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition-all"
                    placeholder="e.g., Mobile App Redesign"
                    required
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <div className="relative">
                  <FileText className="absolute left-4 top-4 text-gray-400 h-5 w-5" />
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition-all resize-none"
                    placeholder="What's this project about?"
                  />
                </div>
              </div>

              {/* Template Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Template
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {templates.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setTemplate(t.id)}
                      className={`p-4 rounded-xl border-2 text-left transition-all ${
                        template === t.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <t.icon className={`h-5 w-5 mb-2 ${template === t.id ? 'text-blue-600' : 'text-gray-400'}`} />
                      <p className={`font-medium ${template === t.id ? 'text-blue-900' : 'text-gray-900'}`}>
                        {t.name}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">{t.description}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Color Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Palette className="inline h-4 w-4 mr-1" />
                  Project Color
                </label>
                <div className="flex flex-wrap gap-2">
                  {colors.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => setColor(c.value)}
                      className={`w-10 h-10 rounded-xl transition-all ${
                        color === c.value
                          ? 'ring-2 ring-offset-2 ring-gray-400 scale-110'
                          : 'hover:scale-105'
                      }`}
                      style={{ backgroundColor: c.value }}
                      title={c.name}
                    />
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-3 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !title.trim()}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium shadow-lg shadow-blue-500/25"
                >
                  {loading ? (
                    <span className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                      Creating...
                    </span>
                  ) : (
                    'Create Project'
                  )}
                </button>
              </div>
            </form>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default CreateProjectModal;