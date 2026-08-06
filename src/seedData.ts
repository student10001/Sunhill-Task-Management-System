import { UserProfile, Project, Task, Milestone, ActivityLog, NotificationItem, ProjectNote, ChatMessage } from './types';

export const INITIAL_USERS: UserProfile[] = [
  {
    uid: 'user_mildred_admin',
    displayName: 'Mildred M. Nicasio-Malaluan',
    email: 'mildred.malaluan@sunhill.com',
    photoURL: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    role: 'admin',
    title: 'System Administrator & Executive Director',
    department: 'Executive Administration & Management',
    phone: '+1 (555) 019-2834',
    location: 'Sunhill Headquarters',
    statusMessage: '🔒 System Administration & Security Governance',
    pinCode: '12345678',
    generalResponsibilities: [
      'System administration, executive security policy management, and user access oversight',
      'Strategic roadmap governance and resource budget approval',
      'Personnel task tracking, performance metrics evaluation, and security compliance'
    ],
    specificResponsibilities: [
      'Manage administrative security levels, role-based access control, and credentials',
      'Authorize project milestone approvals and review cross-department task allocations',
      'Oversee system audit logs and data integrity governance'
    ],
    joinedAt: '2024-01-01',
    activeProjectIds: ['proj_cloud_migration', 'proj_mobile_v2', 'proj_security_audit', 'proj_ai_analytics']
  },
  {
    uid: 'user_alex_manager',
    displayName: 'Alex Vance',
    email: 'alex.vance@techcorp.com',
    photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    role: 'admin',
    title: 'System Administrator & Director of Engineering',
    department: 'Engineering & Executive Admin',
    phone: '+1 (555) 234-5678',
    location: 'San Francisco, CA',
    statusMessage: '🎯 Sprint 24 planning & team capacity optimization',
    pinCode: '1234',
    generalResponsibilities: [
      'Overarching strategic planning and roadmap execution for engineering teams',
      'Team resource allocation, performance tracking, and career growth mentorship',
      'Cross-departmental alignment with product, design, and executive leadership',
      'Resource budgeting, vendor selection, and platform SLA governance'
    ],
    specificResponsibilities: [
      'Conduct weekly 1-on-1 performance syncs with team leads and individual contributors',
      'Review and approve high-priority feature specifications and architecture RFCs',
      'Monitor real-time workflow completion metrics and mitigate project bottlenecks',
      'Oversee quarterly milestone compliance and report progress to executive stakeholders'
    ],
    joinedAt: '2024-01-15',
    activeProjectIds: ['proj_cloud_migration', 'proj_mobile_v2', 'proj_security_audit']
  },
  {
    uid: 'user_sarah_lead',
    displayName: 'Sarah Lin',
    email: 'sarah.lin@techcorp.com',
    photoURL: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
    role: 'member',
    title: 'Lead Systems Architect',
    department: 'Backend Architecture',
    phone: '+1 (555) 876-5432',
    location: 'Austin, TX',
    statusMessage: '⚡ Refactoring real-time sync engine & database rules',
    pinCode: '1234',
    generalResponsibilities: [
      'Designing scalable, resilient microservice architectures and API contracts',
      'Maintaining database schema definitions, security compliance, and data sync layers',
      'Guiding senior engineers on best coding practices and automated testing standards'
    ],
    specificResponsibilities: [
      'Lead backend implementation for Cloud Infrastructure Upgrade & Firestore sync',
      'Perform peer code reviews for core security, authentication, and database modules',
      'Optimize query throughput, database indexing, and real-time event distribution'
    ],
    joinedAt: '2024-03-10',
    activeProjectIds: ['proj_cloud_migration', 'proj_security_audit']
  },
  {
    uid: 'user_marcus_frontend',
    displayName: 'Marcus Chen',
    email: 'marcus.chen@techcorp.com',
    photoURL: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    role: 'member',
    title: 'Senior Frontend Engineer',
    department: 'Product UI/UX',
    phone: '+1 (555) 456-7890',
    location: 'Seattle, WA',
    statusMessage: '🎨 Building intuitive calendar widgets & performance dashboards',
    generalResponsibilities: [
      'Developing high-performance, accessible web interfaces and design systems',
      'Integrating state management with backend APIs and real-time push subscriptions',
      'Collaborating with UX designers to refine interactive component animations'
    ],
    specificResponsibilities: [
      'Implement real-time task progress trackers and interactive team calendar views',
      'Integrate push notification triggers for deadline alerts across mobile & web',
      'Maintain component test coverage and responsiveness across desktop & mobile viewports'
    ],
    joinedAt: '2024-06-01',
    activeProjectIds: ['proj_mobile_v2', 'proj_cloud_migration']
  },
  {
    uid: 'user_elena_devops',
    displayName: 'Elena Rostova',
    email: 'elena.rostova@techcorp.com',
    photoURL: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    role: 'member',
    title: 'DevOps & Reliability Specialist',
    department: 'Cloud Infrastructure',
    phone: '+1 (555) 345-6789',
    location: 'Remote, US',
    statusMessage: '🚀 Automated CI/CD pipeline deployment & security scanning',
    generalResponsibilities: [
      'Managing Cloud Run container orchestration, VPC routing, and deployment pipelines',
      'Enforcing strict role-based access controls and infrastructure monitoring',
      'Conducting load tests and ensuring zero-downtime database migrations'
    ],
    specificResponsibilities: [
      'Maintain automated deployments and secrets rotation via Cloud Key Vault',
      'Configure real-time error logging, performance telemetry, and health check alerts',
      'Audit role-based permissions and ensure Firestore security rules compliance'
    ],
    joinedAt: '2024-08-20',
    activeProjectIds: ['proj_security_audit', 'proj_cloud_migration']
  }
];

