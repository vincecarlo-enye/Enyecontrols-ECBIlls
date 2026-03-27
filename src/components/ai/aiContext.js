/**
 * aiContext.js
 * Maps URL pathnames to contextual page info and starter suggestions.
 * The AI assistant uses this to greet users appropriately and offer
 * relevant quick-action prompts for each section of the app.
 */

export const PAGE_CONTEXTS = {
  // ── Admin ────────────────────────────────────────────────────────
  '/admin': {
    page: 'Dashboard',
    role: 'Admin',
    description: 'Overview of billing, tenants, and system activity.',
    suggestions: [
      'Summarize outstanding bills',
      'How do I create a new bill?',
      'Show me pending payments',
      'What are this month\'s highlights?',
    ],
  },
  '/admin/billing': {
    page: 'Billing',
    role: 'Admin',
    description: 'Manage and track all tenant bills.',
    suggestions: [
      'How do I publish a bill?',
      'What bills are unpaid?',
      'Explain billing statuses',
      'How to download a bill PDF?',
    ],
  },
  '/admin/billing/new': {
    page: 'New Bill',
    role: 'Admin',
    description: 'Create a new billing statement.',
    suggestions: [
      'What fields are required?',
      'How are utility charges calculated?',
      'Can I save as draft?',
      'Explain the rate configuration',
    ],
  },
  '/admin/tenants': {
    page: 'Tenants',
    role: 'Admin',
    description: 'Manage tenant records and assignments.',
    suggestions: [
      'How to add a new tenant?',
      'How do I assign a unit?',
      'What info is stored per tenant?',
      'How to remove a tenant?',
    ],
  },
  '/admin/units': {
    page: 'Units',
    role: 'Admin',
    description: 'Manage building units and meter assignments.',
    suggestions: [
      'How to add a unit?',
      'How are meters linked to units?',
      'What does "vacant" mean?',
      'Can I bulk update units?',
    ],
  },
  '/admin/meters': {
    page: 'Meter Management',
    role: 'Super Admin',
    description: 'Register and configure utility meters.',
    suggestions: [
      'How to add a new meter?',
      'What meter types are available?',
      'How do I assign a meter to a unit?',
      'Explain the "Other" meter type',
    ],
  },
  '/admin/billing-rates': {
    page: 'Billing Rates',
    role: 'Super Admin',
    description: 'Configure utility billing rates.',
    suggestions: [
      'How are rates applied?',
      'What is the electricity rate unit?',
      'Can I set rates per unit?',
      'When do rate changes take effect?',
    ],
  },
  '/admin/users': {
    page: 'User Management',
    role: 'Super Admin',
    description: 'Manage system users and roles.',
    suggestions: [
      'How to create a new user?',
      'What roles are available?',
      'How do I reset a password?',
      'How to suspend a user?',
    ],
  },
  '/admin/usage-reports': {
    page: 'Usage Reports',
    role: 'Admin',
    description: 'View utility consumption analytics.',
    suggestions: [
      'Which unit uses the most electricity?',
      'How to export a report?',
      'Explain the consumption chart',
      'Compare monthly usage trends',
    ],
  },
  '/admin/announcements': {
    page: 'Announcements',
    role: 'Super Admin',
    description: 'Post and manage system-wide announcements.',
    suggestions: [
      'How to create an announcement?',
      'Who can see announcements?',
      'Can I schedule announcements?',
      'How to delete old announcements?',
    ],
  },
  '/admin/tenant-reports': {
    page: 'Tenant Reports',
    role: 'Super Admin',
    description: 'View and manage reports related to tenant activities.',
    suggestions: [
      'How to generate a tenant report?',
      'What information is included in the report?',
      'Can I customize the report format?',
      'How to export a tenant report?',
    ],
  },
  '/admin/settings': {
    page: 'Settings',
    role: 'Super Admin',
    description: 'Manage system settings and configurations.',
    suggestions: [
      'How to update system settings?',
      'What are the default billing parameters?',
      'Can I change the currency?',
      'How to enable two-factor authentication?',
    ],
  },
  '/super-admin': {
    page: 'Dashboard',
    role: 'Super Admin',
    description: 'System-wide overview and control center.',
    suggestions: [
      'Show system highlights',
      'What needs attention today?',
      'Summarize platform activity',
      'Open meter management',
    ],
  },
  '/super-admin/billing': {
    page: 'Billing',
    role: 'Super Admin',
    description: 'Manage and track all tenant bills.',
    suggestions: [
      'How do I publish a bill?',
      'What bills are unpaid?',
      'Explain billing statuses',
      'How to download a bill PDF?',
    ],
  },
  '/super-admin/tenants': {
    page: 'Tenants',
    role: 'Super Admin',
    description: 'Manage tenant records and assignments.',
    suggestions: [
      'How to add a new tenant?',
      'How do I assign a unit?',
      'What info is stored per tenant?',
      'How to remove a tenant?',
    ],
  },
  '/super-admin/units': {
    page: 'Units',
    role: 'Super Admin',
    description: 'Manage building units and assignments.',
    suggestions: [
      'How to add a unit?',
      'Show occupied units',
      'How do unit statuses work?',
      'Can I update a unit?',
    ],
  },
  '/super-admin/usage-reports': {
    page: 'Usage Reports',
    role: 'Super Admin',
    description: 'View utility consumption analytics.',
    suggestions: [
      'How to export a report?',
      'Compare utility trends',
      'Which utility is highest?',
      'Show last 7 days usage',
    ],
  },
  '/super-admin/tenant-reports': {
    page: 'Tenant Reports',
    role: 'Super Admin',
    description: 'Review tenant billing disputes and reports.',
    suggestions: [
      'Open pending tenant reports',
      'How do I assign a concern?',
      'Show unresolved tickets',
      'Explain concern statuses',
    ],
  },
  '/super-admin/meters': {
    page: 'Meter Management',
    role: 'Super Admin',
    description: 'Register and configure utility meters.',
    suggestions: [
      'How to add a new meter?',
      'What meter types are available?',
      'How do I assign a meter to a unit?',
      'Explain the Other meter type',
    ],
  },
  '/super-admin/billing-rates': {
    page: 'Billing Rates',
    role: 'Super Admin',
    description: 'Configure utility billing rates.',
    suggestions: [
      'How are rates applied?',
      'What is the electricity rate unit?',
      'Can I set rates per unit?',
      'When do rate changes take effect?',
    ],
  },
  '/super-admin/users': {
    page: 'User Management',
    role: 'Super Admin',
    description: 'Manage system users and roles.',
    suggestions: [
      'How to create a new user?',
      'What roles are available?',
      'How do I reset a password?',
      'How to suspend a user?',
    ],
  },
  '/super-admin/announcements': {
    page: 'Announcements',
    role: 'Super Admin',
    description: 'Post and manage system-wide announcements.',
    suggestions: [
      'How to create an announcement?',
      'Who can see announcements?',
      'Can I schedule announcements?',
      'How to delete old announcements?',
    ],
  },


  // ── Tenant ───────────────────────────────────────────────────────
  '/tenant': {
    page: 'Tenant Dashboard',
    role: 'Tenant',
    description: 'Your billing overview and account summary.',
    suggestions: [
      'What is my current balance?',
      'How to pay my bill?',
      'When is the due date?',
      'Show my consumption history',
    ],
  },
  '/tenant/bills': {
    page: 'My Bills',
    role: 'Tenant',
    description: 'View and pay your billing statements.',
    suggestions: [
      'How do I submit a payment?',
      'What does "published" mean?',
      'Can I dispute a charge?',
      'How to download my bill?',
    ],
  },
  '/tenant/usage': {
    page: 'Usage',
    role: 'Tenant',
    description: 'Monitor your utility consumption.',
    suggestions: [
      'How is my electricity calculated?',
      'Why did my bill increase?',
      'Show me this month\'s usage',
      'Tips to reduce consumption',
    ],
  },

  // ── Facility ─────────────────────────────────────────────────────
  '/facility': {
    page: 'Facility Dashboard',
    role: 'Facility Manager',
    description: 'Monitor building systems and meter health.',
    suggestions: [
      'Are all meters active?',
      'Any maintenance alerts?',
      'Show energy consumption summary',
      'How to report a fault?',
    ],
  },
  '/facility/monitoring': {
    page: 'Monitoring',
    role: 'Facility Manager',
    description: 'Real-time meter and utility monitoring.',
    suggestions: [
      'Which meters need attention?',
      'Explain meter status indicators',
      'How to flag a meter issue?',
      'Show inactive meters',
    ],
  },

  // ── Finance ──────────────────────────────────────────────────────
  '/finance': {
    page: 'Finance Dashboard',
    role: 'Finance Officer',
    description: 'Financial overview and payment tracking.',
    suggestions: [
      'Show pending payment reviews',
      'What\'s the collection rate?',
      'How to approve a payment?',
      'Export payment summary',
    ],
  },
  '/finance/payment-review': {
    page: 'Payment Review',
    role: 'Finance Officer',
    description: 'Review and approve submitted payment receipts.',
    suggestions: [
      'How to approve a receipt?',
      'How to reject a payment?',
      'What happens after approval?',
      'Show payments pending review',
    ],
  },
}

