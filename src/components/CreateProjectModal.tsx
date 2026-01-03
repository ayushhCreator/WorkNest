import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from '../utils/axios';
import { X, Folder, Palette, FileText, Sparkles, Layout } from 'lucide-react';

interface CreateProjectModalProps {
  onClose: () => void;
  onProjectCreated: (project: { _id: string; title: string; [key: string]: unknown }) => void;
}

const colors = [
  { value: '#3B82F6', name: 'Blue' },
  { value: '#10B981', name: 'Emerald' },
  { value: '#F59E0B', name: 'Amber' },
  { value: '#EF4444', name: 'Red' },
  { value: '#8B5CF6', name: 'Violet' },
  { value: '#06B6D4', name: 'Cyan' },
  { value: '#F97316', name: 'Orange' },
  { value: '#EC4899', name: 'Pink' }
];

const templates = [
  { id: 'blank', name: 'Blank Project', icon: Folder, description: 'Start fresh' },
  { id: 'kanban', name: 'Kanban Board', icon: Layout, description: 'To Do, Doing, Done' },
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

      if (template === 'kanban') {
        projectData.columns = [
          { id: 'todo', title: 'To Do', taskIds: [] },
          { id: 'inprogress', title: 'In Progress', taskIds: [] },
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
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: 'spring', bounce: 0.3, duration: 0.5 }}
          className="bg-white rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="relative p-6 px-8 border-b border-gray-100 overflow-hidden">
             <div className="relative z-10 flex justify-between items-center">
               <div>
                  <h2 className="text-2xl font-bold text-gray-900">New Project</h2>
                  <p className="text-gray-500 text-sm">Create a workspace for your team</p>
               </div>
               <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <X className="w-5 h-5 text-gray-500" />
               </button>
             </div>
             
             {/* Dynamic background shimmer based on selected color */}
             <div 
               className="absolute top-0 right-0 w-64 h-64 opacity-10 rounded-full blur-3xl -mr-20 -mt-20 transition-colors duration-500 pointer-events-none"
               style={{ backgroundColor: color }}
             />
          </div>

          <div className="p-8">
            {error && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm font-medium">
                {error}
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Project Name</label>
                <div className="relative">
                   <Folder className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                   <input
                     type="text"
                     value={title}
                     onChange={(e) => setTitle(e.target.value)}
                     className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all font-medium text-gray-900"
                     placeholder="e.g. Website Redesign"
                     required
                   />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Description <span className="text-gray-400 font-normal normal-case">(Optional)</span></label>
                <div className="relative">
                   <FileText className="absolute left-4 top-4 text-gray-400 w-5 h-5" />
                   <textarea
                     value={description}
                     onChange={(e) => setDescription(e.target.value)}
                     rows={2}
                     className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all text-sm resize-none"
                     placeholder="What's this project about?"
                   />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Template</label>
                    <div className="space-y-2">
                       {templates.map((t) => (
                          <button
                             key={t.id}
                             type="button"
                             onClick={() => setTemplate(t.id)}
                             className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all ${
                                template === t.id 
                                ? 'border-indigo-500 bg-indigo-50/50' 
                                : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'
                             }`}
                          >
                             <div className={`p-2 rounded-lg ${template === t.id ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-500'}`}>
                                <t.icon className="w-4 h-4" />
                             </div>
                             <div>
                                <p className={`text-sm font-bold ${template === t.id ? 'text-indigo-900' : 'text-gray-700'}`}>{t.name}</p>
                                <p className="text-xs text-gray-500">{t.description}</p>
                             </div>
                          </button>
                       ))}
                    </div>
                 </div>

                 <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Theme Color</label>
                    <div className="grid grid-cols-4 gap-2">
                       {colors.map((c) => (
                          <button
                             key={c.value}
                             type="button"
                             onClick={() => setColor(c.value)}
                             className={`w-full aspect-square rounded-xl transition-transform ${
                                color === c.value ? 'scale-110 ring-2 ring-offset-2 ring-gray-300' : 'hover:scale-105'
                             }`}
                             style={{ backgroundColor: c.value }}
                             title={c.name}
                          />
                       ))}
                    </div>
                 </div>
              </div>

              <div className="pt-4 flex gap-3">
                 <button type="button" onClick={onClose} className="flex-1 px-4 py-3 border border-gray-200 text-gray-600 font-bold rounded-xl hover:bg-gray-50 transition-colors">
                    Cancel
                 </button>
                 <button 
                  type="submit" 
                  disabled={loading || !title.trim()} 
                  className="flex-1 px-4 py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  style={{ backgroundColor: loading ? undefined : color }}
                 >
                    {loading ? (
                       <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                       <>
                        <Sparkles className="w-4 h-4" />
                        Create Project
                       </>
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