export const INITIAL_PROJECTS: Project[] = [
  {
    id: 'proj_cloud_migration',
    name: 'Cloud Native Infrastructure & Real-Time Sync',
    description: 'Upgrading core microservices to cloud containerized infrastructure with real-time Firestore sync & encrypted state management.',
    color: '#3b82f6', // blue
    status: 'in_progress',
    startDate: '2026-07-01',
    endDate: '2026-08-15',
    managerId: 'user_alex_manager',
    managerName: 'Alex Vance',
    memberIds: ['user_alex_manager', 'user_sarah_lead', 'user_marcus_frontend', 'user_elena_devops'],
    completionPercentage: 68,
    category: 'Infrastructure',
    budget: 45000,
    tags: ['Cloud', 'Realtime', 'Database', 'Urgent']
  },
  {
    id: 'proj_mobile_v2',
    name: 'Mobile & Web App Redesign v2.0',
    description: 'Refreshing user interface, adding intuitive team calendar views, push deadline notifications, and personnel profile dashboards.',
    color: '#8b5cf6', // purple
    status: 'in_progress',
    startDate: '2026-07-10',
    endDate: '2026-08-30',
    managerId: 'user_alex_manager',
    managerName: 'Alex Vance',
    memberIds: ['user_alex_manager', 'user_marcus_frontend'],
    completionPercentage: 52,
    category: 'Product UI',
    budget: 32000,
    tags: ['Frontend', 'Calendar', 'Mobile', 'UI']
  },
  {
    id: 'proj_security_audit',
    name: 'Enterprise RBAC & Security Audit',
    description: 'Implementing role-based access control, security rule enforcement, third-party authentication, and privacy compliance.',
    color: '#10b981', // green
    status: 'in_progress',
    startDate: '2026-07-15',
    endDate: '2026-08-20',
    managerId: 'user_alex_manager',
    managerName: 'Alex Vance',
    memberIds: ['user_alex_manager', 'user_sarah_lead', 'user_elena_devops'],
    completionPercentage: 80,
    category: 'Security',
    budget: 25000,
    tags: ['Security', 'RBAC', 'Compliance']
  },
  {
    id: 'proj_ai_analytics',
    name: 'Real-Time Performance Analytics Suite',
    description: 'Centralizing team productivity metrics, manager velocity tracking, and automated progress report generation.',
    color: '#f59e0b', // amber
    status: 'planning',
    startDate: '2026-08-01',
    endDate: '2026-09-15',
    managerId: 'user_alex_manager',
    managerName: 'Alex Vance',
    memberIds: ['user_alex_manager', 'user_sarah_lead', 'user_marcus_frontend'],
    completionPercentage: 20,
    category: 'Analytics',
    budget: 28000,
    tags: ['Analytics', 'Manager View', 'Reporting']
  }
];

