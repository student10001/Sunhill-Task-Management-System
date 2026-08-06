import React, { useState } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Download,
  ExternalLink,
  Filter,
  CheckCircle2,
  Clock,
  Layers,
  Sparkles,
  Share2,
  X,
  Copy,
  Check,
  UserCheck,
  Users,
  ListTodo,
  Trash2,
  Lock
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Project, Task, Milestone, SubTask, TaskPriority } from '../types';

interface TodoItem {
  id: string;
  text: string;
  completed: boolean;
}

export const ProjectCalendar: React.FC = () => {
  const {
    projects,
    tasks,
    milestones,
    users,
    currentUser,
    userRole,
    createProject,
    createTask,
    createMilestone,
    updateProjectDetails,
    deleteProject,
    updateTaskStatus,
    updateTaskDetails,
    deleteTask
  } = useAuth();

  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedProjectFilter, setSelectedProjectFilter] = useState<string>('all');
  const [showAddEventModal, setShowAddEventModal] = useState<boolean>(false);
  const [showSyncModal, setShowSyncModal] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  // Selected Project/Task details view state
  const [viewingProject, setViewingProject] = useState<Project | null>(null);
  const [editingProjectTitle, setEditingProjectTitle] = useState<string>('');
  const [newProjectTaskTitle, setNewProjectTaskTitle] = useState<string>('');
  const [showDeleteProjectConfirm, setShowDeleteProjectConfirm] = useState<boolean>(false);

  const [viewingTask, setViewingTask] = useState<Task | null>(null);
  const [editingTaskTitle, setEditingTaskTitle] = useState<string>('');
  const [editingTaskDesc, setEditingTaskDesc] = useState<string>('');
  const [editingTaskSubtasks, setEditingTaskSubtasks] = useState<SubTask[]>([]);
  const [editingTaskDueDate, setEditingTaskDueDate] = useState<string>('');
  const [editingTaskPriority, setEditingTaskPriority] = useState<TaskPriority>('high');
  const [editingTaskAssigneeId, setEditingTaskAssigneeId] = useState<string>('');
  const [taskNewSubtaskInput, setTaskNewSubtaskInput] = useState<string>('');
  const [isSavingTask, setIsSavingTask] = useState<boolean>(false);
  const [showDeleteTaskConfirm, setShowDeleteTaskConfirm] = useState<boolean>(false);

  // New Event Form State
  const [newEventTitle, setNewEventTitle] = useState<string>('');
  const [newEventType, setNewEventType] = useState<'project' | 'task'>('project');
  const [newEventDate, setNewEventDate] = useState<string>('2026-08-01');
  const [newEventProject, setNewEventProject] = useState<string>(projects[0]?.id || '');
  const [picId, setPicId] = useState<string>('');
  const [selectedCollaboratorIds, setSelectedCollaboratorIds] = useState<string[]>([]);

  // Editable To Do List State for Task creation tab
  const [todoList, setTodoList] = useState<TodoItem[]>([
    { id: '1', text: '1. Review project requirements & scope', completed: false },
    { id: '2', text: '2. Prepare technical deliverables', completed: false },
    { id: '3', text: '3. Verify test cases & team sign-off', completed: false }
  ]);
  const [newTodoInput, setNewTodoInput] = useState<string>('');

  const openTaskModal = (t: Task) => {
    setViewingTask(t);
    setEditingTaskTitle(t.title);
    setEditingTaskDesc(t.description || '');
    setShowDeleteTaskConfirm(false);

    let initialSubtasks: SubTask[] = t.subtasks && t.subtasks.length > 0 ? t.subtasks : [];
    if (initialSubtasks.length === 0 && t.description) {
      const lines = t.description.split('\n').map((l) => l.trim()).filter(Boolean);
      if (lines.length > 0) {
        initialSubtasks = lines.map((line, idx) => ({
          id: `st_${Date.now()}_${idx}`,
          title: line.replace(/^[0-9]+\.\s*/, '').replace(/^[-*]\s*/, '').replace(/^\[[ xX]\]\s*/, ''),
          completed: line.toLowerCase().includes('[x]')
        }));
      }
    }
    setEditingTaskSubtasks(initialSubtasks);
    setEditingTaskDueDate(t.dueDate || '');
    setEditingTaskPriority(t.priority || 'high');
    setEditingTaskAssigneeId(t.assigneeId || '');
    setTaskNewSubtaskInput('');
  };

  const handleAddTaskSubtask = async () => {
    if (!taskNewSubtaskInput.trim() || !viewingTask) return;
    const canUpdate = userRole === 'admin' || userRole === 'manager' || viewingTask.assigneeId === currentUser.uid;
    if (!canUpdate) return;
    const newItem: SubTask = {
      id: 'st_' + Date.now(),
      title: taskNewSubtaskInput.trim(),
      completed: false
    };
    const updated = [...editingTaskSubtasks, newItem];
    setEditingTaskSubtasks(updated);
    setTaskNewSubtaskInput('');
    await updateTaskDetails(viewingTask.id, { subtasks: updated });
    setViewingTask({ ...viewingTask, subtasks: updated });
  };

  const handleToggleTaskSubtask = async (stId: string) => {
    if (!viewingTask) return;
    const canUpdate = userRole === 'admin' || userRole === 'manager' || viewingTask.assigneeId === currentUser.uid;
    if (!canUpdate) return;
    const updated = editingTaskSubtasks.map((st) =>
      st.id === stId ? { ...st, completed: !st.completed } : st
    );
    setEditingTaskSubtasks(updated);
    await updateTaskDetails(viewingTask.id, { subtasks: updated });
    setViewingTask({ ...viewingTask, subtasks: updated });
  };

  const handleUpdateTaskSubtaskTitle = (stId: string, title: string) => {
    if (!viewingTask) return;
    const canUpdate = userRole === 'admin' || userRole === 'manager' || viewingTask.assigneeId === currentUser.uid;
    if (!canUpdate) return;
    const updated = editingTaskSubtasks.map((st) =>
      st.id === stId ? { ...st, title } : st
    );
    setEditingTaskSubtasks(updated);
  };

  const handleDeleteTaskSubtask = async (stId: string) => {
    if (!viewingTask) return;
    const canUpdate = userRole === 'admin' || userRole === 'manager' || viewingTask.assigneeId === currentUser.uid;
    if (!canUpdate) return;
    const updated = editingTaskSubtasks.filter((st) => st.id !== stId);
    setEditingTaskSubtasks(updated);
    await updateTaskDetails(viewingTask.id, { subtasks: updated });
    setViewingTask({ ...viewingTask, subtasks: updated });
  };

  const handleSaveTaskChanges = async () => {
    if (!viewingTask) return;
    const canUpdate = userRole === 'admin' || userRole === 'manager' || viewingTask.assigneeId === currentUser.uid;
    if (!canUpdate) return;
    setIsSavingTask(true);
    const assignedUser = users.find((u) => u.uid === editingTaskAssigneeId);
    const updates: Partial<Task> = {
      title: editingTaskTitle.trim() || viewingTask.title,
      description: editingTaskDesc,
      subtasks: editingTaskSubtasks,
      dueDate: editingTaskDueDate,
      priority: editingTaskPriority,
      assigneeId: editingTaskAssigneeId || viewingTask.assigneeId,
      assigneeName: assignedUser?.displayName || viewingTask.assigneeName,
      assigneePhoto: assignedUser?.photoURL || viewingTask.assigneePhoto
    };
    await updateTaskDetails(viewingTask.id, updates);
    setIsSavingTask(false);
    setViewingTask(null);
  };

  const handleAddTodo = () => {
    if (!newTodoInput.trim()) return;
    setTodoList([
      ...todoList,
      { id: Date.now().toString(), text: newTodoInput.trim(), completed: false }
    ]);
    setNewTodoInput('');
  };

  const handleToggleTodo = (id: string) => {
    setTodoList(todoList.map((item) => (item.id === id ? { ...item, completed: !item.completed } : item)));
  };

  const handleUpdateTodoText = (id: string, text: string) => {
    setTodoList(todoList.map((item) => (item.id === id ? { ...item, text } : item)));
  };

  const handleDeleteTodo = (id: string) => {
    setTodoList(todoList.filter((item) => item.id !== id));
  };

  const handleOpenAddModal = () => {
    if (users.length > 0) {
      setPicId(currentUser?.uid || users[0].uid);
      setSelectedCollaboratorIds(users.map((u) => u.uid));
    }
    setShowAddEventModal(true);
  };

  // Helper date math
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const todayMonth = () => setCurrentDate(new Date());

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Third-party .ics Export Generator
  const generateIcsExport = () => {
    let icsContent = `BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//PulseTask Pro//Team Project Calendar//EN\r\nCALSCALE:GREGORIAN\r\nMETHOD:PUBLISH\r\nX-WR-CALNAME:PulseTask Shared Team Calendar\r\n`;

    // Add Projects
    projects.forEach((proj) => {
      const sDate = proj.startDate.replace(/-/g, '');
      const eDate = proj.endDate.replace(/-/g, '');
      icsContent += `BEGIN:VEVENT\r\nSUMMARY:[Project] ${proj.name}\r\nDESCRIPTION:${proj.description}\r\nDTSTART;VALUE=DATE:${sDate}\r\nDTEND;VALUE=DATE:${eDate}\r\nSTATUS:CONFIRMED\r\nEND:VEVENT\r\n`;
    });

    // Add Tasks
    tasks.forEach((task) => {
      if (task.dueDate) {
        const dDate = task.dueDate.replace(/-/g, '');
        icsContent += `BEGIN:VEVENT\r\nSUMMARY:[Task] ${task.title}\r\nDESCRIPTION:Assigned to ${task.assigneeName}. Priority: ${task.priority.toUpperCase()}\r\nDTSTART;VALUE=DATE:${dDate}\r\nDTEND;VALUE=DATE:${dDate}\r\nEND:VEVENT\r\n`;
      }
    });

    icsContent += `END:VCALENDAR`;

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'PulseTask_Team_Calendar.ics');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Google Calendar Link Generator for a task/project
  const getGoogleCalendarUrl = (title: string, dateStr: string, details: string) => {
    const d = dateStr.replace(/-/g, '');
    const encodedTitle = encodeURIComponent(title);
    const encodedDetails = encodeURIComponent(details);
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodedTitle}&dates=${d}/${d}&details=${encodedDetails}`;
  };

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventTitle) return;

    const picUser = users.find((u) => u.uid === picId) || currentUser || users[0];
    const collaborators = users.filter((u) => selectedCollaboratorIds.includes(u.uid));
    const collabNames = collaborators.map((u) => u.displayName).join(', ');

    if (newEventType === 'project') {
      await createProject({
        name: newEventTitle,
        description: `Person-In-Charge: ${picUser?.displayName || 'N/A'}${
          collabNames ? `. Collaborators: ${collabNames}` : ''
        }.`,
        color: '#f59e0b',
        status: 'in_progress',
        startDate: newEventDate,
        endDate: newEventDate,
        managerId: picUser?.uid || 'user_alex_manager',
        managerName: picUser?.displayName || 'Alex Vance',
        memberIds: selectedCollaboratorIds.length > 0 ? selectedCollaboratorIds : users.map((u) => u.uid),
        category: 'Development'
      });
    } else if (newEventType === 'task') {
      const targetProj = projects.find((p) => p.id === newEventProject) || projects[0];
      const formattedTodoList =
        todoList.length > 0
          ? todoList.map((t) => `${t.completed ? '[✓]' : '[ ]'} ${t.text}`).join('\n')
          : 'Editable To-Do List empty.';

      await createTask({
        title: newEventTitle,
        description: formattedTodoList,
        projectId: targetProj?.id || 'proj_cloud_migration',
        projectName: targetProj?.name || 'Project',
        assigneeId: picUser?.uid || currentUser?.uid || users[0]?.uid || 'user_alex_manager',
        assigneeName: picUser?.displayName || currentUser?.displayName || users[0]?.displayName || 'Alex Vance',
        assigneePhoto: picUser?.photoURL || currentUser?.photoURL || '',
        creatorId: currentUser?.uid || picUser?.uid || 'user_alex_manager',
        creatorName: currentUser?.displayName || picUser?.displayName || 'Alex Vance',
        priority: 'high',
        status: 'todo',
        dueDate: newEventDate,
        estimatedHours: 8
      });
    } else {
      const targetProj = projects.find((p) => p.id === newEventProject) || projects[0];
      await createMilestone({
        projectId: targetProj?.id || 'proj_cloud_migration',
        projectName: targetProj?.name || 'Project',
        title: `${newEventTitle} (PIC: ${picUser?.displayName || 'N/A'})`,
        dueDate: newEventDate
      });
    }

    setNewEventTitle('');
    setShowAddEventModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
              <CalendarIcon className="w-5 h-5 text-amber-600" />
              <span>Shared Team Project Calendar</span>
            </h1>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-50 text-amber-900 border border-amber-300">
              Live Sync
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Collaborative project scheduling & deadline tracking across all personnel members
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Third-Party Calendar Integration Buttons */}
          <button
            onClick={generateIcsExport}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold transition-all shadow-xs"
            title="Download .ics File for Outlook, Apple Calendar, Thunderbird"
          >
            <Download className="w-3.5 h-3.5 text-amber-600" />
            <span>Export .ics</span>
          </button>

          <button
            onClick={() => setShowSyncModal(true)}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold transition-all shadow-xs"
          >
            <Share2 className="w-3.5 h-3.5 text-amber-600" />
            <span>Sync iCal / Google</span>
          </button>

          <button
            onClick={handleOpenAddModal}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-black shadow-md shadow-amber-500/20 transition-all"
          >
            <Plus className="w-4 h-4 text-slate-950 font-bold" />
            <span>Schedule Event / Task</span>
          </button>
        </div>
      </div>

      {/* Calendar Controls & Month Grid */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <h2 className="text-lg font-bold text-slate-900">
              {monthNames[month]} {year}
            </h2>
            <div className="flex items-center space-x-1 bg-slate-100 rounded-lg p-0.5 border border-slate-200">
              <button
                onClick={prevMonth}
                className="p-1 text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={todayMonth}
                className="px-2 py-0.5 text-xs text-slate-700 hover:text-slate-900 font-semibold"
              >
                Today
              </button>
              <button
                onClick={nextMonth}
                className="p-1 text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Project Filter */}
          <div className="flex items-center space-x-2">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedProjectFilter}
              onChange={(e) => setSelectedProjectFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-lg px-2.5 py-1 focus:outline-none"
            >
              <option value="all">All Team Projects</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Month Calendar Grid with Horizontal Scrollbar for narrow screens */}
        <div className="overflow-x-auto w-full pb-2">
          <div className="grid grid-cols-7 gap-px bg-slate-200 rounded-xl overflow-hidden text-xs min-w-[700px]">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div key={day} className="bg-slate-50 py-2 text-center font-bold text-slate-500 text-[11px] uppercase tracking-wider">
              {day}
            </div>
          ))}

          {/* Blank preceding days */}
          {Array.from({ length: firstDayOfMonth }).map((_, i) => (
            <div key={`blank-${i}`} className="bg-slate-50/60 min-h-[100px] p-1 text-slate-400" />
          ))}

          {/* Days of Month */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const dayNumber = i + 1;
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNumber).padStart(2, '0')}`;
            const today = new Date();
            const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
            const isToday = dateStr === todayStr;

            // Find matching projects, tasks, milestones for this day
            const dayProjects = projects.filter((p) => {
              if (selectedProjectFilter !== 'all' && p.id !== selectedProjectFilter) return false;
              return dateStr >= p.startDate && dateStr <= p.endDate;
            });

            const dayTasks = tasks.filter((t) => {
              if (selectedProjectFilter !== 'all' && t.projectId !== selectedProjectFilter) return false;
              return t.dueDate === dateStr;
            });

            const dayMilestones = milestones.filter((m) => {
              if (selectedProjectFilter !== 'all' && m.projectId !== selectedProjectFilter) return false;
              return m.dueDate === dateStr;
            });

            return (
              <div
                key={dayNumber}
                onClick={() => {
                  setNewEventDate(dateStr);
                  setShowAddEventModal(true);
                }}
                className={`bg-white min-h-[110px] p-1.5 transition-colors cursor-pointer hover:bg-slate-50 border-t border-slate-100 flex flex-col justify-between ${
                  isToday ? 'ring-2 ring-indigo-500 bg-indigo-50/50' : ''
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`font-semibold text-[11px] ${
                        isToday ? 'bg-indigo-600 text-white px-1.5 rounded-full' : 'text-slate-700'
                      }`}
                    >
                      {dayNumber}
                    </span>
                    {isToday && <span className="text-[9px] text-indigo-600 font-bold uppercase">Today</span>}
                  </div>

                  {/* Day Events */}
                  <div className="space-y-1 overflow-y-auto max-h-[95px] pr-0.5">
                    {/* Projects Timeline Badge */}
                    {dayProjects.map((p) => (
                      <div
                        key={p.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          setViewingProject(p);
                          setEditingProjectTitle(p.name);
                          setShowDeleteProjectConfirm(false);
                        }}
                        className="px-1.5 py-0.5 rounded text-[10px] font-medium truncate text-white shadow-xs flex items-center justify-between opacity-90 cursor-pointer hover:scale-[1.02] transition-transform"
                        style={{ backgroundColor: p.color }}
                        title={`Click to open project: ${p.name}`}
                      >
                        <span className="truncate">📁 {p.name}</span>
                      </div>
                    ))}

                    {/* Milestones */}
                    {dayMilestones.map((m) => (
                      <div
                        key={m.id}
                        className="px-1.5 py-0.5 rounded text-[10px] font-semibold truncate bg-amber-50 text-amber-800 border border-amber-200 flex items-center justify-between"
                        title={`Milestone: ${m.title}`}
                      >
                        <span className="truncate">🎯 {m.title}</span>
                      </div>
                    ))}

                    {/* Tasks */}
                    {dayTasks.map((t) => (
                      <div
                        key={t.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          openTaskModal(t);
                        }}
                        className={`px-1.5 py-0.5 rounded text-[10px] truncate border flex items-center justify-between cursor-pointer hover:scale-[1.02] transition-transform ${
                          t.priority === 'urgent'
                            ? 'bg-rose-50 text-rose-700 border-rose-200 font-semibold'
                            : 'bg-slate-100 text-slate-800 border-slate-200'
                        }`}
                        title={`Click to view & edit to-do list for task: ${t.title} (${t.assigneeName})`}
                      >
                        <span className="truncate">✓ {t.title}</span>
                        <a
                          href={getGoogleCalendarUrl(t.title, t.dueDate, `Assigned to ${t.assigneeName}`)}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-indigo-600 hover:text-indigo-800 ml-1"
                          title="Add to Google Calendar"
                        >
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
          </div>
        </div>
      </div>

      {/* Add Event Modal */}
      {showAddEventModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4 text-slate-900 animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-base text-slate-900 flex items-center space-x-2">
                <CalendarIcon className="w-5 h-5 text-amber-600" />
                <span>Schedule Project Event</span>
              </h3>
              <button onClick={() => setShowAddEventModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddEvent} className="space-y-4 text-xs">
              {/* 1. PROJECT TITLE */}
              <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-xl space-y-1.5">
                <label className="block text-amber-950 font-black text-xs uppercase tracking-wider flex items-center space-x-1.5">
                  <Layers className="w-4 h-4 text-amber-600" />
                  <span>PROJECT TITLE</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Enter Project Title..."
                  value={newEventTitle}
                  onChange={(e) => setNewEventTitle(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-2xs"
                />
              </div>

              {/* Schedule Date */}
              <div>
                <label className="block text-slate-700 mb-1 font-bold text-[11px] uppercase tracking-wider">Schedule Date</label>
                <input
                  type="date"
                  required
                  value={newEventDate}
                  onChange={(e) => setNewEventDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* PERSON-IN-CHARGE FOR PROJECTS */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                <label className="block text-slate-900 font-extrabold text-xs uppercase tracking-wider flex items-center space-x-1.5">
                  <UserCheck className="w-4 h-4 text-amber-600" />
                  <span>PERSON-IN-CHARGE</span>
                </label>
                <p className="text-[11px] text-slate-500">Designated lead manager or primary responsible personnel</p>
                <select
                  value={picId || currentUser?.uid || users[0]?.uid || ''}
                  onChange={(e) => setPicId(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-2xs"
                >
                  {users.map((u) => (
                    <option key={u.uid} value={u.uid}>
                      {u.displayName} ({u.role.toUpperCase()} • {u.title || u.department || 'Personnel'})
                    </option>
                  ))}
                </select>
              </div>



              <div className="pt-2 flex justify-end space-x-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddEventModal(false)}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl font-black shadow-md shadow-amber-500/20 transition-all flex items-center space-x-1.5"
                >
                  <Plus className="w-4 h-4 text-slate-950 font-bold" />
                  <span>Add to Calendar</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Sync iCal & Google Calendar Modal */}
      {showSyncModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg p-5 shadow-2xl space-y-4 text-slate-900 animate-in fade-in zoom-in-95 duration-150 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-base text-slate-900 flex items-center space-x-2">
                <Share2 className="w-5 h-5 text-purple-600" />
                <span>Third-Party Calendar Integration</span>
              </h3>
              <button onClick={() => setShowSyncModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <p className="text-slate-600">
                Seamlessly synchronize your personnel team schedule with external calendar applications like Google Calendar, Apple Calendar, or Microsoft Outlook.
              </p>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="font-semibold text-slate-900 flex items-center space-x-1.5">
                  <Download className="w-4 h-4 text-indigo-600" />
                  <span>Option 1: iCal (.ics) Standard Export</span>
                </div>
                <p className="text-slate-500 text-[11px]">
                  Downloads a standard <code>.ics</code> calendar file compatible with macOS Calendar, Outlook, and mobile calendar apps.
                </p>
                <button
                  onClick={generateIcsExport}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold flex items-center space-x-1 shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download .ics File</span>
                </button>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="font-semibold text-slate-900 flex items-center space-x-1.5">
                  <ExternalLink className="w-4 h-4 text-purple-600" />
                  <span>Option 2: Direct Google Calendar Web Links</span>
                </div>
                <p className="text-slate-500 text-[11px]">
                  Each task card in the calendar includes a direct link to open Google Calendar with pre-populated event details.
                </p>
              </div>
            </div>

            <div className="pt-2 flex justify-end border-t border-slate-100">
              <button
                onClick={() => setShowSyncModal(false)}
                className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View/Edit Project Details Modal (Retaining Project Title) */}
      {viewingProject && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg p-5 shadow-2xl space-y-4 text-slate-900 animate-in fade-in zoom-in-95 duration-150 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <span
                  className="w-3.5 h-3.5 rounded-full shrink-0"
                  style={{ backgroundColor: viewingProject.color || '#f59e0b' }}
                />
                <h3 className="font-extrabold text-base text-slate-900">Shared Calendar Project Details</h3>
              </div>
              <button onClick={() => setViewingProject(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              {/* Retained Project Title Input */}
              <div className="p-3.5 bg-amber-50/80 border border-amber-200 rounded-xl space-y-1.5">
                <label className="block text-amber-950 font-black text-xs uppercase tracking-wider flex items-center space-x-1.5">
                  <CalendarIcon className="w-4 h-4 text-amber-600" />
                  <span>PROJECT TITLE (RETAINED)</span>
                </label>
                <input
                  type="text"
                  value={editingProjectTitle}
                  onChange={(e) => setEditingProjectTitle(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 font-extrabold text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-2xs"
                  placeholder="Project title..."
                />
                <p className="text-[10px] text-amber-900">
                  This title is preserved across the Shared Calendar, Projects Tab, and Assigned Tasks.
                </p>
              </div>

              {/* Category & Status */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <span className="block text-[10px] font-bold text-slate-400 uppercase">Category</span>
                  <span className="font-bold text-slate-800 text-xs">{viewingProject.category || 'General'}</span>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <span className="block text-[10px] font-bold text-slate-400 uppercase">Timeline</span>
                  <span className="font-bold text-slate-800 text-xs">
                    {viewingProject.startDate} – {viewingProject.endDate}
                  </span>
                </div>
              </div>

              {/* Description */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <span className="block text-[10px] font-bold text-slate-400 uppercase">Scope & Lead</span>
                <p className="text-slate-700 text-xs leading-relaxed">{viewingProject.description}</p>
              </div>

              {/* Linked Tasks / Project To-Do Checklist */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-slate-800 text-xs flex items-center space-x-1.5">
                    <ListTodo className="w-4 h-4 text-amber-600" />
                    <span>PROJECT TO-DO TASKS ({tasks.filter((t) => t.projectId === viewingProject.id).length})</span>
                  </span>
                  <span className="text-[10px] text-amber-700 font-bold bg-amber-100 px-2 py-0.5 rounded-full">
                    {tasks.filter((t) => t.projectId === viewingProject.id && t.status === 'completed').length} / {tasks.filter((t) => t.projectId === viewingProject.id).length} Completed
                  </span>
                </div>

                {/* Quick Add Task to Project */}
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    placeholder="Add a new task / to-do item to project..."
                    value={newProjectTaskTitle}
                    onChange={(e) => setNewProjectTaskTitle(e.target.value)}
                    onKeyDown={async (e) => {
                      if (e.key === 'Enter' && newProjectTaskTitle.trim()) {
                        e.preventDefault();
                        await createTask({
                          title: newProjectTaskTitle.trim(),
                          description: '',
                          projectId: viewingProject.id,
                          projectName: viewingProject.name,
                          assigneeId: currentUser?.uid || users[0]?.uid || '',
                          assigneeName: currentUser?.displayName || users[0]?.displayName || 'Assigned',
                          assigneePhoto: currentUser?.photoURL || users[0]?.photoURL || '',
                          creatorId: currentUser?.uid || '',
                          creatorName: currentUser?.displayName || 'Admin',
                          priority: 'high',
                          status: 'todo',
                          dueDate: viewingProject.endDate || '2026-08-15',
                          estimatedHours: 4,
                          loggedHours: 0,
                          createdAt: new Date().toISOString()
                        });
                        setNewProjectTaskTitle('');
                      }
                    }}
                    className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-2xs"
                  />
                  <button
                    type="button"
                    onClick={async () => {
                      if (!newProjectTaskTitle.trim()) return;
                      await createTask({
                        title: newProjectTaskTitle.trim(),
                        description: '',
                        projectId: viewingProject.id,
                        projectName: viewingProject.name,
                        assigneeId: currentUser?.uid || users[0]?.uid || '',
                        assigneeName: currentUser?.displayName || users[0]?.displayName || 'Assigned',
                        assigneePhoto: currentUser?.photoURL || users[0]?.photoURL || '',
                        creatorId: currentUser?.uid || '',
                        creatorName: currentUser?.displayName || 'Admin',
                        priority: 'high',
                        status: 'todo',
                        dueDate: viewingProject.endDate || '2026-08-15',
                        estimatedHours: 4,
                        loggedHours: 0,
                        createdAt: new Date().toISOString()
                      });
                      setNewProjectTaskTitle('');
                    }}
                    className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg text-xs font-black transition-all shadow-2xs shrink-0 flex items-center space-x-1"
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[3]" />
                    <span>Add Task</span>
                  </button>
                </div>

                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                  {tasks.filter((t) => t.projectId === viewingProject.id).length === 0 ? (
                    <p className="text-[11px] text-slate-400 italic bg-white p-2 rounded border border-slate-200 text-center">
                      No tasks currently linked to this project. Type above and click "Add Task"!
                    </p>
                  ) : (
                    tasks
                      .filter((t) => t.projectId === viewingProject.id)
                      .map((t) => (
                        <div
                          key={t.id}
                          className="flex items-center justify-between p-2 bg-white border border-slate-200 rounded-lg text-xs hover:border-amber-300 transition-colors"
                        >
                          <div className="flex items-center space-x-2 min-w-0 flex-1">
                            <input
                              type="checkbox"
                              checked={t.status === 'completed'}
                              onChange={() => updateTaskStatus(t.id, t.status === 'completed' ? 'in_progress' : 'completed')}
                              className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 cursor-pointer shrink-0"
                            />
                            <span
                              onClick={() => openTaskModal(t)}
                              className={`font-semibold cursor-pointer truncate hover:text-amber-700 ${
                                t.status === 'completed' ? 'line-through text-slate-400' : 'text-slate-800'
                              }`}
                              title="Click to view & edit full To-Do checklist for this task"
                            >
                              ✓ {t.title}
                            </span>
                          </div>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600 shrink-0 ml-2">
                            {t.assigneeName}
                          </span>
                        </div>
                      ))
                  )}
                </div>
              </div>
            </div>

            <div className="pt-3 flex items-center justify-between border-t border-slate-100">
              {showDeleteProjectConfirm ? (
                <div className="flex items-center space-x-2 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-xl animate-in fade-in">
                  <span className="text-[11px] font-bold text-rose-700">Confirm delete project?</span>
                  <button
                    type="button"
                    onClick={async () => {
                      await deleteProject(viewingProject.id);
                      setViewingProject(null);
                      setShowDeleteProjectConfirm(false);
                    }}
                    className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-black shadow-xs"
                  >
                    Yes, Delete
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowDeleteProjectConfirm(false)}
                    className="px-2 py-1 text-slate-600 hover:text-slate-900 text-xs font-semibold"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowDeleteProjectConfirm(true)}
                  className="px-3 py-1.5 text-rose-600 hover:bg-rose-50 rounded-lg text-xs font-bold transition-colors flex items-center space-x-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Project</span>
                </button>
              )}

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setViewingProject(null)}
                  className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    if (editingProjectTitle.trim()) {
                      await updateProjectDetails(viewingProject.id, { name: editingProjectTitle.trim() });
                    }
                    setViewingProject(null);
                  }}
                  className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-black shadow-2xs"
                >
                  Save Title & Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View / Edit Task Modal (Full To-Do List Interactive Management) */}
      {viewingTask && (() => {
        const canEditTask = userRole === 'admin' || userRole === 'manager' || viewingTask.assigneeId === currentUser.uid;

        return (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg p-5 shadow-2xl space-y-4 text-slate-900 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-extrabold text-base text-slate-900 flex items-center space-x-2">
                  <CheckCircle2 className="w-5 h-5 text-amber-600" />
                  <span>Shared Calendar Event / Task Details</span>
                </h3>
                <button onClick={() => setViewingTask(null)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {!canEditTask && (
                <div className="p-3 bg-amber-100/90 text-amber-950 border border-amber-300 rounded-xl text-xs font-bold flex items-center space-x-2 shadow-2xs">
                  <Lock className="w-4 h-4 text-amber-700 shrink-0" />
                  <span>Read-Only: This task is assigned to <strong>{viewingTask.assigneeName}</strong>. You cannot edit tasks assigned to another member.</span>
                </div>
              )}

              <div className="space-y-3.5 text-xs">
                {/* Task Title (Editable) */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Task / Event Title
                  </label>
                  <input
                    type="text"
                    value={editingTaskTitle}
                    readOnly={!canEditTask}
                    onChange={(e) => setEditingTaskTitle(e.target.value)}
                    className={`w-full border rounded-lg px-3 py-2 text-slate-900 font-extrabold text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-2xs ${
                      !canEditTask ? 'bg-slate-100/80 border-slate-200 text-slate-600 cursor-not-allowed' : 'bg-slate-50 border-slate-200'
                    }`}
                    placeholder="Event title..."
                  />
                </div>

                {/* Linked Project & Assignee / Due Date */}
                <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-amber-900 uppercase">LINKED PROJECT</span>
                    <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                      {viewingTask.projectName}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase">Assignee</label>
                      <select
                        value={editingTaskAssigneeId}
                        disabled={!canEditTask}
                        onChange={(e) => setEditingTaskAssigneeId(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        {users.map((u) => (
                          <option key={u.uid} value={u.uid}>
                            {u.displayName}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase">Due Date</label>
                      <input
                        type="date"
                        value={editingTaskDueDate}
                        readOnly={!canEditTask}
                        disabled={!canEditTask}
                        onChange={(e) => setEditingTaskDueDate(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:opacity-60 disabled:cursor-not-allowed"
                      />
                    </div>
                  </div>
                </div>

                {/* TO DO LIST SECTION */}
                <div className="p-3.5 bg-amber-50/60 border border-amber-200 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="block text-amber-950 font-black text-xs uppercase tracking-wider flex items-center space-x-1.5">
                      <ListTodo className="w-4 h-4 text-amber-600" />
                      <span>EVENT TO DO LIST ({editingTaskSubtasks.filter((st) => st.completed).length} / {editingTaskSubtasks.length} COMPLETED)</span>
                    </label>
                    <span className="text-[10px] font-extrabold text-amber-800 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-full">
                      {editingTaskSubtasks.length > 0
                        ? `${Math.round((editingTaskSubtasks.filter((st) => st.completed).length / editingTaskSubtasks.length) * 100)}%`
                        : '0%'}
                    </span>
                  </div>

                  {!canEditTask && (
                    <div className="p-2.5 bg-amber-100/90 text-amber-950 border border-amber-300 rounded-xl text-xs font-bold flex items-center space-x-2">
                      <Lock className="w-4 h-4 text-amber-700 shrink-0" />
                      <span>Read-Only: Only assigned personnel ({viewingTask.assigneeName}) can update this to-do list.</span>
                    </div>
                  )}

                  {/* Add New To Do Item */}
                  {canEditTask && (
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        placeholder="Add a new to-do checklist item..."
                        value={taskNewSubtaskInput}
                        onChange={(e) => setTaskNewSubtaskInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddTaskSubtask();
                          }
                        }}
                        className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-2xs"
                      />
                      <button
                        type="button"
                        onClick={handleAddTaskSubtask}
                        className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg text-xs font-black transition-all shadow-2xs flex items-center space-x-1 shrink-0"
                      >
                        <Plus className="w-3.5 h-3.5 stroke-[3]" />
                        <span>Add Item</span>
                      </button>
                    </div>
                  )}

                  {/* List of To-Do Items */}
                  <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
                    {editingTaskSubtasks.length === 0 ? (
                      <p className="text-slate-400 text-[11px] italic text-center py-3 bg-white/70 rounded-lg border border-slate-100">
                        No items in this event's To-Do List yet.{canEditTask ? ' Type an item above and click "Add Item"!' : ''}
                      </p>
                    ) : (
                      editingTaskSubtasks.map((st) => (
                        <div
                          key={st.id}
                          className={`flex items-center space-x-2 p-2 rounded-lg border transition-all ${
                            st.completed ? 'bg-slate-100/80 border-slate-200' : 'bg-white border-slate-200 shadow-2xs'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={st.completed}
                            disabled={!canEditTask}
                            onChange={() => handleToggleTaskSubtask(st.id)}
                            className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 cursor-pointer shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                          />
                          <input
                            type="text"
                            value={st.title}
                            readOnly={!canEditTask}
                            onChange={(e) => handleUpdateTaskSubtaskTitle(st.id, e.target.value)}
                            className={`flex-1 bg-transparent text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-amber-400 rounded px-1.5 py-0.5 ${
                              st.completed ? 'line-through text-slate-400 font-normal' : 'font-semibold text-slate-800'
                            } ${!canEditTask ? 'cursor-default' : ''}`}
                          />
                          {canEditTask && (
                            <button
                              type="button"
                              onClick={() => handleDeleteTaskSubtask(st.id)}
                              className="text-slate-400 hover:text-rose-600 p-1 transition-colors shrink-0"
                              title="Remove to-do item"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Task Notes / Description */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Additional Notes & Description
                  </label>
                  <textarea
                    rows={2}
                    value={editingTaskDesc}
                    readOnly={!canEditTask}
                    onChange={(e) => setEditingTaskDesc(e.target.value)}
                    className={`w-full border rounded-lg p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                      !canEditTask ? 'bg-slate-100/80 border-slate-200 cursor-not-allowed' : 'bg-slate-50 border-slate-200'
                    }`}
                    placeholder="Notes or scope..."
                  />
                </div>
              </div>

              {/* Modal Actions */}
              <div className="pt-3 flex items-center justify-between border-t border-slate-100">
                {!canEditTask ? (
                  <div className="flex items-center space-x-1.5 text-xs text-amber-900 font-bold">
                    <Lock className="w-3.5 h-3.5 text-amber-700" />
                    <span>Assigned to {viewingTask.assigneeName}</span>
                  </div>
                ) : showDeleteTaskConfirm ? (
                  <div className="flex items-center space-x-2 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-xl animate-in fade-in">
                    <span className="text-[11px] font-bold text-rose-700">Confirm delete event?</span>
                    <button
                      type="button"
                      onClick={async () => {
                        await deleteTask(viewingTask.id);
                        setViewingTask(null);
                        setShowDeleteTaskConfirm(false);
                      }}
                      className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-black shadow-xs"
                    >
                      Yes, Delete
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowDeleteTaskConfirm(false)}
                      className="px-2 py-1 text-slate-600 hover:text-slate-900 text-xs font-semibold"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowDeleteTaskConfirm(true)}
                    className="px-3 py-1.5 text-rose-600 hover:bg-rose-50 rounded-lg text-xs font-bold flex items-center space-x-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Event</span>
                  </button>
                )}

                <div className="flex items-center space-x-2">
                  {canEditTask && (
                    <>
                      {viewingTask.status !== 'completed' ? (
                        <button
                          type="button"
                          onClick={async () => {
                            await updateTaskStatus(viewingTask.id, 'completed');
                            setViewingTask(null);
                          }}
                          className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-2xs"
                        >
                          Mark Complete
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={async () => {
                            await updateTaskStatus(viewingTask.id, 'in_progress');
                            setViewingTask(null);
                          }}
                          className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-2xs"
                        >
                          Reopen
                        </button>
                      )}
                    </>
                  )}
                  <button
                    type="button"
                    onClick={() => setViewingTask(null)}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
                  >
                    {canEditTask ? 'Cancel' : 'Close'}
                  </button>
                  {canEditTask && (
                    <button
                      type="button"
                      onClick={handleSaveTaskChanges}
                      disabled={isSavingTask}
                      className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-black shadow-2xs transition-all"
                    >
                      {isSavingTask ? 'Saving...' : 'Save To-Do List & Updates'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};
