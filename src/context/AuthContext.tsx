import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  collection,
  onSnapshot,
  doc,
  getDoc,
  getDocFromServer,
  setDoc,
  updateDoc,
  deleteDoc,
  addDoc,
  query,
  orderBy,
  getDocs,
  arrayUnion
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import {
  UserProfile,
  Project,
  Task,
  SubTask,
  Milestone,
  ActivityLog,
  NotificationItem,
  UserRole,
  TaskStatus,
  TaskPriority,
  AppBackgroundConfig,
  ProjectNote,
  ChatMessage,
  ChatMessageReaction
} from '../types';
import {
  INITIAL_USERS,
  INITIAL_PROJECTS,
  INITIAL_TASKS,
  INITIAL_MILESTONES,
  INITIAL_ACTIVITY_LOGS,
  INITIAL_NOTIFICATIONS,
  INITIAL_PROJECT_NOTES,
  INITIAL_CHAT_MESSAGES
} from '../seedData';

const DEFAULT_BACKGROUND: AppBackgroundConfig = {
  imageUrl: '',
  mode: 'expand',
  opacity: 1,
  presetId: 'none'
};

interface AuthContextType {
  currentUser: UserProfile;
  userRole: UserRole;
  users: UserProfile[];
  projects: Project[];
  tasks: Task[];
  milestones: Milestone[];
  activityLogs: ActivityLog[];
  notifications: NotificationItem[];
  projectNotes: ProjectNote[];
  chatMessages: ChatMessage[];
  loading: boolean;
  isAuthenticated: boolean;
  isQuotaExceeded: boolean;
  appBackground: AppBackgroundConfig;
  updateAppBackground: (config: AppBackgroundConfig) => Promise<void>;
  securityLogoUrl: string;
  updateSecurityLogoUrl: (url: string) => Promise<void>;
  login: (userIdOrEmail: string, pinCode?: string) => { success: boolean; message?: string };
  logout: () => void;
  switchUser: (userId: string) => void;
  toggleRole: () => void;
  
  // Messaging Actions
  sendChatMessage: (msgData: Omit<ChatMessage, 'id' | 'timestamp' | 'senderId' | 'senderName' | 'senderPhoto'>) => Promise<void>;
  addMessageReaction: (messageId: string, emoji: string) => Promise<void>;
  deleteChatMessage: (messageId: string) => Promise<void>;
  markMessagesAsRead: (recipientId: string) => Promise<void>;
  markAllMessagesAsRead: () => Promise<void>;
  
