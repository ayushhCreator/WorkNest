import React, { useState } from 'react';
import axios from '../utils/axios';
import { useAuth } from '../context/AuthContext';
import FileUpload from './FileUpload';
import AttachmentList from './AttachmentList';
import { 
  X, 
  Calendar, 
  User, 
  Flag, 
  MessageCircle, 
  Send,
  Edit2,
  Trash2,
  Save,
  Paperclip
} from 'lucide-react';

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

interface TaskDetailModalProps {
  task: Task;
  members: Array<{
    user: {
      _id: string;
      name: string;
      email: string;
    };
    role: string;
  }>;
  onClose: () => void;
  onTaskUpdated: (task: Task) => void;
  onTaskDeleted: (taskId: string) => void;
  settings?: {
    allowComments: boolean;
    allowFileUploads: boolean;
  };
}

const TaskDetailModal: React.FC<TaskDetailModalProps> = ({ 
  task, 
  members, 
  onClose, 
  onTaskUpdated, 
  onTaskDeleted,
  settings
}) => {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description);
  const [assignee, setAssignee] = useState(task.assignee?._id || '');
  const [priority, setPriority] = useState(task.priority);
  const [dueDate, setDueDate] = useState(task.dueDate ? task.dueDate.split('T')[0] : '');
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [commentLoading, setCommentLoading] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadSuccess, setUploadSuccess] = useState('');
  const [uploadError, setUploadError] = useState('');
  const [showAttachments, setShowAttachments] = useState(true);
  const { user } = useAuth();
  
  const currentUserRole = members.find(m => m.user._id === user?.id)?.role;
  const isAdmin = currentUserRole === 'admin';
  const canUpload = isAdmin || (settings?.allowFileUploads ?? true);
  const canComment = isAdmin || (settings?.allowComments ?? true);

  const handleUpdate = async () => {
    setLoading(true);
    try {
      const response = await axios.put(`/api/tasks/${task._id}`, {
        title,
        description,
        assignee: assignee || undefined,
        priority,
        dueDate: dueDate || undefined
      });
      onTaskUpdated(response.data);
      setEditing(false);
    } catch (error) {
      console.error('Error updating task:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this task?')) return;
    
    setLoading(true);
    try {
      await axios.delete(`/api/tasks/${task._id}`);
      onTaskDeleted(task._id);
    } catch (error) {
      console.error('Error deleting task:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setCommentLoading(true);
    try {
      const response = await axios.post(`/api/tasks/${task._id}/comments`, {
        text: newComment
      });
      onTaskUpdated(response.data);
      setNewComment('');
    } catch (error) {
      console.error('Error adding comment:', error);
    } finally {
      setCommentLoading(false);
    }
  };

  const handleFileUpload = async (file: File) => {
    setUploadLoading(true);
    setUploadError('');
    setUploadProgress(0);
    setUploadSuccess('');

    try {
      const formData = new FormData();
      formData.append('file', file);


      const response = await axios.post(`/api/tasks/${task._id}/attachments`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(percentCompleted);
          }
        },
      });
      
      console.log('📤 TopDetailModal: File Upload Success', response.data);
      setUploadSuccess('File uploaded successfully');
      setUploadProgress(100);
      onTaskUpdated(response.data);
      
      // Auto clear success message
      setTimeout(() => {
        setUploadSuccess('');
        setUploadProgress(0);
      }, 3000);

    } catch (error: unknown) {
      console.error('❌ TopDetailModal: Error uploading file:', error);
      const errMsg = error instanceof Error && 'response' in error 
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ? (error as any).response?.data?.error || (error as any).response?.data?.message
        : 'Failed to upload file';
      setUploadError(errMsg || 'Failed to upload file');
    } finally {
      setUploadLoading(false);
    }
  };

  const handleDeleteAttachment = async (attachmentId: string) => {
    try {
      console.log('🗑️ TopDetailModal: Deleting attachment', attachmentId);
      const response = await axios.delete(`/api/tasks/${task._id}/attachments/${attachmentId}`);
      console.log('✅ TopDetailModal: Delete Success', response.data);
      onTaskUpdated(response.data);
    } catch (error) {
      console.error('❌ TopDetailModal: Error deleting attachment:', error);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const canEdit = () => {
    const userMember = members.find(member => 
      member.user._id === user?.id
    );
    return userMember && userMember.role !== 'viewer';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">Task Details</h2>
            <div className="flex items-center space-x-2">
              {canEdit() && (
                <>
                  <button
                    onClick={() => setEditing(!editing)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <Edit2 className="h-5 w-5 text-gray-500" />
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={loading}
                    className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="h-5 w-5 text-red-500" />
                  </button>
                </>
              )}
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {editing ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Assignee
                  </label>
                  <select
                    value={assignee}
                    onChange={(e) => setAssignee(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Unassigned</option>
                    {members.map((member) => (
                      <option key={member.user._id} value={member.user._id}>
                        {member.user.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Priority
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={handleUpdate}
                  disabled={loading}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  <Save className="h-4 w-4" />
                  <span>{loading ? 'Saving...' : 'Save Changes'}</span>
                </button>
                <button
                  onClick={() => setEditing(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{task.title}</h3>
                <p className="text-gray-600">{task.description || 'No description provided'}</p>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">
                    {task.assignee ? task.assignee.name : 'Unassigned'}
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  <Flag className="h-4 w-4 text-gray-500" />
                  <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(task.priority)}`}>
                    {task.priority}
                  </span>
                </div>

                {task.dueDate && (
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">
                      {new Date(task.dueDate).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Attachments Section */}
          <div className="border-t pt-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="flex items-center space-x-2 text-lg font-semibold text-gray-900">
                <Paperclip className="h-5 w-5" />
                <span>Attachments ({task.attachments.length})</span>
              </h4>
              <button
                onClick={() => setShowAttachments(!showAttachments)}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                {showAttachments ? 'Hide' : 'Show'}
              </button>
            </div>

            {showAttachments && (
              <div className="space-y-4">
                {uploadError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-700 text-sm">{uploadError}</p>
                  </div>
                )}
                
                {canEdit() && canUpload && (
                  <FileUpload
                    onFileUpload={handleFileUpload}
                    loading={uploadLoading}
                    progress={uploadProgress}
                    success={uploadSuccess}
                  />
                )}
                
                <AttachmentList
                  attachments={task.attachments}
                  onDelete={canEdit() ? handleDeleteAttachment : undefined}
                  canDelete={canEdit()}
                />
              </div>
            )}
          </div>

          {/* Comments Section */}
          <div className="border-t pt-6">
            <h4 className="flex items-center space-x-2 text-lg font-semibold text-gray-900 mb-4">
              <MessageCircle className="h-5 w-5" />
              <span>Comments ({task.comments.length})</span>
            </h4>

            {canComment && (
            <form onSubmit={handleAddComment} className="mb-4">
              <div className="flex space-x-3">
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add a comment..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  type="submit"
                  disabled={commentLoading || !newComment.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center space-x-2"
                >
                  <Send className="h-4 w-4" />
                  <span>{commentLoading ? 'Posting...' : 'Post'}</span>
                </button>
              </div>
            </form>
            )}
            {!canComment && (
              <p className="text-sm text-gray-500 italic mb-4">Comments are disabled for this project.</p>
            )}

            <div className="space-y-3 max-h-64 overflow-y-auto">
              {task.comments.map((comment) => (
                <div key={comment._id} className="flex space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <span className="text-xs font-medium text-blue-600">
                      {comment.user.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-sm font-medium text-gray-900">{comment.user.name}</span>
                      <span className="text-xs text-gray-500">
                        {new Date(comment.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700">{comment.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskDetailModal;