import React, { useState } from 'react';
import axios from '../utils/axios';
import { X, Mail, UserPlus, Shield } from 'lucide-react';

interface InviteMemberModalProps {
  projectId: string;
  onClose: () => void;
  onInviteSent: () => void;
}

const InviteMemberModal: React.FC<InviteMemberModalProps> = ({ 
  projectId, 
  onClose, 
  onInviteSent 
}) => {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('member');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await axios.post('/api/invitations', {
        email,
        projectId,
        role
      });
      
      setSuccess('Invitation sent successfully!');
      onInviteSent();
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
      setError(error.response?.data?.message || 'Failed to send invitation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Invite Team Member</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-700 text-sm">{success}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter email address"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Role
            </label>
            <div className="relative">
              <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
              >
                <option value="viewer">Viewer - Can view tasks and comments</option>
                <option value="member">Member - Can create and edit tasks</option>
                <option value="admin">Admin - Can manage project and members</option>
              </select>
            </div>
          </div>

          <div className="bg-gray-50 p-3 rounded-lg">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Role Permissions:</h4>
            <ul className="text-xs text-gray-600 space-y-1">
              <li><strong>Viewer:</strong> Read-only access to tasks and comments</li>
              <li><strong>Member:</strong> Create, edit, and comment on tasks</li>
              <li><strong>Admin:</strong> Full project management including member management</li>
            </ul>
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !email.trim()}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
            >
              <UserPlus className="h-4 w-4" />
              <span>{loading ? 'Sending...' : 'Send Invite'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InviteMemberModal;