export const INITIAL_TASKS: Task[] = [
  {
    id: 'task_001',
    title: 'Deploy Real-Time Database Security Rules',
    description: 'Audit and deploy updated firestore.rules to enforce role-based access control for managers vs team members.',
    projectId: 'proj_security_audit',
    projectName: 'Enterprise RBAC & Security Audit',
    assigneeId: 'user_sarah_lead',
    assigneeName: 'Sarah Lin',
    assigneePhoto: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
    creatorId: 'user_alex_manager',
    creatorName: 'Alex Vance',
    priority: 'urgent',
    status: 'in_progress',
    dueDate: '2026-07-30',
    estimatedHours: 8,
    loggedHours: 6,
    createdAt: '2026-07-25T10:00:00Z',
    subtasks: [
      { id: 'st_1', title: 'Draft Security Rules in firestore.rules', completed: true },
      { id: 'st_2', title: 'Test user permission enforcement', completed: true },
      { id: 'st_3', title: 'Deploy via deploy_firebase tool', completed: false }
    ]
  },
  {
    id: 'task_002',
    title: 'Build Team Project Calendar Component',
    description: 'Develop interactive shared calendar with month/week views, third-party iCal export, and Google Calendar sync link generator.',
    projectId: 'proj_mobile_v2',
    projectName: 'Mobile & Web App Redesign v2.0',
    assigneeId: 'user_marcus_frontend',
    assigneeName: 'Marcus Chen',
    assigneePhoto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    creatorId: 'user_alex_manager',
    creatorName: 'Alex Vance',
    priority: 'urgent',
    status: 'in_progress',
    dueDate: '2026-07-31',
    estimatedHours: 16,
    loggedHours: 12,
    createdAt: '2026-07-26T09:30:00Z',
    subtasks: [
      { id: 'st_11', title: 'Design calendar grid & month layout', completed: true },
      { id: 'st_12', title: 'Add project timeline badges & date selection', completed: true },
      { id: 'st_13', title: 'Implement .ics calendar exporter', completed: true },
      { id: 'st_14', title: 'Add Google Calendar event generator link', completed: false }
    ]
  },
  {
    id: 'task_003',
    title: 'Configure Web Push Notification Alerts',
    description: 'Set up browser push notifications for upcoming task deadlines (<24h) and urgent assignments with sound toggles.',
    projectId: 'proj_mobile_v2',
    projectName: 'Mobile & Web App Redesign v2.0',
    assigneeId: 'user_marcus_frontend',
    assigneeName: 'Marcus Chen',
    assigneePhoto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    creatorId: 'user_alex_manager',
    creatorName: 'Alex Vance',
    priority: 'high',
    status: 'in_review',
    dueDate: '2026-08-01',
    estimatedHours: 10,
    loggedHours: 9,
    createdAt: '2026-07-27T11:15:00Z',
    subtasks: [
      { id: 'st_21', title: 'Browser notification permission trigger', completed: true },
      { id: 'st_22', title: 'Deadline countdown scanner loop', completed: true },
      { id: 'st_23', title: 'Toast banner fallback drawer', completed: true }
    ]
  },
  {
    id: 'task_004',
    title: 'Setup Automated CI/CD Deployment Pipeline',
    description: 'Configure Cloud Run Docker build verification, esbuild bundling, and static asset caching.',
    projectId: 'proj_cloud_migration',
    projectName: 'Cloud Native Infrastructure & Real-Time Sync',
    assigneeId: 'user_elena_devops',
    assigneeName: 'Elena Rostova',
    assigneePhoto: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    creatorId: 'user_alex_manager',
    creatorName: 'Alex Vance',
    priority: 'high',
    status: 'completed',
    dueDate: '2026-07-28',
    estimatedHours: 12,
    loggedHours: 11,
    createdAt: '2026-07-20T14:00:00Z',
    completedAt: '2026-07-28T16:30:00Z',
    subtasks: [
      { id: 'st_31', title: 'Write container environment variables', completed: true },
      { id: 'st_32', title: 'Verify build script esbuild CJS bundle', completed: true }
    ]
  },
  {
    id: 'task_005',
    title: 'Design Manager Performance Analytics Dashboard',
    description: 'Create centralized analytics charts visualizing overall completion %, team velocity, and personnel workload balancing.',
    projectId: 'proj_ai_analytics',
    projectName: 'Real-Time Performance Analytics Suite',
    assigneeId: 'user_alex_manager',
    assigneeName: 'Alex Vance',
    assigneePhoto: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    creatorId: 'user_alex_manager',
    creatorName: 'Alex Vance',
    priority: 'medium',
    status: 'todo',
    dueDate: '2026-08-05',
    estimatedHours: 14,
    loggedHours: 2,
    createdAt: '2026-07-28T08:00:00Z'
  },
  {
    id: 'task_006',
    title: 'User Profile & Job Responsibilities View',
    description: 'Construct profile view showcasing assigned tasks, active project contributions, milestones achieved, and general/specific job duties.',
    projectId: 'proj_mobile_v2',
    projectName: 'Mobile & Web App Redesign v2.0',
    assigneeId: 'user_marcus_frontend',
    assigneeName: 'Marcus Chen',
    assigneePhoto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    creatorId: 'user_alex_manager',
    creatorName: 'Alex Vance',
    priority: 'high',
    status: 'completed',
    dueDate: '2026-07-29',
    estimatedHours: 10,
    loggedHours: 10,
    createdAt: '2026-07-25T12:00:00Z',
    completedAt: '2026-07-29T14:15:00Z',
    subtasks: [
      { id: 'st_41', title: 'Profile details header and job responsibilities list', completed: true },
      { id: 'st_42', title: 'Active project contributions breakdown', completed: true },
      { id: 'st_43', title: 'Completed milestones timeline & badges', completed: true }
    ]
  }
];

