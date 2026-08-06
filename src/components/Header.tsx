import React, { useState } from 'react';
import {
  BarChart3,
  CheckSquare,
  Calendar,
  Users,
  FolderKanban,
  Shield,
  ShieldCheck,
  User,
  ChevronDown,
  Check,
  X,
  Search,
  RefreshCw,
  AlertCircle,
  LogOut,
  MessageSquare,
  Bell,
  CheckCheck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { UserRole, NotificationItem } from '../types';

import { SunhillLogo } from './SunhillLogo';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  openAiModal: () => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  openAiModal,
  searchQuery,
  setSearchQuery
}) => {
  const {
    currentUser,
    userRole,
    users,
    switchUser,
    toggleRole,
    notifications,
    markNotificationRead,
    clearNotifications,
    markMessagesAsRead,
    markAllMessagesAsRead,
    seedData,
    logout,
    securityLogoUrl,
    isQuotaExceeded,
    chatMessages
  } = useAuth();

  const [showPersonaMenu, setShowPersonaMenu] = useState(false);
  const [showNotifMenu, setShowNotifMenu] = useState(false);

  // Calculate explicit notifications + synthetic notifications from unread chat messages
  const syntheticMessageNotifs: NotificationItem[] = chatMessages
    .filter((m) => {
      if (m.senderId === currentUser.uid) return false;
      if (m.readBy && m.readBy.includes(currentUser.uid)) return false;
      if (m.recipientType === 'direct') {
        return m.recipientId === currentUser.uid;
      }
      return true;
    })
    .map((m) => {
      const snippet = m.content
        ? (m.content.length > 50 ? m.content.substring(0, 50) + '...' : m.content)
        : (m.attachments && m.attachments.length > 0 ? `[Attachment: ${m.attachments[0].name}]` : 'sent a message');

      return {
        id: `synth_msg_${m.id}`,
        userId: currentUser.uid,
        title: m.recipientType === 'direct'
          ? `Direct Message from ${m.senderName}`
          : `#${m.recipientName || 'channel'} - ${m.senderName}`,
        message: snippet,
        type: 'message',
        read: false,
        createdAt: m.timestamp,
        linkId: m.id,
        senderPhoto: m.senderPhoto
      };
    });

  // Filter explicit notifications for current user
  const userExplicitNotifs = notifications.filter(
    (n) => n.userId === currentUser.uid || n.userId === 'all'
  );

  // Merge explicit notifications with synthetic message notifications (avoiding duplicate linkIds)
  const existingLinkIds = new Set(userExplicitNotifs.map(n => n.linkId).filter(Boolean));
  const mergedNotifs: NotificationItem[] = [
    ...userExplicitNotifs,
    ...syntheticMessageNotifs.filter(s => !existingLinkIds.has(s.linkId))
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const unreadNotifs = mergedNotifs.filter((n) => !n.read);

  const unreadMessagesCount = chatMessages.filter((m) => {
    if (m.senderId === currentUser.uid) return false;
    if (m.readBy && m.readBy.includes(currentUser.uid)) return false;
    if (m.recipientType === 'direct') {
      return m.recipientId === currentUser.uid;
    }
    return true;
  }).length;

  const totalMessageBadge = unreadMessagesCount;

  const baseNavItems = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare },
    { id: 'messages', label: 'Messages', icon: MessageSquare, badge: totalMessageBadge },
    { id: 'calendar', label: 'Calendar', icon: Calendar },
    { id: 'profiles', label: 'Profiles', icon: Users },
    { id: 'projects', label: 'Projects', icon: FolderKanban }
  ];

  // Include Admin Portal tab for Admin / Manager users
  const navItems = (userRole === 'admin' || userRole === 'manager')
    ? [...baseNavItems, { id: 'admin', label: 'Admin Portal', icon: ShieldCheck, isAdminOnly: true }]
    : baseNavItems;

  return (
    <header className="bg-white border-b border-slate-200 text-slate-900 sticky top-0 z-40 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo & Sync Status */}
          <div className="flex items-center space-x-3">
            {securityLogoUrl ? (
              <img
                src={securityLogoUrl}
                alt="System Header Logo"
                className="w-12 h-12 shrink-0 filter drop-shadow-xs object-contain rounded-xl"
              />
            ) : (
              <SunhillLogo className="w-12 h-12 shrink-0 filter drop-shadow-xs" />
            )}
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-lg tracking-tight text-slate-900">
                  Sunhill Task Tracking
                </span>
                {isQuotaExceeded ? (
                  <span
                    className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-100 text-amber-950 border border-amber-300 flex items-center space-x-1"
                    title="Firestore quota reached — preserving last known updates in local backup mode"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-pulse"></span>
                    <span>Local Backup Active</span>
                  </span>
                ) : (
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                    Real-time
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 hidden sm:block">Personnel Tasks & Team Analytics</p>
            </div>
          </div>

          {/* Right Action Tools */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Notification Bell Dropdown */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowNotifMenu(!showNotifMenu);
                  setShowPersonaMenu(false);
                }}
                className="relative p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors bg-white shadow-xs"
                title="Notifications"
              >
                <Bell className="w-4 h-4" />
                {unreadNotifs.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-amber-500 text-slate-950 text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center border-2 border-white shadow-xs animate-pulse">
                    {unreadNotifs.length}
                  </span>
                )}
              </button>

              {showNotifMenu && (
                <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden text-slate-800">
                  <div className="p-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Bell className="w-4 h-4 text-amber-600" />
                      <span className="font-bold text-xs text-slate-900">Notifications</span>
                      {unreadNotifs.length > 0 && (
                        <span className="bg-amber-100 text-amber-900 text-[10px] font-extrabold px-1.5 py-0.5 rounded-full">
                          {unreadNotifs.length} unread
                        </span>
                      )}
                    </div>
                    {unreadNotifs.length > 0 && (
                      <button
                        onClick={() => {
                          clearNotifications();
                          markAllMessagesAsRead();
                        }}
                        className="text-[11px] font-medium text-amber-700 hover:text-amber-900 flex items-center space-x-1"
                      >
                        <CheckCheck className="w-3 h-3" />
                        <span>Mark all read</span>
                      </button>
                    )}
                  </div>

                  <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                    {(() => {
                      if (mergedNotifs.length === 0) {
                        return (
                          <div className="p-4 text-center text-slate-400 text-xs">
                            No notifications yet
                          </div>
                        );
                      }
                      return mergedNotifs.map((n) => (
                        <div
                          key={n.id}
                          onClick={() => {
                            if (n.id.startsWith('synth_msg_')) {
                              const msgId = n.linkId;
                              const targetMsg = chatMessages.find(m => m.id === msgId);
                              if (targetMsg) {
                                const targetId = targetMsg.recipientType === 'direct' ? targetMsg.senderId : targetMsg.recipientId;
                                markMessagesAsRead(targetId);
                              }
                            } else {
                              markNotificationRead(n.id);
                            }
                            if (n.type === 'reaction' || n.type === 'message' || n.id.startsWith('synth_msg_')) {
                              setActiveTab('messages');
                            } else {
                              setActiveTab('tasks');
                            }
                            setShowNotifMenu(false);
                          }}
                          className={`p-3 text-left hover:bg-amber-50/50 cursor-pointer transition-colors ${
                            !n.read ? 'bg-amber-50/40 font-medium' : ''
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <span className="font-semibold text-xs text-slate-900">{n.title}</span>
                            {!n.read && (
                              <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0 mt-1 animate-pulse"></span>
                            )}
                          </div>
                          <p className="text-xs text-slate-600 mt-0.5 line-clamp-2">{n.message}</p>
                          <span className="text-[10px] text-slate-400 mt-1 block">
                            {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      ));
                    })()}
                  </div>
                </div>
              )}
            </div>

            {/* Persona & Role Switcher */}
            <div className="relative">
              <button
                onClick={() => setShowPersonaMenu(!showPersonaMenu)}
                className="flex items-center space-x-2 bg-white hover:bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded-lg text-xs text-slate-800 transition-colors shadow-xs"
              >
                <img
                  src={currentUser.photoURL}
                  alt={currentUser.displayName}
                  className="w-6 h-6 rounded-full object-cover border border-slate-200"
                />
                <div className="text-left hidden lg:block">
                  <div className="font-semibold text-slate-900 flex items-center space-x-1">
                    <span>{currentUser.displayName}</span>
                  </div>
                  <div className="text-[10px] text-slate-500 flex items-center space-x-1">
                    {userRole === 'admin' ? (
                      <span className="text-amber-800 font-bold flex items-center">
                        <ShieldCheck className="w-2.5 h-2.5 mr-0.5 text-amber-600" /> Admin
                      </span>
                    ) : userRole === 'manager' ? (
                      <span className="text-blue-700 font-semibold flex items-center">
                        <Shield className="w-2.5 h-2.5 mr-0.5 text-blue-600" /> Manager
                      </span>
                    ) : (
                      <span className="text-indigo-600 font-semibold flex items-center">
                        <User className="w-2.5 h-2.5 mr-0.5" /> Member
                      </span>
                    )}
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {showPersonaMenu && (
                <div className="absolute right-0 mt-2 w-64 bg-white border border-slate-200 rounded-xl shadow-xl z-50 p-2.5 text-slate-800 space-y-2">
                  <div className="p-2 bg-slate-50 border border-slate-100 rounded-lg flex items-center space-x-2.5">
                    <img
                      src={currentUser.photoURL}
                      alt={currentUser.displayName}
                      className="w-8 h-8 rounded-full object-cover border border-slate-200"
                    />
                    <div className="text-left overflow-hidden">
                      <div className="font-semibold text-xs text-slate-900 truncate">{currentUser.displayName}</div>
                      <div className="text-[10px] text-slate-500 truncate">{currentUser.title || currentUser.email}</div>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      logout();
                      setShowPersonaMenu(false);
                    }}
                    className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-colors font-semibold"
                  >
                    <span className="flex items-center space-x-1.5">
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Lock & Log Out Portal</span>
                    </span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <div className="flex space-x-2 overflow-x-auto pb-3 pt-2 border-t border-slate-100 no-scrollbar">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            const isAdminItem = (item as any).isAdminOnly;

            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                }}
                className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? isAdminItem
                      ? 'bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white font-black shadow-md shadow-amber-500/25 border border-amber-400'
                      : 'bg-amber-400 text-slate-950 font-black border border-amber-500 shadow-md shadow-amber-400/30'
                    : isAdminItem
                    ? 'bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100 font-bold'
                    : 'text-slate-600 hover:bg-amber-50 hover:text-amber-900 font-medium'
                }`}
              >
                <div className="relative flex items-center">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-slate-950' : (isAdminItem ? 'text-amber-700' : 'text-slate-500')}`} />
                  {(item as any).badge !== undefined && (item as any).badge > 0 && !isActive && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                  )}
                </div>
                <span>{item.label}</span>
                {(item as any).badge !== undefined && (item as any).badge > 0 && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ml-1 flex items-center space-x-1 ${
                    isActive ? 'bg-slate-950 text-amber-400' : 'bg-amber-500 text-slate-950 shadow-xs animate-pulse'
                  }`}>
                    <span>{(item as any).badge}</span>
                  </span>
                )}
                {isAdminItem && (
                  <span className={`text-[9px] px-1.5 py-0.5 rounded font-extrabold ml-1 uppercase ${isActive ? 'bg-slate-950 text-amber-400' : 'bg-amber-200 text-amber-950'}`}>
                    Admin
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
