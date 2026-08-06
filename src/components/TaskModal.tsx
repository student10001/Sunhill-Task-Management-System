import React, { useState, useEffect } from 'react';
import {
  CheckSquare,
  X,
  Plus,
  Trash2,
  Calendar,
  Clock,
  User,
  AlertTriangle,
  Tag,
  FolderKanban,
  Link2,
  UserCheck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { TaskPriority, SubTask } from '../types';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialAssigneeId?: string;
}

export const TaskModal: React.FC<TaskModalProps> = ({ isOpen, onClose, initialAssigneeId }) => {
  const { users, projects, tasks, currentUser, createTask } = useAuth();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [projectId, setProjectId] = useState('');
  const [assigneeId, setAssigneeId] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('high');
  const [dueDate, setDueDate] = useState('2026-08-01');
  const [estimatedHours, setEstimatedHours] = useState(8);
  const [subtasks, setSubtasks] = useState<SubTask[]>([]);
  const [subtaskInput, setSubtaskInput] = useState('');

  // Active Projects (less than 100% completion & not completed)
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

  // Auto-select initial values when projects/users load or modal opens
  useEffect(() => {
    if (activeProjects.length > 0 && (!projectId || !activeProjects.some((p) => p.id === projectId))) {
      setProjectId(activeProjects[0].id);
    }
  }, [activeProjects, projectId]);

  useEffect(() => {
    if (isOpen) {
      if (initialAssigneeId && users.some((u) => u.uid === initialAssigneeId)) {
        setAssigneeId(initialAssigneeId);
      } else if (users.length > 0 && (!assigneeId || !users.some((u) => u.uid === assigneeId))) {
        setAssigneeId(users[0].uid);
      }
    }
  }, [isOpen, initialAssigneeId, users]);

  if (!isOpen) return null;

  const selectedProj = activeProjects.find((p) => p.id === projectId) || activeProjects[0];

  const handleAddSubtask = () => {
    if (!subtaskInput.trim()) return;
    setSubtasks([...subtasks, { id: 'st_' + Date.now(), title: subtaskInput.trim(), completed: false }]);
    setSubtaskInput('');
  };

  const handleRemoveSubtask = (id: string) => {
    setSubtasks(subtasks.filter((st) => st.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;

    const targetProj = projects.find((p) => p.id === projectId) || selectedProj;
    const selectedUser = users.find((u) => u.uid === assigneeId) || users[0];

    await createTask({
      title,
      description,
      projectId: targetProj?.id || 'proj_cloud_migration',
      projectName: targetProj?.name || 'Project',
      assigneeId: selectedUser?.uid || currentUser.uid,
      assigneeName: selectedUser?.displayName || currentUser.displayName || 'Team Member',
      assigneePhoto: selectedUser?.photoURL || '',
      creatorId: currentUser.uid,
      creatorName: currentUser.displayName,
      priority,
      status: 'todo',
      dueDate,
      estimatedHours: Number(estimatedHours) || 8,
      subtasks
    });

    // Reset Form
    setTitle('');
    setDescription('');
    setSubtasks([]);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4 text-slate-900 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="font-bold text-base text-slate-900 flex items-center space-x-2">
            <CheckSquare className="w-5 h-5 text-amber-600" />
            <span>Assign New Personnel Task</span>
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-700 font-semibold mb-1">Task Title *</label>
            <input
              type="text"
              required
              placeholder="e.g. Implement Real-Time Firestore Listener"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">Description</label>
            <textarea
              rows={2}
              placeholder="Key deliverables and acceptance criteria..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {/* Project Selection Linked to Shared Calendar */}
          <div className="p-3.5 bg-amber-50/80 border border-amber-200 rounded-xl space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="block text-amber-950 font-black text-xs uppercase tracking-wider flex items-center space-x-1.5">
                <FolderKanban className="w-4 h-4 text-amber-600" />
                <span>LINKED SHARED CALENDAR PROJECT *</span>
              </label>
              <span className="text-[10px] font-bold text-amber-900 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-full flex items-center space-x-1">
                <Link2 className="w-3 h-3 text-amber-600" />
                <span>Shared Calendar Linked</span>
              </span>
            </div>

            <select
              value={projectId || (activeProjects[0]?.id ?? '')}
              onChange={(e) => setProjectId(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-2xs"
            >
              {activeProjects.length === 0 ? (
                <option value="" disabled>No Active Projects Available</option>
              ) : (
                activeProjects.map((p) => (
                  <option key={p.id} value={p.id}>
                    📁 {p.name} (In Progress)
                  </option>
                ))
              )}
            </select>

            {/* Live Shared Calendar Project Details Card */}
            {selectedProj && (
              <div className="bg-white/95 border border-amber-200 rounded-lg p-2.5 text-xs space-y-1.5 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-slate-900 flex items-center space-x-1.5 truncate">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: selectedProj.color || '#f59e0b' }}
                    />
                    <span className="truncate">{selectedProj.name}</span>
                  </span>
                  <span className="px-2 py-0.5 rounded text-[9px] font-extrabold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                    {selectedProj.status?.replace('_', ' ') || 'Active'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 pt-1 border-t border-slate-100">
                  <div className="flex items-center space-x-1 truncate">
                    <Calendar className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span className="truncate">Timeline: {selectedProj.startDate} – {selectedProj.endDate}</span>
                  </div>
                  <div className="flex items-center space-x-1 truncate">
                    <UserCheck className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span className="truncate">PIC: {selectedProj.managerName}</span>
                  </div>
                </div>

                <div className="text-[10px] text-amber-950 bg-amber-100/70 rounded px-2 py-1 font-medium flex items-center space-x-1">
                  <Calendar className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                  <span>Automatically synchronized under <strong>{selectedProj.name}</strong> on the Shared Calendar.</span>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Assign Personnel Member</label>
              <select
                value={assigneeId}
                onChange={(e) => setAssigneeId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                {users.map((u) => (
                  <option key={u.uid} value={u.uid}>
                    {u.displayName} ({u.title})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Due Date</label>
              <input
                type="date"
                required
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 text-slate-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="urgent">🔥 Urgent</option>
                <option value="high">⚡ High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Est. Hours</label>
              <input
                type="number"
                min={1}
                value={estimatedHours}
                onChange={(e) => setEstimatedHours(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 text-slate-900"
              />
            </div>
          </div>

          {/* Subtasks Checklists */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <label className="block text-slate-700 font-semibold">Action Subtasks Checklist</label>
            <div className="space-y-1">
              {subtasks.map((st) => (
                <div key={st.id} className="flex items-center justify-between bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
                  <span>{st.title}</span>
                  <button type="button" onClick={() => handleRemoveSubtask(st.id)} className="text-rose-500 hover:text-rose-700">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex space-x-2">
              <input
                type="text"
                placeholder="Add subtask step..."
                value={subtaskInput}
                onChange={(e) => setSubtaskInput(e.target.value)}
                className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-slate-900"
              />
              <button
                type="button"
                onClick={handleAddSubtask}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-lg font-semibold"
              >
                + Add Step
              </button>
            </div>
          </div>

          <div className="pt-3 flex justify-end space-x-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-lg shadow-xs transition-colors"
            >
              Assign Task
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

