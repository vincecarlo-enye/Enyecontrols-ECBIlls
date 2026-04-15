/**
 * aiContext.js
 * Page-aware context and starter prompts for the AI assistant.
 */

export const PAGE_CONTEXTS = {
  '/admin': {
    page: 'Admin Dashboard',
    role: 'admin',
    description: 'Overview of billing, tenants, units, and operational activity.',
    suggestions: [
      'Summarize outstanding bills',
      'Show pending tenant concerns',
      'Explain this dashboard',
      'What needs attention today?',
    ],
  },
  '/admin/billing': {
    page: 'Billing',
    role: 'admin',
    description: 'Manage bills, billing cycles, and publication status.',
    suggestions: [
      'What bills are unpaid?',
      'Explain billing statuses',
      'How do I publish a bill?',
      'Show recently generated bills',
    ],
  },
  '/admin/tenants': {
    page: 'Tenants',
    role: 'admin',
    description: 'Manage tenant records and their assigned units.',
    suggestions: [
      'How do I add a tenant?',
      'Show active tenants',
      'Explain tenant fields',
      'How do I assign a unit?',
    ],
  },
  '/admin/units': {
    page: 'Units',
    role: 'admin',
    description: 'Manage unit availability, occupancy, and configuration.',
    suggestions: [
      'Show occupied units',
      'How do unit statuses work?',
      'How are units linked to tenants?',
      'How do I add a new unit?',
    ],
  },
  '/admin/usage-reports': {
    page: 'Usage Reports',
    role: 'admin',
    description: 'Review utility usage analytics and trends.',
    suggestions: [
      'Compare electricity and water trends',
      'Show recent spikes',
      'Explain this chart',
      'How do I export this report?',
    ],
  },
  '/admin/tenant-reports': {
    page: 'Tenant Reports',
    role: 'admin',
    description: 'Review tenant billing concerns and dispute handling.',
    suggestions: [
      'Show unresolved billing concerns',
      'Explain concern statuses',
      'How do I assign a concern?',
      'What is pending today?',
    ],
  },
  '/admin/anomalies': {
    page: 'Anomalies',
    role: 'admin',
    description: 'Monitor anomalies across the system and oversee resolution progress.',
    suggestions: [
      'Show critical anomalies',
      'Explain the anomaly summary',
      'What should be escalated today?',
      'Show unresolved alerts',
    ],
  },
  '/super-admin': {
    page: 'Super Admin Dashboard',
    role: 'super_admin',
    description: 'System-wide executive overview, summaries, and governance controls.',
    suggestions: [
      'Summarize system activity',
      'Show critical anomalies today',
      'What needs executive attention?',
      'Open billing overview',
    ],
  },
  '/super-admin/billing': {
    page: 'Billing',
    role: 'super_admin',
    description: 'System-wide billing oversight.',
    suggestions: [
      'Summarize unpaid bills',
      'Show recent bill generation activity',
      'Explain billing flow',
      'What needs attention here?',
    ],
  },
  '/super-admin/meters': {
    page: 'Meter Management',
    role: 'super_admin',
    description: 'Register, manage, and organize utility meters.',
    suggestions: [
      'How do I add a meter?',
      'Explain meter types',
      'What does Other meter mean?',
      'Show meters needing attention',
    ],
  },
  '/super-admin/billing-rates': {
    page: 'Billing Rates',
    role: 'super_admin',
    description: 'Configure electricity, water, and thermal rates.',
    suggestions: [
      'How are rates applied?',
      'What changes when rates are updated?',
      'Explain current billing rates',
      'Which rate affects tenants most?',
    ],
  },
  '/super-admin/users': {
    page: 'User Management',
    role: 'super_admin',
    description: 'Manage users, roles, and access levels.',
    suggestions: [
      'How do I add a user?',
      'Explain role differences',
      'How do I suspend an account?',
      'What can each role access?',
    ],
  },
  '/super-admin/announcements': {
    page: 'Announcements',
    role: 'super_admin',
    description: 'Manage system-wide announcements and visibility.',
    suggestions: [
      'How do I post an announcement?',
      'Who can see announcements?',
      'Show active announcements',
      'Explain announcement visibility',
    ],
  },
  '/tenant': {
    page: 'Tenant Dashboard',
    role: 'tenant',
    description: 'View your account summary, bills, and usage insights.',
    suggestions: [
      'What is my current balance?',
      'Show my latest bill',
      'Why did my usage increase?',
      'When is my next due date?',
    ],
  },
  '/tenant/bills': {
    page: 'My Bills',
    role: 'tenant',
    description: 'View your bills and submit payment receipts.',
    suggestions: [
      'Show my unpaid bills',
      'How do I submit a payment?',
      'Explain my bill status',
      'What charges are on my latest bill?',
    ],
  },
  '/tenant/usage': {
    page: 'Usage',
    role: 'tenant',
    description: 'Track your meter usage and consumption patterns.',
    suggestions: [
      'Show my recent usage trend',
      'Why is my bill higher this month?',
      'Explain my consumption data',
      'How can I reduce usage?',
    ],
  },
  '/tenant/billing-reports': {
    page: 'Billing Reports',
    role: 'tenant',
    description: 'Track your submitted billing concerns.',
    suggestions: [
      'Show my open concerns',
      'How do I reopen a ticket?',
      'Explain concern status',
      'What did finance say about my concern?',
    ],
  },
  '/tenant/profile': {
    page: 'Profile',
    role: 'tenant',
    description: 'Manage your profile and account information.',
    suggestions: [
      'What profile info can I update?',
      'How do I change my password?',
      'Show my unit details',
      'What account info is saved here?',
    ],
  },
  '/finance': {
    page: 'Finance Dashboard',
    role: 'finance',
    description: 'Monitor collections, payments, and financial performance.',
    suggestions: [
      'Show pending payment reviews',
      'What is the collection rate?',
      'Summarize outstanding balances',
      'Explain this finance dashboard',
    ],
  },
  '/finance/billing': {
    page: 'Billing Management',
    role: 'finance',
    description: 'Generate, publish, and manage billing records.',
    suggestions: [
      'How do I generate a bill?',
      'Show draft bills',
      'Explain bill generation flow',
      'What is waiting for publication?',
    ],
  },
  '/finance/payment-review': {
    page: 'Payment Review',
    role: 'finance',
    description: 'Review submitted payments and update their status.',
    suggestions: [
      'Show pending payment reviews',
      'How do I approve a receipt?',
      'How do I reject a payment?',
      'What happens after approval?',
    ],
  },
  '/finance/billing-tickets': {
    page: 'Billing Tickets',
    role: 'finance',
    description: 'Investigate and resolve finance-assigned billing concerns.',
    suggestions: [
      'Show assigned tickets',
      'What should I investigate first?',
      'Explain ticket statuses',
      'How do I resolve a ticket?',
    ],
  },
  '/finance/reports': {
    page: 'Finance Reports',
    role: 'finance',
    description: 'Analyze collections, revenue, and finance trends.',
    suggestions: [
      'Summarize monthly collections',
      'Show outstanding balances',
      'Explain revenue breakdown',
      'What changed this month?',
    ],
  },
  '/facility': {
    page: 'Facility Dashboard',
    role: 'facility_manager',
    description: 'Monitor utilities, equipment, anomalies, and maintenance activity.',
    suggestions: [
      'Show current anomalies',
      'Which equipment needs attention?',
      'Summarize utility spikes',
      'What maintenance is open?',
    ],
  },
  '/facility/monitoring': {
    page: 'Monitoring',
    role: 'facility_manager',
    description: 'Track live utility and equipment monitoring data.',
    suggestions: [
      'Show abnormal meters',
      'Explain live load data',
      'Which floor has the highest usage?',
      'What changed today?',
    ],
  },
  '/facility/consumption': {
    page: 'Consumption',
    role: 'facility_manager',
    description: 'Analyze utility consumption by unit and trend.',
    suggestions: [
      'Show top-consuming units',
      'Compare utility usage',
      'Explain this consumption chart',
      'Where are the spikes?',
    ],
  },
  '/facility/anomalies': {
    page: 'Anomalies',
    role: 'facility_manager',
    description: 'Review AI-detected anomalies and respond to them.',
    suggestions: [
      'Show critical anomalies',
      'What is the likely cause here?',
      'What action should I take first?',
      'Show unresolved alerts',
    ],
  },
  '/facility/maintenance': {
    page: 'Maintenance',
    role: 'facility_manager',
    description: 'Track and update maintenance work items.',
    suggestions: [
      'Show open maintenance tickets',
      'What is in progress?',
      'How do I resolve a ticket?',
      'Summarize maintenance status',
    ],
  },
  '/facility/equipment': {
    page: 'Equipment',
    role: 'facility_manager',
    description: 'Monitor equipment and meter status across the building.',
    suggestions: [
      'Show offline equipment',
      'Which meters are in warning state?',
      'Explain equipment status',
      'What should I inspect today?',
    ],
  },
  '/facility/reports': {
    page: 'Facility Reports',
    role: 'facility_manager',
    description: 'Review facility operations reports and utility trends.',
    suggestions: [
      'Summarize daily energy',
      'Show peak usage periods',
      'Explain efficiency summary',
      'What anomalies are recurring?',
    ],
  },
}

