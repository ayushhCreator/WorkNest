import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import axios from '../utils/axios';
import { 
  User, 
  Mail, 
  Lock, 
  Save, 
  Camera,
  Shield,
  Bell,
  Palette,
  Pencil,
  CheckCircle,
  AlertCircle,
  Loader2,
  Eye,
  EyeOff,
  LogOut
} from 'lucide-react';

const Profile: React.FC = () => {
  const { user, logout } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [editing, setEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'preferences'>('profile');
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar || '');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Password Visibility States
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const getInitials = (name: string) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U';
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/jpg', 'image/png', 'image/gif'].includes(file.type)) {
      setError('Please upload a valid image (JPG, PNG, or GIF)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Image size must be less than 5MB');
      return;
    }

    setError('');
    setUploadingAvatar(true);

    try {
      const formData = new FormData();
      formData.append('avatar', file);

      const response = await axios.post('/api/users/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setAvatarUrl(response.data.avatar);
      setSuccess('Avatar updated successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: unknown) {
        const errMsg = err instanceof Error && 'response' in err 
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ? (err as any).response?.data?.message 
        : 'Failed to upload avatar';
      setError(errMsg || 'Failed to upload avatar');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword && newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (newPassword && newPassword.length < 6) {
      setError('New password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      const updateData: Record<string, unknown> = { name, email };
      
      if (newPassword) {
        updateData.currentPassword = currentPassword;
        updateData.newPassword = newPassword;
      }

      await axios.put('/api/users/profile', updateData);
      setSuccess('Profile updated successfully');
      setEditing(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: unknown) {
        const errMsg = err instanceof Error && 'response' in err 
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ? (err as any).response?.data?.message 
        : 'Failed to update profile';
      setError(errMsg || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'profile', label: 'Overview', icon: User },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'preferences', label: 'Preferences', icon: Palette },
  ];

  return (
    <div className="max-w-5xl mx-auto pb-12">
      {/* Profile Header */}
      <div className="relative mb-8 group">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-3xl opacity-90 blur-xl group-hover:opacity-100 transition-opacity duration-500" />
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 text-white overflow-hidden"
          >
             <div className="flex flex-col md:flex-row items-center gap-8">
                <div className="relative">
                   <input
                     ref={fileInputRef}
                     type="file"
                     accept="image/jpeg,image/jpg,image/png,image/gif"
                     onChange={handleAvatarUpload}
                     className="hidden"
                   />
                   <motion.div whileHover={{ scale: 1.05 }} className="relative group/avatar cursor-pointer" onClick={handleAvatarClick}>
                      {avatarUrl || user?.avatar ? (
                        <img 
                          src={avatarUrl || user?.avatar} 
                          alt={user?.name} 
                          className="w-32 h-32 rounded-3xl object-cover shadow-2xl border-4 border-white/20"
                        />
                      ) : (
                        <div className="w-32 h-32 rounded-3xl bg-indigo-500 flex items-center justify-center text-4xl font-bold shadow-2xl border-4 border-white/20">
                          {getInitials(user?.name || '')}
                        </div>
                      )}
                      
                      <div className="absolute inset-0 bg-black/40 rounded-3xl opacity-0 group-hover/avatar:opacity-100 transition-opacity flex items-center justify-center">
                         <Camera className="w-8 h-8 text-white" />
                      </div>
                      
                      {uploadingAvatar && (
                        <div className="absolute inset-0 bg-black/60 rounded-3xl flex items-center justify-center">
                          <Loader2 className="w-8 h-8 text-white animate-spin" />
                        </div>
                      )}
                   </motion.div>
                </div>
                
                <div className="text-center md:text-left flex-1">
                   <h1 className="text-4xl font-bold mb-2">{user?.name}</h1>
                   <p className="text-indigo-100 mb-4 text-lg">{user?.email}</p>
                   <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                      <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-lg text-sm font-medium border border-white/10">
                        {user?.role || 'Member'}
                      </span>
                      <span className="px-3 py-1 bg-emerald-500/20 backdrop-blur-md rounded-lg text-sm font-medium border border-emerald-400/30 text-emerald-100 flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-400"></span> Active
                      </span>
                   </div>
                </div>

                <div className="flex gap-3">
                   <button onClick={logout} className="p-3 bg-white/10 hover:bg-white/20 rounded-2xl backdrop-blur-md transition-colors border border-white/10 group/btn">
                      <LogOut className="w-6 h-6 text-white group-hover/btn:scale-110 transition-transform" />
                   </button>
                </div>
             </div>
          </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
         {/* Navigation */}
         <div className="lg:col-span-1 space-y-2">
            {tabs.map((tab) => (
               <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  className={`w-full flex items-center gap-3 px-5 py-4 rounded-2xl transition-all font-medium text-left ${
                     activeTab === tab.id 
                     ? 'bg-white shadow-lg shadow-indigo-100 text-indigo-600' 
                     : 'text-slate-500 hover:bg-white/60 hover:text-slate-700'
                  }`}
               >
                  <tab.icon className={`w-5 h-5 ${activeTab === tab.id ? 'text-indigo-600' : 'text-slate-400'}`} />
                  {tab.label}
               </button>
            ))}
         </div>

         {/* Content */}
         <div className="lg:col-span-3">
            <motion.div
               layout
               className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 border border-white/60 shadow-xl shadow-slate-200/50 min-h-[500px]"
            >
               <AnimatePresence mode="wait">
                  {error && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl flex items-center gap-3">
                      <AlertCircle className="w-5 h-5" /> {error}
                    </motion.div>
                  )}
                  {success && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mb-6 p-4 bg-emerald-50 text-emerald-600 rounded-xl flex items-center gap-3">
                      <CheckCircle className="w-5 h-5" /> {success}
                    </motion.div>
                  )}

                  {activeTab === 'profile' && (
                     <motion.div
                        key="profile"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3 }}
                     >
                        <div className="flex justify-between items-center mb-8">
                           <div>
                              <h2 className="text-2xl font-bold text-slate-900">Personal Details</h2>
                              <p className="text-slate-500">Manage your name and contact info</p>
                           </div>
                           {!editing && (
                              <button onClick={() => setEditing(true)} className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl font-bold hover:bg-indigo-100 transition-colors">
                                 <Pencil className="w-4 h-4" /> Edit
                              </button>
                           )}
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div>
                                 <label className="block text-sm font-bold text-slate-700 mb-2">Full Name</label>
                                 <div className="relative">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                                    <input type="text" value={name} onChange={(e) => setName(e.target.value)} disabled={!editing} className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all disabled:opacity-60 disabled:bg-slate-100" />
                                 </div>
                              </div>
                              <div>
                                 <label className="block text-sm font-bold text-slate-700 mb-2">Email</label>
                                 <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} disabled={!editing} className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all disabled:opacity-60 disabled:bg-slate-100" />
                                 </div>
                              </div>
                           </div>

                           {editing && (
                              <div className="flex gap-4 pt-4">
                                 <button type="submit" disabled={loading} className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all flex items-center gap-2">
                                    <Save className="w-5 h-5" /> {loading ? 'Saving...' : 'Save Changes'}
                                 </button>
                                 <button type="button" onClick={() => setEditing(false)} className="px-8 py-3 border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 transition-all">
                                    Cancel
                                 </button>
                              </div>
                           )}
                        </form>
                     </motion.div>
                  )}

                  {activeTab === 'security' && (
                     <motion.div
                        key="security"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3 }}
                     >
                        <div className="mb-8">
                           <h2 className="text-2xl font-bold text-slate-900">Security</h2>
                           <p className="text-slate-500">Update your password to keep your account safe</p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
                           <div>
                              <label className="block text-sm font-bold text-slate-700 mb-2">Current Password</label>
                              <div className="relative">
                                 <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                                 <input 
                                    type={showCurrentPassword ? "text" : "password"} 
                                    value={currentPassword} 
                                    onChange={(e) => setCurrentPassword(e.target.value)} 
                                    className="w-full pl-12 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all" 
                                    placeholder="••••••••"
                                 />
                                 <button type="button" onClick={() => setShowCurrentPassword(!showCurrentPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                                    {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                 </button>
                              </div>
                           </div>
                           
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div>
                                 <label className="block text-sm font-bold text-slate-700 mb-2">New Password</label>
                                 <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                                    <input 
                                       type={showNewPassword ? "text" : "password"} 
                                       value={newPassword} 
                                       onChange={(e) => setNewPassword(e.target.value)} 
                                       className="w-full pl-12 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all" 
                                       placeholder="Min 6 chars"
                                    />
                                     <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                                       {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                 </div>
                              </div>
                              <div>
                                 <label className="block text-sm font-bold text-slate-700 mb-2">Confirm New Password</label>
                                 <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                                    <input 
                                       type={showConfirmPassword ? "text" : "password"} 
                                       value={confirmPassword} 
                                       onChange={(e) => setConfirmPassword(e.target.value)} 
                                       className="w-full pl-12 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all" 
                                       placeholder="Repeat password"
                                    />
                                    <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                                       {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                 </div>
                              </div>
                           </div>

                           <div className="pt-4">
                              <button type="submit" disabled={loading || !currentPassword} className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                                 <Shield className="w-5 h-5" /> Update Password
                              </button>
                           </div>
                        </form>
                     </motion.div>
                  )}
                  
                  {activeTab === 'preferences' && (
                     <motion.div
                        key="preferences"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3 }}
                     >
                        <div className="mb-8">
                           <h2 className="text-2xl font-bold text-slate-900">Preferences</h2>
                           <p className="text-slate-500">Customize your WorkNest experience</p>
                        </div>
                        
                        <div className="space-y-4">
                           <div className="p-4 bg-slate-50 rounded-2xl flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                 <div className="p-3 bg-white rounded-xl shadow-sm"><Bell className="w-6 h-6 text-slate-600" /></div>
                                 <div>
                                    <p className="font-bold text-slate-900">Email Notifications</p>
                                    <p className="text-sm text-slate-500">Get updates on task assignments</p>
                                 </div>
                              </div>
                              <label className="relative inline-flex items-center cursor-pointer">
                                 <input type="checkbox" defaultChecked className="sr-only peer" />
                                 <div className="w-14 h-7 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-indigo-600"></div>
                              </label>
                           </div>
                           
                           <div className="p-4 bg-slate-50 rounded-2xl flex items-center justify-between opacity-50 cursor-not-allowed">
                              <div className="flex items-center gap-4">
                                 <div className="p-3 bg-white rounded-xl shadow-sm"><Palette className="w-6 h-6 text-slate-600" /></div>
                                 <div>
                                    <p className="font-bold text-slate-900">Dark Mode</p>
                                    <p className="text-sm text-slate-500">Coming soon to WorkNest 2.0</p>
                                 </div>
                              </div>
                              <div className="px-3 py-1 bg-slate-200 text-slate-500 text-xs font-bold rounded-lg uppercase">Soon</div>
                           </div>
                        </div>
                     </motion.div>
                  )}
               </AnimatePresence>
            </motion.div>
         </div>
      </div>
    </div>
  );
};

export default Profile;