export const INITIAL_MILESTONES: Milestone[] = [
  {
    id: 'ms_01',
    projectId: 'proj_cloud_migration',
    projectName: 'Cloud Native Infrastructure & Real-Time Sync',
    title: 'Phase 1: Real-time Firestore Database Bootstrap',
    description: 'Provisioning multi-region Firestore and establishing synchronized collection listeners.',
    dueDate: '2026-07-20',
    completed: true,
    completedBy: 'user_sarah_lead',
    completedByName: 'Sarah Lin',
    completedAt: '2026-07-19T18:00:00Z'
  },
  {
    id: 'ms_02',
    projectId: 'proj_security_audit',
    projectName: 'Enterprise RBAC & Security Audit',
    title: 'Phase 2: Role-Based Access Control Enforcement',
    description: 'Enforcing granular manager vs member permissions across all system modules.',
    dueDate: '2026-08-02',
    completed: false
  },
  {
    id: 'ms_03',
    projectId: 'proj_mobile_v2',
    projectName: 'Mobile & Web App Redesign v2.0',
    title: 'Phase 3: Shared Team Calendar & Push Deadline Alerts',
    description: 'Full rollout of calendar scheduling, third-party exports, and web push notifications.',
    dueDate: '2026-08-10',
    completed: false
  }
];

export const INITIAL_ACTIVITY_LOGS: ActivityLog[] = [
  {
    id: 'act_1',
    userId: 'user_alex_manager',
    userName: 'Alex Vance',
    userPhoto: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    action: 'created task',
    targetType: 'task',
    targetName: 'Build Team Project Calendar Component',
    timestamp: '2026-07-29T17:30:00Z',
    details: 'Assigned to Marcus Chen with Urgent priority'
  },
  {
    id: 'act_2',
    userId: 'user_marcus_frontend',
    userName: 'Marcus Chen',
    userPhoto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    action: 'completed task',
    targetType: 'task',
    targetName: 'User Profile & Job Responsibilities View',
    timestamp: '2026-07-29T14:15:00Z',
    details: 'Logged 10 total development hours'
  },
  {
    id: 'act_3',
    userId: 'user_sarah_lead',
    userName: 'Sarah Lin',
    userPhoto: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
    action: 'updated milestone',
    targetType: 'milestone',
    targetName: 'Phase 1: Real-time Firestore Database Bootstrap',
    timestamp: '2026-07-28T11:20:00Z',
    details: 'Marked milestone as completed ahead of deadline'
  }
];

export const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'notif_1',
    userId: 'all',
    title: '⏰ Urgent Deadline Approaching',
    message: 'Deploy Real-Time Database Security Rules is due in less than 24 hours (July 30).',
    type: 'deadline',
    read: false,
    createdAt: '2026-07-29T16:00:00Z',
    priority: 'high'
  },
  {
    id: 'notif_2',
    userId: 'user_marcus_frontend',
    title: '📌 Task Assigned',
    message: 'Alex Vance assigned "Build Team Project Calendar Component" to you.',
    type: 'assignment',
    read: true,
    createdAt: '2026-07-29T12:00:00Z'
  }
];

