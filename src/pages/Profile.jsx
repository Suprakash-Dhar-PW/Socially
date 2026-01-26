import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { MapPin, Calendar, Link as LinkIcon, Mail, ShieldCheck, Edit3, X, Check, ChevronDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Profile = () => {
  const { id } = useParams();
  const { user: currentUser } = useAuth(); // Get logged-in user
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Edit Mode State
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    bio: '',
    avatar_url: '',
    username: '',
    batch_year: '',
    campus: 'Bengaluru',
    department: 'SOT'
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await axios.get(`/api/users/${id}`);
        setProfile(res.data);
        setEditForm({
            bio: res.data.bio || '',
            avatar_url: res.data.avatar_url || '',
            username: res.data.username || '',
            batch_year: res.data.batch_year || '',
            campus: res.data.campus || 'Bengaluru',
            department: res.data.department || 'SOT'
        });
      } catch (err) {
        setError('User not found');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [id]);

  const handleSave = async () => {
      try {
          await axios.put('/api/auth/me', editForm);
          setProfile({ ...profile, ...editForm });
          setIsEditing(false);
          // Optional: Update global context if it's "me"
      } catch (err) {
          alert('Failed to update profile');
      }
  };

  const isOwnProfile = currentUser && profile && currentUser.id === profile.id;

  if (loading) return (
    <div className="min-h-screen bg-[#F1F5F9] flex items-center justify-center">
       <div className="w-8 h-8 border-4 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin"></div>
    </div>
  );

  if (error || !profile) return (
     <div className="min-h-screen bg-[#F1F5F9] flex flex-col items-center justify-center text-slate-400">
        <div className="text-xl font-bold mb-2">User Not Found</div>
        <p className="text-sm">The user you are looking for does not exist.</p>
     </div>
  );

  return (
    <div className="bg-[#F1F5F9] min-h-screen text-slate-900">
      <Navbar />
      <div className="max-w-[1600px] mx-auto flex justify-center pt-4 px-0 lg:px-4 pb-4 gap-4">
        <Sidebar />
        
        {/* Main Profile Content */}
        <main className="flex-1 max-w-4xl w-full min-w-0">
           
           {/* Cover Image & Header Info */}
           <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden relative mb-6">
              {/* Cover */}
              <div className="h-48 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 relative">
                 <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20"></div>
              </div>

              <div className="px-8 pb-8 relative">
                 {/* Avatar */}
                 <div className="absolute -top-16 left-8">
                    <div className="p-1.5 bg-white rounded-full">
                       <img 
                          src={profile.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name)}&background=random`} 
                          alt={profile.name}
                          className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-md bg-slate-50"
                       />
                    </div>
                 </div>

                 {/* Action Buttons (Right) */}
                 <div className="flex justify-end pt-4 mb-4 gap-3">
                    {isOwnProfile ? (
                        isEditing ? (
                            <>
                                <button onClick={() => setIsEditing(false)} className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50">
                                    <X size={18} />
                                </button>
                                <button onClick={handleSave} className="px-4 py-2 rounded-xl font-bold text-sm bg-indigo-600 text-white hover:bg-indigo-700 flex items-center gap-2">
                                    <Check size={16} /> Save
                                </button>
                            </>
                        ) : (
                            <button onClick={() => setIsEditing(true)} className="px-5 py-2 rounded-xl font-bold text-sm border-2 border-slate-100 text-slate-600 hover:border-slate-300 transition-colors flex items-center gap-2">
                               <Edit3 size={16} /> Edit Profile
                            </button>
                        )
                    ) : (
                        <>
                            <button className="px-5 py-2 rounded-xl font-bold text-sm border-2 border-slate-100 text-slate-600 hover:border-slate-300 transition-colors">
                            Message
                            </button>
                            <button className="px-5 py-2 rounded-xl font-bold text-sm bg-slate-900 text-white hover:bg-indigo-600 shadow-lg shadow-slate-200 hover:shadow-indigo-200 transition-all">
                            Follow
                            </button>
                        </>
                    )}
                 </div>

                 {/* User Info */}
                 <div className="mt-4">
                    <div className="flex items-center gap-2 mb-1">
                       <h1 className="text-2xl font-black text-slate-900">{profile.name}</h1>
                       <ShieldCheck className="w-5 h-5 text-indigo-500" />
                       <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase tracking-wider border border-indigo-100">
                          {profile.role}
                       </span>
                    </div>
                    {profile.username && <p className="text-sm font-bold text-slate-400 mb-2">@{profile.username}</p>}
                    
                    {isEditing ? (
                        <div className="space-y-4 max-w-lg mb-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-slate-400 uppercase">Username</label>
                                    <input 
                                        type="text" 
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-medium focus:outline-none focus:border-indigo-500"
                                        value={editForm.username}
                                        onChange={e => setEditForm({...editForm, username: e.target.value})}
                                        placeholder="@username"
                                    />
                                </div>
                                <div className="relative group">
                                    <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Batch Year</label>
                                    <div className="relative">
                                        <select 
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:border-indigo-500 appearance-none cursor-pointer hover:bg-slate-100 transition-colors"
                                            value={editForm.batch_year}
                                            onChange={e => setEditForm({...editForm, batch_year: e.target.value})}
                                        >
                                            <option value="" disabled>Select Year</option>
                                            {['2023', '2024', '2025'].map(year => (
                                                <option key={year} value={year}>{year}</option>
                                            ))}
                                        </select>
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                            <ChevronDown size={14} />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="relative group">
                                    <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Campus</label>
                                    <div className="relative">
                                        <select 
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:border-indigo-500 appearance-none cursor-pointer hover:bg-slate-100 transition-colors"
                                            value={editForm.campus}
                                            onChange={e => setEditForm({...editForm, campus: e.target.value})}
                                        >
                                            {['Bengaluru', 'Lucknow', 'Pune', 'Noida', 'Indore', 'Patna'].map(c => (
                                                <option key={c} value={c}>{c}</option>
                                            ))}
                                        </select>
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                            <ChevronDown size={14} />
                                        </div>
                                    </div>
                                </div>
                                <div className="relative group">
                                    <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Department</label>
                                    <div className="relative">
                                        <select 
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:border-indigo-500 appearance-none cursor-pointer hover:bg-slate-100 transition-colors"
                                            value={editForm.department}
                                            onChange={e => setEditForm({...editForm, department: e.target.value})}
                                        >
                                            {['SOT', 'SOM', 'SOH'].map(d => (
                                                <option key={d} value={d}>{d}</option>
                                            ))}
                                        </select>
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                            <ChevronDown size={14} />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-slate-400 uppercase">Avatar URL</label>
                                <input 
                                    type="text" 
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-medium focus:outline-none focus:border-indigo-500"
                                    value={editForm.avatar_url}
                                    onChange={e => setEditForm({...editForm, avatar_url: e.target.value})}
                                    placeholder="https://..."
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-400 uppercase">Bio</label>
                                <textarea 
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-medium focus:outline-none focus:border-indigo-500 min-h-[80px]"
                                    value={editForm.bio}
                                    onChange={e => setEditForm({...editForm, bio: e.target.value})}
                                    placeholder="Tell us about yourself..."
                                />
                            </div>
                        </div>
                    ) : (
                        <p className="text-slate-500 font-medium mb-4 max-w-2xl">
                           {profile.bio || "No bio yet."}
                        </p>
                    )}

                    <div className="flex flex-wrap items-center gap-6 text-slate-400 text-sm font-medium">
                       <div className="flex items-center gap-1.5">
                          <MapPin className="w-4 h-4" />
                          <span>{profile.campus || 'Campus Not Set'}</span>
                       </div>
                       {profile.department && (
                           <div className="flex items-center gap-1.5">
                               <ShieldCheck className="w-4 h-4" />
                               <span>{profile.department}</span>
                           </div>
                       )}
                       {profile.batch_year && (
                           <div className="flex items-center gap-1.5">
                               <Calendar className="w-4 h-4" />
                               <span>Batch of {profile.batch_year}</span>
                           </div>
                       )}
                       <div className="flex items-center gap-1.5 hover:text-indigo-500 transition-colors cursor-pointer">
                          <LinkIcon className="w-4 h-4" />
                          <span>{profile.email}</span>
                       </div>
                       <div className="flex items-center gap-1.5">
                          <Calendar className="w-4 h-4" />
                          <span>Joined {new Date(profile.created_at).toLocaleDateString()}</span>
                       </div>
                    </div>
                 </div>

                 {/* Stats */}
                 <div className="flex items-center gap-8 mt-8 border-t border-slate-100 pt-6">
                    <div className="text-center">
                       <div className="text-xl font-black text-slate-900">0</div>
                       <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Posts</div>
                    </div>
                    <div className="text-center">
                       <div className="text-xl font-black text-slate-900">0</div>
                       <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Followers</div>
                    </div>
                    <div className="text-center">
                       <div className="text-xl font-black text-slate-900">0</div>
                       <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Following</div>
                    </div>
                 </div>
              </div>
           </div>

           {/* Placeholder for User's Posts */}
           <div className="bg-white p-12 rounded-[2rem] border border-slate-100 text-center">
              <div className="inline-flex p-4 rounded-full bg-slate-50 mb-4 text-slate-300">
                 <Calendar className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-1">No posts yet</h3>
              <p className="text-slate-400 text-sm">When {profile.name} posts, you'll see it here.</p>
           </div>
        </main>
      </div>
    </div>
  );
};

export default Profile;
