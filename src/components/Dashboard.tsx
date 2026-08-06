import React, { useState } from 'react';
import {
  CheckCircle2,
  Clock,
  AlertOctagon,
  Users,
  TrendingUp,
  BarChart2,
  ArrowUpRight,
  Plus,
  Shield,
  Activity,
  Layers,
  ChevronRight,
  UserCheck,
  AlertCircle,
  ListTodo,
  Calendar,
  X,
  Trash2,
  ExternalLink,
  Check,
  Lock,
  Trophy,
  Award,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Task, Project, UserProfile, SubTask } from '../types';

interface DashboardProps {
  setActiveTab: (tab: string) => void;
  openCreateTaskModal: (assigneeId?: string) => void;
  openAiModal: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  setActiveTab,
  openCreateTaskModal,
  openAiModal
}) => {
  const { tasks, projects, users, activityLogs, userRole, currentUser, updateTaskStatus, updateTaskDetails } = useAuth();

  const [viewingMemberTodoList, setViewingMemberTodoList] = useState<UserProfile | null>(null);
  const [newSubtaskInputs, setNewSubtaskInputs] = useState<Record<string, string>>({});
  const [selectedActiveProjectId, setSelectedActiveProjectId] = useState<string>('');
  const [selectedFinishedProjectId, setSelectedFinishedProjectId] = useState<string>('');
  const [isTeamPerformanceExpanded, setIsTeamPerformanceExpanded] = useState<boolean>(true);

  // Calculate live project completion percentages
  const projectsWithCompletion = projects.map((proj) => {
    const projTasks = tasks.filter((t) => t.projectId === proj.id);
    let livePct = proj.completionPercentage;

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
      livePct = Math.round((totalRatio / projTasks.length) * 100);
    } else if (proj.status === 'completed') {
      livePct = 100;
    }

    const doneCount = projTasks.filter((t) => t.status === 'completed').length;

    return {
      ...proj,
      livePct,
      doneCount,
      totalTasksCount: projTasks.length
    };
  });

  // Automatically separate into Active Projects vs Finished Projects (100% Completed)
  const activeProjects = projectsWithCompletion.filter((p) => p.livePct < 100 && p.status !== 'completed');
  const finishedProjects = projectsWithCompletion.filter((p) => p.livePct >= 100 || p.status === 'completed');

  const activeProjectsToDisplay = selectedActiveProjectId === 'all'
    ? activeProjects
    : activeProjects.filter((p) => p.id === selectedActiveProjectId);

  const finishedProjectsToDisplay = selectedFinishedProjectId === 'all'
    ? finishedProjects
    : finishedProjects.filter((p) => p.id === selectedFinishedProjectId);

  const activeProjectIds = new Set(activeProjects.map((p) => p.id));
  const activeProjectTasks = tasks.filter((t) => activeProjectIds.has(t.projectId));

  // Metrics calculation (reflects ONLY tasks under ACTIVE PROJECTS)
  const totalTasks = activeProjectTasks.length;
  const completedTasks = activeProjectTasks.filter((t) => t.status === 'completed').length;
  const overallCompletionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const urgentTasks = tasks.filter((t) => t.priority === 'urgent' && t.status !== 'completed');
  const highTasks = tasks.filter((t) => t.priority === 'high' && t.status !== 'completed');
  const inProgressTasks = tasks.filter((t) => t.status === 'in_progress');

  const totalLoggedHours = tasks.reduce((sum, t) => sum + (t.loggedHours || 0), 0);
  const totalEstHours = tasks.reduce((sum, t) => sum + (t.estimatedHours || 0), 0);

  return (
    <div className="space-y-6">
      {/* Top Banner & Manager Welcome */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-xs relative overflow-hidden">
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-amber-400/15 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-orange-400/15 rounded-full blur-2xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center space-x-2 mb-1">
              <span className="px-3 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300">
                {userRole === 'admin' || userRole === 'manager' ? '🛡️ Team Manager View' : '🧑‍💻 Personnel Workspace'}
              </span>
              <span className="text-slate-500 text-xs font-semibold">• Real-time Sync Active</span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Welcome back, {currentUser.displayName}
            </h1>

          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setViewingMemberTodoList(currentUser)}
              className="flex items-center space-x-1.5 px-3.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-950 border border-amber-200 rounded-xl text-xs font-extrabold shadow-2xs transition-all"
              title="View My Personal Tasks To-Do List"
            >
              <ListTodo className="w-4 h-4 text-amber-600" />
              <span>My To-Do List</span>
            </button>
            {(userRole === 'admin' || userRole === 'manager') && (
              <button
                onClick={openCreateTaskModal}
                className="flex items-center space-x-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs shadow-md shadow-amber-500/25 transition-all"
              >
                <Plus className="w-4 h-4 text-slate-950 font-bold" />
                <span>Assign Task</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* KPI Stats Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Overall Completion Percentage */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Workflow Completion</span>
              <span className="text-[10px] text-amber-700 font-extrabold uppercase bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 inline-block mt-0.5">
                Active Projects
              </span>
            </div>
            <div className="p-2.5 bg-amber-100 text-amber-800 rounded-xl border border-amber-200">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-3xl font-black text-slate-900">{overallCompletionPercentage}%</span>
            <span className="text-xs text-slate-500">({completedTasks}/{totalTasks} active tasks)</span>
          </div>
          <div className="w-full bg-slate-100 h-2.5 rounded-full mt-3 overflow-hidden border border-slate-200/60">
            <div
              className="bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${overallCompletionPercentage}%` }}
            />
          </div>
        </div>

        {/* Priority Items Alert */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Urgent Priority Items</span>
            <div className="p-2 bg-rose-50 text-rose-600 rounded-xl">
              <AlertOctagon className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-rose-600">{urgentTasks.length}</span>
            <span className="text-xs text-slate-500">requires immediate action</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-2">
            +{highTasks.length} high priority items pending review
          </p>
        </div>

        {/* Active Personnel Count & Hours */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Team Capacity</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-slate-900">{users.length}</span>
            <span className="text-xs text-slate-500">Personnel Members</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-2">
            Logged: <strong className="text-slate-800">{totalLoggedHours} hrs</strong> / {totalEstHours} est hrs
          </p>
        </div>

        {/* Active & Finished Projects KPI */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Projects</span>
            <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
              <Layers className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-slate-900">{activeProjects.length}</span>
            <span className="text-xs text-slate-500">In Progress ({finishedProjects.length} Finished)</span>
          </div>
          <p className="text-[11px] text-emerald-600 font-semibold mt-2 flex items-center space-x-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>{finishedProjects.length} transferred to Finished</span>
          </p>
        </div>
      </div>

      {/* Performance Analytics & Workflow Grid */}
      <div className="space-y-6">
        {/* Personnel Team Member Performance Table */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <UserCheck className="w-4 h-4 text-indigo-600" />
                <span>Real-Time Team Performance & Workload</span>
              </h2>
              <p className="text-slate-500 text-xs">Individual completion rates, active tasks, and workload balancing for Active Projects</p>
            </div>
            <div className="flex items-center space-x-3 shrink-0">
              <button
                onClick={() => setActiveTab('profiles')}
                className="text-xs text-indigo-600 hover:underline font-semibold"
              >
                View Profiles
              </button>
              <button
                onClick={() => setIsTeamPerformanceExpanded(!isTeamPerformanceExpanded)}
                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-xs transition-all flex items-center space-x-1 shadow-2xs cursor-pointer"
                title={isTeamPerformanceExpanded ? "Minimize Team Performance Section" : "Expand Team Performance Section"}
              >
                {isTeamPerformanceExpanded ? (
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
          </div>

          {isTeamPerformanceExpanded ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3 rounded-l-lg">Personnel Member</th>
                    <th className="py-2.5 px-3">Active Tasks</th>
                    <th className="py-2.5 px-3">Completed</th>
                    <th className="py-2.5 px-3">Completion Rate</th>
                    <th className="py-2.5 px-3">Workload Status</th>
                    <th className="py-2.5 px-3 text-right rounded-r-lg">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.map((member) => {
                    const memberTasks = activeProjectTasks.filter((t) => t.assigneeId === member.uid);
                    const memberCompleted = memberTasks.filter((t) => t.status === 'completed').length;
                    const memberActive = memberTasks.filter((t) => t.status !== 'completed').length;
                    const rate = memberTasks.length > 0 ? Math.round((memberCompleted / memberTasks.length) * 100) : 100;
                    const isOverloaded = memberActive >= 3;

                    return (
                      <tr key={member.uid} className="hover:bg-slate-50 transition-colors">
                        <td
                          onClick={() => setViewingMemberTodoList(member)}
                          className="py-3 px-3 flex items-center space-x-2.5 cursor-pointer group"
                        >
                          <img
                            src={member.photoURL}
                            alt={member.displayName}
                            className="w-7 h-7 rounded-full object-cover border border-slate-200 group-hover:border-amber-500 transition-colors"
                          />
                          <div>
                            <div className="font-semibold text-slate-900 group-hover:text-amber-600 transition-colors flex items-center space-x-1">
                              <span>{member.displayName}</span>
                              <ListTodo className="w-3 h-3 text-amber-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                            <div className="text-[10px] text-slate-500">{member.title}</div>
                          </div>
                        </td>

                        <td
                          onClick={() => setViewingMemberTodoList(member)}
                          className="py-3 px-3 font-semibold text-slate-800 cursor-pointer hover:text-amber-600 transition-colors"
                        >
                          {memberActive} active
                        </td>

                        <td
                          onClick={() => setViewingMemberTodoList(member)}
                          className="py-3 px-3 text-emerald-600 font-semibold cursor-pointer hover:underline"
                        >
                          {memberCompleted} done
                        </td>

                        <td className="py-3 px-3">
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-slate-900">{rate}%</span>
                            <div className="w-16 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                              <div
                                className="bg-indigo-600 h-full rounded-full"
                                style={{ width: `${rate}%` }}
                              />
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-3">
                          {isOverloaded ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                              ⚠️ High Workload
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              ✓ Optimal Capacity
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-3 text-right">
                          <div className="flex items-center justify-end space-x-1.5">
                            <button
                              onClick={() => setViewingMemberTodoList(member)}
                              className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-lg text-[11px] font-bold transition-colors flex items-center space-x-1"
                              title={`View Shared Calendar Event To-Do List under ${member.displayName}`}
                            >
                              <ListTodo className="w-3 h-3 text-amber-600" />
                              <span>To-Do List</span>
                            </button>
                            <button
                              onClick={() => openCreateTaskModal(member.uid)}
                              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-lg text-[11px] font-semibold transition-colors"
                            >
                              Assign Task
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-4 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-center space-y-2">
              <p className="text-xs text-slate-500 font-medium">
                Real-time team performance and workload metrics are currently minimized.
              </p>
              <div className="flex items-center justify-center space-x-2 pt-1">
                <span className="text-[11px] font-bold text-slate-700 bg-white px-2.5 py-0.5 rounded-md border border-slate-200 shadow-2xs">
                  {users.length} Team Members
                </span>
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-100">
                  {activeProjectTasks.length} Active Tasks
                </span>
                <button
                  onClick={() => setIsTeamPerformanceExpanded(true)}
                  className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 underline ml-1 cursor-pointer"
                >
                  Expand Content
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Active Projects Section */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div className="flex items-center space-x-2">
              <BarChart2 className="w-4 h-4 text-purple-600" />
              <h2 className="text-base font-bold text-slate-900">
                Active Projects ({activeProjects.length})
              </h2>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                In Progress (&lt; 100%)
              </span>
            </div>

            {/* Dropdown Menu to Select Active Projects */}
            <div className="flex items-center space-x-2">
              <label htmlFor="dashboard-active-project-dropdown" className="text-xs font-bold text-slate-500 shrink-0">Select Active Project:</label>
              <select
                id="dashboard-active-project-dropdown"
                value={selectedActiveProjectId}
                onChange={(e) => setSelectedActiveProjectId(e.target.value)}
                className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer shadow-2xs max-w-xs truncate"
              >
                <option value="">Select Project</option>
                <option value="all">📂 All Active Projects ({activeProjects.length})</option>
                {activeProjects.map((proj) => (
                  <option key={proj.id} value={proj.id}>
                    📁 {proj.name} ({proj.livePct}% Complete)
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-4">
            {selectedActiveProjectId === '' ? (
              <div className="bg-slate-50 border border-dashed border-slate-200 rounded-xl p-6 text-center space-y-3">
                <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 border border-purple-100 flex items-center justify-center mx-auto">
                  <BarChart2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-800">Select an Active Project</h3>
                  <p className="text-[11px] text-slate-500 mt-0.5 max-w-sm mx-auto">
                    Choose an active project from the drop down menu above to inspect its live progress and workflow status.
                  </p>
                </div>
                {activeProjects.length > 0 && (
                  <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                    {activeProjects.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => setSelectedActiveProjectId(p.id)}
                        className="px-3 py-1 bg-white hover:bg-purple-50 border border-slate-200 hover:border-purple-300 rounded-lg text-xs font-bold text-slate-700 hover:text-purple-700 transition-all flex items-center space-x-1.5 shadow-2xs"
                      >
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
                        <span>{p.name}</span>
                      </button>
                    ))}
                    <button
                      onClick={() => setSelectedActiveProjectId('all')}
                      className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold shadow-xs transition-all"
                    >
                      Show All ({activeProjects.length})
                    </button>
                  </div>
                )}
              </div>
            ) : activeProjectsToDisplay.length === 0 ? (
              <div className="text-center py-8 px-4 bg-slate-50 border border-dashed border-slate-200 rounded-xl">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-700">No active projects matching selected dropdown view.</p>
                <p className="text-[11px] text-slate-500">All projects have reached 100% completion or no project matches your selection.</p>
              </div>
            ) : (
              activeProjectsToDisplay.map((proj) => {
                return (
                  <div key={proj.id} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 hover:border-slate-300 transition-all space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span
                          className="w-3 h-3 rounded-full shrink-0"
                          style={{ backgroundColor: proj.color }}
                        />
                        <span className="font-bold text-sm text-slate-900">{proj.name}</span>
                        <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 rounded bg-white text-slate-600 border border-slate-200">
                          {proj.category}
                        </span>
                      </div>
                      <span className="text-xs font-black text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-100">
                        {proj.livePct}% Complete
                      </span>
                    </div>

                    <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${proj.livePct}%`, backgroundColor: proj.color }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5">
                      <span>Timeline: {proj.startDate} to {proj.endDate}</span>
                      <span className="font-medium text-slate-700">{proj.doneCount}/{proj.totalTasksCount} tasks completed</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Finished Projects Section (Dedicated for 100% Completed Projects) */}
        <div className="bg-gradient-to-br from-emerald-50/60 via-white to-amber-50/40 border border-emerald-200 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-emerald-100 pb-3">
            <div className="flex items-center space-x-2">
              <div className="p-1.5 bg-emerald-500 text-white rounded-lg shadow-2xs">
                <Trophy className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-black text-slate-900 flex items-center space-x-2">
                  <span>Finished Projects ({finishedProjects.length})</span>
                </h2>
                <p className="text-[11px] text-slate-500">Dedicated archive for projects that reached 100% completion</p>
              </div>
            </div>

            {/* Dropdown Menu to Select Finished Projects */}
            <div className="flex items-center space-x-2">
              <label htmlFor="dashboard-finished-project-dropdown" className="text-xs font-bold text-slate-600 shrink-0">Select Finished Project:</label>
              <select
                id="dashboard-finished-project-dropdown"
                value={selectedFinishedProjectId}
                onChange={(e) => setSelectedFinishedProjectId(e.target.value)}
                className="bg-white border border-emerald-300 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer shadow-2xs max-w-xs truncate"
              >
                <option value="">Select Project</option>
                <option value="all">🏆 All Finished Projects ({finishedProjects.length})</option>
                {finishedProjects.map((proj) => (
                  <option key={proj.id} value={proj.id}>
                    🏆 {proj.name} (100% Finished)
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-4">
            {selectedFinishedProjectId === '' ? (
              <div className="bg-white/80 border border-dashed border-emerald-200 rounded-xl p-6 text-center space-y-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center mx-auto">
                  <Trophy className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-800">Select a Finished Project</h3>
                  <p className="text-[11px] text-slate-500 mt-0.5 max-w-sm mx-auto">
                    Choose a finished project from the drop down menu above to inspect its completed milestones and achievements.
                  </p>
                </div>
                {finishedProjects.length > 0 && (
                  <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                    {finishedProjects.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => setSelectedFinishedProjectId(p.id)}
                        className="px-3 py-1 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg text-xs font-bold text-emerald-800 transition-all flex items-center space-x-1.5 shadow-2xs"
                      >
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
                        <span>{p.name}</span>
                      </button>
                    ))}
                    <button
                      onClick={() => setSelectedFinishedProjectId('all')}
                      className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs transition-all"
                    >
                      Show All ({finishedProjects.length})
                    </button>
                  </div>
                )}
              </div>
            ) : finishedProjectsToDisplay.length === 0 ? (
              <div className="text-center py-8 px-4 bg-white/80 border border-dashed border-emerald-200 rounded-xl space-y-1">
                <Award className="w-8 h-8 text-slate-300 mx-auto mb-1" />
                <p className="text-xs font-bold text-slate-700">No finished projects matching selected dropdown view.</p>
                <p className="text-[11px] text-slate-500">As soon as all tasks in a project are 100% completed, the project will automatically transfer here.</p>
              </div>
            ) : (
              finishedProjectsToDisplay.map((proj) => {
                return (
                  <div key={proj.id} className="p-4 bg-white/90 rounded-xl border border-emerald-200 shadow-xs space-y-2 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-400/10 rounded-full blur-xl pointer-events-none" />

                    <div className="flex items-center justify-between relative z-10">
                      <div className="flex items-center space-x-2">
                        <span
                          className="w-3.5 h-3.5 rounded-full shrink-0 border border-emerald-400"
                          style={{ backgroundColor: proj.color }}
                        />
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-black text-sm text-slate-900">{proj.name}</span>
                            <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300">
                              {proj.category}
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-500">{proj.description}</span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-1.5 px-3 py-1 bg-emerald-500 text-white rounded-full text-xs font-black shadow-xs shrink-0">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>100% Done</span>
                      </div>
                    </div>

                    <div className="w-full bg-emerald-100 h-2.5 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 transition-all duration-500"
                        style={{ width: '100%' }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                      <span className="flex items-center space-x-1 font-semibold text-emerald-800">
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span>All {proj.totalTasksCount > 0 ? proj.totalTasksCount : 'associated'} tasks fully completed</span>
                      </span>
                      <span>Timeline: {proj.startDate} to {proj.endDate}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Personnel Member Shared Calendar To-Do List Modal */}
      {viewingMemberTodoList && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-2xl p-6 shadow-2xl space-y-4 text-slate-900 animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-3">
                <img
                  src={viewingMemberTodoList.photoURL}
                  alt={viewingMemberTodoList.displayName}
                  className="w-10 h-10 rounded-full object-cover border-2 border-amber-400 shrink-0"
                />
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="font-bold text-base text-slate-900">{viewingMemberTodoList.displayName}</h3>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                      {viewingMemberTodoList.role}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    Active Projects To-Do Checklists • {viewingMemberTodoList.title || viewingMemberTodoList.department}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setViewingMemberTodoList(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* List of Tasks & To-Do Items */}
            {(() => {
              const memberTasks = activeProjectTasks.filter((t) => t.assigneeId === viewingMemberTodoList.uid);
              if (memberTasks.length === 0) {
                return (
                  <div className="text-center py-10 px-4 bg-slate-50 border border-dashed border-slate-200 rounded-2xl space-y-3">
                    <ListTodo className="w-10 h-10 text-slate-300 mx-auto" />
                    <p className="text-xs font-semibold text-slate-600">
                      No events or tasks currently assigned to {viewingMemberTodoList.displayName} in the Shared Calendar.
                    </p>
                    <button
                      onClick={() => {
                        const targetId = viewingMemberTodoList.uid;
                        setViewingMemberTodoList(null);
                        openCreateTaskModal(targetId);
                      }}
                      className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs shadow-xs transition-all inline-flex items-center space-x-1.5"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Assign First Task Event</span>
                    </button>
                  </div>
                );
              }

              return (
                <div className="space-y-4">
                  <div className="flex items-center justify-between bg-amber-50/80 border border-amber-200 p-3 rounded-xl">
                    <div className="flex items-center space-x-2 text-xs font-bold text-amber-950">
                      <Calendar className="w-4 h-4 text-amber-600" />
                      <span>{memberTasks.length} Assigned Shared Calendar Event{memberTasks.length > 1 ? 's' : ''}</span>
                    </div>
                    <button
                      onClick={() => {
                        setActiveTab('calendar');
                        setViewingMemberTodoList(null);
                      }}
                      className="text-[11px] font-extrabold text-indigo-600 hover:text-indigo-800 flex items-center space-x-1 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs"
                    >
                      <span>Open Full Calendar</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>

                  <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                    {memberTasks.map((t) => {
                      const subtasks = t.subtasks || [];
                      const completedCount = subtasks.filter((st) => st.completed).length;
                      const progressPct = subtasks.length > 0 ? Math.round((completedCount / subtasks.length) * 100) : 0;
                      const canUpdate = userRole === 'admin' || userRole === 'manager' || t.assigneeId === currentUser.uid;

                      return (
                        <div key={t.id} className="p-4 bg-white border border-slate-200 rounded-xl shadow-2xs space-y-3">
                          {/* Task Header */}
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="flex items-center space-x-2">
                                <span className="font-bold text-sm text-slate-900">{t.title}</span>
                                {t.priority === 'urgent' ? (
                                  <span className="text-[9px] bg-rose-100 text-rose-800 border border-rose-300 px-1.5 py-0.5 rounded font-extrabold uppercase">
                                    Urgent
                                  </span>
                                ) : t.priority === 'high' ? (
                                  <span className="text-[9px] bg-amber-100 text-amber-900 border border-amber-300 px-1.5 py-0.5 rounded font-bold uppercase">
                                    High
                                  </span>
                                ) : (
                                  <span className="text-[9px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-medium uppercase">
                                    {t.priority}
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-slate-500 mt-0.5">
                                Project: <strong className="text-slate-700">{t.projectName}</strong> • Due: {t.dueDate}
                              </p>
                            </div>

                            <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                              t.status === 'completed'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-blue-50 text-blue-700 border-blue-200'
                            }`}>
                              {t.status.replace('_', ' ')}
                            </span>
                          </div>

                          {/* Event To-Do Checklist */}
                          <div className="p-3 bg-amber-50/50 border border-amber-200/80 rounded-xl space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-extrabold text-amber-950 uppercase tracking-wider flex items-center space-x-1.5">
                                <ListTodo className="w-3.5 h-3.5 text-amber-600" />
                                <span>LISTED TO-DO CHECKLIST ({completedCount}/{subtasks.length})</span>
                              </span>
                              <span className="text-[10px] font-extrabold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-200">
                                {progressPct}%
                              </span>
                            </div>

                            {!canUpdate && (
                              <div className="p-2 bg-amber-100/90 text-amber-950 border border-amber-300 rounded-lg text-[11px] font-bold flex items-center space-x-1.5">
                                <Lock className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                                <span>Read-Only: Assigned to {t.assigneeName}</span>
                              </div>
                            )}

                            {/* Subtasks items */}
                            <div className="space-y-1.5 max-h-40 overflow-y-auto">
                              {subtasks.length === 0 ? (
                                <p className="text-slate-400 text-[11px] italic py-2 text-center bg-white/70 rounded-lg border border-slate-100">
                                  No checklist items listed yet.{canUpdate ? ' Add an item below!' : ''}
                                </p>
                              ) : (
                                subtasks.map((st) => (
                                  <div
                                    key={st.id}
                                    className={`flex items-center justify-between p-2 rounded-lg border text-xs transition-all ${
                                      st.completed
                                        ? 'bg-slate-100/80 border-slate-200 text-slate-400 line-through'
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
                                          await updateTaskDetails(t.id, { subtasks: updated });
                                        }}
                                        className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 cursor-pointer shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                                      />
                                      <span className="truncate">{st.title}</span>
                                    </div>

                                    {canUpdate && (
                                      <button
                                        onClick={async () => {
                                          const updated = subtasks.filter((item) => item.id !== st.id);
                                          await updateTaskDetails(t.id, { subtasks: updated });
                                        }}
                                        className="text-slate-400 hover:text-rose-600 p-1 transition-colors shrink-0"
                                        title="Remove item"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    )}
                                  </div>
                                ))
                              )}
                            </div>

                            {/* Add Subtask Input */}
                            {canUpdate && (
                              <div className="flex items-center space-x-2 pt-1">
                                <input
                                  type="text"
                                  placeholder="Add new to-do checklist item..."
                                  value={newSubtaskInputs[t.id] || ''}
                                  onChange={(e) => setNewSubtaskInputs({ ...newSubtaskInputs, [t.id]: e.target.value })}
                                  onKeyDown={async (e) => {
                                    if (e.key === 'Enter') {
                                      e.preventDefault();
                                      const val = newSubtaskInputs[t.id]?.trim();
                                      if (!val) return;
                                      const updated = [
                                        ...subtasks,
                                        { id: `st_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`, title: val, completed: false }
                                      ];
                                      await updateTaskDetails(t.id, { subtasks: updated });
                                      setNewSubtaskInputs({ ...newSubtaskInputs, [t.id]: '' });
                                    }
                                  }}
                                  className="flex-1 bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                                />
                                <button
                                  type="button"
                                  onClick={async () => {
                                    const val = newSubtaskInputs[t.id]?.trim();
                                    if (!val) return;
                                    const updated = [
                                      ...subtasks,
                                      { id: `st_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`, title: val, completed: false }
                                    ];
                                    await updateTaskDetails(t.id, { subtasks: updated });
                                    setNewSubtaskInputs({ ...newSubtaskInputs, [t.id]: '' });
                                  }}
                                  className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg text-xs font-black transition-all shadow-2xs flex items-center space-x-1 shrink-0"
                                >
                                  <Plus className="w-3.5 h-3.5 stroke-[3]" />
                                  <span>Add</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

            {/* Footer buttons */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <button
                onClick={() => {
                  const targetId = viewingMemberTodoList.uid;
                  setViewingMemberTodoList(null);
                  openCreateTaskModal(targetId);
                }}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold transition-colors flex items-center space-x-1"
              >
                <Plus className="w-3.5 h-3.5 text-slate-600" />
                <span>Assign New Task</span>
              </button>

              <button
                onClick={() => setViewingMemberTodoList(null)}
                className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition-colors shadow-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
