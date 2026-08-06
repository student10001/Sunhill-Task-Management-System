import React, { useState } from 'react';
import {
  CheckSquare,
  Plus,
  Filter,
  Search,
  LayoutGrid,
  List,
  Clock,
  AlertTriangle,
  CheckCircle2,
  User,
  MoreVertical,
  Trash2,
  Edit3,
  Calendar,
  X,
  Play,
  Check,
  Lock,
  ListTodo
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Task, TaskPriority, TaskStatus, UserProfile } from '../types';

interface TaskListProps {
  openCreateTaskModal: () => void;
  searchQuery: string;
}

export const TaskList: React.FC<TaskListProps> = ({ openCreateTaskModal, searchQuery }) => {
  const {
    tasks,
    projects,
    users,
    currentUser,
    userRole,
    updateTaskStatus,
    deleteTask,
    updateTaskDetails
  } = useAuth();

  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterAssignee, setFilterAssignee] = useState<string>('all');
  const [filterProject, setFilterProject] = useState<string>('all');
  const [viewingTaskTodoList, setViewingTaskTodoList] = useState<Task | null>(null);
  const [newSubtaskInput, setNewSubtaskInput] = useState<string>('');

  // Identify Active Projects (less than 100% completion)
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

  // Identify Finished Projects (100% completion)
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

  // Filter tasks logic (Active Projects for standard tabs, Finished Projects for Completed tab)
  const filteredTasks = tasks.filter((task) => {
    if (filterStatus === 'completed') {
      // Reflect tasks that belong to Finished Projects
      const isUnderFinishedProject = task.projectId ? finishedProjectIds.has(task.projectId) : task.status === 'completed';
      if (!isUnderFinishedProject) {
        return false;
      }
    } else {
      // Exclude tasks belonging to finished/100% completed projects for active tabs
      if (task.projectId && !activeProjectIds.has(task.projectId)) {
        return false;
      }
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchTitle = task.title.toLowerCase().includes(q);
      const matchAssignee = task.assigneeName.toLowerCase().includes(q);
      const matchProject = task.projectName.toLowerCase().includes(q);
      if (!matchTitle && !matchAssignee && !matchProject) return false;
    }

    if (filterStatus === 'my_tasks' && task.assigneeId !== currentUser.uid) return false;
    if (filterStatus !== 'all' && filterStatus !== 'my_tasks' && filterStatus !== 'completed' && task.status !== filterStatus) return false;
    if (filterPriority !== 'all' && task.priority !== filterPriority) return false;
    if (filterAssignee !== 'all' && task.assigneeId !== filterAssignee) return false;
    if (filterProject !== 'all' && task.projectId !== filterProject) return false;

    return true;
  });

  const getPriorityBadge = (p: TaskPriority) => {
    switch (p) {
      case 'urgent':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-rose-50 text-rose-600 border border-rose-200">🔥 Urgent</span>;
      case 'high':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-50 text-amber-700 border border-amber-200">⚡ High</span>;
      case 'medium':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-indigo-50 text-indigo-700 border border-indigo-200">Medium</span>;
      case 'low':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-600 border border-slate-200">Low</span>;
    }
  };

  const getStatusBadge = (s: TaskStatus) => {
    switch (s) {
      case 'todo':
        return <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200">To Do</span>;
      case 'in_progress':
        return <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-indigo-50 text-indigo-700 border border-indigo-200">In Progress</span>;
      case 'in_review':
        return <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-purple-50 text-purple-700 border border-purple-200">In Review</span>;
      case 'completed':
        return <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">Completed</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
              <CheckSquare className="w-5 h-5 text-indigo-600" />
              <span>Personnel Tasks ({filteredTasks.length})</span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              {filterStatus === 'completed'
                ? 'Completed task archive for 100% Finished Projects'
                : 'Real-time status updates and priority workflow tracking for Active Projects'}
            </p>
          </div>

          <div className="flex items-center space-x-3">
            {/* View Mode Switcher */}
            <div className="bg-slate-100 p-1 rounded-xl flex items-center space-x-1 border border-slate-200">
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-lg text-xs transition-colors ${
                  viewMode === 'list' ? 'bg-amber-500 text-slate-950 font-black shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
                title="List View"
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('kanban')}
                className={`p-1.5 rounded-lg text-xs transition-colors ${
                  viewMode === 'kanban' ? 'bg-amber-500 text-slate-950 font-black shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Kanban Board View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={openCreateTaskModal}
              className="flex items-center space-x-1.5 px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-black shadow-md shadow-amber-500/25 transition-all"
            >
              <Plus className="w-4 h-4 text-slate-950 font-bold" />
              <span>New Task</span>
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filterStatus === 'all' ? 'bg-amber-500 text-slate-950 font-black shadow-xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            All Tasks
          </button>
          <button
            onClick={() => setFilterStatus('my_tasks')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filterStatus === 'my_tasks' ? 'bg-amber-500 text-slate-950 font-black shadow-xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            My Assigned Tasks
          </button>
          <button
            onClick={() => setFilterStatus('in_progress')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filterStatus === 'in_progress' ? 'bg-amber-500 text-slate-950 font-black shadow-xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            In Progress
          </button>
          <button
            onClick={() => setFilterStatus('completed')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filterStatus === 'completed' ? 'bg-amber-500 text-slate-950 font-black shadow-xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Completed
          </button>

          <div className="ml-auto flex flex-wrap items-center gap-2">
            {/* Priority Filter */}
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="all">All Priorities</option>
              <option value="urgent">🔥 Urgent</option>
              <option value="high">⚡ High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>

            {/* Assignee Filter */}
            <select
              value={filterAssignee}
              onChange={(e) => setFilterAssignee(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="all">All Assignees</option>
              {users.map((u) => (
                <option key={u.uid} value={u.uid}>
                  {u.displayName}
                </option>
              ))}
            </select>

            {/* Project Filter */}
            <select
              value={filterProject}
              onChange={(e) => setFilterProject(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Projects</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* View Mode Content */}
      {viewMode === 'list' ? (
        /* List View Table */
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Task Title & Details</th>
                  <th className="py-3 px-4">Project</th>
                  <th className="py-3 px-4">Assignee</th>
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-4">Due Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTasks.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-slate-500 text-xs">
                      No matching personnel tasks found. Try adjusting filters or create a new task.
                    </td>
                  </tr>
                ) : (
                    filteredTasks.map((t) => {
                      const canUpdate = userRole === 'admin' || userRole === 'manager' || t.assigneeId === currentUser.uid;

                      return (
                        <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-3.5 px-4">
                            <div className="font-semibold text-slate-900 text-sm">{t.title}</div>
                            <div className="text-slate-500 text-[11px] line-clamp-1 max-w-md">{t.description}</div>
                            {t.subtasks && t.subtasks.length > 0 && (
                              <div className="text-[10px] text-slate-500 mt-1 flex items-center space-x-1">
                                <CheckSquare className="w-3 h-3 text-indigo-600" />
                                <span>
                                  Subtasks: {t.subtasks.filter((st) => st.completed).length}/{t.subtasks.length} completed
                                </span>
                              </div>
                            )}
                          </td>

                          <td className="py-3.5 px-4 font-semibold text-slate-800">
                            {t.projectName}
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="flex items-center space-x-2">
                              <img src={t.assigneePhoto} alt={t.assigneeName} className="w-6 h-6 rounded-full object-cover border border-slate-200" />
                              <span className="text-slate-800 font-medium">{t.assigneeName}</span>
                            </div>
                          </td>

                          <td className="py-3.5 px-4">
                            {getPriorityBadge(t.priority)}
                          </td>

                          <td className="py-3.5 px-4 text-slate-600">
                            <div className="flex items-center space-x-1">
                              <Clock className="w-3.5 h-3.5 text-slate-400" />
                              <span>{t.dueDate}</span>
                            </div>
                          </td>

                          <td className="py-3.5 px-4">
                            {getStatusBadge(t.status)}
                          </td>

                          <td className="py-3.5 px-4 text-right space-x-1.5">
                            <button
                              onClick={() => setViewingTaskTodoList(t)}
                              className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-lg text-[11px] font-bold transition-all shadow-2xs inline-flex items-center space-x-1"
                              title="View & manage checklist to-do items"
                            >
                              <ListTodo className="w-3.5 h-3.5 text-amber-600" />
                              <span>To-Do List</span>
                            </button>

                            {canUpdate ? (
                              t.status !== 'completed' ? (
                                <button
                                  onClick={() => updateTaskStatus(t.id, 'completed')}
                                  className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-600 hover:text-white text-emerald-700 border border-emerald-200 rounded-lg text-[11px] font-semibold transition-all shadow-xs"
                                  title="Mark as Completed"
                                >
                                  Complete
                                </button>
                              ) : (
                                <button
                                  onClick={() => updateTaskStatus(t.id, 'in_progress')}
                                  className="px-2.5 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-lg text-[11px] font-semibold transition-all"
                                  title="Reopen Task"
                                >
                                  Reopen
                                </button>
                              )
                            ) : (
                              <span className="inline-flex items-center space-x-1 px-2 py-0.5 bg-slate-100 text-slate-400 border border-slate-200 rounded-lg text-[10px] font-semibold" title={`Assigned to ${t.assigneeName}`}>
                                <Lock className="w-3 h-3 text-slate-400" />
                                <span>Read-Only</span>
                              </span>
                            )}

                            {(userRole === 'manager' || userRole === 'admin') && (
                              <button
                                onClick={() => deleteTask(t.id)}
                                className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                                title="Delete Task"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Kanban Board View */
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {(['todo', 'in_progress', 'in_review', 'completed'] as TaskStatus[]).map((status) => {
            const statusTasks = filteredTasks.filter((t) => t.status === status);
            const statusTitles: Record<TaskStatus, string> = {
              todo: 'To Do',
              in_progress: 'In Progress',
              in_review: 'In Review',
              completed: 'Completed'
            };

            return (
              <div key={status} className="bg-slate-50 border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <span className="font-bold text-xs uppercase tracking-wider text-slate-800">
                    {statusTitles[status]} ({statusTasks.length})
                  </span>
                  {getStatusBadge(status)}
                </div>

                <div className="space-y-3 min-h-[300px]">
                  {statusTasks.map((t) => {
                    const canUpdate = userRole === 'admin' || userRole === 'manager' || t.assigneeId === currentUser.uid;

                    return (
                      <div key={t.id} className="p-3 bg-white border border-slate-200 rounded-xl space-y-2.5 hover:border-indigo-300 shadow-xs transition-all">
                        <div className="flex items-start justify-between">
                          <span className="font-semibold text-xs text-slate-900 line-clamp-2">{t.title}</span>
                          {getPriorityBadge(t.priority)}
                        </div>

                        <p className="text-[11px] text-slate-500 line-clamp-2">{t.description}</p>

                        <div className="flex items-center justify-between text-[10px] text-slate-500 pt-2 border-t border-slate-100">
                          <div className="flex items-center space-x-1.5">
                            <img src={t.assigneePhoto} alt={t.assigneeName} className="w-5 h-5 rounded-full object-cover border border-slate-200" />
                            <span className="font-medium text-slate-700">{t.assigneeName}</span>
                          </div>
                          <span>Due {t.dueDate}</span>
                        </div>

                        <div className="flex items-center justify-between pt-1">
                          <div className="flex items-center space-x-1">
                            <button
                              onClick={() => setViewingTaskTodoList(t)}
                              className="px-2 py-0.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded text-[10px] font-bold transition-all shadow-2xs inline-flex items-center space-x-1"
                              title="View & manage checklist to-do items"
                            >
                              <ListTodo className="w-3 h-3 text-amber-600" />
                              <span>To-Do List</span>
                            </button>

                            {canUpdate ? (
                              <select
                                value={t.status}
                                onChange={(e) => updateTaskStatus(t.id, e.target.value as TaskStatus)}
                                className="bg-slate-50 border border-slate-200 text-[10px] text-slate-700 rounded px-1.5 py-0.5 focus:outline-none"
                              >
                                <option value="todo">To Do</option>
                                <option value="in_progress">In Progress</option>
                                <option value="in_review">In Review</option>
                                <option value="completed">Completed</option>
                              </select>
                            ) : (
                              <span className="inline-flex items-center space-x-1 text-[10px] font-semibold text-slate-400" title={`Assigned to ${t.assigneeName}`}>
                                <Lock className="w-3 h-3 text-slate-400" />
                                <span>{statusTitles[t.status]}</span>
                              </span>
                            )}
                          </div>

                          {(userRole === 'manager' || userRole === 'admin') && (
                            <button
                              onClick={() => deleteTask(t.id)}
                              className="text-slate-400 hover:text-rose-600"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
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