  // Database Actions
  addMember: (memberData: Omit<UserProfile, 'uid' | 'joinedAt'>) => Promise<void>;
  deleteMember: (userId: string) => Promise<void>;
  createTask: (taskData: Omit<Task, 'id' | 'createdAt' | 'loggedHours'>) => Promise<void>;
  updateTaskStatus: (taskId: string, status: TaskStatus) => Promise<void>;
  updateTaskDetails: (taskId: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  
  createProject: (projectData: Omit<Project, 'id' | 'completionPercentage'>) => Promise<void>;
  updateProjectDetails: (projectId: string, updates: Partial<Project>) => Promise<void>;
  deleteProject: (projectId: string) => Promise<void>;
  
  createMilestone: (milestoneData: Omit<Milestone, 'id' | 'completed'>) => Promise<void>;
  toggleMilestone: (milestoneId: string, completed: boolean) => Promise<void>;
  
  updateUserProfile: (userId: string, updates: Partial<UserProfile>) => Promise<void>;
  
  markNotificationRead: (notificationId: string) => Promise<void>;
  clearNotifications: () => Promise<void>;
  
  logUserActivity: (action: string, targetType: ActivityLog['targetType'], targetName: string, details?: string) => Promise<void>;
  createProjectNote: (noteData: Omit<ProjectNote, 'id' | 'createdAt'>) => Promise<void>;
  updateProjectNote: (noteId: string, updates: Partial<ProjectNote>) => Promise<void>;
  deleteProjectNote: (noteId: string) => Promise<void>;
  seedData: () => Promise<void>;
  wipeNonAdminData: () => Promise<void>;
}

// Helper function to deduplicate arrays by key property
function dedupeArray<T>(items: T[], keyProp: keyof T): T[] {
  const seen = new Set<any>();
  return items.filter((item) => {
    const val = item[keyProp];
    if (!val) return true;
    if (seen.has(val)) return false;
    seen.add(val);
    return true;
  });
}

function loadLocalBackup<T>(key: string, fallback: T[]): T[] {
  try {
    const saved = localStorage.getItem(key);
    if (saved !== null) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn(`Error loading backup for ${key}:`, e);
  }
  return fallback;
}

function saveLocalBackup<T>(key: string, items: T[]) {
  try {
    localStorage.setItem(key, JSON.stringify(items));
  } catch (e) {
    console.warn(`Error saving backup for ${key}:`, e);
  }
}

function getLocalDeletedUserIds(): string[] {
  try {
    const saved = localStorage.getItem('sunhill_deleted_user_ids');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {}
  return [];
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isQuotaExceeded, setIsQuotaExceeded] = useState<boolean>(false);
  const [deletedUserIds, setDeletedUserIds] = useState<string[]>(getLocalDeletedUserIds);

  // Initialize state directly from Local Storage Backup if present, filtering deleted users
  const [usersState, setUsersState] = useState<UserProfile[]>(() => {
    const deleted = getLocalDeletedUserIds();
    const loaded = loadLocalBackup('sunhill_backup_users', INITIAL_USERS);
    return loaded.filter(u => !deleted.includes(u.uid));
  });
  const [projectsState, setProjectsState] = useState<Project[]>(() =>
    loadLocalBackup('sunhill_backup_projects', INITIAL_PROJECTS)
  );
  const [tasksState, setTasksState] = useState<Task[]>(() =>
    loadLocalBackup('sunhill_backup_tasks', INITIAL_TASKS)
  );
  const [milestonesState, setMilestonesState] = useState<Milestone[]>(() =>
    loadLocalBackup('sunhill_backup_milestones', INITIAL_MILESTONES)
  );
  const [activityLogsState, setActivityLogsState] = useState<ActivityLog[]>(() =>
    loadLocalBackup('sunhill_backup_activity', INITIAL_ACTIVITY_LOGS)
  );
  const [notificationsState, setNotificationsState] = useState<NotificationItem[]>(() =>
    loadLocalBackup('sunhill_backup_notifications', INITIAL_NOTIFICATIONS)
  );
  const [projectNotesState, setProjectNotesState] = useState<ProjectNote[]>(() =>
    loadLocalBackup('sunhill_backup_project_notes', INITIAL_PROJECT_NOTES)
  );
  const [chatMessagesState, setChatMessagesState] = useState<ChatMessage[]>(() =>
    loadLocalBackup('sunhill_backup_messages', INITIAL_CHAT_MESSAGES)
  );
  const [loading, setLoading] = useState<boolean>(true);

  // Synchronous State & Backup Persistent Wrappers
  const setChatMessages = (val: ChatMessage[] | ((prev: ChatMessage[]) => ChatMessage[])) => {
    setChatMessagesState(prev => {
      const next = typeof val === 'function' ? val(prev) : val;
      saveLocalBackup('sunhill_backup_messages', next);
      return next;
    });
  };

  const setUsers = (val: UserProfile[] | ((prev: UserProfile[]) => UserProfile[])) => {
    setUsersState(prev => {
      const next = typeof val === 'function' ? val(prev) : val;
      saveLocalBackup('sunhill_backup_users', next);
      return next;
    });
  };

  const setProjects = (val: Project[] | ((prev: Project[]) => Project[])) => {
    setProjectsState(prev => {
      const next = typeof val === 'function' ? val(prev) : val;
      saveLocalBackup('sunhill_backup_projects', next);
      return next;
    });
  };

  const setTasks = (val: Task[] | ((prev: Task[]) => Task[])) => {
    setTasksState(prev => {
      const next = typeof val === 'function' ? val(prev) : val;
      saveLocalBackup('sunhill_backup_tasks', next);
      return next;
    });
  };

  const setMilestones = (val: Milestone[] | ((prev: Milestone[]) => Milestone[])) => {
    setMilestonesState(prev => {
      const next = typeof val === 'function' ? val(prev) : val;
      saveLocalBackup('sunhill_backup_milestones', next);
      return next;
    });
  };

  const setActivityLogs = (val: ActivityLog[] | ((prev: ActivityLog[]) => ActivityLog[])) => {
    setActivityLogsState(prev => {
      const next = typeof val === 'function' ? val(prev) : val;
      saveLocalBackup('sunhill_backup_activity', next);
      return next;
    });
  };

  const setNotifications = (val: NotificationItem[] | ((prev: NotificationItem[]) => NotificationItem[])) => {
    setNotificationsState(prev => {
      const next = typeof val === 'function' ? val(prev) : val;
      saveLocalBackup('sunhill_backup_notifications', next);
      return next;
    });
  };

  const setProjectNotes = (val: ProjectNote[] | ((prev: ProjectNote[]) => ProjectNote[])) => {
    setProjectNotesState(prev => {
      const next = typeof val === 'function' ? val(prev) : val;
      saveLocalBackup('sunhill_backup_project_notes', next);
      return next;
    });
  };

  const users = usersState;
  const projects = projectsState;
  const tasks = tasksState;
  const milestones = milestonesState;
  const activityLogs = activityLogsState;
  const notifications = notificationsState;
  const projectNotes = projectNotesState;
  const chatMessages = chatMessagesState;

  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem('pulse_auth') === 'true';
  });
  const [currentUserId, setCurrentUserId] = useState<string>(() => {
    return sessionStorage.getItem('pulse_user_id') || 'user_alex_manager';
  });

  // Background State
  const [appBackground, setAppBackgroundState] = useState<AppBackgroundConfig>(() => {
    try {
      const saved = localStorage.getItem('sunhill_app_background');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') return parsed;
      }
    } catch (e) {
      // ignore
    }
    return DEFAULT_BACKGROUND;
  });

  // Security Portal Header Logo State
  const [securityLogoUrl, setSecurityLogoUrl] = useState<string>(() => {
    try {
      return localStorage.getItem('sunhill_security_logo') || '';
    } catch (e) {
      return '';
    }
  });

  // Real-time Firestore sync setup
  useEffect(() => {
    if (isQuotaExceeded) return;

    let unsubscribeUsers: () => void = () => {};
    let unsubscribeProjects: () => void = () => {};
    let unsubscribeTasks: () => void = () => {};
    let unsubscribeMilestones: () => void = () => {};
    let unsubscribeNotifs: () => void = () => {};
    let unsubscribeNotes: () => void = () => {};
    let unsubscribeMessages: () => void = () => {};
    let unsubscribeBg: () => void = () => {};
    let unsubscribeLogo: () => void = () => {};
    let unsubscribeDeleted: () => void = () => {};

    const initFirebaseListeners = async () => {
      try {
        // Deleted users setting listener
        const deletedDocRef = doc(db, 'settings', 'deleted_users');
        unsubscribeDeleted = onSnapshot(deletedDocRef, (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.data();
            if (data && Array.isArray(data.uids)) {
              setDeletedUserIds(prev => {
                const merged = Array.from(new Set([...prev, ...data.uids]));
                try {
                  localStorage.setItem('sunhill_deleted_user_ids', JSON.stringify(merged));
                } catch (e) {}
                return merged;
              });
            }
          }
        });

        // App background config listener
        const bgDocRef = doc(db, 'settings', 'background');
        unsubscribeBg = onSnapshot(
          bgDocRef,
          (snapshot) => {
            if (snapshot.exists()) {
              const data = snapshot.data() as AppBackgroundConfig;
              if (data && data.mode) {
                setAppBackgroundState(data);
                try {
                  localStorage.setItem('sunhill_app_background', JSON.stringify(data));
                } catch (e) {}
              }
            }
          },
          (err) => {
            handleFirestoreError(err, OperationType.GET, 'settings/background');
            setIsQuotaExceeded(true);
          }
        );

        // Security Portal Logo listener
        const logoDocRef = doc(db, 'settings', 'security_logo');
        unsubscribeLogo = onSnapshot(
          logoDocRef,
          (snapshot) => {
            if (snapshot.exists()) {
              const data = snapshot.data();
              if (data && typeof data.url === 'string') {
                setSecurityLogoUrl(data.url);
                try {
                  localStorage.setItem('sunhill_security_logo', data.url);
                } catch (e) {}
              }
            }
          },
          (err) => {
            handleFirestoreError(err, OperationType.GET, 'settings/security_logo');
            setIsQuotaExceeded(true);
          }
        );

        // Users collection
        const usersCol = collection(db, 'users');
        unsubscribeUsers = onSnapshot(
          usersCol,
          (snapshot) => {
            const currentDeleted = getLocalDeletedUserIds();
            if (!snapshot.empty) {
              const userList: UserProfile[] = [];
              snapshot.forEach((d) => {
                if (!currentDeleted.includes(d.id)) {
                  userList.push({ ...d.data(), uid: d.id } as UserProfile);
                }
              });
              setUsers(dedupeArray(userList, 'uid'));
            } else {
              setUsers(INITIAL_USERS.filter(u => !currentDeleted.includes(u.uid)));
            }
          },
          (err) => {
            handleFirestoreError(err, OperationType.GET, 'users');
            setIsQuotaExceeded(true);
          }
        );

        // Projects collection
        const projectsCol = collection(db, 'projects');
        unsubscribeProjects = onSnapshot(
          projectsCol,
          (snapshot) => {
            if (!snapshot.empty) {
              const projectList: Project[] = [];
              snapshot.forEach((d) => projectList.push({ ...d.data(), id: d.id } as Project));
              setProjects(dedupeArray(projectList, 'id'));
            } else {
              setProjects([]);
            }
          },
          (err) => {
            handleFirestoreError(err, OperationType.GET, 'projects');
            setIsQuotaExceeded(true);
          }
        );

        // Tasks collection
        const tasksCol = collection(db, 'tasks');
        unsubscribeTasks = onSnapshot(
          tasksCol,
          (snapshot) => {
            if (!snapshot.empty) {
              const taskList: Task[] = [];
              snapshot.forEach((d) => taskList.push({ ...d.data(), id: d.id } as Task));
              setTasks(dedupeArray(taskList, 'id'));
            } else {
              setTasks([]);
            }
          },
          (err) => {
            handleFirestoreError(err, OperationType.GET, 'tasks');
            setIsQuotaExceeded(true);
          }
        );

        // Milestones collection
        const milestonesCol = collection(db, 'milestones');
        unsubscribeMilestones = onSnapshot(
          milestonesCol,
          (snapshot) => {
            if (!snapshot.empty) {
              const msList: Milestone[] = [];
              snapshot.forEach((d) => msList.push({ ...d.data(), id: d.id } as Milestone));
              setMilestones(dedupeArray(msList, 'id'));
            } else {
              setMilestones([]);
            }
          },
          (err) => {
            handleFirestoreError(err, OperationType.GET, 'milestones');
            setIsQuotaExceeded(true);
          }
        );

        // Activity Logs (single getDocs fetch on mount to reduce quota usage)
        try {
          const activityCol = collection(db, 'activity_logs');
          const activitySnap = await getDocs(activityCol);
          if (!activitySnap.empty) {
            const logList: ActivityLog[] = [];
            activitySnap.forEach((d) => logList.push({ ...d.data(), id: d.id } as ActivityLog));
            logList.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
            setActivityLogs(dedupeArray(logList, 'id'));
          } else {
            setActivityLogs([]);
          }
        } catch (err) {
          handleFirestoreError(err, OperationType.GET, 'activity_logs');
          setIsQuotaExceeded(true);
        }

        // Notifications
        const notifCol = collection(db, 'notifications');
        unsubscribeNotifs = onSnapshot(
          notifCol,
          (snapshot) => {
            if (!snapshot.empty) {
              const nList: NotificationItem[] = [];
              snapshot.forEach((d) => nList.push({ ...d.data(), id: d.id } as NotificationItem));
              nList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
              setNotifications(dedupeArray(nList, 'id'));
            } else {
              setNotifications([]);
            }
          },
          (err) => {
            handleFirestoreError(err, OperationType.GET, 'notifications');
            setIsQuotaExceeded(true);
          }
        );

        // Project Notes
        const notesCol = collection(db, 'project_notes');
        unsubscribeNotes = onSnapshot(
          notesCol,
          (snapshot) => {
            if (!snapshot.empty) {
              const noteList: ProjectNote[] = [];
              snapshot.forEach((d) => noteList.push({ ...d.data(), id: d.id } as ProjectNote));
              noteList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
              setProjectNotes(dedupeArray(noteList, 'id'));
            } else {
              setProjectNotes([]);
            }
          },
          (err) => {
            handleFirestoreError(err, OperationType.GET, 'project_notes');
            setIsQuotaExceeded(true);
          }
        );

        // Chat Messages collection
        const messagesCol = collection(db, 'messages');
        unsubscribeMessages = onSnapshot(
          messagesCol,
          (snapshot) => {
            const localMsgs = loadLocalBackup('sunhill_backup_messages', INITIAL_CHAT_MESSAGES);
            if (!snapshot.empty) {
              const remoteMsgs: ChatMessage[] = [];
              snapshot.forEach((d) => remoteMsgs.push({ ...d.data(), id: d.id } as ChatMessage));
              const combined = dedupeArray([...remoteMsgs, ...localMsgs], 'id');
              combined.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
              setChatMessages(combined);

              // Backfill any local messages to Firestore if missing from remote
              const remoteIds = new Set(remoteMsgs.map((m) => m.id));
              localMsgs.forEach((m) => {
                if (!remoteIds.has(m.id)) {
                  setDoc(doc(db, 'messages', m.id), m).catch(() => {});
                }
              });
            } else {
              // Preserve existing messages from local backup or default seed instead of wiping out
              const fallback = localMsgs.length > 0 ? localMsgs : INITIAL_CHAT_MESSAGES;
              fallback.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
              setChatMessages(fallback);
              // Seed initial messages to Firestore if empty
              fallback.forEach((m) => {
                setDoc(doc(db, 'messages', m.id), m).catch(() => {});
              });
            }
          },
          (err) => {
            handleFirestoreError(err, OperationType.GET, 'messages');
            setIsQuotaExceeded(true);
          }
        );

      } catch (e) {
        console.error('Error initializing FirebaseListeners:', e);
      } finally {
        setLoading(false);
      }
    };

    initFirebaseListeners();

    return () => {
      unsubscribeUsers();
      unsubscribeProjects();
      unsubscribeTasks();
      unsubscribeMilestones();
      unsubscribeNotifs();
      unsubscribeNotes();
      unsubscribeMessages();
      unsubscribeBg();
      unsubscribeLogo();
      unsubscribeDeleted();
    };
  }, [isQuotaExceeded]);

  // Tab Visibility & Reconnection Handler: Reconnects & refetches real-time messages when tab becomes visible or focused
  useEffect(() => {
    if (isQuotaExceeded) return;

    const handleVisibilityOrFocus = async () => {
      if (document.visibilityState === 'visible') {
        try {
          const messagesCol = collection(db, 'messages');
          const snapshot = await getDocs(messagesCol);
          const localMsgs = loadLocalBackup('sunhill_backup_messages', INITIAL_CHAT_MESSAGES);
          if (!snapshot.empty) {
            const remoteMsgs: ChatMessage[] = [];
            snapshot.forEach((d) => remoteMsgs.push({ ...d.data(), id: d.id } as ChatMessage));
            setChatMessages((prev) => {
              const combined = dedupeArray([...remoteMsgs, ...prev, ...localMsgs], 'id');
              combined.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
              return combined;
            });
          }
        } catch (err) {
          console.warn('Visibility change message refresh error:', err);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityOrFocus);
    window.addEventListener('focus', handleVisibilityOrFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
      window.removeEventListener('focus', handleVisibilityOrFocus);
    };
  }, [isQuotaExceeded]);


  const updateAppBackground = async (config: AppBackgroundConfig) => {
    setAppBackgroundState(config);
    try {
      localStorage.setItem('sunhill_app_background', JSON.stringify(config));
    } catch (e) {
      console.warn('LocalStorage error:', e);
    }

    try {
      await setDoc(doc(db, 'settings', 'background'), config);
      await logUserActivity(
        'updated interface background',
        'system',
        'App Interface',
        `Mode: ${config.mode.toUpperCase()}`
      );
    } catch (err) {
      console.error('Error persisting background setting to Firestore:', err);
    }
  };

  const updateSecurityLogoUrl = async (url: string) => {
    setSecurityLogoUrl(url);
    try {
      localStorage.setItem('sunhill_security_logo', url);
    } catch (e) {
      console.warn('LocalStorage error:', e);
    }

    try {
      await setDoc(doc(db, 'settings', 'security_logo'), { url });
      await logUserActivity(
        'updated security portal header logo',
        'system',
        'Security Portal',
        url ? 'Custom image uploaded' : 'Reset to default logo'
      );
    } catch (err) {
      console.error('Error persisting security logo to Firestore:', err);
    }
  };

  const seedInitialData = async () => {
    try {
      for (const u of INITIAL_USERS) {
        if (!deletedUserIds.includes(u.uid)) {
          await setDoc(doc(db, 'users', u.uid), u);
        }
      }
      for (const p of INITIAL_PROJECTS) {
        await setDoc(doc(db, 'projects', p.id), p);
      }
      for (const t of INITIAL_TASKS) {
        await setDoc(doc(db, 'tasks', t.id), t);
      }
      for (const m of INITIAL_MILESTONES) {
        await setDoc(doc(db, 'milestones', m.id), m);
      }
      for (const a of INITIAL_ACTIVITY_LOGS) {
        await setDoc(doc(db, 'activity_logs', a.id), a);
      }
      for (const n of INITIAL_NOTIFICATIONS) {
        await setDoc(doc(db, 'notifications', n.id), n);
      }
      for (const msg of INITIAL_CHAT_MESSAGES) {
        await setDoc(doc(db, 'messages', msg.id), msg);
      }
      await setDoc(doc(db, 'settings', 'system'), { seeded: true, seededAt: new Date().toISOString() });
      console.log('Firebase collections successfully seeded!');
    } catch (err) {
      console.error('Error seeding Firebase collections:', err);
    }
  };

  // Find active current user or fallback
  const currentUser = users.find((u) => u.uid === currentUserId) || users[0] || INITIAL_USERS.find(u => !deletedUserIds.includes(u.uid)) || INITIAL_USERS[0];
  const userRole = currentUser.role;

  const login = (userIdOrEmail: string, enteredPin?: string): { success: boolean; message?: string } => {
    const searchStr = userIdOrEmail.trim().toLowerCase();
    const targetUser = users.find(
      (u) => u.uid === userIdOrEmail || u.email.toLowerCase() === searchStr
    );
    if (!targetUser) {
      return { success: false, message: 'Personnel account not found in system directory.' };
    }

    const expectedPin = targetUser.pinCode || '1234';
    if (enteredPin && enteredPin !== expectedPin) {
      return { success: false, message: 'Invalid security PIN code for this account.' };
    }

    setCurrentUserId(targetUser.uid);
    setIsAuthenticated(true);
    sessionStorage.setItem('pulse_auth', 'true');
    sessionStorage.setItem('pulse_user_id', targetUser.uid);
    return { success: true };
  };

  const logout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('pulse_auth');
    sessionStorage.removeItem('pulse_user_id');
  };

  const switchUser = (userId: string) => {
    setCurrentUserId(userId);
    sessionStorage.setItem('pulse_user_id', userId);
  };

  const toggleRole = async () => {
    const nextRole: UserRole = userRole === 'admin' ? 'manager' : userRole === 'manager' ? 'member' : 'admin';
    await updateUserProfile(currentUser.uid, { role: nextRole });
  };

  const addMember = async (memberData: Omit<UserProfile, 'uid' | 'joinedAt'>) => {
    const uid = 'user_' + Date.now();
    const newMember: UserProfile = {
      ...memberData,
      uid,
      joinedAt: new Date().toISOString().split('T')[0],
      activeProjectIds: memberData.activeProjectIds || [],
      pinCode: memberData.pinCode || '1234',
      generalResponsibilities: memberData.generalResponsibilities || [],
      specificResponsibilities: memberData.specificResponsibilities || []
    };

    if (deletedUserIds.includes(uid)) {
      const filtered = deletedUserIds.filter(id => id !== uid);
      setDeletedUserIds(filtered);
      try {
        localStorage.setItem('sunhill_deleted_user_ids', JSON.stringify(filtered));
      } catch (e) {}
    }

    try {
      await setDoc(doc(db, 'users', uid), newMember);
      setUsers(prev => dedupeArray([...prev, newMember], 'uid'));
      await logUserActivity('added new team member', 'profile', newMember.displayName, `Role: ${newMember.role.toUpperCase()}`);
    } catch (err) {
      console.error('Error adding member to Firestore:', err);
      setUsers(prev => dedupeArray([...prev, newMember], 'uid'));
    }
  };

  const deleteMember = async (userId: string) => {
    const targetUser = users.find(u => u.uid === userId);

    const updatedDeletedIds = Array.from(new Set([...deletedUserIds, userId]));
    setDeletedUserIds(updatedDeletedIds);
    try {
      localStorage.setItem('sunhill_deleted_user_ids', JSON.stringify(updatedDeletedIds));
    } catch (e) {}

    try {
      await setDoc(doc(db, 'settings', 'deleted_users'), { uids: arrayUnion(userId) }, { merge: true });
    } catch (e) {
      // silent fallback
    }

    try {
      await deleteDoc(doc(db, 'users', userId));
      setUsers(prev => prev.filter(u => u.uid !== userId));
      if (targetUser) {
        await logUserActivity('removed team member', 'profile', targetUser.displayName);
      }
    } catch (err) {
      console.error('Error deleting member from Firestore:', err);
      setUsers(prev => prev.filter(u => u.uid !== userId));
    }
  };

  // Action methods
  const createTask = async (taskData: Omit<Task, 'id' | 'createdAt' | 'loggedHours'>) => {
    const newTask: Omit<Task, 'id'> = {
      ...taskData,
      loggedHours: 0,
      createdAt: new Date().toISOString()
    };
    try {
      const docRef = await addDoc(collection(db, 'tasks'), newTask);
      // Local state update fallback
      setTasks(prev => dedupeArray([{ id: docRef.id, ...newTask }, ...prev], 'id'));
      
      // Notify assigned user
      await addDoc(collection(db, 'notifications'), {
        userId: taskData.assigneeId,
        title: '📌 New Task Assigned',
        message: `${currentUser.displayName} assigned "${taskData.title}" to you (${taskData.priority.toUpperCase()} priority).`,
        type: 'assignment',
        read: false,
        createdAt: new Date().toISOString(),
        priority: taskData.priority === 'urgent' ? 'high' : 'normal'
      });

      await logUserActivity('created task', 'task', taskData.title, `Assigned to ${taskData.assigneeName}`);
      recalculateProjectProgress(taskData.projectId);
    } catch (err) {
      console.error('Error creating task:', err);
      // fallback local
      const fallbackId = 'task_' + Date.now();
      setTasks(prev => dedupeArray([{ id: fallbackId, ...newTask }, ...prev], 'id'));
    }
  };

  const updateTaskStatus = async (taskId: string, status: TaskStatus) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    const completedAt = status === 'completed' ? new Date().toISOString() : null;
    const updates = { status, completedAt };

    try {
      await setDoc(doc(db, 'tasks', taskId), updates, { merge: true });
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, ...updates } : t));

      await logUserActivity(
        `updated task status to ${status.replace('_', ' ')}`,
        'task',
        task.title,
        `Task in project ${task.projectName}`
      );

      recalculateProjectProgress(task.projectId);
    } catch (err) {
      console.error('Error updating task status:', err);
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, ...updates } : t));
    }
  };

  const updateTaskDetails = async (taskId: string, updates: Partial<Task>) => {
    const currentTask = tasks.find(t => t.id === taskId);
    const subtasks = updates.subtasks ?? currentTask?.subtasks;

    if (subtasks && subtasks.length > 0) {
      const allDone = subtasks.every(st => st.completed);
      if (allDone) {
        updates.status = 'completed';
        updates.completedAt = new Date().toISOString();
      } else if (currentTask?.status === 'completed') {
        updates.status = 'in_progress';
        updates.completedAt = null;
      }
    }

    try {
      await setDoc(doc(db, 'tasks', taskId), updates, { merge: true });
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, ...updates } : t));
      const targetProjId = updates.projectId || currentTask?.projectId;
      if (targetProjId) {
        recalculateProjectProgress(targetProjId, updates.subtasks ? { taskId, subtasks: updates.subtasks } : undefined);
      }
    } catch (err) {
      console.error('Error updating task:', err);
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, ...updates } : t));
    }
  };

  const deleteTask = async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    try {
      await deleteDoc(doc(db, 'tasks', taskId));
      setTasks(prev => prev.filter(t => t.id !== taskId));
      if (task) {
        await logUserActivity('deleted task', 'task', task.title);
        recalculateProjectProgress(task.projectId);
      }
    } catch (err) {
      console.error('Error deleting task:', err);
      setTasks(prev => prev.filter(t => t.id !== taskId));
    }
  };

  const createProject = async (projectData: Omit<Project, 'id' | 'completionPercentage'>) => {
    const newProject: Omit<Project, 'id'> = {
      ...projectData,
      completionPercentage: 0
    };
    try {
      const docRef = await addDoc(collection(db, 'projects'), newProject);
      setProjects(prev => dedupeArray([{ id: docRef.id, ...newProject }, ...prev], 'id'));
      await logUserActivity('created project', 'project', projectData.name);
    } catch (err) {
      console.error('Error creating project:', err);
      const fallbackId = 'proj_' + Date.now();
      setProjects(prev => dedupeArray([{ id: fallbackId, ...newProject }, ...prev], 'id'));
    }
  };

  const updateProjectDetails = async (projectId: string, updates: Partial<Project>) => {
    try {
      await setDoc(doc(db, 'projects', projectId), updates, { merge: true });
      setProjects(prev => prev.map(p => p.id === projectId ? { ...p, ...updates } : p));
    } catch (err) {
      console.error('Error updating project:', err);
      setProjects(prev => prev.map(p => p.id === projectId ? { ...p, ...updates } : p));
    }
  };

  const deleteProject = async (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    try {
      await deleteDoc(doc(db, 'projects', projectId));
      setProjects(prev => prev.filter(p => p.id !== projectId));

      // Clean up linked tasks
      const relatedTasks = tasks.filter(t => t.projectId === projectId);
      for (const t of relatedTasks) {
        deleteDoc(doc(db, 'tasks', t.id)).catch(() => {});
      }
      setTasks(prev => prev.filter(t => t.projectId !== projectId));

      // Clean up linked milestones
      const relatedMilestones = milestones.filter(m => m.projectId === projectId);
      for (const m of relatedMilestones) {
        deleteDoc(doc(db, 'milestones', m.id)).catch(() => {});
      }
      setMilestones(prev => prev.filter(m => m.projectId !== projectId));

      if (project) {
        await logUserActivity('deleted project', 'project', project.name);
      }
    } catch (err) {
      console.error('Error deleting project:', err);
      setProjects(prev => prev.filter(p => p.id !== projectId));
      setTasks(prev => prev.filter(t => t.projectId !== projectId));
      setMilestones(prev => prev.filter(m => m.projectId !== projectId));
    }
  };

  const createMilestone = async (milestoneData: Omit<Milestone, 'id' | 'completed'>) => {
    const newMs = {
      ...milestoneData,
      completed: false
    };
    try {
      const docRef = await addDoc(collection(db, 'milestones'), newMs);
      setMilestones(prev => dedupeArray([{ id: docRef.id, ...newMs }, ...prev], 'id'));
      await logUserActivity('added project milestone', 'milestone', milestoneData.title);
    } catch (err) {
      console.error('Error creating milestone:', err);
      setMilestones(prev => dedupeArray([{ id: 'ms_' + Date.now(), ...newMs }, ...prev], 'id'));
    }
  };

  const toggleMilestone = async (milestoneId: string, completed: boolean) => {
    const ms = milestones.find(m => m.id === milestoneId);
    if (!ms) return;
    const updates = {
      completed,
      completedBy: completed ? currentUser.uid : null,
      completedByName: completed ? currentUser.displayName : null,
      completedAt: completed ? new Date().toISOString() : null
    };

    try {
      await setDoc(doc(db, 'milestones', milestoneId), updates, { merge: true });
      setMilestones(prev => prev.map(m => m.id === milestoneId ? { ...m, ...updates } : m));
      await logUserActivity(
        completed ? 'completed milestone' : 'reopened milestone',
        'milestone',
        ms.title,
        `Project: ${ms.projectName}`
      );
    } catch (err) {
      console.error('Error toggling milestone:', err);
      setMilestones(prev => prev.map(m => m.id === milestoneId ? { ...m, ...updates } : m));
    }
  };

  const updateUserProfile = async (userId: string, updates: Partial<UserProfile>) => {
    try {
      await setDoc(doc(db, 'users', userId), updates, { merge: true });
      setUsers(prev => prev.map(u => u.uid === userId ? { ...u, ...updates } : u));
      await logUserActivity('updated profile details', 'profile', currentUser.displayName);
    } catch (err) {
      console.error('Error updating user profile:', err);
      setUsers(prev => prev.map(u => u.uid === userId ? { ...u, ...updates } : u));
    }
  };

  const markNotificationRead = async (notificationId: string) => {
    try {
      await setDoc(doc(db, 'notifications', notificationId), { read: true }, { merge: true });
      setNotifications(prev => prev.map(n => n.id === notificationId ? { ...n, read: true } : n));
    } catch (err) {
      setNotifications(prev => prev.map(n => n.id === notificationId ? { ...n, read: true } : n));
    }
  };

  const clearNotifications = async () => {
    try {
      notifications.forEach(async (n) => {
        await setDoc(doc(db, 'notifications', n.id), { read: true }, { merge: true });
      });
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (err) {
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    }
  };

  const logUserActivity = async (
    action: string,
    targetType: ActivityLog['targetType'],
    targetName: string,
    details?: string
  ) => {
    const newLog: Omit<ActivityLog, 'id'> = {
      userId: currentUser.uid,
      userName: currentUser.displayName,
      userPhoto: currentUser.photoURL,
      action,
      targetType,
      targetName,
      timestamp: new Date().toISOString(),
      details: details || ''
    };
    try {
      const docRef = await addDoc(collection(db, 'activity_logs'), newLog);
      setActivityLogs(prev => dedupeArray([{ id: docRef.id, ...newLog }, ...prev], 'id'));
    } catch (err) {
      setActivityLogs(prev => dedupeArray([{ id: 'act_' + Date.now(), ...newLog }, ...prev], 'id'));
    }
  };

  const sendChatMessage = async (msgData: Omit<ChatMessage, 'id' | 'timestamp' | 'senderId' | 'senderName' | 'senderPhoto'>) => {
    const newMsg: ChatMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      senderId: currentUser.uid,
      senderName: currentUser.displayName,
      senderPhoto: currentUser.photoURL,
      timestamp: new Date().toISOString(),
      readBy: [currentUser.uid],
      ...msgData
    };

    try {
      const docRef = doc(db, 'messages', newMsg.id);
      await setDoc(docRef, newMsg);
      setChatMessages(prev => [...prev, newMsg]);

      // Create notification item for recipient(s)
      const snippet = msgData.content
        ? (msgData.content.length > 45 ? msgData.content.substring(0, 45) + '...' : msgData.content)
        : (msgData.attachments && msgData.attachments.length > 0 ? `[Attachment: ${msgData.attachments[0].name}]` : 'sent a message');

      const notifId = 'notif_msg_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
      const targetUserId = msgData.recipientType === 'direct' ? msgData.recipientId : 'all';

      const newNotif: NotificationItem = {
        id: notifId,
        userId: targetUserId,
        title: msgData.recipientType === 'direct'
          ? `Message from ${currentUser.displayName}`
          : `#${msgData.recipientName || 'channel'} - ${currentUser.displayName}`,
        message: snippet,
        type: 'message',
        read: false,
        createdAt: new Date().toISOString(),
        linkId: newMsg.id,
        senderPhoto: currentUser.photoURL
      };

      try {
        await setDoc(doc(db, 'notifications', notifId), newNotif);
      } catch (e) {
        setNotifications(prev => [newNotif, ...prev]);
      }
    } catch (err) {
      console.warn('Error saving chat message to Firestore, using fallback:', err);
      setChatMessages(prev => [...prev, newMsg]);
    }
  };

  const addMessageReaction = async (messageId: string, emoji: string) => {
    const targetMsg = chatMessages.find(m => m.id === messageId);
    if (!targetMsg) return;

    const currentReactions = targetMsg.reactions || [];
    const existingReactionIndex = currentReactions.findIndex(r => r.emoji === emoji);

    let updatedReactions: ChatMessageReaction[] = [];
    let isAddingReaction = false;

    if (existingReactionIndex > -1) {
      const existing = currentReactions[existingReactionIndex];
      const userHasReacted = existing.userIds.includes(currentUser.uid);

      if (userHasReacted) {
        const updatedUserIds = existing.userIds.filter(id => id !== currentUser.uid);
        if (updatedUserIds.length > 0) {
          updatedReactions = currentReactions.map((r, i) => i === existingReactionIndex ? { ...r, userIds: updatedUserIds } : r);
        } else {
          updatedReactions = currentReactions.filter((_, i) => i !== existingReactionIndex);
        }
      } else {
        isAddingReaction = true;
        updatedReactions = currentReactions.map((r, i) => i === existingReactionIndex ? { ...r, userIds: [...r.userIds, currentUser.uid] } : r);
      }
    } else {
      isAddingReaction = true;
      updatedReactions = [...currentReactions, { emoji, userIds: [currentUser.uid] }];
    }

    try {
      const docRef = doc(db, 'messages', messageId);
      await setDoc(docRef, { reactions: updatedReactions }, { merge: true });
      setChatMessages(prev => prev.map(m => m.id === messageId ? { ...m, reactions: updatedReactions } : m));
    } catch (err) {
      setChatMessages(prev => prev.map(m => m.id === messageId ? { ...m, reactions: updatedReactions } : m));
    }

    // Send notification to message sender if reaction added by another member
    if (isAddingReaction && targetMsg.senderId && targetMsg.senderId !== currentUser.uid) {
      const snippet = targetMsg.content
        ? (targetMsg.content.length > 35 ? targetMsg.content.substring(0, 35) + '...' : targetMsg.content)
        : (targetMsg.attachments && targetMsg.attachments.length > 0 ? `[Attachment: ${targetMsg.attachments[0].name}]` : 'a message');

      const notifId = 'notif_react_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
      const newNotif: NotificationItem = {
        id: notifId,
        userId: targetMsg.senderId,
        title: `${emoji} New Reaction`,
        message: `${currentUser.displayName || 'A team member'} reacted ${emoji} to your message: "${snippet}"`,
        type: 'reaction',
        read: false,
        createdAt: new Date().toISOString(),
        linkId: messageId,
        priority: 'normal'
      };

      try {
        await addDoc(collection(db, 'notifications'), newNotif);
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, 'notifications');
      }

      setNotifications(prev => dedupeArray([newNotif, ...prev], 'id'));
    }
  };

  const deleteChatMessage = async (messageId: string) => {
    try {
      const docRef = doc(db, 'messages', messageId);
      await deleteDoc(docRef);
      setChatMessages(prev => prev.filter(m => m.id !== messageId));
    } catch (err) {
      setChatMessages(prev => prev.filter(m => m.id !== messageId));
    }
  };

  const markMessagesAsRead = async (recipientId: string) => {
    const unreadToMark = chatMessages.filter(m =>
      (m.recipientId === recipientId || m.senderId === recipientId) &&
      (!m.readBy || !m.readBy.includes(currentUser.uid))
    );

    if (unreadToMark.length === 0) return;

    const updatedMessages = chatMessages.map(m => {
      if ((m.recipientId === recipientId || m.senderId === recipientId) && (!m.readBy || !m.readBy.includes(currentUser.uid))) {
        return { ...m, readBy: [...(m.readBy || []), currentUser.uid] };
      }
      return m;
    });

    setChatMessages(updatedMessages);

    for (const m of unreadToMark) {
      try {
        const updatedReadBy = [...(m.readBy || []), currentUser.uid];
        await setDoc(doc(db, 'messages', m.id), { readBy: updatedReadBy }, { merge: true });
      } catch (e) {
        // silent fallback
      }
    }
  };

  const markAllMessagesAsRead = async () => {
    // 1. Mark all chat messages as read for currentUser
    const unreadMessages = chatMessages.filter(
      m => !m.readBy || !m.readBy.includes(currentUser.uid)
    );

    if (unreadMessages.length > 0) {
      const updatedMessages = chatMessages.map(m => {
        if (!m.readBy || !m.readBy.includes(currentUser.uid)) {
          return { ...m, readBy: [...(m.readBy || []), currentUser.uid] };
        }
        return m;
      });
      setChatMessages(updatedMessages);

      for (const m of unreadMessages) {
        try {
          const updatedReadBy = [...(m.readBy || []), currentUser.uid];
          await setDoc(doc(db, 'messages', m.id), { readBy: updatedReadBy }, { merge: true });
        } catch (e) {
          // silent fallback
        }
      }
    }

    // 2. Mark all message and reaction notifications as read
    const unreadMessageNotifs = notifications.filter(
      n => !n.read && (n.type === 'reaction' || n.type === 'message')
    );
    if (unreadMessageNotifs.length > 0) {
      setNotifications(prev =>
        prev.map(n =>
          (n.type === 'reaction' || n.type === 'message') ? { ...n, read: true } : n
        )
      );
      for (const n of unreadMessageNotifs) {
        try {
          await setDoc(doc(db, 'notifications', n.id), { read: true }, { merge: true });
        } catch (e) {
          // silent fallback
        }
      }
    }
  };

  const createProjectNote = async (noteData: Omit<ProjectNote, 'id' | 'createdAt'>) => {
    const newNote: Omit<ProjectNote, 'id'> = {
      ...noteData,
      createdAt: new Date().toISOString()
    };
    try {
      const docRef = await addDoc(collection(db, 'project_notes'), newNote);
      setProjectNotes(prev => dedupeArray([{ id: docRef.id, ...newNote }, ...prev], 'id'));
      await logUserActivity('created project note', 'project', noteData.projectName, noteData.title);
    } catch (err) {
      console.error('Error creating project note:', err);
      const fallbackId = 'note_' + Date.now();
      setProjectNotes(prev => dedupeArray([{ id: fallbackId, ...newNote }, ...prev], 'id'));
    }
  };

  const updateProjectNote = async (noteId: string, updates: Partial<ProjectNote>) => {
    const updated = { ...updates, updatedAt: new Date().toISOString() };
    try {
      await setDoc(doc(db, 'project_notes', noteId), updated, { merge: true });
      setProjectNotes(prev => prev.map(n => n.id === noteId ? { ...n, ...updated } : n));
    } catch (err) {
      console.error('Error updating project note:', err);
      setProjectNotes(prev => prev.map(n => n.id === noteId ? { ...n, ...updated } : n));
    }
  };

  const deleteProjectNote = async (noteId: string) => {
    const note = projectNotes.find(n => n.id === noteId);
    try {
      await deleteDoc(doc(db, 'project_notes', noteId));
      setProjectNotes(prev => prev.filter(n => n.id !== noteId));
      if (note) {
        await logUserActivity('deleted project note', 'project', note.projectName, note.title);
      }
    } catch (err) {
      console.error('Error deleting project note:', err);
      setProjectNotes(prev => prev.filter(n => n.id !== noteId));
    }
  };

  const recalculateProjectProgress = (
    projectId: string,
    updatedTaskSubtaskOverride?: { taskId: string; subtasks: SubTask[] }
  ) => {
    const projTasks = tasks.filter(t => t.projectId === projectId);
    if (projTasks.length === 0) return;

    let totalProgress = 0;
    projTasks.forEach(t => {
      const tSubtasks = updatedTaskSubtaskOverride?.taskId === t.id
        ? updatedTaskSubtaskOverride.subtasks
        : (t.subtasks || []);

      if (tSubtasks.length > 0) {
        const completedCount = tSubtasks.filter(st => st.completed).length;
        totalProgress += completedCount / tSubtasks.length;
      } else {
        totalProgress += (t.status === 'completed' ? 1 : 0);
      }
    });

    const percentage = Math.round((totalProgress / projTasks.length) * 100);
    updateProjectDetails(projectId, { completionPercentage: percentage });
  };

  const wipeNonAdminData = async () => {
    try {
      // 1. Fetch all projects and identify those under Active Projects and Finished Projects
      const projectsSnap = await getDocs(collection(db, 'projects'));
      const projectsToDeleteIds: string[] = [];

      for (const d of projectsSnap.docs) {
        const p = d.data() as Project;
        // In our system, active projects are incomplete or in-progress, while finished projects are 100% completed or marked completed
        const isCompleted = p.completionPercentage >= 100 || p.status === 'completed';
        const isActive = p.completionPercentage < 100 && p.status !== 'completed';
        if (isActive || isCompleted) {
          projectsToDeleteIds.push(d.id);
          await deleteDoc(doc(db, 'projects', d.id));
        }
      }

      // 2. Delete tasks linked to the deleted projects
      const tasksSnap = await getDocs(collection(db, 'tasks'));
      for (const d of tasksSnap.docs) {
        const t = d.data() as Task;
        if (projectsToDeleteIds.includes(t.projectId) || !t.projectId) {
          await deleteDoc(doc(db, 'tasks', d.id));
        }
      }

      // 3. Delete milestones linked to the deleted projects
      const milestonesSnap = await getDocs(collection(db, 'milestones'));
      for (const d of milestonesSnap.docs) {
        const m = d.data() as Milestone;
        if (projectsToDeleteIds.includes(m.projectId) || !m.projectId) {
          await deleteDoc(doc(db, 'milestones', d.id));
        }
      }

      // Update state without removing user accounts
      setProjects(prev => prev.filter(p => !projectsToDeleteIds.includes(p.id)));
      setTasks(prev => prev.filter(t => !projectsToDeleteIds.includes(t.projectId)));
      setMilestones(prev => prev.filter(m => !projectsToDeleteIds.includes(m.projectId)));

      // Log activity
      await logUserActivity(
        'performed project data purge',
        'system',
        'Projects Reset',
        'Purged projects under Active Projects and Finished Projects.'
      );
    } catch (err) {
      console.error('Error wiping non-admin project data:', err);
      setProjects([]);
      setTasks([]);
      setMilestones([]);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userRole,
        users,
        projects,
        tasks,
        milestones,
        activityLogs,
        notifications,
        projectNotes,
        chatMessages,
        loading,
        isAuthenticated,
        isQuotaExceeded,
        appBackground,
        updateAppBackground,
        securityLogoUrl,
        updateSecurityLogoUrl,
        login,
        logout,
        switchUser,
        toggleRole,
        sendChatMessage,
        addMessageReaction,
        deleteChatMessage,
        markMessagesAsRead,
        markAllMessagesAsRead,
        addMember,
        deleteMember,
        createTask,
        updateTaskStatus,
        updateTaskDetails,
        deleteTask,
        createProject,
        updateProjectDetails,
        deleteProject,
        createMilestone,
        toggleMilestone,
        updateUserProfile,
        markNotificationRead,
        clearNotifications,
        createProjectNote,
        updateProjectNote,
        deleteProjectNote,
        logUserActivity,
        seedData: seedInitialData,
        wipeNonAdminData
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};