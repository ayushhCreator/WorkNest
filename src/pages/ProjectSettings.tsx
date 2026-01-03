import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from '../utils/axios';
import { useAuth } from '../context/AuthContext';
import { 
  Save, 
  ArrowLeft, 
  Github, 
  Slack, 
  MessageSquare, 
  Upload, 
  Bell, 
  ShieldAlert,
  Trash2
} from 'lucide-react';

interface ProjectSettings {
  allowComments: boolean;
  allowFileUploads: boolean;
  emailNotifications: boolean;
}

interface GithubIntegration {
  repoFullName: string;
  accessToken: string;
  connected: boolean;
  webhookId?: string;
}

interface SlackIntegration {
  token: string;
  channelId: string;
  workspace: string;
  connected: boolean;
}

interface ProjectData {
  _id: string;
  title: string;
  description: string;
  color: string;
  status: string;
  settings: ProjectSettings;
  githubIntegration: GithubIntegration;
  slackIntegration: SlackIntegration;
  members: any[];
}

const ProjectSettings: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [project, setProject] = useState<ProjectData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form State
  const [formData, setFormData] = useState<{
    title: string;
    description: string;
    color: string;
    settings: ProjectSettings;
    githubIntegration: Partial<GithubIntegration>;
    slackIntegration: Partial<SlackIntegration>;
  }>({
    title: '',
    description: '',
    color: '#3B82F6',
    settings: {
      allowComments: true,
      allowFileUploads: true,
      emailNotifications: true
    },
    githubIntegration: { repoFullName: '', accessToken: '' },
    slackIntegration: { token: '', channelId: '', workspace: '' }
  });

  useEffect(() => {
    fetchProject();
  }, [id]);

  const fetchProject = async () => {
    try {
      const response = await axios.get(`/api/projects/${id}`);
      const data = response.data;
      
      // Check permissions
      const member = data.members.find((m: any) => m.user._id === user?.id);
      if (!member || member.role !== 'admin') {
        navigate(`/project/${id}`); // Redirect non-admins
        return;
      }

      setProject(data);
      setFormData({
        title: data.title,
        description: data.description || '',
        color: data.color,
        settings: {
          allowComments: data.settings?.allowComments ?? true,
          allowFileUploads: data.settings?.allowFileUploads ?? true,
          emailNotifications: data.settings?.emailNotifications ?? true
        },
        githubIntegration: {
          repoFullName: data.githubIntegration?.repoFullName || '',
          accessToken: '', // Don't show existing token for security, only allow set new
        },
        slackIntegration: {
          token: '', // Don't show existing token
          channelId: data.slackIntegration?.channelId || '',
          workspace: data.slackIntegration?.workspace || ''
        }
      });
    } catch (error) {
      console.error('Error fetching project:', error);
      setError('Failed to load project details');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      // Prepare payload - only send tokens if they are changed (not empty)
      const payload: any = {
        title: formData.title,
        description: formData.description,
        color: formData.color,
        settings: formData.settings,
        // For integrations, merge with existing potentially
      };

      if (formData.githubIntegration.repoFullName || formData.githubIntegration.accessToken) {
        payload.githubIntegration = { ...formData.githubIntegration };
        if (!payload.githubIntegration.accessToken) delete payload.githubIntegration.accessToken;
      }

      if (formData.slackIntegration.token || formData.slackIntegration.channelId) {
        payload.slackIntegration = { ...formData.slackIntegration };
        if (!payload.slackIntegration.token) delete payload.slackIntegration.token;
      }

      await axios.put(`/api/projects/${id}`, payload);
      setSuccess('Project settings saved successfully');
      
      // Refresh to get updated connection states
      fetchProject();
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to DELETE this project? This action cannot be undone and will delete all tasks.')) return;
    
    try {
      await axios.delete(`/api/projects/${id}`);
      navigate('/dashboard');
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to delete project');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => navigate(`/project/${id}`)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Back to board"
              >
                <ArrowLeft className="h-5 w-5 text-gray-500" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Project Settings</h1>
                <p className="text-sm text-gray-500">{project?.title}</p>
              </div>
            </div>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm"
            >
              {saving ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              <span>Save Changes</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Alerts */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center text-red-700 animate-fadeIn">
            <ShieldAlert className="h-5 w-5 mr-3" />
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center text-green-700 animate-fadeIn">
            <Save className="h-5 w-5 mr-3" />
            {success}
          </div>
        )}

        {/* General Settings */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900">General Information</h2>
          </div>
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Project Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Color Theme</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData({...formData, color: e.target.value})}
                    className="h-10 w-20 rounded border border-gray-300 px-1 py-1 cursor-pointer"
                  />
                  <span className="text-gray-500 text-sm">{formData.color}</span>
                </div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none"
              />
            </div>
          </div>
        </div>

        {/* Feature Toggles */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
            <h2 className="text-lg font-semibold text-gray-900">Features & Permissions</h2>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between p-4 border border-gray-100 rounded-lg hover:border-gray-200 transition-colors">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                  <MessageSquare className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Allow Comments</h3>
                  <p className="text-sm text-gray-500">Enable team members to comment on tasks</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={formData.settings.allowComments}
                  onChange={(e) => setFormData({
                    ...formData, 
                    settings: { ...formData.settings, allowComments: e.target.checked }
                  })}
                  className="sr-only peer" 
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-4 border border-gray-100 rounded-lg hover:border-gray-200 transition-colors">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-purple-50 rounded-lg text-purple-600">
                  <Upload className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">File Uploads</h3>
                  <p className="text-sm text-gray-500">Allow attaching files to tasks</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={formData.settings.allowFileUploads}
                  onChange={(e) => setFormData({
                    ...formData, 
                    settings: { ...formData.settings, allowFileUploads: e.target.checked }
                  })}
                  className="sr-only peer" 
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-4 border border-gray-100 rounded-lg hover:border-gray-200 transition-colors">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-yellow-50 rounded-lg text-yellow-600">
                  <Bell className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Email Notifications</h3>
                  <p className="text-sm text-gray-500">Send automated emails for task updates</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={formData.settings.emailNotifications}
                  onChange={(e) => setFormData({
                    ...formData, 
                    settings: { ...formData.settings, emailNotifications: e.target.checked }
                  })}
                  className="sr-only peer" 
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Integrations */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
            <h2 className="text-lg font-semibold text-gray-900">Integrations</h2>
          </div>
          <div className="p-6 space-y-6">
            {/* GitHub */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-gray-900 font-medium">
                  <Github className="h-5 w-5" />
                  <span>GitHub Repository</span>
                </div>
                {project?.githubIntegration?.connected && (
                  <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">Connected</span>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Repository (owner/repo)</label>
                  <input
                    type="text"
                    placeholder="e.g. facebook/react"
                    value={formData.githubIntegration.repoFullName}
                    onChange={(e) => setFormData({
                      ...formData, 
                      githubIntegration: { ...formData.githubIntegration, repoFullName: e.target.value }
                    })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Access Token</label>
                  <input
                    type="password"
                    placeholder="ghp_xxxxxxxxxxxx"
                    value={formData.githubIntegration.accessToken}
                    onChange={(e) => setFormData({
                      ...formData, 
                      githubIntegration: { ...formData.githubIntegration, accessToken: e.target.value }
                    })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                  <p className="text-xs text-gray-500 mt-1">Token is hidden for security. Leave empty to keep unchanged.</p>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-100" />

            {/* Slack */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-gray-900 font-medium">
                  <Slack className="h-5 w-5" />
                  <span>Slack Notifications</span>
                </div>
                {project?.slackIntegration?.connected && (
                  <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">Connected</span>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Channel ID</label>
                  <input
                    type="text"
                    placeholder="e.g. C01234567"
                    value={formData.slackIntegration.channelId}
                    onChange={(e) => setFormData({
                      ...formData, 
                      slackIntegration: { ...formData.slackIntegration, channelId: e.target.value }
                    })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bot User OAuth Token</label>
                  <input
                    type="password"
                    placeholder="xoxb-xxxxxxxxxxxx"
                    value={formData.slackIntegration.token}
                    onChange={(e) => setFormData({
                      ...formData, 
                      slackIntegration: { ...formData.slackIntegration, token: e.target.value }
                    })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                  <p className="text-xs text-gray-500 mt-1">Token is hidden for security.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="bg-white rounded-xl shadow-sm border border-red-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-red-100 bg-red-50">
            <h2 className="text-lg font-semibold text-red-900">Danger Zone</h2>
          </div>
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-gray-900">Delete Project</h3>
                <p className="text-sm text-gray-500">Permanently delete this project and all of its tasks. This cannot be undone.</p>
              </div>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2"
              >
                <Trash2 className="h-4 w-4" />
                <span>Delete Project</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectSettings;
