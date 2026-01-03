import React, { useState, useEffect } from 'react';
import axios from '../utils/axios';
import { X, Mail, UserPlus, Shield, Clock, CheckCircle, XCircle } from 'lucide-react';

interface InviteMemberModalProps {
  projectId: string;
  onClose: () => void;
  onInviteSent: () => void;
}

interface Invitation {
  _id: string;
  email: string;
  role: string;
  status: 'pending' | 'accepted' | 'expired';
  invitedBy: {
    _id: string;
    name: string;
    email: string;
  };
  createdAt: string;
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
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  useEffect(() => {
    fetchInvitations();
  }, [projectId]);

  const fetchInvitations = async () => {
    try {
      const response = await axios.get(`/api/invitations/project/${projectId}`);
      setInvitations(response.data);
    } catch (error) {
      console.error('Error fetching invitations:', error);
    } finally {
      setLoadingHistory(false);
    }
  };

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
      
      setSuccess(`Invitation sent to ${email} successfully!`);
      setEmail(''); // Clear input
      fetchInvitations(); // Refresh history
      onInviteSent(); // Refresh parent data (if needed) but don't close yet
      
      // Close after 2 seconds
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
      setError(error.response?.data?.message || 'Failed to send invitation');
    } finally {
      setLoading(false);
    }
  };

  // Revoke handler
  const handleRevoke = async (invitationId: string) => {
    if (!confirm('Are you sure you want to revoke this invitation?')) return;
    
    try {
      await axios.delete(`/api/invitations/${invitationId}`);
      setSuccess('Invitation revoked successfully');
      fetchInvitations();
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to revoke invitation');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900">Invite Team Member</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto custom-scrollbar">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg animate-fadeIn">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg animate-fadeIn flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
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

            <div className="flex space-x-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !email.trim()}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <UserPlus className="h-4 w-4" />
                    <span>Send Invite</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Invitation History */}
          <div className="mt-8">
            <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
              <Clock className="h-4 w-4 mr-2" />
              Invitation History
            </h3>
            
            {loadingHistory ? (
              <div className="text-center py-4 text-gray-500 text-sm">Loading history...</div>
            ) : invitations.length > 0 ? (
              <div className="space-y-3">
                {invitations.map((inv) => (
                  <div key={inv._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{inv.email}</p>
                      <div className="flex items-center space-x-2 text-xs text-gray-500 mt-1">
                        <span>{inv.role}</span>
                        <span>•</span>
                        <span>Invited by {inv.invitedBy.name}</span>
                        <span>•</span>
                        <span>{new Date(inv.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        inv.status === 'accepted' ? 'bg-green-100 text-green-700' :
                        inv.status === 'expired' ? 'bg-red-100 text-red-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {inv.status.charAt(0).toUpperCase() + inv.status.slice(1)}
                      </span>
                      {inv.status === 'pending' && (
                        <button
                          onClick={() => handleRevoke(inv._id)}
                          className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                          title="Revoke Invitation"
                        >
                          <XCircle className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-gray-500 text-sm bg-gray-50 rounded-lg border border-dashed border-gray-200">
                No active invitations found
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InviteMemberModal;