import React, { useState, useEffect, useRef } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { TaskList } from './components/TaskList';
import { ProjectCalendar } from './components/ProjectCalendar';
import { UserProfiles } from './components/UserProfiles';
import { ProjectManager } from './components/ProjectManager';
import { AdminManager } from './components/AdminManager';
import { TeamMessaging } from './components/TeamMessaging';
import { LoginSecurityPortal } from './components/LoginSecurityPortal';
import { TaskModal } from './components/TaskModal';
import { AiAssistantModal } from './components/AiAssistantModal';
import { MessageSquare, X, Bell } from 'lucide-react';

function AppContent() {
  const { isAuthenticated, currentUser, appBackground, chatMessages, markAllMessagesAsRead } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isTaskModalOpen, setIsTaskModalOpen] = useState<boolean>(false);
  const [taskModalAssigneeId, setTaskModalAssigneeId] = useState<string | undefined>(undefined);
  const [isAiModalOpen, setIsAiModalOpen] = useState<boolean>(false);

  // Incoming Message Toast Notification state
  const [activeToast, setActiveToast] = useState<{ id: string; senderName: string; senderPhoto?: string; text: string } | null>(null);
  const knownMsgIdsRef = useRef<Set<string>>(new Set());
  const isInitializedRef = useRef<boolean>(false);

  useEffect(() => {
    if (!currentUser) return;

    if (!isInitializedRef.current) {
      // First run: populate known message IDs without triggering toasts for historic messages
      chatMessages.forEach(m => knownMsgIdsRef.current.add(m.id));
      if (chatMessages.length > 0) {
        isInitializedRef.current = true;
      }
      return;
    }

    // Subsequent runs: detect genuinely new incoming messages
    let newestToastMessage = null;
    for (const msg of chatMessages) {
      if (!knownMsgIdsRef.current.has(msg.id)) {
        knownMsgIdsRef.current.add(msg.id);
        if (
          msg.senderId !== currentUser.uid &&
          (!msg.readBy || !msg.readBy.includes(currentUser.uid)) &&
          (msg.recipientType === 'direct' ? msg.recipientId === currentUser.uid : true)
        ) {
          newestToastMessage = msg;
        }
      }
    }

    if (newestToastMessage) {
      setActiveToast({
        id: newestToastMessage.id,
        senderName: newestToastMessage.senderName,
        senderPhoto: newestToastMessage.senderPhoto,
        text: newestToastMessage.content || (newestToastMessage.attachments?.length ? 'Sent an attachment' : 'Sent a message')
      });
    }
  }, [chatMessages, currentUser]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
    if (document.documentElement) document.documentElement.scrollTop = 0;
    if (document.body) document.body.scrollTop = 0;
    const scrollables = document.querySelectorAll('.overflow-y-auto, .overflow-auto');
    scrollables.forEach((el) => {
      el.scrollTop = 0;
    });
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    scrollToTop();
  };

  // Always reset activeTab to 'dashboard' (Analytics Dashboard) and scroll to top when user logs in or switches user
  useEffect(() => {
    if (isAuthenticated) {
      setActiveTab('dashboard');
      scrollToTop();
      const timer = setTimeout(scrollToTop, 50);
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, currentUser?.uid]);

  // Scroll to top whenever activeTab changes
  useEffect(() => {
    scrollToTop();
    const timer = setTimeout(scrollToTop, 50);
    const raf = requestAnimationFrame(scrollToTop);
    return () => {
      clearTimeout(timer);
      cancelAnimationFrame(raf);
    };
  }, [activeTab]);

  const openCreateTaskModal = (assigneeId?: string) => {
    setTaskModalAssigneeId(assigneeId);
    setIsTaskModalOpen(true);
  };

  if (!isAuthenticated) {
    return <LoginSecurityPortal />;
  }

  const hasBgImage = Boolean(appBackground?.imageUrl);

  const backgroundStyle: React.CSSProperties = hasBgImage
    ? {
        backgroundImage: `url("${appBackground.imageUrl}")`,
        backgroundSize: appBackground.mode === 'expand' ? 'cover' : 'auto',
        backgroundPosition: appBackground.mode === 'pattern' ? 'top left' : 'center center',
        backgroundRepeat: appBackground.mode === 'pattern' ? 'repeat' : 'no-repeat',
        backgroundAttachment: 'fixed',
        opacity: appBackground.opacity ?? 1
      }
    : {};

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased selection:bg-indigo-600 selection:text-white flex flex-col relative">
      {/* Dynamic Interface Background Layer */}
      {hasBgImage && (
        <div
          className="fixed inset-0 pointer-events-none z-0 transition-all duration-300"
          style={backgroundStyle}
        />
      )}

      <div className="relative z-10 flex flex-col flex-1">
        <Header
          activeTab={activeTab}
          setActiveTab={handleTabChange}
          openAiModal={() => setIsAiModalOpen(true)}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
        />

        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {activeTab === 'dashboard' && (
            <Dashboard
              setActiveTab={handleTabChange}
              openCreateTaskModal={openCreateTaskModal}
              openAiModal={() => setIsAiModalOpen(true)}
            />
          )}

          {activeTab === 'tasks' && (
            <TaskList
              openCreateTaskModal={openCreateTaskModal}
              searchQuery={searchQuery}
            />
          )}

          {activeTab === 'messages' && <TeamMessaging />}

          {activeTab === 'calendar' && <ProjectCalendar />}

          {activeTab === 'profiles' && (
            <UserProfiles openCreateTaskModal={openCreateTaskModal} />
          )}

          {activeTab === 'projects' && <ProjectManager />}

          {activeTab === 'admin' && (
            <AdminManager openCreateTaskModal={openCreateTaskModal} />
          )}
        </main>

        {/* Modals */}
        <TaskModal
          isOpen={isTaskModalOpen}
          initialAssigneeId={taskModalAssigneeId}
          onClose={() => setIsTaskModalOpen(false)}
        />

        <AiAssistantModal
          isOpen={isAiModalOpen}
          onClose={() => setIsAiModalOpen(false)}
        />

        {/* Floating Message Received Toast Notification */}
        {activeToast && (
          <div className="fixed bottom-6 right-6 z-50 max-w-sm bg-slate-900 text-white rounded-2xl p-4 shadow-2xl border border-slate-700 animate-in slide-in-from-bottom-5 duration-300">
            <div className="flex items-start space-x-3">
              <div className="relative shrink-0">
                {activeToast.senderPhoto ? (
                  <img
                    src={activeToast.senderPhoto}
                    alt={activeToast.senderName}
                    className="w-10 h-10 rounded-full object-cover border border-amber-400"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center font-bold text-sm">
                    {activeToast.senderName.charAt(0)}
                  </div>
                )}
                <span className="absolute -bottom-1 -right-1 bg-amber-500 text-slate-950 rounded-full p-0.5 border border-slate-900">
                  <MessageSquare className="w-2.5 h-2.5" />
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-amber-400 truncate">
                    {activeToast.senderName}
                  </span>
                  <button
                    onClick={() => setActiveToast(null)}
                    className="text-slate-400 hover:text-white transition-colors p-0.5"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <p className="text-xs text-slate-200 mt-0.5 line-clamp-2">
                  {activeToast.text}
                </p>
                <div className="mt-2.5 flex items-center space-x-2">
                  <button
                    onClick={() => {
                      setActiveTab('messages');
                      setActiveToast(null);
                    }}
                    className="px-3 py-1 bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-bold rounded-lg transition-colors"
                  >
                    View Messages
                  </button>
                  <button
                    onClick={() => setActiveToast(null)}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg transition-colors"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Clean Geometric Balance Footer */}
        <footer className="border-t border-slate-200/80 bg-white/90 backdrop-blur-sm py-4 text-center text-xs text-slate-500">
          <p>Sunhill Task Tracking System • Personnel Task & Performance Management Suite</p>
        </footer>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
