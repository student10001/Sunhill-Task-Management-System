import React, { useState } from 'react';
import {
  ShieldCheck,
  UserPlus,
  Trash2,
  Edit,
  Search,
  Users,
  Shield,
  User,
  CheckCircle2,
  AlertTriangle,
  X,
  KeyRound,
  Mail,
  Building,
  MapPin,
  Phone,
  Sparkles,
  RefreshCw,
  Clock,
  Briefcase,
  Palette,
  Maximize2,
  Grid,
  AlignCenter,
  Sliders,
  Image as ImageIcon,
  RotateCcw,
  Check,
  Upload,
  Camera,
  Plus
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { UserProfile, UserRole, AppBackgroundConfig, BackgroundMode } from '../types';
import { SunhillLogo } from './SunhillLogo';
import { compressImage } from '../utils/imageCompressor';

const AVATAR_PRESETS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&auto=format&fit=crop&q=80'
];

const BACKGROUND_PRESETS = [
  {
    id: 'none',
    name: 'Default Solid',
    mode: 'expand' as BackgroundMode,
    url: '',
    previewBg: 'bg-slate-100 border border-slate-300',
    description: 'Clean default interface background'
  },
  {
    id: 'grid_pattern',
    name: 'Blueprint Grid',
    mode: 'pattern' as BackgroundMode,
    url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 36 36"><path d="M 36 0 L 0 0 0 36" fill="none" stroke="%236366f1" stroke-width="0.6" opacity="0.25"/></svg>',
    previewBg: 'bg-indigo-950 border border-indigo-700',
    description: 'Subtle technical grid lines (Pattern mode)'
  },
  {
    id: 'dot_matrix',
    name: 'Micro Dot Matrix',
    mode: 'pattern' as BackgroundMode,
    url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20"><circle cx="2" cy="2" r="1.5" fill="%234f46e5" opacity="0.25"/></svg>',
    previewBg: 'bg-slate-200 border border-slate-300',
    description: 'Clean repeating dot pattern (Pattern mode)'
  },
  {
    id: 'dark_mesh',
    name: 'Dark Cyber Mesh',
    mode: 'expand' as BackgroundMode,
    url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1600&auto=format&fit=crop&q=80',
    previewBg: 'bg-slate-900 border border-slate-700',
    description: 'Full-bleed dark gradient waves (Expand mode)'
  },
  {
    id: 'geometric_centered',
    name: 'Abstract Geometry',
    mode: 'center' as BackgroundMode,
    url: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=1200&auto=format&fit=crop&q=80',
    previewBg: 'bg-indigo-900 border border-indigo-700',
    description: 'Centered glowing geometric motif (Center mode)'
  },
  {
    id: 'carbon_pattern',
    name: 'Executive Carbon',
    mode: 'pattern' as BackgroundMode,
    url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16"><rect width="8" height="8" fill="%231e293b" opacity="0.14"/><rect x="8" y="8" width="8" height="8" fill="%231e293b" opacity="0.14"/></svg>',
    previewBg: 'bg-slate-800 border border-slate-600',
    description: 'Subtle carbon tile pattern (Pattern mode)'
  },
  {
    id: 'radiant_aurora',
    name: 'Radiant Gradient',
    mode: 'expand' as BackgroundMode,
    url: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=1600&auto=format&fit=crop&q=80',
    previewBg: 'bg-purple-900 border border-purple-700',
    description: 'Spanning soft gradient aura (Expand mode)'
  }
];

interface AdminManagerProps {
  openCreateTaskModal?: (assigneeId?: string) => void;
}