export const INITIAL_PROJECT_NOTES: ProjectNote[] = [
  {
    id: 'note_1',
    userId: 'user_alex_manager',
    userName: 'Alex Vance',
    projectId: 'proj_cloud_migration',
    projectName: 'Cloud Infrastructure Upgrade',
    title: 'Migration Phase 1 Technical Sync',
    content: 'Completed initial cluster deployment tests. Next focus is auditing latency metrics and updating backup retention policies.',
    createdAt: '2026-08-01T10:00:00Z'
  },
  {
    id: 'note_2',
    userId: 'user_sarah_lead',
    userName: 'Sarah Lin',
    projectId: 'proj_cloud_migration',
    projectName: 'Cloud Infrastructure Upgrade',
    title: 'Database Rule Audit Notes',
    content: 'Refactored security rules to enforce ABAC on subcollections. All security rule validation tests pass cleanly.',
    createdAt: '2026-08-02T14:30:00Z'
  }
];

export const INITIAL_CHAT_MESSAGES: ChatMessage[] = [
  {
    id: 'msg_1',
    senderId: 'user_sarah_lead',
    senderName: 'Sarah Lin',
    senderPhoto: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
    recipientId: 'general',
    recipientType: 'channel',
    recipientName: '# general-chat',
    content: 'Good morning team! The Sprint 24 Firestore sync patch has been merged to main. All real-time channels are active.',
    timestamp: new Date(Date.now() - 3600000 * 4).toISOString(),
    readBy: ['user_sarah_lead', 'user_alex_manager', 'user_marcus_frontend', 'user_elena_devops', 'user_david_security'],
    reactions: [{ emoji: '🚀', userIds: ['user_alex_manager', 'user_marcus_frontend'] }]
  },
  {
    id: 'msg_2',
    senderId: 'user_alex_manager',
    senderName: 'Alex Vance',
    senderPhoto: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    recipientId: 'general',
    recipientType: 'channel',
    recipientName: '# general-chat',
    content: 'Awesome work Sarah! Marcus, could you check the calendar widget integration with the new snapshot listener?',
    timestamp: new Date(Date.now() - 3600000 * 3).toISOString(),
    readBy: ['user_sarah_lead', 'user_alex_manager', 'user_marcus_frontend', 'user_elena_devops', 'user_david_security']
  },
  {
    id: 'msg_3',
    senderId: 'user_marcus_frontend',
    senderName: 'Marcus Chen',
    senderPhoto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    recipientId: 'general',
    recipientType: 'channel',
    recipientName: '# general-chat',
    content: 'On it! Testing responsive layout and offline fallback now. Everything looking crisp.',
    timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
    readBy: ['user_sarah_lead', 'user_alex_manager', 'user_marcus_frontend', 'user_elena_devops', 'user_david_security'],
    reactions: [{ emoji: '👍', userIds: ['user_alex_manager'] }]
  },
  {
    id: 'msg_4',
    senderId: 'user_elena_devops',
    senderName: 'Elena Rostova',
    senderPhoto: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    recipientId: 'proj_cloud_migration',
    recipientType: 'project',
    recipientName: 'Cloud Infrastructure Upgrade',
    content: 'Secrets rotation pipeline successfully verified. All container instances on port 3000 report health status 200 OK.',
    timestamp: new Date(Date.now() - 3600000 * 1.5).toISOString(),
    readBy: ['user_sarah_lead', 'user_alex_manager', 'user_marcus_frontend', 'user_elena_devops', 'user_david_security']
  },
  {
    id: 'msg_5',
    senderId: 'user_sarah_lead',
    senderName: 'Sarah Lin',
    senderPhoto: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
    recipientId: 'user_alex_manager',
    recipientType: 'direct',
    recipientName: 'Alex Vance',
    content: 'Hey Alex, do you have 5 mins for a quick 1-on-1 review on the security audit milestones?',
    timestamp: new Date(Date.now() - 3600000 * 1).toISOString(),
    readBy: ['user_sarah_lead', 'user_alex_manager', 'user_marcus_frontend', 'user_elena_devops', 'user_david_security']
  }
];

