import React, { useState } from 'react';
import {
  FolderKanban,
  Plus,
  Users,
  Calendar,
  Layers,
  CheckCircle2,
  Trash2,
  Edit3,
  X,
  PlusCircle,
  Flag
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Project, ProjectStatus, Milestone } from '../types';

export const ProjectManager: React.FC = () => {
  const {
    projects,
    tasks,
    milestones,
    users,
    userRole,
    createProject,
    updateProjectDetails,
    deleteProject,
    createMilestone,
    toggleMilestone
  } = useAuth();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showMilestoneModal, setShowMilestoneModal] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [selectedDropdownProjectId, setSelectedDropdownProjectId] = useState<string>('');
  const [filterTab, setFilterTab] = useState<'all' | 'active' | 'finished'>('all');

  // Edit Project State
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editCategory, setEditCategory] = useState('Engineering');
  const [deletingProjectId, setDeletingProjectId] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Engineering');
  const [color, setColor] = useState('#3b82f6');
  const [startDate, setStartDate] = useState('2026-08-01');
  const [endDate, setEndDate] = useState('2026-09-01');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);

  // Milestone Form
  const [milestoneTitle, setMilestoneTitle] = useState('');
  const [milestoneDate, setMilestoneDate] = useState('2026-08-15');

  // Calculate live completion for all projects
  const projectsWithCompletion = projects.map((proj) => {
    const projTasks = tasks.filter((t) => t.projectId === proj.id);
    let liveCompletionPct = proj.completionPercentage;

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
      liveCompletionPct = Math.round((totalRatio / projTasks.length) * 100);
    } else if (proj.status === 'completed') {
      liveCompletionPct = 100;
    }

    return { ...proj, liveCompletionPct };
  });

  const activeProjectsCount = projectsWithCompletion.filter((p) => p.liveCompletionPct < 100 && p.status !== 'completed').length;
  const finishedProjectsCount = projectsWithCompletion.filter((p) => p.liveCompletionPct >= 100 || p.status === 'completed').length;

  const filteredProjects = projectsWithCompletion.filter((p) => {
    if (filterTab === 'active') return p.liveCompletionPct < 100 && p.status !== 'completed';
    if (filterTab === 'finished') return p.liveCompletionPct >= 100 || p.status === 'completed';
    return true;
  });

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    await createProject({
      name,
      description,
      category,
      color,
      status: 'in_progress',
      startDate,
      endDate,
      managerId: users[0]?.uid || 'user_alex_manager',
      managerName: users[0]?.displayName || 'Alex Vance',
      memberIds: selectedMembers.length > 0 ? selectedMembers : users.map((u) => u.uid)
    });

    setName('');
    setDescription('');
    setShowCreateModal(false);
  };

  const handleCreateMilestone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!milestoneTitle || !selectedProjectId) return;

    const proj = projects.find((p) => p.id === selectedProjectId);
    await createMilestone({
      projectId: selectedProjectId,
      projectName: proj?.name || 'Project',
      title: milestoneTitle,
      dueDate: milestoneDate
    });

    setMilestoneTitle('');
    setShowMilestoneModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
            <FolderKanban className="w-5 h-5 text-indigo-600" />
            <span>Team Projects ({projects.length})</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">Categorized into Active in-progress and Finished 100% completed projects</p>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center space-x-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button
            onClick={() => setFilterTab('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              filterTab === 'all'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All ({projects.length})
          </button>
          <button
            onClick={() => setFilterTab('active')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              filterTab === 'active'
                ? 'bg-indigo-600 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Active ({activeProjectsCount})
          </button>
          <button
            onClick={() => setFilterTab('finished')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              filterTab === 'finished'
                ? 'bg-emerald-600 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Finished ({finishedProjectsCount})
          </button>
        </div>

        {(userRole === 'manager' || userRole === 'admin') && (
          <button
            onClick={() => {
              setSelectedMembers(users.map((u) => u.uid));
              setShowCreateModal(true);
            }}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-all shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Project</span>
          </button>
        )}
      </div>

      {/* Dropdown Menu Section */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <FolderKanban className="w-4 h-4 text-indigo-600 shrink-0" />
          <label htmlFor="team-project-dropdown" className="text-xs font-extrabold text-slate-800 shrink-0">
            Select Team Project:
          </label>
          <select
            id="team-project-dropdown"
            value={selectedDropdownProjectId}
            onChange={(e) => setSelectedDropdownProjectId(e.target.value)}
            className="bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 cursor-pointer shadow-2xs transition-all min-w-[220px]"
          >
            <option value="">Select Project</option>
            <option value="all">-- Show All Projects ({filteredProjects.length}) --</option>
            {filteredProjects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} {p.liveCompletionPct >= 100 || p.status === 'completed' ? '✓ (Finished)' : `(${p.liveCompletionPct}%)`}
              </option>
            ))}
          </select>
        </div>

        {selectedDropdownProjectId && selectedDropdownProjectId !== 'all' && (
          <button
            onClick={() => setSelectedDropdownProjectId('')}
            className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 underline self-end sm:self-center"
          >
            Reset Selection
          </button>
        )}
      </div>

      {/* Projects Display Area */}
      {selectedDropdownProjectId === '' ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center space-y-4 shadow-xs">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mx-auto text-indigo-600">
            <FolderKanban className="w-7 h-7" />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="text-base font-bold text-slate-900">Select a Team Project</h3>
            <p className="text-xs text-slate-500">
              Please choose a project from the drop down menu above to inspect its workflow progress, milestones, and personnel tasks.
            </p>
          </div>

          {filteredProjects.length > 0 && (
            <div className="pt-2">
              <p className="text-[11px] font-semibold text-slate-400 mb-2.5 uppercase tracking-wider">
                Or click a project directly:
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2 max-w-2xl mx-auto">
                {filteredProjects.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setSelectedDropdownProjectId(p.id)}
                    className="px-3.5 py-1.5 bg-slate-50 hover:bg-indigo-50 hover:border-indigo-300 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:text-indigo-700 transition-all flex items-center space-x-2 shadow-2xs"
                  >
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
                    <span>{p.name}</span>
                  </button>
                ))}
                <button
                  onClick={() => setSelectedDropdownProjectId('all')}
                  className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all"
                >
                  Show All ({filteredProjects.length})
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (selectedDropdownProjectId === 'all' ? filteredProjects : filteredProjects.filter((p) => p.id === selectedDropdownProjectId)).length === 0 ? (
        <div className="text-center py-12 bg-white border border-dashed border-slate-200 rounded-2xl p-6">
          <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-slate-800">No projects found in this section</h3>
          <p className="text-xs text-slate-500 mt-1">
            {filterTab === 'finished'
              ? 'Projects automatically transfer to Finished Projects once they reach 100% completion.'
              : 'Create a new project or switch filter tabs above.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {(selectedDropdownProjectId === 'all' ? filteredProjects : filteredProjects.filter((p) => p.id === selectedDropdownProjectId)).map((proj) => {
            const projTasks = tasks.filter((t) => t.projectId === proj.id);
            const projMilestones = milestones.filter((m) => m.projectId === proj.id);
            const liveCompletionPct = proj.liveCompletionPct;
            const isFinished = liveCompletionPct >= 100 || proj.status === 'completed';

            return (
              <div
                key={proj.id}
                className={`bg-white border rounded-2xl p-5 shadow-xs space-y-4 transition-all ${
                  isFinished ? 'border-emerald-300 ring-1 ring-emerald-400/30' : 'border-slate-200'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: proj.color }} />
                      <h2 className="text-base font-bold text-slate-900">{proj.name}</h2>
                    </div>
                    <div className="text-[11px] text-slate-500">{proj.description}</div>
                  </div>

                  <div className="flex flex-col items-end space-y-1">
                    {isFinished ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-900 border border-emerald-300 flex items-center space-x-1 shadow-2xs">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>Finished • 100%</span>
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-purple-50 text-purple-700 border border-purple-200">
                        {proj.category}
                      </span>
                    )}
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase bg-amber-50 text-amber-800 border border-amber-300 flex items-center space-x-1">
                      <Calendar className="w-2.5 h-2.5 text-amber-600" />
                      <span>Shared Calendar Linked</span>
                    </span>
                  </div>
                </div>

                {/* Completion Progress */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-slate-600">
                  <span>Workflow Completion</span>
                  <span className="font-bold text-slate-900">{liveCompletionPct}%</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${liveCompletionPct}%`, backgroundColor: proj.color }}
                  />
                </div>
              </div>



              {/* Milestones Checkpoints */}
              <div className="pt-2 border-t border-slate-100 space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-800">
                  <span className="flex items-center space-x-1">
                    <Flag className="w-3.5 h-3.5 text-amber-500" />
                    <span>Project Milestones ({projMilestones.length})</span>
                  </span>
                  {(userRole === 'manager' || userRole === 'admin') && (
                    <button
                      onClick={() => {
                        setSelectedProjectId(proj.id);
                        setShowMilestoneModal(true);
                      }}
                      className="text-[11px] text-indigo-600 hover:underline font-semibold"
                    >
                      + Add Milestone
                    </button>
                  )}
                </div>

                <div className="space-y-1.5">
                  {projMilestones.length === 0 ? (
                    <p className="text-[11px] text-slate-400 italic">No milestones set for this project.</p>
                  ) : (
                    projMilestones.map((ms) => (
                      <div
                        key={ms.id}
                        className="flex items-center justify-between px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                      >
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={ms.completed}
                            onChange={(e) => toggleMilestone(ms.id, e.target.checked)}
                            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                          />
                          <span className={ms.completed ? 'line-through text-slate-400' : 'text-slate-800 font-medium'}>
                            {ms.title}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-500">Due {ms.dueDate}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {(userRole === 'manager' || userRole === 'admin') && (
                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <button
                    onClick={() => {
                      setEditingProject(proj);
                      setEditName(proj.name);
                      setEditDescription(proj.description);
                      setEditCategory(proj.category || 'Engineering');
                    }}
                    className="text-xs text-indigo-600 hover:underline font-bold flex items-center space-x-1"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit Title & Details</span>
                  </button>
                  {deletingProjectId === proj.id ? (
                    <div className="flex items-center space-x-2 bg-rose-50 border border-rose-200 px-2 py-1 rounded-lg animate-in fade-in">
                      <span className="text-[11px] font-bold text-rose-700">Delete project & tasks?</span>
                      <button
                        onClick={async () => {
                          await deleteProject(proj.id);
                          setDeletingProjectId(null);
                        }}
                        className="px-2 py-0.5 bg-rose-600 hover:bg-rose-700 text-white rounded text-[11px] font-black shadow-xs"
                      >
                        Yes, Delete
                      </button>
                      <button
                        onClick={() => setDeletingProjectId(null)}
                        className="px-1.5 py-0.5 text-slate-500 hover:text-slate-800 text-[11px] font-semibold"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setDeletingProjectId(proj.id)}
                      className="text-xs text-rose-600 hover:bg-rose-50 px-2 py-1 rounded-lg font-bold transition-colors flex items-center space-x-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete Project</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    )}

      {/* Edit Project Modal */}
      {editingProject && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md p-5 shadow-2xl space-y-4 text-slate-900 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-base text-slate-900 flex items-center space-x-2">
                <Edit3 className="w-4 h-4 text-indigo-600" />
                <span>Edit Project Details</span>
              </h3>
              <button onClick={() => setEditingProject(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!editName.trim() || !editingProject) return;
                await updateProjectDetails(editingProject.id, {
                  name: editName.trim(),
                  description: editDescription,
                  category: editCategory
                });
                setEditingProject(null);
              }}
              className="space-y-3 text-xs"
            >
              <div>
                <label className="block text-slate-900 mb-1 font-bold">Project Title (Retained across app)</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-semibold">Description</label>
                <textarea
                  rows={2}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-semibold">Category / System</label>
                <select
                  value={editCategory || 'Sunhill Education System'}
                  onChange={(e) => setEditCategory(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                >
                  <option value="Sunhill Education System">Sunhill Education System</option>
                  <option value="Sunhill Montessori Casa">Sunhill Montessori Casa</option>
                  <option value="E.Learning@Work">E.Learning@Work</option>
                  <option value="Faithbook Ph">Faithbook Ph</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end space-x-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingProject(null)}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-xs transition-all"
                >
                  Save Title Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Project Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md p-5 shadow-2xl space-y-4 text-slate-900 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-base text-slate-900 flex items-center space-x-2">
                <FolderKanban className="w-4 h-4 text-indigo-600" />
                <span>Create New Team Project</span>
              </h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProject} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 mb-1 font-semibold">Project Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. NextGen Microservices Refactor"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-600 mb-1 font-semibold">Description</label>
                <textarea
                  rows={2}
                  placeholder="Objectives and scope..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 mb-1 font-semibold">Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1 font-semibold">End Date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end space-x-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold shadow-xs"
                >
                  Create Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Milestone Modal */}
      {showMilestoneModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-sm p-5 shadow-2xl space-y-4 text-slate-900 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-base text-slate-900 flex items-center space-x-2">
                <Flag className="w-4 h-4 text-amber-500" />
                <span>Add Project Milestone</span>
              </h3>
              <button onClick={() => setShowMilestoneModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateMilestone} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 mb-1 font-semibold">Milestone Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Alpha Release Code Freeze"
                  value={milestoneTitle}
                  onChange={(e) => setMilestoneTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-600 mb-1 font-semibold">Due Date</label>
                <input
                  type="date"
                  value={milestoneDate}
                  onChange={(e) => setMilestoneDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowMilestoneModal(false)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-semibold shadow-xs"
                >
                  Save Milestone
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