const ECBILLS_SCOPE_KEYWORDS = [
  'ec bills',
  'ecbills',
  'billing',
  'bill',
  'transaction',
  'transactions',
  'tenant',
  'unit',
  'meter',
  'usage',
  'consumption',
  'payment',
  'payments',
  'receipt',
  'rate',
  'announcement',
  'notification',
  'anomaly',
  'maintenance',
  'equipment',
  'facility',
  'finance',
  'dashboard',
  'report',
  'reading',
  'omni',
  'thermal',
  'electric',
  'electricity',
  'water',
]

const GENERAL_CODE_KEYWORDS = [
  'flutter',
  'react native',
  'android app',
  'ios app',
  'swift',
  'kotlin',
  'laravel code',
  'php code',
  'python code',
  'java code',
  'c# code',
  'html code',
  'css code',
  'javascript code',
  'write code',
  'generate code',
  'create app',
  'build app',
  'code snippet',
  'source code',
  'project code',
  'make me code',
  'gawan mo ako ng code',
  'gumawa ka ng code',
  'write a program',
  'create a program',
  'generate a script',
  'make a script',
]

const CREATION_REQUEST_KEYWORDS = [
  'create',
  'build',
  'design',
  'generate',
  'make',
  'develop',
  'scaffold',
  'prototype',
  'wireframe',
  'layout',
  'ui design',
  'ux design',
  'login design',
  'signup design',
  'dashboard design',
  'new page',
  'new screen',
  'new feature',
  'new module',
  'gawa',
  'gumawa',
  'gawan',
  'idesign',
  'i-design',
]

