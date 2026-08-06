import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare,
  Send,
  Paperclip,
  Smile,
  Search,
  Hash,
  Users,
  CheckCheck,
  Trash2,
  Reply,
  X,
  FileText,
  Image as ImageIcon,
  FolderKanban,
  Sparkles,
  Info,
  ChevronRight,
  User,
  Shield,
  Circle,
  Download,
  Loader2,
  Maximize2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ChatMessage, UserProfile, Project, Task, ChatMessageAttachment } from '../types';

export const TeamMessaging: React.FC = () => {
  const {
    currentUser,
    users,
    projects,
    tasks,
    chatMessages,
    sendChatMessage,
    addMessageReaction,
    deleteChatMessage,
    markMessagesAsRead,
    markAllMessagesAsRead
  } = useAuth();

  // Active channel/conversation target
  // Default to '# announcements'
  const [selectedRecipientId, setSelectedRecipientId] = useState<string>('announcements');
  const [selectedRecipientType, setSelectedRecipientType] = useState<'channel' | 'direct' | 'project'>('channel');
  const [selectedRecipientName, setSelectedRecipientName] = useState<string>('# announcements');

  // Search filter for sidebar
  const [sidebarSearch, setSidebarSearch] = useState<string>('');

  // Input states
  const [messageInput, setMessageInput] = useState<string>('');
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
  const [attachedFiles, setAttachedFiles] = useState<ChatMessageAttachment[]>([]);
  const [isProcessingFile, setIsProcessingFile] = useState<boolean>(false);
  const [previewModalImage, setPreviewModalImage] = useState<{ url: string; name: string } | null>(null);

  const [showEmojiPicker, setShowEmojiPicker] = useState<boolean>(false);
  const [showTaskPicker, setShowTaskPicker] = useState<boolean>(false);
  const [showMemberDetails, setShowMemberDetails] = useState<boolean>(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, selectedRecipientId]);

  // Helper: Format bytes to human readable string
  const formatBytes = (bytes: number, decimals = 1): string => {
    if (bytes <= 0) return '0 B';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  // File size conversion protocol: Compress images using HTML Canvas, convert documents to Data URL
  const processAndCompressFile = (file: File): Promise<ChatMessageAttachment> => {
    return new Promise((resolve) => {
      const originalSizeFormatted = formatBytes(file.size);
      const isImage = file.type.startsWith('image/');

      if (isImage) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const img = new Image();
          img.onload = () => {
            // Downscale max dimension to 1000px for optimal canvas compression & storage saving
            const maxDim = 1000;
            let width = img.width;
            let height = img.height;

            if (width > maxDim || height > maxDim) {
              if (width > height) {
                height = Math.round((height * maxDim) / width);
                width = maxDim;
              } else {
                width = Math.round((width * maxDim) / height);
                height = maxDim;
              }
            }

            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(img, 0, 0, width, height);
              // Canvas JPEG compression at 0.75 quality reduces size by ~70-90%
              const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.75);
              const approxBytes = Math.round((compressedDataUrl.length * 3) / 4);
              const compressedSizeFormatted = formatBytes(approxBytes);

              resolve({
                name: file.name,
                url: compressedDataUrl,
                type: 'image',
                size: compressedSizeFormatted,
                originalSize: originalSizeFormatted
              });
              return;
            }

            // Fallback if canvas context unavailable
            const rawDataUrl = e.target?.result as string || '#';
            const approxBytes = Math.round((rawDataUrl.length * 3) / 4);
            resolve({
              name: file.name,
              url: rawDataUrl,
              type: 'image',
              size: formatBytes(approxBytes),
              originalSize: originalSizeFormatted
            });
          };
          img.onerror = () => {
            resolve({
              name: file.name,
              url: e.target?.result as string || '#',
              type: 'image',
              size: originalSizeFormatted,
              originalSize: originalSizeFormatted
            });
          };
          img.src = e.target?.result as string;
        };
        reader.readAsDataURL(file);
      } else {
        // Document / Non-image file conversion to Data URL
        const reader = new FileReader();
        reader.onload = (e) => {
          const dataUrl = e.target?.result as string || '#';
          const approxBytes = Math.round((dataUrl.length * 3) / 4);
          resolve({
            name: file.name,
            url: dataUrl,
            type: 'file',
            size: formatBytes(approxBytes || file.size),
            originalSize: originalSizeFormatted
          });
        };
        reader.readAsDataURL(file);
      }
    });
  };

  const handleTriggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsProcessingFile(true);
    try {
      const processedList: ChatMessageAttachment[] = [];
      for (let i = 0; i < files.length; i++) {
        const item = await processAndCompressFile(files[i]);
        processedList.push(item);
      }
      setAttachedFiles(prev => [...prev, ...processedList]);
    } catch (err) {
      console.error('Error processing attachment:', err);
    } finally {
      setIsProcessingFile(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Filter messages for current conversation
  const currentConversationMessages = chatMessages.filter(msg => {
    if (selectedRecipientType === 'channel' || selectedRecipientType === 'project') {
      return msg.recipientId === selectedRecipientId;
    } else {
      // Direct message between currentUser and selected user
      return (
        (msg.senderId === currentUser.uid && msg.recipientId === selectedRecipientId) ||
        (msg.senderId === selectedRecipientId && msg.recipientId === currentUser.uid)
      );
    }
  });

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!messageInput.trim() && attachedFiles.length === 0) return;

    await sendChatMessage({
      recipientId: selectedRecipientId,
      recipientType: selectedRecipientType,
      recipientName: selectedRecipientName,
      content: messageInput.trim(),
      attachments: attachedFiles.length > 0 ? attachedFiles : undefined,
      replyToId: replyingTo?.id,
      replyToText: replyingTo ? `${replyingTo.senderName}: ${replyingTo.content.substring(0, 40)}...` : undefined
    });

    setMessageInput('');
    setAttachedFiles([]);
    setReplyingTo(null);
    setShowEmojiPicker(false);
    setShowTaskPicker(false);
  };

  const handleSimulateFileUpload = () => {
    const fileTypes: ('image' | 'file')[] = ['image', 'file'];
    const chosenType = fileTypes[Math.floor(Math.random() * fileTypes.length)];
    const sampleImage = 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&auto=format&fit=crop&q=80';
    const sampleDoc = 'Sprint_24_Architecture_Spec.pdf';

    if (chosenType === 'image') {
      setAttachedFiles(prev => [...prev, { name: 'Architecture_Diagram.png', url: sampleImage, type: 'image' }]);
    } else {
      setAttachedFiles(prev => [...prev, { name: sampleDoc, url: '#', type: 'file' }]);
    }
  };

  const handleInsertTaskReference = (task: Task) => {
    setMessageInput(prev => `${prev} [Task #${task.id.slice(-4)}: ${task.title}]`);
    setShowTaskPicker(false);
  };

  const commonEmojis = ['👍', '❤️', '🔥', '🚀', '🎉', '👀', '💡', '✅'];

  // Identify recipient user or channel info
  const selectedUser = users.find(u => u.uid === selectedRecipientId);
  const selectedProject = projects.find(p => p.id === selectedRecipientId);

  // Unread count for public or project channels
  const getChannelUnreadCount = (channelId: string) => {
    return chatMessages.filter(m =>
      m.recipientId === channelId &&
      m.senderId !== currentUser.uid &&
      (!m.readBy || !m.readBy.includes(currentUser.uid))
    ).length;
  };

  // Unread count for direct member profiles
  // A notification will ONLY appear on the member's profile if they sent an unread direct message to the current user
  const getMemberProfileUnreadCount = (memberUid: string) => {
    return chatMessages.filter(m =>
      m.recipientType === 'direct' &&
      m.senderId === memberUid &&
      m.recipientId === currentUser.uid &&
      (!m.readBy || !m.readBy.includes(currentUser.uid))
    ).length;
  };

  // Helper: Get latest message for a recipient
  const getLatestMessage = (recipientId: string, recipientType: 'channel' | 'direct' | 'project'): ChatMessage | null => {
    let conversationMsgs: ChatMessage[] = [];
    if (recipientType === 'channel' || recipientType === 'project') {
      conversationMsgs = chatMessages.filter(m => m.recipientId === recipientId);
    } else {
      conversationMsgs = chatMessages.filter(
        m =>
          (!m.recipientType || m.recipientType === 'direct') &&
          ((m.senderId === currentUser.uid && m.recipientId === recipientId) ||
           (m.senderId === recipientId && m.recipientId === currentUser.uid))
      );
    }

    if (conversationMsgs.length === 0) return null;

    let latestMsg = conversationMsgs[0];
    let maxTs = new Date(latestMsg.timestamp).getTime();
    if (isNaN(maxTs)) maxTs = 0;

    for (let i = 1; i < conversationMsgs.length; i++) {
      const m = conversationMsgs[i];
      let ts = new Date(m.timestamp).getTime();
      if (isNaN(ts)) ts = 0;
      if (ts > maxTs) {
        maxTs = ts;
        latestMsg = m;
      }
    }

    return latestMsg;
  };

  // Helper: Get latest message timestamp for sorting
  const getLatestMessageTimestamp = (recipientId: string, recipientType: 'channel' | 'direct' | 'project'): number => {
    const latest = getLatestMessage(recipientId, recipientType);
    if (!latest) return 0;
    const ts = new Date(latest.timestamp).getTime();
    return isNaN(ts) ? 0 : ts;
  };

  // Helper: Format timestamp for sidebar badge
  const formatSidebarTime = (isoString?: string): string => {
    if (!isoString) return '';
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return '';

    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();

    if (isToday) {
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  // Public channels definition
  const publicChannelsList = [
    { id: 'announcements', name: 'announcements', type: 'channel' as const }
  ];

  // Sort channels by latest message timestamp
  const sortedChannels = [...publicChannelsList].sort((a, b) => {
    const tsA = getLatestMessageTimestamp(a.id, 'channel');
    const tsB = getLatestMessageTimestamp(b.id, 'channel');
    if (tsA !== tsB) return tsB - tsA;
    return a.name.localeCompare(b.name);
  });

  const filteredUsers = users.filter(u =>
    u.displayName.toLowerCase().includes(sidebarSearch.toLowerCase()) ||
    u.title.toLowerCase().includes(sidebarSearch.toLowerCase())
  );

  // Sort direct messages by latest message timestamp (most recent at top)
  const sortedFilteredUsers = [...filteredUsers].sort((a, b) => {
    const tsA = getLatestMessageTimestamp(a.uid, 'direct');
    const tsB = getLatestMessageTimestamp(b.uid, 'direct');
    if (tsA !== tsB) return tsB - tsA;
    return a.displayName.localeCompare(b.displayName);
  });

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col h-[calc(100vh-140px)] min-h-[600px]">
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-amber-200/90 via-amber-100 to-orange-200/80 px-6 py-3.5 flex items-center justify-between border-b border-amber-300/80 shrink-0 shadow-xs">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 border border-amber-300 flex items-center justify-center shadow-sm">
            <MessageSquare className="w-5 h-5 text-slate-950" />
          </div>
          <div>
            <h1 className="text-sm font-black tracking-tight text-slate-900 flex items-center space-x-2">
              <span>Member Communication & Live Team Chat</span>
              <span className="text-[10px] bg-amber-300/80 text-amber-950 border border-amber-400/90 px-2.5 py-0.5 rounded-full font-black tracking-wide uppercase shadow-[0_0_10px_rgba(245,158,11,0.4)] flex items-center space-x-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-ping mr-1" />
                Real-Time Sync
              </span>
            </h1>
            <p className="text-amber-950/80 text-xs font-medium">Direct member messaging, public channels, and task collaboration</p>
          </div>
        </div>

        <div className="flex items-center space-x-2 text-xs text-slate-900 bg-amber-50/90 px-3.5 py-1.5 rounded-xl border border-amber-300/90 shadow-2xs">
          <Circle className="w-2.5 h-2.5 fill-emerald-500 text-emerald-500 animate-pulse" />
          <span className="font-extrabold text-amber-950">{currentUser.displayName}</span>
          <span className="text-amber-400 font-bold">•</span>
          <span className="text-amber-900/90 font-bold capitalize">{currentUser.role}</span>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* LEFT SIDEBAR: Channels & Direct Messages */}
        <div className="w-72 sm:w-80 bg-slate-50 border-r border-slate-200 flex flex-col shrink-0">
          {/* Search Box */}
          <div className="p-3 border-b border-slate-200/80">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Filter members or channels..."
                value={sidebarSearch}
                onChange={(e) => setSidebarSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
              />
              {sidebarSearch && (
                <button
                  onClick={() => setSidebarSearch('')}
                  className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Channels & Members List Scroll Area */}
          <div className="flex-1 overflow-y-auto p-3 space-y-5 custom-scrollbar">
            {/* PUBLIC CHANNELS */}
            <div>
              <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2 px-2 flex items-center justify-between">
                <span>Public Channels</span>
                <span className="bg-slate-200 text-slate-600 px-1.5 py-0.2 rounded-md font-bold">{sortedChannels.length}</span>
              </div>
              <div className="space-y-0.5">
                {sortedChannels.map((ch) => {
                  const isSelected = selectedRecipientId === ch.id;
                  const unread = getChannelUnreadCount(ch.id);
                  const latestMsg = getLatestMessage(ch.id, 'channel');
                  const latestTimeStr = latestMsg ? formatSidebarTime(latestMsg.timestamp) : '';

                  return (
                    <button
                      key={ch.id}
                      onClick={() => {
                        setSelectedRecipientId(ch.id);
                        setSelectedRecipientType('channel');
                        setSelectedRecipientName(`# ${ch.name}`);
                        markMessagesAsRead(ch.id);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                        isSelected
                          ? 'bg-amber-500 text-slate-950 font-extrabold shadow-xs'
                          : 'text-slate-700 hover:bg-amber-100/60'
                      }`}
                    >
                      <div className="flex items-center space-x-2 truncate min-w-0 flex-1">
                        <Hash className={`w-4 h-4 shrink-0 ${isSelected ? 'text-slate-950' : 'text-slate-400'}`} />
                        <div className="text-left truncate min-w-0 flex-1">
                          <div className="flex items-center justify-between">
                            <span className="truncate font-semibold">{ch.name}</span>
                            {latestTimeStr && (
                              <span className={`text-[9px] font-medium shrink-0 ml-1.5 ${isSelected ? 'text-amber-950/80 font-bold' : 'text-slate-400'}`}>
                                {latestTimeStr}
                              </span>
                            )}
                          </div>
                          {latestMsg && (
                            <p className={`text-[10px] truncate font-normal ${isSelected ? 'text-amber-950/80' : 'text-slate-400'}`}>
                              {latestMsg.senderName ? `${latestMsg.senderName.split(' ')[0]}: ` : ''}{latestMsg.content || (latestMsg.attachments?.length ? '📎 Attachment' : '')}
                            </p>
                          )}
                        </div>
                      </div>
                      {unread > 0 && (
                        <span className="px-1.5 py-0.5 bg-amber-500 text-slate-950 font-extrabold text-[10px] rounded-full shrink-0 ml-1.5">
                          {unread}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* DIRECT MESSAGES (TEAM MEMBERS) */}
            <div>
              <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2 px-2 flex items-center justify-between">
                <span>Direct Member Messages</span>
                <span className="bg-slate-200 text-slate-600 px-1.5 py-0.2 rounded-md font-bold">{sortedFilteredUsers.length}</span>
              </div>
              <div className="space-y-1">
                {sortedFilteredUsers.map((member) => {
                  const isSelf = member.uid === currentUser.uid;
                  const isSelected = selectedRecipientId === member.uid;
                  const unread = getMemberProfileUnreadCount(member.uid);
                  const latestMsg = getLatestMessage(member.uid, 'direct');
                  const latestTimeStr = latestMsg ? formatSidebarTime(latestMsg.timestamp) : '';

                  return (
                    <button
                      key={member.uid}
                      onClick={() => {
                        setSelectedRecipientId(member.uid);
                        setSelectedRecipientType('direct');
                        setSelectedRecipientName(member.displayName);
                        markMessagesAsRead(member.uid);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all ${
                        isSelected
                          ? 'bg-amber-500 text-slate-950 font-extrabold shadow-xs'
                          : unread > 0
                          ? 'bg-amber-100/80 hover:bg-amber-100 text-amber-950 border border-amber-400 font-bold shadow-2xs'
                          : 'text-slate-700 hover:bg-amber-100/60'
                      }`}
                    >
                      <div className="flex items-center space-x-2.5 truncate min-w-0 flex-1">
                        <div className="relative shrink-0">
                          <img
                            src={member.photoURL}
                            alt={member.displayName}
                            className={`w-7 h-7 rounded-full object-cover border ${
                              isSelected
                                ? 'border-slate-950'
                                : unread > 0
                                ? 'border-amber-500 ring-2 ring-amber-500/60'
                                : 'border-slate-200'
                            }`}
                          />
                          {unread > 0 ? (
                            <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-amber-600 text-white font-black text-[9px] border-2 border-white flex items-center justify-center animate-pulse shadow-xs">
                              {unread}
                            </span>
                          ) : (
                            <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-500 border border-white" />
                          )}
                        </div>
                        <div className="text-left truncate min-w-0 flex-1">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-1.5 truncate">
                              <span className="truncate font-semibold">{member.displayName}</span>
                              {isSelf && (
                                <span className={`text-[9px] px-1 rounded font-bold shrink-0 ${
                                  isSelected ? 'bg-amber-950 text-amber-200' : 'bg-slate-200 text-slate-600'
                                }`}>
                                  You
                                </span>
                              )}
                            </div>
                            {latestTimeStr && (
                              <span className={`text-[9px] font-medium shrink-0 ml-1.5 ${
                                isSelected
                                  ? 'text-amber-950/80 font-bold'
                                  : unread > 0
                                  ? 'text-amber-900 font-bold'
                                  : 'text-slate-400'
                              }`}>
                                {latestTimeStr}
                              </span>
                            )}
                          </div>
                          <p className={`text-[10px] truncate ${
                            isSelected
                              ? 'text-amber-950/80 font-medium'
                              : unread > 0
                              ? 'text-amber-950 font-bold'
                              : 'text-slate-400'
                          }`}>
                            {latestMsg ? (latestMsg.content || (latestMsg.attachments?.length ? '📎 Attachment' : member.title)) : member.title}
                          </p>
                        </div>
                      </div>

                      {unread > 0 && (
                        <span className="px-1.5 py-0.5 bg-amber-500 text-slate-950 font-black text-[10px] rounded-full shrink-0 ml-1.5 shadow-2xs animate-pulse">
                          {unread}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* CENTER MAIN CHAT DISPLAY */}
        <div className="flex-1 flex flex-col bg-white overflow-hidden">
          {/* Chat Room Top Bar */}
          <div className="px-6 py-3.5 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between shrink-0">
            <div className="flex items-center space-x-3">
              {selectedRecipientType === 'direct' && selectedUser ? (
                <div className="relative">
                  <img
                    src={selectedUser.photoURL}
                    alt={selectedUser.displayName}
                    className="w-9 h-9 rounded-full object-cover border border-slate-200"
                  />
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white" />
                </div>
              ) : selectedRecipientType === 'project' ? (
                <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center">
                  <FolderKanban className="w-5 h-5 text-amber-600" />
                </div>
              ) : (
                <div className="w-9 h-9 rounded-xl bg-amber-100/70 border border-amber-200/60 flex items-center justify-center">
                  <Hash className="w-5 h-5 text-amber-900" />
                </div>
              )}

              <div>
                <h2 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                  <span>{selectedRecipientName}</span>
                  {selectedRecipientType === 'direct' && selectedUser && (
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.2 rounded-full font-bold">
                      Online
                    </span>
                  )}
                </h2>
                <p className="text-[11px] text-slate-500">
                  {selectedRecipientType === 'channel' && 'Public team discussion channel'}
                  {selectedRecipientType === 'project' && selectedProject && `Project room for ${selectedProject.name}`}
                  {selectedRecipientType === 'direct' && selectedUser && `${selectedUser.title} • ${selectedUser.department}`}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => markAllMessagesAsRead()}
                className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 rounded-xl text-xs font-semibold transition-colors flex items-center space-x-1.5 shadow-xs"
                title="Mark all messages and chat notifications as read"
              >
                <CheckCheck className="w-3.5 h-3.5 text-amber-700" />
                <span>Clear Notifications</span>
              </button>

              {selectedRecipientType === 'direct' && selectedUser && (
                <button
                  onClick={() => setShowMemberDetails(!showMemberDetails)}
                  className="px-2.5 py-1.5 bg-white border border-slate-200 hover:bg-amber-50 rounded-xl text-xs font-semibold text-slate-700 transition-colors flex items-center space-x-1.5"
                >
                  <Info className="w-3.5 h-3.5 text-amber-600" />
                  <span>Member Info</span>
                </button>
              )}
            </div>
          </div>

          {/* Messages Stream Container */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar bg-amber-50/10">
            {currentConversationMessages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-400 space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center border border-amber-200">
                  <MessageSquare className="w-6 h-6 text-amber-500" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-700">No messages yet</h3>
                  <p className="text-xs text-slate-500">Start the conversation with {selectedRecipientName}!</p>
                </div>
              </div>
            ) : (
              currentConversationMessages.map((msg) => {
                const isMe = msg.senderId === currentUser.uid;
                const senderProfile = users.find(u => u.uid === msg.senderId);

                return (
                  <div
                    key={msg.id}
                    className={`flex items-start space-x-3 group ${isMe ? 'flex-row-reverse space-x-reverse' : ''}`}
                  >
                    <img
                      src={msg.senderPhoto || senderProfile?.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                      alt={msg.senderName}
                      onClick={() => {
                        if (!isMe) {
                          setSelectedRecipientId(msg.senderId);
                          setSelectedRecipientType('direct');
                          setSelectedRecipientName(msg.senderName);
                          markMessagesAsRead(msg.senderId);
                        }
                      }}
                      className="w-8 h-8 rounded-full object-cover border border-slate-200 shrink-0 mt-1 cursor-pointer hover:ring-2 hover:ring-amber-400 transition-all"
                    />

                    <div className={`max-w-md sm:max-w-lg ${isMe ? 'items-end' : 'items-start'}`}>
                      {/* Sender Header info */}
                      <div className={`flex items-center space-x-2 text-[11px] mb-1 ${isMe ? 'justify-end space-x-reverse' : ''}`}>
                        <span
                          onClick={() => {
                            if (!isMe) {
                              setSelectedRecipientId(msg.senderId);
                              setSelectedRecipientType('direct');
                              setSelectedRecipientName(msg.senderName);
                              markMessagesAsRead(msg.senderId);
                            }
                          }}
                          className={`font-bold text-slate-800 ${!isMe ? 'cursor-pointer hover:text-amber-700 hover:underline' : ''}`}
                        >
                          {msg.senderName}
                        </span>
                        {senderProfile?.role && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-100/80 text-amber-900 font-bold uppercase">
                            {senderProfile.role}
                          </span>
                        )}
                        <span className="text-slate-400 text-[10px]">
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      {/* Quoted Reply if present */}
                      {msg.replyToText && (
                        <div className={`text-[11px] px-3 py-1.5 rounded-lg mb-1 border-l-2 bg-amber-50/80 border-amber-500 text-amber-950 italic`}>
                          💬 {msg.replyToText}
                        </div>
                      )}

                      {/* Message Body Bubble */}
                      <div className={`p-3.5 rounded-2xl text-xs relative transition-all shadow-2xs ${
                        isMe
                          ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-medium rounded-tr-none'
                          : 'bg-white text-slate-800 border border-slate-200/90 rounded-tl-none'
                      }`}>
                        <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>

                        {/* Attachments if any */}
                        {msg.attachments && msg.attachments.length > 0 && (
                          <div className="mt-2.5 space-y-2 border-t pt-2 border-slate-200/30">
                            {msg.attachments.map((att, i) => (
                              <div key={i} className="flex items-center space-x-2">
                                {att.type === 'image' ? (
                                  <div className="space-y-1 group/img relative">
                                    <div className="relative inline-block overflow-hidden rounded-xl border border-slate-300/40 bg-slate-900/5">
                                      <img
                                        src={att.url}
                                        alt={att.name}
                                        className="max-w-xs max-h-56 object-cover rounded-xl cursor-pointer hover:opacity-90 transition-opacity"
                                        onClick={() => setPreviewModalImage({ url: att.url, name: att.name })}
                                      />
                                      <button
                                        type="button"
                                        onClick={() => setPreviewModalImage({ url: att.url, name: att.name })}
                                        className="absolute top-2 right-2 p-1.5 bg-slate-900/60 hover:bg-slate-900/80 text-white rounded-lg opacity-0 group-hover/img:opacity-100 transition-opacity"
                                        title="Expand Image"
                                      >
                                        <Maximize2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                    <div className="text-[10px] opacity-80 flex items-center justify-between space-x-2">
                                      <span className="flex items-center space-x-1 truncate max-w-[180px]">
                                        <ImageIcon className="w-3 h-3 shrink-0" />
                                        <span className="truncate">{att.name}</span>
                                      </span>
                                      {att.size && (
                                        <span className="px-1.5 py-0.2 rounded bg-black/10 text-[9px] font-mono">
                                          {att.size}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                ) : (
                                  <div className="flex flex-col">
                                    <a
                                      href={att.url}
                                      download={att.name}
                                      target="_blank"
                                      rel="noreferrer"
                                      className={`flex items-center space-x-2 p-2.5 rounded-xl border text-xs font-semibold transition-all ${
                                        isMe
                                          ? 'bg-amber-950/20 border-amber-950/30 text-slate-950 hover:bg-amber-950/30'
                                          : 'bg-white border-slate-200 text-amber-700 hover:bg-amber-50/50 shadow-2xs'
                                      }`}
                                    >
                                      <FileText className="w-4 h-4 shrink-0 text-amber-600" />
                                      <div className="flex flex-col min-w-0 text-left">
                                        <span className="truncate max-w-[180px] leading-snug">{att.name}</span>
                                        {att.size && (
                                          <span className={`text-[9px] ${isMe ? 'text-amber-900' : 'text-slate-400'}`}>
                                            {att.size} • Click to download
                                          </span>
                                        )}
                                      </div>
                                      <Download className="w-3.5 h-3.5 ml-2 shrink-0 opacity-70" />
                                    </a>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Reactions Row */}
                      <div className={`flex flex-wrap items-center gap-1 mt-1.5 ${isMe ? 'justify-end' : 'justify-start'}`}>
                        {msg.reactions && msg.reactions.map((react, i) => {
                          const hasReacted = react.userIds.includes(currentUser.uid);
                          return (
                            <button
                              key={i}
                              onClick={() => addMessageReaction(msg.id, react.emoji)}
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold border transition-colors flex items-center space-x-1 ${
                                hasReacted
                                  ? 'bg-amber-100 border-amber-400 text-amber-950 font-black'
                                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                              }`}
                            >
                              <span>{react.emoji}</span>
                              <span>{react.userIds.length}</span>
                            </button>
                          );
                        })}

                        {/* Hover Action Bar */}
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center space-x-1 ml-2">
                          <button
                            onClick={() => setReplyingTo(msg)}
                            className="p-1 hover:bg-slate-200/80 rounded text-slate-500 hover:text-slate-800"
                            title="Reply"
                          >
                            <Reply className="w-3.5 h-3.5" />
                          </button>
                          {commonEmojis.slice(0, 4).map((e) => (
                            <button
                              key={e}
                              onClick={() => addMessageReaction(msg.id, e)}
                              className="p-1 hover:bg-slate-200/80 rounded text-xs"
                              title={`React ${e}`}
                            >
                              {e}
                            </button>
                          ))}
                          {(isMe || currentUser.role === 'admin') && (
                            <button
                              onClick={() => deleteChatMessage(msg.id)}
                              className="p-1 hover:bg-rose-100 rounded text-slate-400 hover:text-rose-600"
                              title="Delete Message"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* COMPOSER / INPUT BAR */}
          <div className="p-4 border-t border-slate-200 bg-white shrink-0">
            {/* Replying Preview Bar */}
            {replyingTo && (
              <div className="flex items-center justify-between bg-amber-50 border-l-4 border-amber-500 px-3 py-1.5 rounded-r-xl mb-2 text-xs text-amber-950 font-medium">
                <div className="flex items-center space-x-2 truncate">
                  <Reply className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span className="font-bold">Replying to {replyingTo.senderName}:</span>
                  <span className="truncate italic opacity-80">{replyingTo.content}</span>
                </div>
                <button onClick={() => setReplyingTo(null)} className="text-amber-700 hover:text-amber-950">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* File Processing Indicator */}
            {isProcessingFile && (
              <div className="flex items-center space-x-2 text-xs text-amber-900 mb-2 bg-amber-50 px-3 py-2 rounded-xl border border-amber-300 animate-pulse">
                <Loader2 className="w-4 h-4 animate-spin text-amber-600 shrink-0" />
                <span className="font-semibold">Converting & compressing file protocol for optimized storage...</span>
              </div>
            )}

            {/* Attached Files Preview Bar */}
            {attachedFiles.length > 0 && (
              <div className="flex items-center gap-2 mb-2 overflow-x-auto pb-1">
                {attachedFiles.map((f, i) => (
                  <div key={i} className="flex items-center space-x-2 bg-amber-50 text-amber-950 px-3 py-1.5 rounded-xl text-xs border border-amber-300 shadow-2xs">
                    {f.type === 'image' ? <ImageIcon className="w-4 h-4 text-amber-600 shrink-0" /> : <FileText className="w-4 h-4 text-emerald-600 shrink-0" />}
                    <div className="flex flex-col min-w-0">
                      <span className="font-semibold max-w-[140px] truncate leading-tight">{f.name}</span>
                      {f.size && (
                        <span className="text-[10px] text-amber-800 font-medium">
                          {f.size} {f.originalSize && f.originalSize !== f.size ? `(from ${f.originalSize})` : ''}
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => setAttachedFiles(prev => prev.filter((_, idx) => idx !== i))}
                      className="text-amber-600 hover:text-rose-600 p-0.5 rounded-lg hover:bg-rose-50 transition-colors ml-1"
                      title="Remove attachment"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSendMessage} className="space-y-2">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                multiple
                className="hidden"
                accept="image/*,.pdf,.doc,.docx,.txt,.csv,.json,.zip"
              />

              <div className="relative flex items-center">
                <textarea
                  rows={2}
                  placeholder={`Send a message to ${selectedRecipientName}...`}
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  className="w-full p-3 pr-24 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 resize-none"
                />

                <div className="absolute right-3 bottom-3 flex items-center space-x-1">
                  <button
                    type="button"
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition-colors"
                    title="Emoji Reactions"
                  >
                    <Smile className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={handleTriggerFileUpload}
                    className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition-colors"
                    title="Upload Local File or Image"
                  >
                    <Paperclip className="w-4 h-4" />
                  </button>

                  <button
                    type="submit"
                    disabled={(!messageInput.trim() && attachedFiles.length === 0) || isProcessingFile}
                    className="p-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 disabled:opacity-40 text-slate-950 font-black rounded-xl transition-colors shadow-xs"
                    title="Send Message"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Action Strip: Mention Task, Quick Emojis */}
              <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowTaskPicker(!showTaskPicker)}
                    className="text-[11px] font-bold text-amber-700 hover:text-amber-900 hover:underline flex items-center space-x-1"
                  >
                    <Sparkles className="w-3 h-3 text-amber-500" />
                    <span>Reference Task</span>
                  </button>
                  <span>•</span>
                  <span className="text-[10px] text-slate-400">Press Enter to send, Shift+Enter for new line</span>
                </div>

                {/* Quick Emoji Strip */}
                {showEmojiPicker && (
                  <div className="flex items-center space-x-1 bg-white border border-slate-200 shadow-md p-1.5 rounded-xl animate-in fade-in zoom-in-95">
                    {commonEmojis.map((e) => (
                      <button
                        key={e}
                        type="button"
                        onClick={() => {
                          setMessageInput(prev => prev + e);
                          setShowEmojiPicker(false);
                        }}
                        className="p-1 hover:bg-amber-50 rounded text-sm"
                      >
                        {e}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Task Reference Modal/Dropdown */}
              {showTaskPicker && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2 max-h-40 overflow-y-auto">
                  <p className="text-[10px] font-bold text-slate-500 uppercase">Select a task to reference in chat:</p>
                  <div className="space-y-1">
                    {tasks.map((task) => (
                      <button
                        key={task.id}
                        type="button"
                        onClick={() => handleInsertTaskReference(task)}
                        className="w-full text-left px-2.5 py-1.5 bg-white hover:bg-amber-50 rounded-lg text-xs text-slate-800 border border-slate-200/80 flex items-center justify-between"
                      >
                        <span className="truncate font-semibold">{task.title}</span>
                        <span className="text-[10px] bg-amber-100 text-amber-900 px-1.5 py-0.2 rounded font-extrabold shrink-0 ml-2">
                          {task.status}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </form>
          </div>
        </div>

        {/* RIGHT SIDEBAR: Member Info (When toggled) */}
        {showMemberDetails && selectedRecipientType === 'direct' && selectedUser && (
          <div className="w-72 bg-slate-50 border-l border-slate-200 p-5 overflow-y-auto space-y-5 animate-in slide-in-from-right-5 duration-200 shrink-0">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider">Member Details</h3>
              <button
                onClick={() => setShowMemberDetails(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-center space-y-2">
              <img
                src={selectedUser.photoURL}
                alt={selectedUser.displayName}
                className="w-16 h-16 rounded-full object-cover border-2 border-amber-500 mx-auto shadow-sm"
              />
              <div>
                <h4 className="text-sm font-bold text-slate-900">{selectedUser.displayName}</h4>
                <p className="text-xs text-slate-500">{selectedUser.title}</p>
                <span className="inline-block mt-1 text-[10px] font-bold uppercase px-2 py-0.5 bg-amber-100 text-amber-900 rounded-full">
                  {selectedUser.department}
                </span>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-white p-3 rounded-xl border border-slate-200/80 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Status</span>
                <p className="text-slate-700 italic">{selectedUser.statusMessage || 'Available for collaboration'}</p>
              </div>

              <div className="bg-white p-3 rounded-xl border border-slate-200/80 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Email Contact</span>
                <p className="text-slate-800 font-semibold">{selectedUser.email}</p>
              </div>

              {selectedUser.phone && (
                <div className="bg-white p-3 rounded-xl border border-slate-200/80 space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Phone</span>
                  <p className="text-slate-800 font-semibold">{selectedUser.phone}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Image Zoom / Download Modal */}
      {previewModalImage && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border border-slate-200">
            <div className="p-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <span className="font-bold text-xs text-slate-800 truncate">{previewModalImage.name}</span>
              <div className="flex items-center space-x-2">
                <a
                  href={previewModalImage.url}
                  download={previewModalImage.name}
                  className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-slate-200/60 rounded-xl transition-colors"
                  title="Download Image"
                >
                  <Download className="w-4 h-4" />
                </a>
                <button
                  onClick={() => setPreviewModalImage(null)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="p-4 bg-slate-900/95 flex items-center justify-center overflow-auto max-h-[80vh]">
              <img src={previewModalImage.url} alt={previewModalImage.name} className="max-w-full max-h-[72vh] object-contain rounded-lg shadow-lg" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