export const AdminManager: React.FC<AdminManagerProps> = ({ openCreateTaskModal }) => {
  const {
    users,
    currentUser,
    userRole,
    addMember,
    deleteMember,
    updateUserProfile,
    activityLogs,
    tasks,
    projects,
    wipeNonAdminData,
    appBackground,
    updateAppBackground,
    securityLogoUrl,
    updateSecurityLogoUrl
  } = useAuth();

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [editingMember, setEditingMember] = useState<UserProfile | null>(null);
  const [deletingMember, setDeletingMember] = useState<UserProfile | null>(null);
  const [pinModalUser, setPinModalUser] = useState<{ user: UserProfile; pin: string } | null>(null);
  const [isWipeModalOpen, setIsWipeModalOpen] = useState<boolean>(false);
  const [isWiping, setIsWiping] = useState<boolean>(false);

  // Interface Background Modal State
  const [isBgModalOpen, setIsBgModalOpen] = useState<boolean>(false);
  const [bgForm, setBgForm] = useState<AppBackgroundConfig>(
    appBackground || { imageUrl: '', mode: 'expand', opacity: 1, presetId: 'none' }
  );

  // Dedicated Admin Photo Upload Modal State
  const [isUploadPhotoModalOpen, setIsUploadPhotoModalOpen] = useState<boolean>(false);
  const [selectedMemberForPhoto, setSelectedMemberForPhoto] = useState<string>('');
  const [uploadPhotoPreview, setUploadPhotoPreview] = useState<string>('');
  const [photoUploadSuccess, setPhotoUploadSuccess] = useState<boolean>(false);

  // Security Portal Header Icon Modal State
  const [isSecurityLogoModalOpen, setIsSecurityLogoModalOpen] = useState<boolean>(false);
  const [securityLogoPreview, setSecurityLogoPreview] = useState<string>(securityLogoUrl || '');
  const [securityLogoSuccess, setSecurityLogoSuccess] = useState<boolean>(false);

  const handleOpenSecurityLogoModal = () => {
    setSecurityLogoPreview(securityLogoUrl || '');
    setSecurityLogoSuccess(false);
    setIsSecurityLogoModalOpen(true);
  };

  const handleSaveSecurityLogo = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateSecurityLogoUrl(securityLogoPreview);
    setSecurityLogoSuccess(true);
    setTimeout(() => {
      setSecurityLogoSuccess(false);
      setIsSecurityLogoModalOpen(false);
    }, 1200);
  };

  const handleOpenPhotoUploadModal = (memberId?: string) => {
    const targetId = memberId || (users[0]?.uid ?? '');
    const targetUser = users.find((u) => u.uid === targetId);
    setSelectedMemberForPhoto(targetId);
    setUploadPhotoPreview(targetUser?.photoURL || AVATAR_PRESETS[0]);
    setPhotoUploadSuccess(false);
    setIsUploadPhotoModalOpen(true);
  };

  const handleAdminPhotoSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMemberForPhoto || !uploadPhotoPreview) return;
    await updateUserProfile(selectedMemberForPhoto, {
      photoURL: uploadPhotoPreview
    });
    setPhotoUploadSuccess(true);
    setTimeout(() => {
      setPhotoUploadSuccess(false);
      setIsUploadPhotoModalOpen(false);
    }, 1200);
  };

  // New Member Form State
  const [formData, setFormData] = useState({
    displayName: '',
    email: '',
    photoURL: AVATAR_PRESETS[0],
    role: 'member' as UserRole,
    title: '',
    department: 'Sunhill Education System',
    phone: '',
    location: '',
    pinCode: '',
    statusMessage: '',
    generalResponsibilities: '',
    specificResponsibilities: ''
  });

  // Filtered members
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.department.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    const matchesDepartment = departmentFilter === 'all' || u.department === departmentFilter;

    return matchesSearch && matchesRole && matchesDepartment;
  });

  const adminCount = users.filter((u) => u.role === 'admin').length;
  const managerCount = users.filter((u) => u.role === 'manager').length;
  const memberCount = users.filter((u) => u.role === 'member').length;

  const resetForm = () => {
    setFormData({
      displayName: '',
      email: '',
      photoURL: AVATAR_PRESETS[0],
      role: 'member',
      title: '',
      department: 'Sunhill Education System',
      phone: '',
      location: '',
      pinCode: '1234',
      statusMessage: '',
      generalResponsibilities: '',
      specificResponsibilities: ''
    });
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.displayName || !formData.email || !formData.title) return;

    await addMember({
      displayName: formData.displayName,
      email: formData.email,
      photoURL: formData.photoURL,
      role: formData.role,
      title: formData.title,
      department: formData.department || 'Sunhill Education System',
      phone: formData.phone || '+1 (555) 000-0000',
      location: formData.location || 'Remote',
      pinCode: formData.pinCode || '1234',
      statusMessage: formData.statusMessage || '✨ Active team member',
      generalResponsibilities: formData.generalResponsibilities
        ? formData.generalResponsibilities.split('\n').filter(Boolean)
        : ['Collaborate on project milestones and team goals'],
      specificResponsibilities: formData.specificResponsibilities
        ? formData.specificResponsibilities.split('\n').filter(Boolean)
        : ['Maintain high quality output and task execution'],
      activeProjectIds: []
    });

    resetForm();
    setIsAddModalOpen(false);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember) return;

    await updateUserProfile(editingMember.uid, {
      displayName: editingMember.displayName,
      email: editingMember.email,
      photoURL: editingMember.photoURL,
      title: editingMember.title,
      department: editingMember.department,
      role: editingMember.role,
      phone: editingMember.phone,
      location: editingMember.location,
      pinCode: editingMember.pinCode || '1234',
      statusMessage: editingMember.statusMessage
    });

    setEditingMember(null);
  };

  const confirmDeleteMember = async () => {
    if (!deletingMember) return;
    await deleteMember(deletingMember.uid);
    setDeletingMember(null);
  };

  // If non-admin user somehow opens this tab, show protection notice
  if (userRole !== 'admin' && userRole !== 'manager') {
    return (
      <div className="bg-white border border-rose-200 rounded-2xl p-8 text-center max-w-lg mx-auto my-12 shadow-sm space-y-4">
        <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto border border-rose-200">
          <ShieldCheck className="w-8 h-8" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-900">Admin Portal Restricted</h2>
          <p className="text-xs text-slate-500 mt-1">
            You are currently logged in with regular member permissions. Access to member management and administrative security settings requires an Admin or Manager role.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Admin Portal Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white shadow-xl border border-slate-800 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="p-1.5 bg-indigo-500/20 text-indigo-400 rounded-lg border border-indigo-500/30">
                <ShieldCheck className="w-5 h-5" />
              </span>
              <h1 className="text-xl font-black tracking-tight text-white">
                Admin Personnel & Access Portal
              </h1>
              <span className="text-[10px] font-extrabold uppercase bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2.5 py-0.5 rounded-full">
                Admin Privilege Active
              </span>
            </div>
            <p className="text-xs text-slate-300 max-w-xl">
              Provision new accounts, assign role permissions (Admin, Manager, Member), configure security PIN passcodes, and maintain member access across Firestore.
            </p>
          </div>
        </div>
      </div>

      {/* Dedicated Administrative Control Commands Section */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg border border-indigo-100">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Admin Control Commands</h2>
              <p className="text-[11px] text-slate-500">
                Execute core administrative actions, system configuration, and member management commands
              </p>
            </div>
          </div>
          <span className="text-[10px] font-extrabold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2.5 py-1 rounded-full uppercase tracking-wider">
            4 Command Tools
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 text-xs">

          {/* 2. Change Interface Background */}
          <button
            onClick={() => {
              setBgForm(appBackground);
              setIsBgModalOpen(true);
            }}
            className="p-3.5 bg-slate-50 hover:bg-indigo-50/80 border border-slate-200 hover:border-indigo-300 rounded-xl font-semibold text-slate-800 hover:text-indigo-950 shadow-2xs transition-all flex items-center space-x-3 text-left group"
            title="Change system interface background image & mode"
          >
            <div className="p-2.5 bg-indigo-100 text-indigo-700 rounded-xl group-hover:bg-indigo-600 group-hover:text-white transition-colors shrink-0">
              <Palette className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-xs text-slate-900 group-hover:text-indigo-950">
                Change Background
              </div>
              <div className="text-[10px] text-slate-500 group-hover:text-indigo-800 font-normal">
                Custom theme background
              </div>
            </div>
          </button>

          {/* 3. Change Security Header Icon */}
          <button
            onClick={handleOpenSecurityLogoModal}
            className="p-3.5 bg-slate-50 hover:bg-amber-50/80 border border-slate-200 hover:border-amber-300 rounded-xl font-semibold text-slate-800 hover:text-amber-950 shadow-2xs transition-all flex items-center space-x-3 text-left group"
            title="Upload picture file to change Security Portal header icon"
          >
            <div className="p-2.5 bg-amber-100 text-amber-700 rounded-xl group-hover:bg-amber-600 group-hover:text-white transition-colors shrink-0">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-xs text-slate-900 group-hover:text-amber-950">
                Security Header Icon
              </div>
              <div className="text-[10px] text-slate-500 group-hover:text-amber-800 font-normal">
                Upload portal header logo
              </div>
            </div>
          </button>

          {/* 4. Wipe Non-Admin Data */}
          {userRole === 'admin' ? (
            <button
              onClick={() => setIsWipeModalOpen(true)}
              className="p-3.5 bg-slate-50 hover:bg-rose-50/80 border border-slate-200 hover:border-rose-300 rounded-xl font-semibold text-slate-800 hover:text-rose-950 shadow-2xs transition-all flex items-center space-x-3 text-left group"
              title="Purge projects under active projects and finished projects"
            >
              <div className="p-2.5 bg-rose-100 text-rose-700 rounded-xl group-hover:bg-rose-600 group-hover:text-white transition-colors shrink-0">
                <Trash2 className="w-4 h-4" />
              </div>
              <div>
                <div className="font-bold text-xs text-slate-900 group-hover:text-rose-950">
                  Wipe Non-Admin Data
                </div>
                <div className="text-[10px] text-slate-500 group-hover:text-rose-800 font-normal">
                  Purge active & finished projects
                </div>
              </div>
            </button>
          ) : (
            <div className="p-3.5 bg-slate-50/50 border border-slate-200/60 rounded-xl flex items-center space-x-3 opacity-60">
              <div className="p-2.5 bg-slate-100 text-slate-400 rounded-xl shrink-0">
                <Trash2 className="w-4 h-4" />
              </div>
              <div>
                <div className="font-bold text-xs text-slate-400">Wipe Non-Admin Data</div>
                <div className="text-[10px] text-slate-400 font-normal">Requires Admin Role</div>
              </div>
            </div>
          )}

          {/* 5. Add New Member */}
          <button
            onClick={() => {
              resetForm();
              setIsAddModalOpen(true);
            }}
            className="p-3.5 bg-indigo-600 hover:bg-indigo-700 text-white border border-indigo-600 rounded-xl font-semibold shadow-xs transition-all flex items-center space-x-3 text-left group"
            title="Provision a new personnel account"
          >
            <div className="p-2.5 bg-indigo-500/80 text-white rounded-xl group-hover:bg-indigo-800 transition-colors shrink-0">
              <UserPlus className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-xs text-white">
                Add New Member
              </div>
              <div className="text-[10px] text-indigo-100 font-normal">
                Provision new account
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 font-medium">Total App Members</span>
            <Users className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-1">{users.length}</div>
          <span className="text-[10px] text-slate-400">Active personnel directory</span>
        </div>

        <div className="bg-white border border-amber-200 rounded-xl p-4 shadow-xs bg-amber-50/30">
          <div className="flex items-center justify-between">
            <span className="text-amber-800 font-medium">System Administrators</span>
            <ShieldCheck className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-amber-900 mt-1">{adminCount}</div>
          <span className="text-[10px] text-amber-700">Full administrative access</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 font-medium">Managers</span>
            <Shield className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-1">{managerCount}</div>
          <span className="text-[10px] text-slate-400">Sprint & task managers</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 font-medium">Team Members</span>
            <User className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-1">{memberCount}</div>
        </div>
      </div>

      {/* Controls & Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
        {/* Search */}
        <div className="relative w-full md:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search members by name, email, title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* System / Department Dropdown Filter */}
        <div className="flex items-center space-x-2 w-full md:w-auto">
          <label className="text-[11px] font-bold text-slate-600 whitespace-nowrap">Filter by System:</label>
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="w-full md:w-auto bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-indigo-950 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
          >
            <option value="all">All Systems & Departments</option>
            <option value="Sunhill Education System">Sunhill Education System</option>
            <option value="Sunhill Montessori Casa">Sunhill Montessori Casa</option>
            <option value="E.Learning@Work">E.Learning@Work</option>
            <option value="Faithbook Ph">Faithbook Ph</option>
          </select>
        </div>

        {/* Role Filters */}
        <div className="flex items-center space-x-1 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          {[
            { id: 'all', label: `All (${users.length})` },
            { id: 'admin', label: `Admins (${adminCount})` },
            { id: 'manager', label: `Managers (${managerCount})` },
            { id: 'member', label: `Members (${memberCount})` }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setRoleFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-all ${
                roleFilter === tab.id
                  ? 'bg-indigo-600 text-white font-bold shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Members Management Table / Grid */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="font-bold text-sm text-slate-900">Personnel Directory & Permissions</h2>
            <p className="text-xs text-slate-500">Manage account credentials, roles, and security passcodes</p>
          </div>
          <span className="text-xs text-slate-500 font-medium">Showing {filteredUsers.length} members</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <th className="py-3 px-6">Member Personnel</th>
                <th className="py-3 px-4">Role & Access</th>
                <th className="py-3 px-4">Department & Title</th>
                <th className="py-3 px-4">Security PIN</th>
                <th className="py-3 px-4">Active Workload</th>
                <th className="py-3 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No members found matching filter criteria.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const userTasks = tasks.filter((t) => t.assigneeId === u.uid);
                  const inProgressCount = userTasks.filter((t) => t.status === 'in_progress').length;

                  return (
                    <tr key={u.uid} className="hover:bg-slate-50/80 transition-colors">
                      {/* Name & Photo */}
                      <td className="py-3.5 px-6">
                        <div className="flex items-center space-x-3">
                          <img
                            src={u.photoURL}
                            alt={u.displayName}
                            className="w-10 h-10 rounded-full object-cover border border-slate-200 shadow-xs"
                          />
                          <div>
                            <div className="font-bold text-slate-900 flex items-center space-x-1.5">
                              <span>{u.displayName}</span>
                              {u.uid === currentUser.uid && (
                                <span className="text-[10px] bg-indigo-50 text-indigo-700 border border-indigo-200 px-1.5 py-0.2 rounded font-semibold">
                                  You
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-500 flex items-center space-x-1">
                              <Mail className="w-3 h-3 text-slate-400" />
                              <span>{u.email}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="py-3.5 px-4">
                        {u.role === 'admin' ? (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                            <ShieldCheck className="w-3 h-3 text-amber-600" />
                            <span>Admin</span>
                          </span>
                        ) : u.role === 'manager' ? (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                            <Shield className="w-3 h-3 text-blue-600" />
                            <span>Manager</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                            <User className="w-3 h-3 text-slate-500" />
                            <span>Member</span>
                          </span>
                        )}
                      </td>

                      {/* Title & Department */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-800">{u.title}</div>
                        <div className="text-[11px] text-slate-500">{u.department}</div>
                      </td>

                      {/* PIN */}
                      <td className="py-3.5 px-4 font-mono font-medium text-slate-700">
                        <button
                          onClick={() => setPinModalUser({ user: u, pin: u.pinCode || '1234' })}
                          className="inline-flex items-center space-x-1.5 bg-slate-100 hover:bg-amber-50 hover:border-amber-300 text-slate-800 hover:text-amber-900 px-2.5 py-1 rounded-lg border border-slate-200 transition-all font-mono text-xs font-semibold group cursor-pointer"
                          title="Click to set or update Security PIN"
                        >
                          <KeyRound className="w-3.5 h-3.5 text-amber-600 group-hover:scale-110 transition-transform" />
                          <span>{u.pinCode || '1234'}</span>
                          <span className="text-[10px] text-amber-700 font-sans font-bold bg-amber-100 px-1 rounded ml-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            Edit
                          </span>
                        </button>
                      </td>

                      {/* Workload */}
                      <td className="py-3.5 px-4 text-slate-600">
                        <div className="font-medium text-slate-900">{userTasks.length} Tasks assigned</div>
                        <div className="text-[11px] text-indigo-600 font-semibold">{inProgressCount} in progress</div>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-6 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          {/* Upload Member Photo Button */}
                          <button
                            onClick={() => handleOpenPhotoUploadModal(u.uid)}
                            className="p-1.5 text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg border border-slate-200 transition-colors"
                            title="Upload Profile Picture for this member"
                          >
                            <Camera className="w-3.5 h-3.5" />
                          </button>

                          {/* Assign Task Button */}
                          {openCreateTaskModal && (
                            <button
                              onClick={() => openCreateTaskModal(u.uid)}
                              className="px-2 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-[10px] transition-colors flex items-center space-x-1 shadow-2xs"
                              title={`Assign Task to ${u.displayName}`}
                            >
                              <Plus className="w-3 h-3 text-slate-950 font-extrabold" />
                              <span>Assign Task</span>
                            </button>
                          )}

                          {/* Quick Role Toggle */}
                          <select
                            value={u.role}
                            onChange={(e) => updateUserProfile(u.uid, { role: e.target.value as UserRole })}
                            className="bg-slate-100 border border-slate-200 text-slate-700 text-xs rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium cursor-pointer"
                          >
                            <option value="member">Set Member</option>
                            <option value="manager">Set Manager</option>
                            <option value="admin">Set Admin</option>
                          </select>

                          {/* Edit Details */}
                          <button
                            onClick={() => setEditingMember(u)}
                            className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg border border-slate-200 transition-colors"
                            title="Edit Member Details"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => setDeletingMember(u)}
                            disabled={u.uid === currentUser.uid}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg border border-slate-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                            title={u.uid === currentUser.uid ? "Cannot delete yourself" : "Delete Member"}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>



      {/* Add Member Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4 text-slate-900 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg border border-indigo-200">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">Add New App Member</h3>
                  <p className="text-[11px] text-slate-500">Provision user profile & security permissions in Firestore</p>
                </div>
              </div>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-4 text-xs">
              {/* Full Name & Email */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. David Vance"
                    value={formData.displayName}
                    onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    placeholder="david.vance@techcorp.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Title & Department */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Job Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Senior QA Engineer"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Department / System</label>
                  <select
                    value={formData.department || 'Sunhill Education System'}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-500 font-medium text-slate-900"
                  >
                    <option value="Sunhill Education System">Sunhill Education System</option>
                    <option value="Sunhill Montessori Casa">Sunhill Montessori Casa</option>
                    <option value="E.Learning@Work">E.Learning@Work</option>
                    <option value="Faithbook Ph">Faithbook Ph</option>
                  </select>
                </div>
              </div>

              {/* Role & PIN */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Assigned Role</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-500 font-semibold text-indigo-700"
                  >
                    <option value="member">Member (Regular)</option>
                    <option value="manager">Manager</option>
                    <option value="admin">Admin (Full Control)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Security PIN Code</label>
                  <input
                    type="text"
                    placeholder="1234"
                    value={formData.pinCode}
                    onChange={(e) => setFormData({ ...formData, pinCode: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-500 font-mono"
                  />
                </div>
              </div>

              {/* Avatar & Local Photo Upload */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-slate-700 font-bold">Profile Photo / Avatar</label>
                  <label htmlFor="admin-add-local-photo" className="cursor-pointer text-indigo-600 hover:text-indigo-700 font-semibold text-[11px] flex items-center space-x-1 bg-white px-2 py-1 rounded-lg border border-slate-200 shadow-2xs">
                    <Upload className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Upload Local File</span>
                    <input
                      id="admin-add-local-photo"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          try {
                            const compressed = await compressImage(file, 400, 400, 0.75);
                            setFormData({ ...formData, photoURL: compressed });
                          } catch (err) {
                            console.error('Error compressing image:', err);
                          }
                        }
                      }}
                    />
                  </label>
                </div>
                <div className="flex items-center space-x-3">
                  <img src={formData.photoURL} alt="Preview" className="w-10 h-10 rounded-full object-cover border-2 border-indigo-600 shadow-xs shrink-0" />
                  <div className="flex-1">
                    <input
                      type="text"
                      placeholder="Or paste image URL (https://...)"
                      value={formData.photoURL}
                      onChange={(e) => setFormData({ ...formData, photoURL: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
                <div className="flex space-x-1.5 overflow-x-auto pt-1">
                  {AVATAR_PRESETS.map((preset, idx) => (
                    <img
                      key={idx}
                      src={preset}
                      alt="Avatar preset"
                      onClick={() => setFormData({ ...formData, photoURL: preset })}
                      className={`w-8 h-8 rounded-full object-cover cursor-pointer border-2 transition-all ${
                        formData.photoURL === preset
                          ? 'border-indigo-600 scale-110 shadow-xs'
                          : 'border-slate-200 opacity-60 hover:opacity-100'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Responsibilities */}
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Primary Responsibilities (One per line)</label>
                <textarea
                  rows={2}
                  placeholder="Design & execute integration test suites&#10;Maintain performance compliance"
                  value={formData.generalResponsibilities}
                  onChange={(e) => setFormData({ ...formData, generalResponsibilities: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold shadow-xs"
                >
                  Provision Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Member Modal */}
      {editingMember && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4 text-slate-900 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg border border-indigo-200">
                  <Edit className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">Edit Member Settings</h3>
                  <p className="text-[11px] text-slate-500">Update role privileges & security details</p>
                </div>
              </div>
              <button onClick={() => setEditingMember(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={editingMember.displayName}
                    onChange={(e) => setEditingMember({ ...editingMember, displayName: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Email</label>
                  <input
                    type="email"
                    required
                    value={editingMember.email}
                    onChange={(e) => setEditingMember({ ...editingMember, email: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Job Title</label>
                  <input
                    type="text"
                    required
                    value={editingMember.title}
                    onChange={(e) => setEditingMember({ ...editingMember, title: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Department / System</label>
                  <select
                    value={editingMember.department || 'Sunhill Education System'}
                    onChange={(e) => setEditingMember({ ...editingMember, department: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-500 font-medium text-slate-900"
                  >
                    <option value="Sunhill Education System">Sunhill Education System</option>
                    <option value="Sunhill Montessori Casa">Sunhill Montessori Casa</option>
                    <option value="E.Learning@Work">E.Learning@Work</option>
                    <option value="Faithbook Ph">Faithbook Ph</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Role Privilege</label>
                  <select
                    value={editingMember.role}
                    onChange={(e) => setEditingMember({ ...editingMember, role: e.target.value as UserRole })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-indigo-700 focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="member">Member</option>
                    <option value="manager">Manager</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Security PIN Passcode</label>
                  <input
                    type="text"
                    value={editingMember.pinCode || '1234'}
                    onChange={(e) => setEditingMember({ ...editingMember, pinCode: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Profile Picture / Avatar Editor */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-slate-700 font-bold flex items-center space-x-1.5">
                    <Camera className="w-4 h-4 text-indigo-600" />
                    <span>Profile Picture / Avatar</span>
                  </label>
                  <label htmlFor="admin-edit-local-photo" className="cursor-pointer text-indigo-600 hover:text-indigo-700 font-semibold text-[11px] flex items-center space-x-1 bg-white px-2 py-1 rounded-lg border border-slate-200 shadow-2xs">
                    <Upload className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Upload Local File</span>
                    <input
                      id="admin-edit-local-photo"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          try {
                            const compressed = await compressImage(file, 400, 400, 0.75);
                            setEditingMember({ ...editingMember, photoURL: compressed });
                          } catch (err) {
                            console.error('Error compressing image:', err);
                          }
                        }
                      }}
                    />
                  </label>
                </div>

                <div className="flex items-center space-x-3">
                  <img
                    src={editingMember.photoURL}
                    alt={editingMember.displayName}
                    className="w-12 h-12 rounded-full object-cover border-2 border-indigo-600 shadow-xs shrink-0"
                  />
                  <div className="flex-1 space-y-1">
                    <input
                      type="text"
                      placeholder="Paste image URL (https://...)"
                      value={editingMember.photoURL}
                      onChange={(e) => setEditingMember({ ...editingMember, photoURL: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <div className="text-[10px] text-slate-400">Select preset or click Upload Local File above</div>
                  </div>
                </div>

                <div className="flex space-x-1.5 pt-1 overflow-x-auto">
                  {AVATAR_PRESETS.map((preset, idx) => (
                    <img
                      key={idx}
                      src={preset}
                      alt="Avatar preset"
                      onClick={() => setEditingMember({ ...editingMember, photoURL: preset })}
                      className={`w-8 h-8 rounded-full object-cover cursor-pointer border-2 transition-all ${
                        editingMember.photoURL === preset
                          ? 'border-indigo-600 scale-110 shadow-xs'
                          : 'border-slate-200 opacity-60 hover:opacity-100'
                      }`}
                    />
                  ))}
                </div>
              </div>

              <div className="pt-2 flex justify-end space-x-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingMember(null)}
                  className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl font-medium hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold shadow-xs"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingMember && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4 text-slate-900 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto border border-rose-200">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="font-bold text-base text-slate-900">Delete Member Profile?</h3>
              <p className="text-xs text-slate-500">
                Are you sure you want to remove <span className="font-bold text-slate-900">{deletingMember.displayName}</span> from the application personnel directory?
              </p>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs flex items-center space-x-3">
              <img src={deletingMember.photoURL} alt={deletingMember.displayName} className="w-9 h-9 rounded-full object-cover" />
              <div>
                <div className="font-bold text-slate-900">{deletingMember.displayName}</div>
                <div className="text-[11px] text-slate-500">{deletingMember.title} • {deletingMember.email}</div>
              </div>
            </div>

            <div className="pt-2 flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setDeletingMember(null)}
                className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl font-medium hover:bg-slate-200 text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteMember}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-semibold text-xs shadow-xs"
              >
                Delete Member
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Set Security PIN Passcode Modal */}
      {pinModalUser && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4 text-slate-900 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-amber-50 text-amber-600 rounded-xl border border-amber-200">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">Set Security Passcode PIN</h3>
                  <p className="text-[11px] text-slate-500">
                    Configure passcode for {pinModalUser.user.displayName} ({pinModalUser.user.role.toUpperCase()})
                  </p>
                </div>
              </div>
              <button onClick={() => setPinModalUser(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center space-x-3 text-xs">
              <img src={pinModalUser.user.photoURL} alt={pinModalUser.user.displayName} className="w-10 h-10 rounded-full object-cover border border-slate-200" />
              <div>
                <div className="font-bold text-slate-900 flex items-center space-x-1">
                  <span>{pinModalUser.user.displayName}</span>
                  <span className="text-[10px] bg-indigo-50 text-indigo-700 border border-indigo-200 px-1.5 py-0.2 rounded font-semibold uppercase">
                    {pinModalUser.user.role}
                  </span>
                </div>
                <div className="text-[11px] text-slate-500">{pinModalUser.user.title} • {pinModalUser.user.email}</div>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  New Security PIN Passcode *
                </label>
                <input
                  type="text"
                  required
                  maxLength={8}
                  value={pinModalUser.pin}
                  onChange={(e) => setPinModalUser({ ...pinModalUser, pin: e.target.value })}
                  placeholder="Enter security PIN..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Quick Helper buttons */}
              <div className="flex items-center space-x-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    const randomPin = Math.floor(1000 + Math.random() * 9000).toString();
                    setPinModalUser({ ...pinModalUser, pin: randomPin });
                  }}
                  className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-[11px] font-semibold border border-indigo-200 flex items-center space-x-1"
                >
                  <Sparkles className="w-3 h-3 text-indigo-600" />
                  <span>Generate Random PIN</span>
                </button>
              </div>
            </div>

            <div className="pt-2 flex justify-end space-x-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setPinModalUser(null)}
                className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl font-medium hover:bg-slate-200 text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (!pinModalUser.pin.trim()) return;
                  await updateUserProfile(pinModalUser.user.uid, { pinCode: pinModalUser.pin.trim() });
                  setPinModalUser(null);
                }}
                className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-semibold text-xs shadow-xs"
              >
                Update Security PIN
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Wipe All Data Except Admins Modal */}
      {isWipeModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-rose-200 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4 text-slate-900 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto border border-rose-200 shadow-sm">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <div className="text-center space-y-1.5">
              <h3 className="font-black text-lg text-slate-900">Purge & Wipe Non-Admin Data?</h3>
              <p className="text-xs text-slate-600 max-w-sm mx-auto">
                This administrative operation will delete projects under "Active Projects" and "Finished Projects" along with their associated tasks, milestones, and project logs.
              </p>
            </div>

            <div className="p-3 bg-rose-50/70 border border-rose-200 rounded-xl space-y-2 text-xs">
              <div className="font-bold text-rose-900 flex items-center space-x-1">
                <ShieldCheck className="w-4 h-4 text-rose-600" />
                <span>Personnel Retained Post-Wipe:</span>
              </div>
              <ul className="list-disc list-inside space-y-1 text-rose-800 font-medium pl-1">
                {users.map((a) => (
                  <li key={a.uid}>
                    <span className="font-bold">{a.displayName}</span> ({a.title} • {a.role.toUpperCase()})
                  </li>
                ))}
              </ul>
              <p className="text-[11px] text-rose-700 italic border-t border-rose-200/60 pt-1.5">
                All team member user accounts will be preserved while project records under active and finished sections are cleared.
              </p>
            </div>

            <div className="pt-2 flex items-center justify-end space-x-2 border-t border-slate-100">
              <button
                type="button"
                disabled={isWiping}
                onClick={() => setIsWipeModalOpen(false)}
                className="px-4 py-2 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-xl font-medium text-xs transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isWiping}
                onClick={async () => {
                  setIsWiping(true);
                  await wipeNonAdminData();
                  setIsWiping(false);
                  setIsWipeModalOpen(false);
                }}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs shadow-lg shadow-rose-600/30 flex items-center space-x-1.5 transition-all disabled:opacity-50"
              >
                {isWiping ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Purging Data...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Confirm & Wipe Non-Admin Data</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Change Interface Background Modal */}
      {isBgModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200 my-8">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-2xl border border-indigo-100">
                  <Palette className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Interface Background Customization
                  </h3>
                  <p className="text-xs text-slate-500">
                    Change the global background appearance and display layout for all users.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsBgModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Display Mode Selection (Center, Expand, Pattern) */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-900 flex items-center justify-between">
                <span>1. Select Background Layout Mode</span>
                <span className="text-[10px] font-normal text-slate-500 uppercase tracking-wider">
                  Requested Options: Center • Expand • Pattern
                </span>
              </label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  {
                    id: 'expand' as BackgroundMode,
                    label: 'Expand',
                    sub: 'Cover & scale full viewport',
                    icon: Maximize2
                  },
                  {
                    id: 'center' as BackgroundMode,
                    label: 'Center',
                    sub: 'Centered without stretching',
                    icon: AlignCenter
                  },
                  {
                    id: 'pattern' as BackgroundMode,
                    label: 'Pattern',
                    sub: 'Tile & repeat seamlessly',
                    icon: Grid
                  }
                ].map((m) => {
                  const IconComp = m.icon;
                  const isActive = bgForm.mode === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setBgForm({ ...bgForm, mode: m.id })}
                      className={`p-3 rounded-2xl border text-left transition-all relative flex flex-col justify-between ${
                        isActive
                          ? 'border-indigo-600 bg-indigo-50/60 ring-2 ring-indigo-500/20 shadow-xs'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full mb-1">
                        <span className={`p-1.5 rounded-lg ${isActive ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                          <IconComp className="w-4 h-4" />
                        </span>
                        {isActive && <Check className="w-4 h-4 text-indigo-600 font-bold" />}
                      </div>
                      <div>
                        <div className={`text-xs font-bold ${isActive ? 'text-indigo-950' : 'text-slate-800'}`}>
                          {m.label}
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5 leading-tight">
                          {m.sub}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Presets Grid */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-900">
                2. Choose Wallpaper or Pattern Preset
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 max-h-48 overflow-y-auto p-1 border border-slate-100 rounded-2xl">
                {BACKGROUND_PRESETS.map((preset) => {
                  const isSelected = bgForm.presetId === preset.id || (preset.id === 'none' && !bgForm.imageUrl);
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() =>
                        setBgForm({
                          ...bgForm,
                          imageUrl: preset.url,
                          mode: preset.mode,
                          presetId: preset.id
                        })
                      }
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-50/70 ring-2 ring-indigo-500/20'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <div className={`h-10 w-full rounded-lg ${preset.previewBg} mb-2 flex items-center justify-center overflow-hidden`}>
                        {preset.url ? (
                          <div
                            className="w-full h-full"
                            style={{
                              backgroundImage: `url("${preset.url}")`,
                              backgroundSize: preset.mode === 'expand' ? 'cover' : 'auto',
                              backgroundRepeat: preset.mode === 'pattern' ? 'repeat' : 'no-repeat',
                              backgroundPosition: 'center'
                            }}
                          />
                        ) : (
                          <span className="text-[10px] text-slate-400 font-medium">Solid Default</span>
                        )}
                      </div>
                      <div className="text-xs font-semibold text-slate-900 truncate">
                        {preset.name}
                      </div>
                      <div className="text-[9px] text-slate-400 uppercase tracking-wider font-bold">
                        {preset.mode}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom Image URL / Local Picture Upload */}
            <div className="space-y-2 p-3.5 bg-slate-50 border border-slate-200 rounded-2xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <label className="text-xs font-bold text-slate-900 flex items-center space-x-1.5">
                  <ImageIcon className="w-4 h-4 text-indigo-600" />
                  <span>3. Provide Custom Image or Upload Local Picture</span>
                </label>
                <label
                  htmlFor="admin-bg-local-upload-btn"
                  className="cursor-pointer bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-3.5 py-1.5 rounded-xl shadow-sm flex items-center justify-center space-x-1.5 transition-all shrink-0"
                  title="Choose image file from local device"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload Picture File</span>
                  <input
                    id="admin-bg-local-upload-btn"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (ev) => {
                          if (ev.target?.result) {
                            setBgForm({
                              ...bgForm,
                              imageUrl: ev.target.result as string,
                              presetId: 'custom'
                            });
                          }
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                </label>
              </div>
              <div className="relative">
                <ImageIcon className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="url"
                  placeholder="Or paste web image URL (https://...) or data:image/..."
                  value={bgForm.imageUrl}
                  onChange={(e) =>
                    setBgForm({
                      ...bgForm,
                      imageUrl: e.target.value,
                      presetId: 'custom'
                    })
                  }
                  className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Opacity Slider */}
            <div className="space-y-1.5 bg-slate-50 border border-slate-200 rounded-2xl p-3.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-900 flex items-center space-x-1.5">
                  <Sliders className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Background Opacity & Intensity</span>
                </label>
                <span className="text-xs font-extrabold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                  {Math.round((bgForm.opacity ?? 1) * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0.1"
                max="1"
                step="0.05"
                value={bgForm.opacity ?? 1}
                onChange={(e) => setBgForm({ ...bgForm, opacity: parseFloat(e.target.value) })}
                className="w-full accent-indigo-600 cursor-pointer"
              />
              <p className="text-[10px] text-slate-500">
                Tip: Lower opacity ensures UI cards and text remain easy to read regardless of image choice.
              </p>
            </div>

            {/* Live Sample Preview Box */}
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Live Interface Sample Preview
              </span>
              <div className="h-28 rounded-2xl border border-slate-300 relative overflow-hidden bg-slate-100 flex items-center justify-center p-3">
                {bgForm.imageUrl && (
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      backgroundImage: `url("${bgForm.imageUrl}")`,
                      backgroundSize: bgForm.mode === 'expand' ? 'cover' : 'auto',
                      backgroundPosition: bgForm.mode === 'pattern' ? 'top left' : 'center center',
                      backgroundRepeat: bgForm.mode === 'pattern' ? 'repeat' : 'no-repeat',
                      opacity: bgForm.opacity ?? 1
                    }}
                  />
                )}
                <div className="relative z-10 bg-white/90 backdrop-blur-xs border border-slate-200/80 rounded-xl p-3 shadow-md max-w-sm w-full text-center space-y-1">
                  <div className="text-xs font-bold text-slate-900">
                    Sunhill Task Tracking Interface
                  </div>
                  <div className="text-[10px] text-slate-500">
                    Sample Card • Mode: <span className="font-bold text-indigo-600 uppercase">{bgForm.mode}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="pt-3 flex items-center justify-between border-t border-slate-100">
              <button
                type="button"
                onClick={() =>
                  setBgForm({
                    imageUrl: '',
                    mode: 'expand',
                    opacity: 1,
                    presetId: 'none'
                  })
                }
                className="px-3 py-2 text-slate-500 hover:text-slate-800 text-xs font-medium flex items-center space-x-1 rounded-xl hover:bg-slate-100 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Solid Default</span>
              </button>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setIsBgModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-xl font-medium text-xs transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    await updateAppBackground(bgForm);
                    setIsBgModalOpen(false);
                  }}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-xs shadow-lg shadow-indigo-600/30 flex items-center space-x-1.5 transition-all"
                >
                  <Check className="w-4 h-4" />
                  <span>Save & Apply Background</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Dedicated Upload Member Profile Picture Command Modal */}
      {isUploadPhotoModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4 text-slate-900 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-200">
                  <Camera className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">Upload Member Profile Picture</h3>
                  <p className="text-[11px] text-slate-500">Admin command tool: Upload local image file for any personnel</p>
                </div>
              </div>
              <button
                onClick={() => setIsUploadPhotoModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAdminPhotoSave} className="space-y-4 text-xs">
              {/* Target Member Selector */}
              <div>
                <label className="block text-slate-700 font-bold mb-1">Select App Member *</label>
                <select
                  value={selectedMemberForPhoto}
                  onChange={(e) => {
                    const id = e.target.value;
                    setSelectedMemberForPhoto(id);
                    const found = users.find((u) => u.uid === id);
                    if (found) setUploadPhotoPreview(found.photoURL);
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500"
                >
                  {users.map((u) => (
                    <option key={u.uid} value={u.uid}>
                      {u.displayName} ({u.title} • {u.department})
                    </option>
                  ))}
                </select>
              </div>

              {/* Photo Upload & Preview Container */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <span className="block text-slate-700 font-bold">Image Source & Local Upload</span>

                <div className="flex flex-col sm:flex-row items-center gap-4">
                  {/* Avatar Circle Preview */}
                  <div className="relative group shrink-0">
                    <img
                      src={uploadPhotoPreview || AVATAR_PRESETS[0]}
                      alt="Member Avatar Preview"
                      className="w-20 h-20 rounded-full object-cover border-4 border-emerald-500 shadow-md bg-white"
                    />
                    <label
                      htmlFor="admin-modal-local-photo"
                      className="absolute inset-0 rounded-full bg-slate-900/40 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-[10px] font-bold"
                    >
                      Change
                    </label>
                  </div>

                  <div className="flex-1 space-y-2 w-full">
                    {/* Command Button for Local File Upload */}
                    <label
                      htmlFor="admin-modal-local-photo"
                      className="cursor-pointer w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center justify-center space-x-2 shadow-sm transition-colors"
                    >
                      <Upload className="w-4 h-4" />
                      <span>Choose File from Local Computer</span>
                      <input
                        id="admin-modal-local-photo"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            try {
                              const compressed = await compressImage(file, 400, 400, 0.75);
                              setUploadPhotoPreview(compressed);
                            } catch (err) {
                              console.error('Error compressing image:', err);
                            }
                          }
                        }}
                      />
                    </label>

                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Or paste web image URL (https://...)"
                        value={uploadPhotoPreview}
                        onChange={(e) => setUploadPhotoPreview(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Preset Quick Selection */}
                <div>
                  <span className="block text-[11px] font-medium text-slate-500 mb-1">Or pick from avatar presets:</span>
                  <div className="flex space-x-2 overflow-x-auto pb-1">
                    {AVATAR_PRESETS.map((preset, idx) => (
                      <img
                        key={idx}
                        src={preset}
                        alt="Avatar preset"
                        onClick={() => setUploadPhotoPreview(preset)}
                        className={`w-9 h-9 rounded-full object-cover cursor-pointer border-2 transition-all ${
                          uploadPhotoPreview === preset
                            ? 'border-emerald-600 scale-110 shadow-sm'
                            : 'border-slate-200 opacity-60 hover:opacity-100'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {photoUploadSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold flex items-center space-x-2 animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Profile picture successfully updated & saved to Firestore!</span>
                </div>
              )}

              <div className="pt-2 flex justify-end space-x-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsUploadPhotoModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-md flex items-center space-x-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Save Member Profile Photo</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Upload Security Portal Header Icon Modal */}
      {isSecurityLogoModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-amber-50 text-amber-600 rounded-xl border border-amber-200">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">Change Security Header Icon</h3>
                  <p className="text-[11px] text-slate-500">Upload a picture to replace the portal & system header logo</p>
                </div>
              </div>
              <button
                onClick={() => setIsSecurityLogoModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSecurityLogo} className="space-y-4 text-xs">
              {/* Image Preview & Upload Controls */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-4">
                <span className="block text-slate-700 font-bold">Picture Preview & File Source</span>

                <div className="flex flex-col sm:flex-row items-center gap-4">
                  {/* Logo Preview Container */}
                  <div className="relative group shrink-0 p-2 bg-white rounded-2xl border-2 border-amber-400 shadow-md flex items-center justify-center w-24 h-24">
                    {securityLogoPreview ? (
                      <img
                        src={securityLogoPreview}
                        alt="Security Header Icon Preview"
                        className="w-20 h-20 object-contain rounded-xl"
                      />
                    ) : (
                      <SunhillLogo className="w-20 h-20" />
                    )}
                    <label
                      htmlFor="security-header-local-photo"
                      className="absolute inset-0 rounded-2xl bg-slate-900/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-[10px] font-bold"
                    >
                      Upload
                    </label>
                  </div>

                  <div className="flex-1 space-y-2.5 w-full">
                    {/* Choose Local Picture File Button */}
                    <label
                      htmlFor="security-header-local-photo"
                      className="cursor-pointer w-full py-2.5 px-4 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold text-xs flex items-center justify-center space-x-2 shadow-xs transition-colors"
                    >
                      <Upload className="w-4 h-4" />
                      <span>Choose File from Local Computer</span>
                      <input
                        id="security-header-local-photo"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (ev) => {
                              if (ev.target?.result) {
                                setSecurityLogoPreview(ev.target.result as string);
                              }
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </label>

                    {/* Image URL Input */}
                    <div>
                      <input
                        type="text"
                        placeholder="Or paste web image URL (https://...)"
                        value={securityLogoPreview}
                        onChange={(e) => setSecurityLogoPreview(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Reset to Default Action */}
                <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between">
                  <span className="text-[11px] text-slate-500 font-medium">Revert to original branding?</span>
                  <button
                    type="button"
                    onClick={() => setSecurityLogoPreview('')}
                    className="px-2.5 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-[11px] font-bold flex items-center space-x-1 transition-colors"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Reset to Default Sunhill Crest</span>
                  </button>
                </div>
              </div>

              {securityLogoSuccess && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs font-semibold flex items-center space-x-2 animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 text-amber-600" />
                  <span>Security header icon successfully updated & synced!</span>
                </div>
              )}

              <div className="pt-2 flex justify-end space-x-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsSecurityLogoModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold shadow-md flex items-center space-x-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Save Security Header Icon</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