const SAFE_ASSIST_INTENTS = [
  'explain',
  'summarize',
  'show',
  'check',
  'why',
  'what',
  'how',
  'which',
  'when',
  'where',
  'status',
  'review',
  'analyze',
  'help',
]

export function getPageContext(pathname) {
  if (PAGE_CONTEXTS[pathname]) return PAGE_CONTEXTS[pathname]

  let best = null
  let bestLen = 0
  for (const key of Object.keys(PAGE_CONTEXTS)) {
    if (pathname.startsWith(key) && key.length > bestLen) {
      best = PAGE_CONTEXTS[key]
      bestLen = key.length
    }
  }

  return best || {
    page: 'ECBills',
    role: null,
    description: 'AI-powered billing and utility management system.',
    suggestions: [
      'What can you help me with?',
      'Explain this page',
      'Show me important highlights',
      'How does this system work?',
    ],
  }
}

export function isEcbillsScopedQuestion(question = '', pageContext = {}) {
  const text = String(question || '').toLowerCase().trim()
  if (!text) return true

  const mentionsEcbillsScope = ECBILLS_SCOPE_KEYWORDS.some((keyword) => text.includes(keyword))
  const looksLikeGeneralCoding = GENERAL_CODE_KEYWORDS.some((keyword) => text.includes(keyword))
  const looksLikeCreationRequest = CREATION_REQUEST_KEYWORDS.some((keyword) => text.includes(keyword))
  const looksLikeSafeAssist = SAFE_ASSIST_INTENTS.some((keyword) => text.includes(keyword))
  const isPageExplain =
    text.includes('this page') ||
    text.includes('explain this') ||
    text.includes('what does this mean') ||
    text.includes('how do i use this')

  if (looksLikeGeneralCoding) {
    return false
  }

  if (looksLikeCreationRequest) {
    return false
  }

  if (pageContext?.page) {
    return true
  }

  if (mentionsEcbillsScope || isPageExplain) {
    return true
  }

  return looksLikeSafeAssist && !looksLikeCreationRequest
}

export function getOutOfScopeReply(pageContext = {}) {
  const pageName = pageContext?.page || 'ECBills'

  return `I can only help with explaining, analyzing, and guiding existing ECBills features on this current page (${pageName}). I can't create new code, new UI designs, new pages, Flutter screens, or unrelated development requests here. Ask me to explain records, workflows, statuses, billing, payments, tenants, units, meters, usage, anomalies, notifications, or reports inside ECBills.`
}