/**
 * Get the best-matching page context for the current pathname.
 * Falls back to a generic assistant context if no match is found.
 */
export function getPageContext(pathname) {
  // Try exact match first, then prefix match (longest wins)
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
    description: 'AI-powered billing management system.',
    suggestions: [
      'How does this system work?',
      'What can you help me with?',
      'Show me the billing workflow',
      'Explain user roles',
    ],
  }
}

/**
 * Generate a context-aware AI response for common queries.
 * This is a local mock — replace with real API call for production.
 */
export function generateAIResponse(message, pageContext) {
  const msg = message.toLowerCase().trim()
  const page = pageContext?.page || 'ECBills'

  // ── Greetings ──────────────────────────────────────────────────
  if (/^(hi|hello|hey|good\s*(morning|afternoon|evening))/.test(msg)) {
    return `Hello! 👋 I'm your ECBills assistant. You're currently on the **${page}** page.\n\nHow can I help you today?`
  }

  // ── What can you do ────────────────────────────────────────────
  if (/what can you|help me with|capabilities|features/.test(msg)) {
    return `I can help you with:\n\n• 📄 **Billing** — create, publish, and track bills\n• 🏠 **Tenants & Units** — manage assignments\n• ⚡ **Meters** — add/edit utility meters\n• 💰 **Payments** — review and approve receipts\n• 📊 **Reports** — usage and financial analytics\n\nJust ask me anything about the **${page}** page or the system in general!`
  }

  // ── Billing questions ──────────────────────────────────────────
  if (/bill|invoice|billing|statement/.test(msg)) {
    if (/create|new|add|make/.test(msg)) {
      return `To create a new bill:\n\n1. Go to **Billing → New Bill**\n2. Select the tenant and billing period\n3. Enter electricity, water, and other charges\n4. Click **Publish** to send it to the tenant\n\nDrafts can be saved and published later.`
    }
    if (/status|what.*mean|explain/.test(msg)) {
      return `Bill statuses explained:\n\n• **Published** — Tenant can view and pay\n• **Payment Submitted** — Tenant uploaded receipt\n• **Paid** — Finance approved the payment\n• **Overdue** — Past due date, unpaid\n\nYou can filter bills by status on the Billing page.`
    }
    if (/unpaid|outstanding|pending|overdue/.test(msg)) {
      return `To find unpaid bills:\n\n1. Go to **Admin → Billing**\n2. Use the status filter to select **Unpaid** or **Overdue**\n3. You'll see all outstanding balances with tenant details\n\nYou can also send reminders directly from the bill details view.`
    }
    return `For billing help, I can explain:\n• How to create and publish bills\n• Understanding bill statuses\n• Payment submission and review flow\n• Generating billing reports\n\nWhat specifically do you need help with?`
  }

  // ── Meter questions ────────────────────────────────────────────
  if (/meter|electric|water|thermal|utility/.test(msg)) {
    if (/add|create|new/.test(msg)) {
      return `To add a new meter:\n\n1. Go to **Super Admin → Meter Management**\n2. Click **Add Meter**\n3. Select the meter type (Electric, Water, Thermal, or Other)\n4. Choose the **Meter Name** from the dropdown\n5. Assign it to a **Unit**\n6. Click **Add Meter** to save\n\nThe meter will immediately appear in related pages.`
    }
    if (/other|custom|type/.test(msg)) {
      return `The **"Other"** meter type allows you to register non-standard meters like gas, solar, or steam meters.\n\nWhen you select "Other":\n• A **Specify Meter Type** field appears\n• Enter the custom type name\n• This label will appear throughout the system`
    }
    return `Meters are managed under **Super Admin → Meter Management**.\n\nAvailable types: ⚡ Electric, 💧 Water, 🔥 Thermal, and ⚙️ Other\n\nEach meter is assigned to a unit and linked to a tenant automatically.`
  }

  // ── Tenant questions ───────────────────────────────────────────
  if (/tenant|occupant|resident/.test(msg)) {
    if (/add|create|new|register/.test(msg)) {
      return `To add a tenant:\n\n1. Go to **Admin → Tenants**\n2. Click **Add Tenant**\n3. Fill in the tenant details (name, contact, company)\n4. Assign them to one or more units\n5. Save — the unit status will update to "Occupied" automatically`
    }
    return `Tenants are managed under **Admin → Tenants**.\n\nEach tenant can be assigned to one or multiple units. Their bills, payments, and consumption data are all linked to their profile.`
  }

  // ── Payment questions ──────────────────────────────────────────
  if (/pay|payment|receipt|approve|reject/.test(msg)) {
    if (/approve|verify|confirm/.test(msg)) {
      return `To approve a payment:\n\n1. Go to **Finance → Payment Review**\n2. Find the submitted payment receipt\n3. Verify the receipt image and reference number\n4. Click **Approve** — the bill status changes to **Paid**\n\nRejected payments return to "Published" so tenants can resubmit.`
    }
    return `The payment workflow:\n\n1. **Tenant** submits a receipt via the Bills page\n2. **Finance Officer** reviews the receipt\n3. Finance clicks **Approve** → Bill marked as **Paid**\n4. Or **Reject** → Tenant must resubmit\n\nAll payment history is tracked for audit purposes.`
  }

  // ── Rate questions ─────────────────────────────────────────────
  if (/rate|price|cost|tariff|kwh|m3/.test(msg)) {
    return `Billing rates are configured by the **Super Admin** under **Billing Rates**.\n\nCurrent utility units:\n• ⚡ Electricity — per kWh\n• 💧 Water — per m³\n• 🔥 Thermal Energy — per kBTU/h\n\nRate changes apply to new bills created after the update.`
  }

  // ── User/role questions ────────────────────────────────────────
  if (/role|user|access|permission|admin/.test(msg)) {
    return `The system has 5 user roles:\n\n• 🔴 **Super Admin** — Full access (meters, rates, users)\n• 🟠 **Admin** — Billing, tenants, units, reports\n• 🟢 **Finance Officer** — Payment review and reports\n• 🔵 **Facility Manager** — Monitoring and maintenance\n• ⚪ **Tenant** — View bills and submit payments\n\nManage users under **Super Admin → User Management**.`
  }

  // ── Report questions ───────────────────────────────────────────
  if (/report|analytic|chart|consumption|usage/.test(msg)) {
    return `Reports available in ECBills:\n\n• 📊 **Usage Reports** — Electricity, water, and thermal consumption charts\n• 💵 **Financial Reports** — Collections, outstanding balances\n• 🏠 **Tenant Reports** — Per-tenant billing history\n\nAll reports can be exported as PDF. Navigate to the relevant Reports section in the sidebar.`
  }

  // ── Default context-aware fallback ────────────────────────────
  return `I can see you're on the **${page}** page. Here are some things I can help you with on this page:\n\n${
    pageContext?.suggestions?.slice(0, 3).map(s => `• ${s}`).join('\n') || '• Ask me anything about this feature!'
  }\n\nOr type any question and I'll do my best to assist you!`
}
