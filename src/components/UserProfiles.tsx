import React, { useState } from 'react';
import {
  User,
  Shield,
  Briefcase,
  CheckSquare,
  Award,
  Layers,
  Edit3,
  Clock,
  Phone,
  Mail,
  MapPin,
  Plus,
  Trash2,
  X,
  Check,
  CheckCircle2,
  Camera,
  Upload,
  ListTodo,
  Lock,
  Trophy,
  StickyNote,
  FileText,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { UserProfile, Task, Project, Milestone, ProjectNote } from '../types';
import { compressImage } from '../utils/imageCompressor';

const AVATAR_PRESETS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&auto=format&fit=crop&q=80'
];

interface UserProfilesProps {
  openCreateTaskModal?: (assigneeId?: string) => void;
}

export const UserProfiles: React.FC<UserProfilesProps> = ({ openCreateTaskModal }) => {
  const {
    users,
    tasks,
    projects,
    milestones,
    projectNotes,
    currentUser,
    userRole,
    updateUserProfile,
    updateTaskStatus,
    updateTaskDetails,
    createProjectNote,
    updateProjectNote,
    deleteProjectNote
  } = useAuth();

  const [selectedUserId, setSelectedUserId] = useState<string>(currentUser.uid);
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [viewingTaskTodoList, setViewingTaskTodoList] = useState<Task | null>(null);
  const [newSubtaskInput, setNewSubtaskInput] = useState<string>('');

  // Job Responsibilities Collapse/Expand State
  const [isResponsibilitiesExpanded, setIsResponsibilitiesExpanded] = useState<boolean>(true);
  const [isGeneralExpanded, setIsGeneralExpanded] = useState<boolean>(true);
  const [isSpecificExpanded, setIsSpecificExpanded] = useState<boolean>(true);

  // Selected profile
  const profileUser = users.find((u) => u.uid === selectedUserId) || currentUser;

  // Associated user data (for Active Projects)
  const activeProjects = projects.filter((p) => {
    const projTasks = tasks.filter((t) => t.projectId === p.id);
    if (projTasks.length > 0) {
      let totalRatio = 0;
      projTasks.forEach((t) => {
        if (t.subtasks && t.subtasks.length > 0) {
          const doneCount = t.subtasks.filter((st) => st.completed).length;
          totalRatio += doneCount / t.subtasks.length;
        } else {
          totalRatio += t.status === 'completed' ? 1 : 0;
        }
      });
      const pct = Math.round((totalRatio / projTasks.length) * 100);
      return pct < 100 && p.status !== 'completed';
    }
    return p.status !== 'completed';
  });
  const activeProjectIds = new Set(activeProjects.map((p) => p.id));

  // Finished Projects (100% completion)
  const finishedProjects = projects.filter((p) => {
    const projTasks = tasks.filter((t) => t.projectId === p.id);
    if (projTasks.length > 0) {
      let totalRatio = 0;
      projTasks.forEach((t) => {
        if (t.subtasks && t.subtasks.length > 0) {
          const doneCount = t.subtasks.filter((st) => st.completed).length;
          totalRatio += doneCount / t.subtasks.length;
        } else {
          totalRatio += t.status === 'completed' ? 1 : 0;
        }
      });
      const pct = Math.round((totalRatio / projTasks.length) * 100);
      return pct >= 100 || p.status === 'completed';
    }
    return p.status === 'completed';
  });
  const finishedProjectIds = new Set(finishedProjects.map((p) => p.id));

  const userTasks = tasks.filter((t) => t.assigneeId === profileUser.uid && (!t.projectId || activeProjectIds.has(t.projectId)));
  const activeUserTasks = userTasks.filter((t) => t.status !== 'completed');
  const completedUserTasks = userTasks.filter((t) => t.status === 'completed');

  const userAssignedProjectIds = new Set(tasks.filter((t) => t.assigneeId === profileUser.uid && Boolean(t.projectId)).map((t) => t.projectId));

  const userActiveProjects = projects.filter((p) => userAssignedProjectIds.has(p.id) && activeProjectIds.has(p.id));
  const userFinishedProjects = finishedProjects.filter((p) => userAssignedProjectIds.has(p.id));
  const userMilestones = milestones.filter((m) => userAssignedProjectIds.has(m.projectId) && (finishedProjectIds.has(m.projectId) || (m.completedBy === profileUser.uid && m.completed)));

  // Member Assigned Projects (for linking notes)
  const userAssignedProjects = projects.filter(
    (p) => userAssignedProjectIds.has(p.id) || p.memberIds.includes(profileUser.uid)
  );
  const userProjectNotes = (projectNotes || []).filter((n) => n.userId === profileUser.uid);

  // Project Notes State
  const [showNoteModal, setShowNoteModal] = useState<boolean>(false);
  const [noteTitle, setNoteTitle] = useState<string>('');
  const [noteContent, setNoteContent] = useState<string>('');
  const [noteProjectId, setNoteProjectId] = useState<string>('');
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [noteProjectFilter, setNoteProjectFilter] = useState<string>('all');

  // Edit State
  const [editTitle, setEditTitle] = useState(profileUser.title);
  const [editDepartment, setEditDepartment] = useState(profileUser.department);
  const [editPhotoURL, setEditPhotoURL] = useState(profileUser.photoURL);
  const [editPhone, setEditPhone] = useState(profileUser.phone || '');
  const [editLocation, setEditLocation] = useState(profileUser.location || '');
  const [editPinCode, setEditPinCode] = useState(profileUser.pinCode || '');
  const [generalResp, setGeneralResp] = useState<string[]>(profileUser.generalResponsibilities || []);
  const [specificResp, setSpecificResp] = useState<string[]>(profileUser.specificResponsibilities || []);
  const [newGenInput, setNewGenInput] = useState('');
  const [newSpecInput, setNewSpecInput] = useState('');

  // Project Note Handlers
  const handleOpenCreateNote = (defaultProjId?: string) => {
    setEditingNoteId(null);
    setNoteTitle('');
    setNoteContent('');
    setNoteProjectId(defaultProjId || (userAssignedProjects.length > 0 ? userAssignedProjects[0].id : ''));
    setShowNoteModal(true);
  };

  const handleOpenEditNote = (note: ProjectNote) => {
    setEditingNoteId(note.id);
    setNoteTitle(note.title);
    setNoteContent(note.content);
    setNoteProjectId(note.projectId);
    setShowNoteModal(true);
  };

  const handleSaveNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteTitle.trim() || !noteContent.trim() || !noteProjectId) return;

    const targetProject = projects.find((p) => p.id === noteProjectId);
    const projectName = targetProject ? targetProject.name : 'Assigned Project';

    if (editingNoteId) {
      await updateProjectNote(editingNoteId, {
        title: noteTitle.trim(),
        content: noteContent.trim(),
        projectId: noteProjectId,
        projectName
      });
    } else {
      await createProjectNote({
        userId: profileUser.uid,
        userName: profileUser.displayName,
        projectId: noteProjectId,
        projectName,
        title: noteTitle.trim(),
        content: noteContent.trim()
      });
    }

    setShowNoteModal(false);
    setNoteTitle('');
    setNoteContent('');
    setNoteProjectId('');
    setEditingNoteId(null);
  };

  const handleDeleteNote = async (noteId: string) => {
    if (confirm('Are you sure you want to delete this project note?')) {
      await deleteProjectNote(noteId);
    }
  };

  const filteredUserNotes = userProjectNotes.filter((n) => {
    if (noteProjectFilter === 'all') return true;
    return n.projectId === noteProjectFilter;
  });

  const handleOpenEdit = () => {
    setEditTitle(profileUser.title);
    setEditDepartment(profileUser.department);
    setEditPhotoURL(profileUser.photoURL);
    setEditPhone(profileUser.phone || '');
    setEditLocation(profileUser.location || '');
    setEditPinCode(profileUser.pinCode || '');
    setGeneralResp([...(profileUser.generalResponsibilities || [])]);
    setSpecificResp([...(profileUser.specificResponsibilities || [])]);
    setShowEditModal(true);
  };

  const handleAddGeneralResp = () => {
    if (!newGenInput.trim()) return;
    setGeneralResp([...generalResp, newGenInput.trim()]);
    setNewGenInput('');
  };

  const handleRemoveGeneralResp = (idx: number) => {
    setGeneralResp(generalResp.filter((_, i) => i !== idx));
  };

  const handleAddSpecificResp = () => {
    if (!newSpecInput.trim()) return;
    setSpecificResp([...specificResp, newSpecInput.trim()]);
    setNewSpecInput('');
  };

  const handleRemoveSpecificResp = (idx: number) => {
    setSpecificResp(specificResp.filter((_, i) => i !== idx));
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateUserProfile(profileUser.uid, {
      title: editTitle,
      department: editDepartment,
      photoURL: editPhotoURL,
      phone: editPhone,
      location: editLocation,
      pinCode: editPinCode,
      generalResponsibilities: generalResp,
      specificResponsibilities: specificResp
    });
    setShowEditModal(false);
  };

  const isSelfOrManager = currentUser.uid === profileUser.uid || userRole === 'manager' || userRole === 'admin';

  return (
    <div className="space-y-6">
      {/* Personnel Directory Header with Dropdown Selection */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex items-center justify-between">
        <div className="flex items-center space-x-2 w-full md:w-auto">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">Personnel Directory:</span>
          <select
            value={profileUser.uid}
            onChange={(e) => setSelectedUserId(e.target.value)}
            className="w-full md:w-auto bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer shadow-xs"
          >
            {users.map((u) => (
              <option key={u.uid} value={u.uid}>
                {u.displayName} — {u.department || 'Sunhill Education System'} ({u.title})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Profile Card Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-start md:items-center space-x-4">
            <div className="relative group shrink-0">
              <img
                src={profileUser.photoURL}
                alt={profileUser.displayName}
                className="w-20 h-20 rounded-2xl object-cover border-2 border-amber-500 shadow-xs"
              />
              {isSelfOrManager && (
                <label
                  htmlFor="user-header-photo-upload"
                  className="absolute inset-0 rounded-2xl bg-slate-900/60 text-white flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-[10px] font-bold p-1 text-center"
                  title="Upload local photo file"
                >
                  <Camera className="w-4 h-4 mb-0.5 text-white" />
                  <span>Upload</span>
                  <input
                    id="user-header-photo-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        try {
                          const compressed = await compressImage(file, 400, 400, 0.75);
                          await updateUserProfile(profileUser.uid, {
                            photoURL: compressed
                          });
                        } catch (err) {
                          console.error('Error compressing image:', err);
                        }
                      }
                    }}
                  />
                </label>
              )}
            </div>
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <h1 className="text-2xl font-bold text-slate-900">{profileUser.displayName}</h1>
                {profileUser.role === 'manager' ? (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-50 text-amber-700 border border-amber-200 flex items-center space-x-1">
                    <Shield className="w-3 h-3" />
                    <span>Manager</span>
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-indigo-50 text-indigo-700 border border-indigo-200">
                    Personnel Member
                  </span>
                )}
              </div>

              <p className="text-slate-700 font-semibold text-sm">{profileUser.title}</p>

              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 pt-1">
                <span className="flex items-center space-x-1">
                  <Briefcase className="w-3.5 h-3.5 text-indigo-600" />
                  <span>{profileUser.department}</span>
                </span>
                <span className="flex items-center space-x-1">
                  <Mail className="w-3.5 h-3.5 text-purple-600" />
                  <span>{profileUser.email}</span>
                </span>
              </div>
            </div>
          </div>

          {isSelfOrManager && (
            <button
              onClick={handleOpenEdit}
              className="flex items-center space-x-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 rounded-xl text-xs font-semibold shadow-xs transition-all"
            >
              <Edit3 className="w-4 h-4 text-indigo-600" />
              <span>Edit Responsibilities & Profile</span>
            </button>
          )}
        </div>
      </div>

      {/* Grid Layout: Job Responsibilities, Assigned Tasks, Active Projects, Milestones */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* General & Specific Job Responsibilities Box */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
              <Briefcase className="w-4 h-4 text-indigo-600" />
              <span>Job Responsibilities</span>
            </h2>
            <button
              onClick={() => setIsResponsibilitiesExpanded(!isResponsibilitiesExpanded)}
              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-xs transition-all flex items-center space-x-1 shadow-2xs cursor-pointer"
              title={isResponsibilitiesExpanded ? "Minimize Job Responsibilities Section" : "Expand Job Responsibilities Section"}
            >
              {isResponsibilitiesExpanded ? (
                <>
                  <ChevronUp className="w-3.5 h-3.5 text-slate-600" />
                  <span>Minimize</span>
                </>
              ) : (
                <>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-600" />
                  <span>Expand</span>
                </>
              )}
            </button>
          </div>

          {isResponsibilitiesExpanded ? (
            <div className="space-y-4 pt-1">
              {/* General Job Responsibilities */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center space-x-1.5">
                    <span>General Job Responsibilities</span>
                    <span className="text-[10px] bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded-full font-bold">
                      {profileUser.generalResponsibilities?.length || 0}
                    </span>
                  </h3>
                  <button
                    onClick={() => setIsGeneralExpanded(!isGeneralExpanded)}
                    className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 flex items-center space-x-1 cursor-pointer"
                  >
                    <span>{isGeneralExpanded ? 'Minimize' : 'Expand'}</span>
                    {isGeneralExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </button>
                </div>

                {isGeneralExpanded && (
                  profileUser.generalResponsibilities && profileUser.generalResponsibilities.length > 0 ? (
                    <ul className="space-y-2 text-xs text-slate-700">
                      {profileUser.generalResponsibilities.map((resp, i) => (
                        <li key={i} className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-start space-x-2">
                          <span className="text-indigo-600 font-bold mt-0.5">•</span>
                          <span>{resp}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-slate-400 italic">No general responsibilities listed.</p>
                  )
                )}
              </div>

              {/* Specific Job Responsibilities */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center space-x-1.5">
                    <span>Specific Job Responsibilities</span>
                    <span className="text-[10px] bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded-full font-bold">
                      {profileUser.specificResponsibilities?.length || 0}
                    </span>
                  </h3>
                  <button
                    onClick={() => setIsSpecificExpanded(!isSpecificExpanded)}
                    className="text-[11px] font-semibold text-purple-600 hover:text-purple-800 flex items-center space-x-1 cursor-pointer"
                  >
                    <span>{isSpecificExpanded ? 'Minimize' : 'Expand'}</span>
                    {isSpecificExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </button>
                </div>

                {isSpecificExpanded && (
                  profileUser.specificResponsibilities && profileUser.specificResponsibilities.length > 0 ? (
                    <ul className="space-y-2 text-xs text-slate-700">
                      {profileUser.specificResponsibilities.map((resp, i) => (
                        <li key={i} className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-start space-x-2">
                          <span className="text-purple-600 font-bold mt-0.5">•</span>
                          <span>{resp}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-slate-400 italic">No specific responsibilities listed.</p>
                  )
                )}
              </div>
            </div>
          ) : (
            <div className="p-4 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-center space-y-2">
              <p className="text-xs text-slate-500 font-medium">
                Job responsibilities content is currently minimized.
              </p>
              <div className="flex items-center justify-center space-x-2 pt-1">
                <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                  {profileUser.generalResponsibilities?.length || 0} General Items
                </span>
                <span className="text-[11px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-100">
                  {profileUser.specificResponsibilities?.length || 0} Specific Items
                </span>
                <button
                  onClick={() => setIsResponsibilitiesExpanded(true)}
                  className="text-[11px] font-bold text-slate-700 hover:text-indigo-600 underline ml-1 cursor-pointer"
                >
                  Expand Content
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Assigned Tasks & Status Real-time Control */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
              <CheckSquare className="w-4 h-4 text-emerald-600" />
              <span>Assigned Personnel Tasks ({userTasks.length})</span>
            </h2>
            <div className="flex items-center space-x-2">
              <span className="text-xs text-slate-500">{completedUserTasks.length} Completed</span>
              {openCreateTaskModal && (userRole === 'admin' || userRole === 'manager') && (
                <button
                  onClick={() => openCreateTaskModal(profileUser.uid)}
                  className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-lg text-xs shadow-xs transition-all flex items-center space-x-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Assign Task</span>
                </button>
              )}
            </div>
          </div>

          <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
            {userTasks.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-6">No assigned tasks found for this personnel member.</p>
            ) : (
              userTasks.map((t) => (
                <div
                  key={t.id}
                  className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-start justify-between gap-3 hover:border-indigo-300 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="font-semibold text-xs text-slate-900">{t.title}</div>
                    <div className="text-[11px] text-slate-500">{t.projectName} • Due {t.dueDate}</div>
                  </div>

                  <div className="flex items-center space-x-1.5 shrink-0">
                    <button
                      onClick={() => setViewingTaskTodoList(t)}
                      className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-lg text-[10px] font-bold whitespace-nowrap transition-all shadow-2xs flex items-center space-x-1"
                      title="View & manage checklist to-do items"
                    >
                      <ListTodo className="w-3.5 h-3.5 text-amber-600" />
                      <span>To-Do List</span>
                    </button>

                    <button
                      onClick={() => updateTaskStatus(t.id, t.status === 'completed' ? 'in_progress' : 'completed')}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold whitespace-nowrap transition-all ${
                        t.status === 'completed'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs'
                      }`}
                    >
                      {t.status === 'completed' ? '✓ Done' : 'Mark Done'}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Active Project Contributions */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
            <Layers className="w-4 h-4 text-purple-600" />
            <span>Active Project Contributions ({userActiveProjects.length})</span>
          </h2>

          <div className="space-y-3">
            {userActiveProjects.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-6">No active in-progress projects assigned to this personnel member.</p>
            ) : (
              userActiveProjects.map((p) => {
                const pTasks = tasks.filter((t) => t.projectId === p.id && t.assigneeId === profileUser.uid);
                const pDone = pTasks.filter((t) => t.status === 'completed').length;

                return (
                  <div key={p.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-xs text-slate-900">{p.name}</span>
                      <span className="text-[10px] uppercase font-bold text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded">
                        {p.category}
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-[10px] text-slate-500 pt-1">
                      <span>Personal Tasks: {pDone}/{pTasks.length} done</span>
                      <span>Project Completion: {p.completionPercentage}%</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Completed Milestones & Achievements */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
              <Award className="w-4 h-4 text-amber-500" />
              <span>Completed Milestones & Achievements</span>
            </h2>
            <span className="text-[10px] font-extrabold uppercase bg-emerald-50 text-emerald-800 px-2.5 py-0.5 rounded-full border border-emerald-200">
              Finished Projects ({userFinishedProjects.length})
            </span>
          </div>

          <div className="space-y-2.5">
            {userFinishedProjects.length === 0 && userMilestones.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-6">No finished project achievements or completed milestones recorded yet.</p>
            ) : (
              <>
                {/* Finished Projects Achievements */}
                {userFinishedProjects.map((p) => (
                  <div key={`finished-proj-${p.id}`} className="p-3.5 bg-gradient-to-r from-emerald-50/90 to-teal-50/40 border border-emerald-200 rounded-xl space-y-1.5 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-1.5">
                        <Trophy className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span className="font-extrabold text-xs text-slate-900">{p.name}</span>
                      </div>
                      <span className="text-[10px] font-black uppercase text-emerald-800 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-full flex items-center space-x-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>100% Finished</span>
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600">{p.description || `${p.category} Project`}</p>
                    <div className="flex justify-between items-center text-[10px] text-slate-500 pt-1 border-t border-emerald-100">
                      <span className="font-semibold text-emerald-800">Finished Project Achievement</span>
                      <span>Timeline: {p.startDate} to {p.endDate}</span>
                    </div>
                  </div>
                ))}

                {/* Completed Milestones */}
                {userMilestones.map((m) => (
                  <div key={m.id} className="p-3 bg-amber-50/60 border border-amber-200 rounded-xl space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-xs text-amber-900">🎯 {m.title}</span>
                      <span className="text-[10px] text-amber-700 font-bold">Achieved</span>
                    </div>
                    <p className="text-[11px] text-slate-600">{m.projectName}</p>
                    <p className="text-[10px] text-slate-400">Completed on {m.completedAt ? new Date(m.completedAt).toLocaleDateString() : 'recent'}</p>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Member Project Notes Section */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl border border-amber-200">
              <StickyNote className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <span>Assigned Project Notes ({userProjectNotes.length})</span>
              </h2>
              <p className="text-xs text-slate-500">
                Personal updates, research logs, and technical notes linked to {profileUser.displayName}'s assigned projects.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            {userAssignedProjects.length > 0 && (
              <select
                value={noteProjectFilter}
                onChange={(e) => setNoteProjectFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">All Assigned Projects ({userProjectNotes.length})</option>
                {userAssignedProjects.map((p) => {
                  const count = userProjectNotes.filter((n) => n.projectId === p.id).length;
                  return (
                    <option key={p.id} value={p.id}>
                      {p.name} ({count})
                    </option>
                  );
                })}
              </select>
            )}

            {isSelfOrManager && (
              <button
                onClick={() => handleOpenCreateNote()}
                className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-xs transition-all flex items-center space-x-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Create Project Note</span>
              </button>
            )}
          </div>
        </div>

        {/* Notes Grid */}
        {userAssignedProjects.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 space-y-2">
            <FileText className="w-8 h-8 text-slate-400 mx-auto" />
            <p className="text-xs font-semibold text-slate-700">No assigned projects found for this member.</p>
            <p className="text-[11px] text-slate-500 max-w-md mx-auto">
              Notes can be created and linked once this team member is assigned to a project or task.
            </p>
          </div>
        ) : filteredUserNotes.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 space-y-3">
            <StickyNote className="w-8 h-8 text-amber-500/60 mx-auto" />
            <div className="space-y-1">
              <p className="text-xs font-bold text-slate-800">No notes linked to this selection.</p>
              <p className="text-[11px] text-slate-500">
                {noteProjectFilter === 'all'
                  ? `${profileUser.displayName} hasn't created any notes for their assigned projects yet.`
                  : 'No notes created for this specific assigned project.'}
              </p>
            </div>
            {isSelfOrManager && (
              <button
                onClick={() => handleOpenCreateNote(noteProjectFilter !== 'all' ? noteProjectFilter : undefined)}
                className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs shadow-xs transition-all inline-flex items-center space-x-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create Note Now</span>
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredUserNotes.map((note) => {
              const linkedProj = projects.find((p) => p.id === note.projectId);

              return (
                <div
                  key={note.id}
                  className="p-4 bg-slate-50/80 hover:bg-slate-50 border border-slate-200 hover:border-indigo-300 rounded-xl flex flex-col justify-between space-y-3 transition-all shadow-2xs group"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-md text-[10px] font-black truncate max-w-[170px]" title={note.projectName}>
                        📌 {note.projectName}
                      </span>

                      {isSelfOrManager && (
                        <div className="flex items-center space-x-1 opacity-80 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleOpenEditNote(note)}
                            className="p-1 hover:bg-slate-200 text-slate-500 hover:text-indigo-600 rounded transition-colors"
                            title="Edit Note"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteNote(note.id)}
                            className="p-1 hover:bg-rose-100 text-slate-500 hover:text-rose-600 rounded transition-colors"
                            title="Delete Note"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>

                    <h3 className="font-bold text-xs text-slate-900 leading-snug">{note.title}</h3>

                    <p className="text-xs text-slate-600 whitespace-pre-wrap leading-relaxed line-clamp-6">
                      {note.content}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[10px] text-slate-400">
                    <span className="flex items-center space-x-1 font-medium">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span>
                        {new Date(note.createdAt).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </span>
                    </span>
                    {linkedProj && (
                      <span className="font-semibold text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                        {linkedProj.category}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create / Edit Project Note Modal */}
      {showNoteModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4 text-slate-900 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-base text-slate-900 flex items-center space-x-2">
                <StickyNote className="w-4 h-4 text-indigo-600" />
                <span>{editingNoteId ? 'Edit Project Note' : 'Create Project Note'}</span>
              </h3>
              <button onClick={() => setShowNoteModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveNote} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Assigned Project <span className="text-rose-500">*</span>
                </label>
                <select
                  value={noteProjectId}
                  onChange={(e) => setNoteProjectId(e.target.value)}
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="" disabled>-- Select Assigned Project --</option>
                  {userAssignedProjects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.category})
                    </option>
                  ))}
                </select>
                {userAssignedProjects.length === 0 && (
                  <p className="text-[11px] text-amber-600 mt-1">
                    Notice: This member currently has no assigned projects.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Note Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={noteTitle}
                  onChange={(e) => setNoteTitle(e.target.value)}
                  placeholder="e.g. Database Architecture Sync & Performance Benchmarks"
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Note Details & Insights <span className="text-rose-500">*</span>
                </label>
                <textarea
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  placeholder="Write research updates, code review notes, bottlenecks, or key decisions for this project..."
                  rows={5}
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 font-normal focus:outline-none focus:ring-2 focus:ring-indigo-500 leading-relaxed"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowNoteModal(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-100 rounded-xl text-slate-700 font-bold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!noteTitle.trim() || !noteContent.trim() || !noteProjectId}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold rounded-xl shadow-xs transition-all flex items-center space-x-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>{editingNoteId ? 'Update Note' : 'Save Project Note'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Profile & Responsibilities Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-xl p-6 shadow-2xl space-y-4 text-slate-900 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-base text-slate-900 flex items-center space-x-2">
                <Edit3 className="w-4 h-4 text-indigo-600" />
                <span>Edit Job Responsibilities & Profile</span>
              </h3>
              <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 mb-1 font-semibold">Job Title</label>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1 font-semibold">Department / System</label>
                  <select
                    value={editDepartment || 'Sunhill Education System'}
                    onChange={(e) => setEditDepartment(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                  >
                    <option value="Sunhill Education System">Sunhill Education System</option>
                    <option value="Sunhill Montessori Casa">Sunhill Montessori Casa</option>
                    <option value="E.Learning@Work">E.Learning@Work</option>
                    <option value="Faithbook Ph">Faithbook Ph</option>
                  </select>
                </div>
              </div>

              {/* Profile Picture / Avatar Editor */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="flex items-center space-x-1.5 font-bold text-slate-700">
                    <Camera className="w-4 h-4 text-indigo-600" />
                    <span>Profile Picture / Avatar</span>
                  </span>
                  <label htmlFor="user-modal-local-photo" className="cursor-pointer text-indigo-600 hover:text-indigo-700 font-semibold text-[11px] flex items-center space-x-1 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs">
                    <Upload className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Upload Local File</span>
                    <input
                      id="user-modal-local-photo"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (ev) => {
                            if (ev.target?.result) {
                              setEditPhotoURL(ev.target.result as string);
                            }
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </label>
                </div>

                <div className="flex items-center space-x-3">
                  <img
                    src={editPhotoURL}
                    alt="Profile Avatar Preview"
                    className="w-12 h-12 rounded-full object-cover border-2 border-indigo-600 shadow-xs shrink-0"
                  />
                  <div className="flex-1 space-y-1">
                    <input
                      type="text"
                      placeholder="Paste image URL (https://...)"
                      value={editPhotoURL}
                      onChange={(e) => setEditPhotoURL(e.target.value)}
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
                      onClick={() => setEditPhotoURL(preset)}
                      className={`w-8 h-8 rounded-full object-cover cursor-pointer border-2 transition-all ${
                        editPhotoURL === preset
                          ? 'border-indigo-600 scale-110 shadow-xs'
                          : 'border-slate-200 opacity-60 hover:opacity-100'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Security PIN Passcode */}
              {(userRole === 'admin' || userRole === 'manager' || currentUser.uid === profileUser.uid) && (
                <div className="p-3 bg-amber-50/60 border border-amber-200 rounded-xl space-y-1">
                  <label className="block text-amber-900 font-bold flex items-center space-x-1">
                    <span>🔑 Security Passcode PIN</span>
                    {userRole === 'admin' && (
                      <span className="text-[10px] bg-amber-200 text-amber-900 px-1.5 rounded font-extrabold uppercase">
                        Admin Editable
                      </span>
                    )}
                  </label>
                  <input
                    type="text"
                    maxLength={8}
                    value={editPinCode}
                    onChange={(e) => setEditPinCode(e.target.value)}
                    placeholder="Enter security PIN..."
                    className="w-full bg-white border border-amber-300 rounded-lg px-3 py-1.5 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  <p className="text-[10px] text-amber-700">
                    Passcode used to authenticate into this personnel account at login.
                  </p>
                </div>
              )}

              {/* General Responsibilities List Editor */}
              <div className="space-y-2">
                <label className="block text-slate-700 font-semibold">General Job Responsibilities</label>
                <div className="space-y-1.5">
                  {generalResp.map((resp, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
                      <span>{resp}</span>
                      <button type="button" onClick={() => handleRemoveGeneralResp(idx)} className="text-rose-500 hover:text-rose-700">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    placeholder="Add new general responsibility..."
                    value={newGenInput}
                    onChange={(e) => setNewGenInput(e.target.value)}
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-slate-900"
                  />
                  <button
                    type="button"
                    onClick={handleAddGeneralResp}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold"
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* Specific Responsibilities List Editor */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <label className="block text-slate-700 font-semibold">Specific Job Responsibilities</label>
                <div className="space-y-1.5">
                  {specificResp.map((resp, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
                      <span>{resp}</span>
                      <button type="button" onClick={() => handleRemoveSpecificResp(idx)} className="text-rose-500 hover:text-rose-700">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    placeholder="Add new specific responsibility..."
                    value={newSpecInput}
                    onChange={(e) => setNewSpecInput(e.target.value)}
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-slate-900"
                  />
                  <button
                    type="button"
                    onClick={handleAddSpecificResp}
                    className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold"
                  >
                    Add
                  </button>
                </div>
              </div>

              <div className="pt-3 flex justify-end space-x-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold shadow-xs"
                >
                  Save Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Interactive To-Do Checklist Modal */}
      {viewingTaskTodoList && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-amber-100 text-amber-900 rounded-xl border border-amber-300">
                  <ListTodo className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">{viewingTaskTodoList.title}</h3>
                  <p className="text-xs text-slate-500">
                    Project: <strong className="text-slate-700">{viewingTaskTodoList.projectName}</strong> • Assigned to: <strong className="text-slate-700">{viewingTaskTodoList.assigneeName}</strong>
                  </p>
                </div>
              </div>

              <button
                onClick={() => setViewingTaskTodoList(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Checklist Items */}
            {(() => {
              const currentTask = tasks.find((t) => t.id === viewingTaskTodoList.id) || viewingTaskTodoList;
              const canUpdate = userRole === 'admin' || userRole === 'manager' || currentTask.assigneeId === currentUser.uid;
              const subtasks = currentTask.subtasks || [];
              const completedCount = subtasks.filter((s) => s.completed).length;
              const progressPct = subtasks.length > 0 ? Math.round((completedCount / subtasks.length) * 100) : 0;

              return (
                <div className="space-y-3">
                  <div className="flex items-center justify-between bg-amber-50 p-3 rounded-2xl border border-amber-200">
                    <span className="text-xs font-bold text-amber-950 uppercase tracking-wider flex items-center space-x-1.5">
                      <ListTodo className="w-4 h-4 text-amber-600" />
                      <span>Subtask Progress</span>
                    </span>
                    <span className="text-xs font-black text-amber-900 bg-amber-200 px-2.5 py-0.5 rounded-full">
                      {completedCount}/{subtasks.length} ({progressPct}%)
                    </span>
                  </div>

                  {!canUpdate && (
                    <div className="p-2.5 bg-amber-100/90 text-amber-950 border border-amber-300 rounded-xl text-xs font-bold flex items-center space-x-2">
                      <Lock className="w-4 h-4 text-amber-700 shrink-0" />
                      <span>Read-Only: Task assigned to {currentTask.assigneeName}</span>
                    </div>
                  )}

                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {subtasks.length === 0 ? (
                      <p className="text-slate-400 text-xs italic text-center py-6 bg-slate-50 rounded-xl border border-slate-100">
                        No checklist items yet.{canUpdate ? ' Add your first subtask below!' : ''}
                      </p>
                    ) : (
                      subtasks.map((st) => (
                        <div
                          key={st.id}
                          className={`flex items-center justify-between p-2.5 rounded-xl border text-xs transition-all ${
                            st.completed
                              ? 'bg-slate-50 border-slate-200 text-slate-400 line-through'
                              : 'bg-white border-slate-200 text-slate-800 font-semibold shadow-2xs'
                          }`}
                        >
                          <div className="flex items-center space-x-2 overflow-hidden">
                            <input
                              type="checkbox"
                              checked={st.completed}
                              disabled={!canUpdate}
                              onChange={async () => {
                                if (!canUpdate) return;
                                const updated = subtasks.map((item) =>
                                  item.id === st.id ? { ...item, completed: !item.completed } : item
                                );
                                await updateTaskDetails(currentTask.id, { subtasks: updated });
                              }}
                              className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 cursor-pointer shrink-0 disabled:opacity-50"
                            />
                            <span className="truncate">{st.title}</span>
                          </div>

                          {canUpdate && (
                            <button
                              onClick={async () => {
                                const updated = subtasks.filter((item) => item.id !== st.id);
                                await updateTaskDetails(currentTask.id, { subtasks: updated });
                              }}
                              className="text-slate-400 hover:text-rose-600 p-1 transition-colors shrink-0"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      ))
                    )}
                  </div>

                  {canUpdate && (
                    <div className="flex items-center space-x-2 pt-2 border-t border-slate-100">
                      <input
                        type="text"
                        placeholder="Add new to-do checklist item..."
                        value={newSubtaskInput}
                        onChange={(e) => setNewSubtaskInput(e.target.value)}
                        onKeyDown={async (e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            const val = newSubtaskInput.trim();
                            if (!val) return;
                            const updated = [
                              ...subtasks,
                              { id: `st_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`, title: val, completed: false }
                            ];
                            await updateTaskDetails(currentTask.id, { subtasks: updated });
                            setNewSubtaskInput('');
                          }
                        }}
                        className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                      <button
                        type="button"
                        onClick={async () => {
                          const val = newSubtaskInput.trim();
                          if (!val) return;
                          const updated = [
                            ...subtasks,
                            { id: `st_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`, title: val, completed: false }
                          ];
                          await updateTaskDetails(currentTask.id, { subtasks: updated });
                          setNewSubtaskInput('');
                        }}
                        className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-black transition-all shadow-2xs flex items-center space-x-1 shrink-0"
                      >
                        <Plus className="w-4 h-4 stroke-[3]" />
                        <span>Add</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
};
