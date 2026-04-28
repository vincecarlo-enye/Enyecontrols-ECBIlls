import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import {
  Minus,
  Send,
  Mic,
  Sparkles,
  RotateCcw,
  Bot,
  Settings,
  Volume2,
  AudioLines,
  Waves,
  ChevronDown,
} from 'lucide-react'
import { getOutOfScopeReply, getPageContext, isEcbillsScopedQuestion } from './aiContext'
import { useVoiceInput } from './useVoiceInput'
import WaveAnimation from './WaveAnimation'
import { clearAIChatHistory, getAIChatHistory, sendAIChat } from '@/services/adminService/aiService'
import { getFinanceBillsSnapshot, getFinancePaymentsSnapshot } from '@/services/financeService/financeBillService'
import { useAuth } from '@/context/AuthContext'

function formatTime() {
  return new Date().toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatGreeting(pageContext) {
  return `Hi! I'm your ECBills AI assistant.\n\nYou're on **${pageContext.page}** - ${pageContext.description}\n\nHow can I help you?`
}

function buildAIQuestion(content, pageContext) {
  const normalized = content.toLowerCase().replace(/\s+/g, ' ').trim()
  const asksForFinanceDashboardExplanation =
    pageContext?.page === 'Finance Dashboard' && isFinanceDashboardExplanationRequest(normalized)
  const asksForCollectionRate =
    pageContext?.page === 'Finance Dashboard' && isCollectionRateRequest(normalized)
  const asksForPendingPaymentReviews =
    pageContext?.page === 'Finance Dashboard' && isPendingPaymentReviewsRequest(normalized)
  const asksForOutstandingBalances =
    pageContext?.page === 'Finance Dashboard' && isOutstandingBalancesRequest(normalized)

  if (asksForCollectionRate) {
    return `${content}

Answer about the Finance Dashboard collection rate, not utility billing rates. Collection rate means verified/collected payments divided by total billed revenue, expressed as a percentage. Include billed amount, collected amount, and outstanding collection gap when available.`
  }

  if (asksForPendingPaymentReviews) {
    return `${content}

Answer about pending payment reviews in the Finance Dashboard. Explain that these are submitted payments or receipts waiting for finance verification. Include the count, total amount, and available payment details such as invoice, tenant, unit, amount, and submission/payment date. Also mention that finance should review the receipt before verifying or rejecting it.`
  }

  if (asksForOutstandingBalances) {
    return `${content}

Answer about outstanding balances in the Finance Dashboard. Outstanding balances mean bills that are not fully paid yet, such as unpaid, published, overdue, partial, pending, or payment-submitted bills. Summarize the total outstanding amount, status breakdown, and tenant breakdown when available. Do not return a broad system snapshot.`
  }

  if (!asksForFinanceDashboardExplanation) return content

  return `${content}

Answer literally by explaining what the Finance Dashboard page is for, what finance users can do from it, and what dashboard sections, cards, charts, and records they can see. Do not primarily list current numeric system data unless the user explicitly asks for live figures, totals, IDs, anomalies, or summaries.`
}

function isFinanceDashboardExplanationRequest(text = '') {
  const normalized = text.toLowerCase().replace(/\s+/g, ' ').trim()

  return (
    normalized === 'explain this finance dashboard' ||
    normalized === 'explain finance dashboard' ||
    normalized === 'explain this dashboard' ||
    normalized.includes('what is finance dashboard') ||
    normalized.includes('what is the finance dashboard')
  )
}

function isCollectionRateRequest(text = '') {
  const normalized = text.toLowerCase().replace(/\s+/g, ' ').trim()
  return normalized.includes('collection rate') || normalized.includes('collection percentage')
}

function isPendingPaymentReviewsRequest(text = '') {
  const normalized = text.toLowerCase().replace(/\s+/g, ' ').trim()
  return (
    normalized.includes('pending payment review') ||
    normalized.includes('pending payment reviews') ||
    normalized.includes('show pending payments') ||
    normalized.includes('pending receipts')
  )
}

function isOutstandingBalancesRequest(text = '') {
  const normalized = text.toLowerCase().replace(/\s+/g, ' ').trim()
  return (
    normalized.includes('outstanding balance') ||
    normalized.includes('outstanding balances') ||
    normalized.includes('unpaid balance') ||
    normalized.includes('unpaid balances') ||
    normalized.includes('collection gap')
  )
}

function isGeneralSystemQuestion(text = '') {
  const normalized = text.toLowerCase().replace(/\s+/g, ' ').trim()
  return (
    normalized.includes('what is ec bills') ||
    normalized.includes('what is ecbills') ||
    normalized.includes('what is this system') ||
    normalized.includes('what does this system do') ||
    normalized.includes('what this system do') ||
    normalized.includes('how does this system work') ||
    normalized.includes('explain this system') ||
    normalized.includes('explain ec bills') ||
    normalized.includes('explain ecbills')
  )
}

function isTenantPaymentHelpRequest(text = '') {
  const normalized = text.toLowerCase().replace(/\s+/g, ' ').trim()
  return (
    normalized.includes('how to pay') ||
    normalized.includes('how do i pay') ||
    normalized.includes('how can i pay') ||
    normalized.includes('submit a payment') ||
    normalized.includes('submit payment') ||
    normalized.includes('upload receipt') ||
    normalized.includes('payment receipt') ||
    normalized.includes('pay a bill') ||
    normalized.includes('pay my bill')
  )
}

function isTenantConcernHelpRequest(text = '') {
  const normalized = text.toLowerCase().replace(/\s+/g, ' ').trim()
  return (
    normalized.includes('make a concern') ||
    normalized.includes('create a concern') ||
    normalized.includes('submit a concern') ||
    normalized.includes('report a concern') ||
    normalized.includes('billing concern') ||
    normalized.includes('make report') ||
    normalized.includes('report an issue') ||
    normalized.includes('raise a concern') ||
    normalized.includes('reopen a ticket')
  )
}

function isBillGenerationHelpRequest(text = '') {
  const normalized = text.toLowerCase().replace(/\s+/g, ' ').trim()
  return (
    normalized.includes('generate a bill') ||
    normalized.includes('generate bill') ||
    normalized.includes('generate bills') ||
    normalized.includes('run bill generation') ||
    normalized.includes('regenerate bill') ||
    normalized.includes('create a bill') ||
    normalized.includes('create bill')
  )
}

function getSystemOverviewAnswer(pageContext = {}) {
  if (pageContext?.role === 'tenant') {
    return `ECBills is a billing and utility management system for tenants and building staff.

For tenants, it is mainly used to check your own billing information. You can view your bills, see payment status, submit or track payment receipts, review your utility usage, check billing reports, and send billing concerns when something needs clarification.

The tenant AI can explain how the system works and help you understand your own account, bills, payments, usage, and concerns. It should not show other tenants' information, finance-wide records, admin tools, or system-wide reports.`
  }

  return `ECBills is a billing and utility management system for managing tenant bills, utility usage, payments, receipts, billing concerns, reports, and role-based workflows.

The AI can explain the current page, summarize records you are allowed to access, and guide you through billing, payment, usage, report, and concern workflows based on your role.`
}

function getTenantPaymentHelpAnswer() {
  return `To pay a bill in ECBills:

1. Go to **My Bills**.
2. Open the bill you want to pay.
3. Check the bill amount, due date, and payment instructions.
4. Pay using the available payment method shown in the bill instructions.
5. After paying, click the option to submit or upload your payment receipt.
6. Attach your receipt, then enter any required payment details.
7. Submit the receipt.

After submission, your payment will usually show as pending or submitted while finance reviews it. Once finance verifies the receipt, the bill status should update as paid or reflected accordingly.`
}

function getTenantConcernHelpAnswer() {
  return `To report a billing concern in ECBills:

1. Go to **Billing Reports** or open the bill related to your concern.
2. Choose the option to report or submit a billing concern.
3. Select the concern category, such as payment not reflected, wrong amount, usage concern, or another billing issue.
4. Write a clear explanation of the problem.
5. Attach a supporting file if you have one, such as a receipt or screenshot.
6. Submit the concern.

After submitting, you can track the concern status in **Billing Reports**. If finance responds or resolves it, you can open the ticket to view the update. If the issue still needs attention and reopening is allowed, use the reopen option and add a note.`
}

function getBillGenerationHelpAnswer(pageContext = {}) {
  if (pageContext?.role === 'tenant') {
    return 'Tenants cannot generate bills. In ECBills, bill generation is handled by Finance or authorized admin users. As a tenant, you can view your published bills in **My Bills**, submit payment receipts, and report billing concerns if something looks wrong.'
  }

  return `To generate a bill in ECBills:

1. Go to **Billing Management**.
2. Open the **Prepare Bills** tab.
3. Make sure the Facility Manager has approved the meter readings for the billing month. Finance can only generate bills from approved readings.
4. To generate one bill, click **Generate Bill**.
5. Select the tenant.
6. Select the billing month.
7. Click **Generate Bill** to create the draft bill.

To generate bills in batch:

1. In **Prepare Bills**, click **Run Bill Generation**.
2. Select the billing month.
3. Turn on **Regenerate existing bills too** only if you want existing bills for that month to be recreated.
4. Click **Generate All Bills**.

After generation, review the draft bills first. When they are correct, publish them so tenants can see the bills.`
}

function extractSnapshotRows(snapshot) {
  if (Array.isArray(snapshot)) return snapshot
  if (Array.isArray(snapshot?.data)) return snapshot.data
  if (Array.isArray(snapshot?.data?.data)) return snapshot.data.data
  return []
}

function formatDateLabel(value) {
  if (!value) return 'No date'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function formatPeso(value) {
  return `PHP ${Number(value || 0).toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

function getFinanceCollectionRateAnswer() {
  const bills = extractSnapshotRows(getFinanceBillsSnapshot())
  const payments = extractSnapshotRows(getFinancePaymentsSnapshot())

  if (bills.length === 0 && payments.length === 0) return ''

  const totalBilled = bills.reduce((sum, bill) => sum + Number(bill?.amount || 0), 0)
  const verifiedPayments = payments.filter((payment) => String(payment?.status || '').toLowerCase() === 'verified')
  const totalCollected = verifiedPayments.reduce((sum, payment) => sum + Number(payment?.amount || 0), 0)
  const collectionRate = totalBilled > 0 ? Number(((totalCollected / totalBilled) * 100).toFixed(1)) : 0
  const collectionGap = Math.max(totalBilled - totalCollected, 0)

  return `The collection rate is **${collectionRate}%**.

This means finance has collected ${formatPeso(totalCollected)} from ${formatPeso(totalBilled)} in billed revenue.

The current collection gap is ${formatPeso(collectionGap)}. This is the amount that is still not collected based on the current cached Finance Dashboard data.`
}

function getFinancePendingPaymentReviewsAnswer() {
  const payments = extractSnapshotRows(getFinancePaymentsSnapshot())
  if (payments.length === 0) return ''

  const pendingPayments = payments.filter((payment) => String(payment?.status || '').toLowerCase() === 'pending')
  const totalPending = pendingPayments.reduce((sum, payment) => sum + Number(payment?.amount || 0), 0)

  if (pendingPayments.length === 0) {
    return 'There are no pending payment reviews right now. That means there are no submitted receipts waiting for finance verification in the current cached Finance Dashboard data.'
  }

  const visiblePayments = pendingPayments.slice(0, 5).map((payment) => {
    const bill = payment?.bill || {}
    const invoice = bill?.id ?? payment?.bill_id ?? payment?.invoice_id ?? payment?.invoiceId ?? 'N/A'
    const tenant = payment?.tenant?.name || bill?.tenant?.name || payment?.tenant_name || 'Unknown tenant'
    const unit = bill?.unit?.unit_number || bill?.unit?.name || payment?.unit?.unit_number || payment?.unit?.name || 'N/A'
    const date = payment?.paid_at || payment?.created_at || payment?.submitted_at || payment?.verified_at

    return `- Invoice ${invoice}: ${tenant}, Unit ${unit}, ${formatPeso(payment?.amount)}, submitted ${formatDateLabel(date)}`
  })

  const extraCount = pendingPayments.length - visiblePayments.length
  const extraLine = extraCount > 0 ? `\n\nThere are ${extraCount} more pending payment review${extraCount === 1 ? '' : 's'} not shown in this quick summary.` : ''

  return `There are **${pendingPayments.length} pending payment reviews** worth **${formatPeso(totalPending)}**.

These are payments or receipts submitted by tenants that finance still needs to check. Finance should open each payment review, confirm the receipt details, then either verify the payment or reject it with a reason.

Pending items:
${visiblePayments.join('\n')}${extraLine}`
}

function getBillTenantName(bill = {}) {
  return bill?.tenant?.name || bill?.tenant_name || bill?.customer_name || 'Unknown tenant'
}

function getBillUnitName(bill = {}) {
  return bill?.unit?.unit_number || bill?.unit?.name || bill?.unit_name || 'N/A'
}

function normalizeStatusLabel(status = '') {
  return String(status || 'unknown')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function getFinanceOutstandingBalancesAnswer() {
  const bills = extractSnapshotRows(getFinanceBillsSnapshot())
  if (bills.length === 0) return ''

  const outstandingStatuses = new Set([
    'unpaid',
    'published',
    'overdue',
    'partial',
    'pending',
    'submitted',
    'payment_submitted',
    'draft',
  ])
  const outstandingBills = bills.filter((bill) => {
    const status = String(bill?.status || '').toLowerCase()
    return outstandingStatuses.has(status) || (status && status !== 'paid' && status !== 'cancelled' && status !== 'void')
  })

  if (outstandingBills.length === 0) {
    return 'There are no outstanding balances right now. All currently cached Finance Dashboard bills are either paid or not counted as collectible balances.'
  }

  const totalOutstanding = outstandingBills.reduce((sum, bill) => sum + Number(bill?.outstanding_amount ?? bill?.balance ?? bill?.amount ?? 0), 0)
  const statusMap = new Map()
  const tenantMap = new Map()

  outstandingBills.forEach((bill) => {
    const amount = Number(bill?.outstanding_amount ?? bill?.balance ?? bill?.amount ?? 0)
    const status = normalizeStatusLabel(bill?.status)
    const tenant = getBillTenantName(bill)

    const statusRow = statusMap.get(status) || { count: 0, amount: 0 }
    statusRow.count += 1
    statusRow.amount += amount
    statusMap.set(status, statusRow)

    const tenantRow = tenantMap.get(tenant) || { count: 0, amount: 0 }
    tenantRow.count += 1
    tenantRow.amount += amount
    tenantMap.set(tenant, tenantRow)
  })

  const statusLines = Array.from(statusMap.entries())
    .sort((a, b) => b[1].amount - a[1].amount)
    .map(([status, row]) => `- ${status}: ${row.count} bill${row.count === 1 ? '' : 's'} worth ${formatPeso(row.amount)}`)

  const tenantLines = Array.from(tenantMap.entries())
    .sort((a, b) => b[1].amount - a[1].amount)
    .slice(0, 5)
    .map(([tenant, row]) => `- ${tenant}: ${row.count} bill${row.count === 1 ? '' : 's'} worth ${formatPeso(row.amount)}`)

  const sampleBills = outstandingBills
    .slice()
    .sort((a, b) => Number(b?.outstanding_amount ?? b?.balance ?? b?.amount ?? 0) - Number(a?.outstanding_amount ?? a?.balance ?? a?.amount ?? 0))
    .slice(0, 5)
    .map((bill) => {
      const invoice = bill?.id ?? bill?.invoice_id ?? bill?.invoiceId ?? 'N/A'
      const amount = Number(bill?.outstanding_amount ?? bill?.balance ?? bill?.amount ?? 0)
      return `- Invoice ${invoice}: ${getBillTenantName(bill)}, Unit ${getBillUnitName(bill)}, ${normalizeStatusLabel(bill?.status)}, ${formatPeso(amount)}`
    })

  return `There are **${outstandingBills.length} outstanding bills** worth **${formatPeso(totalOutstanding)}**.

Outstanding balances are bills that are not fully paid yet, such as unpaid, published, overdue, partial, pending, or submitted-payment bills.

By status:
${statusLines.join('\n')}

By tenant:
${tenantLines.join('\n')}

Largest outstanding items:
${sampleBills.join('\n')}`
}

function getFinanceDashboardExplanation() {
  return `The Finance Dashboard is the main overview page for the finance team. It helps users quickly understand billing performance, payment activity, collections, and revenue movement without opening each billing or payment record one by one.

On this dashboard, finance users can monitor how much has been billed, how much has been collected, what is still outstanding, and which payments still need review. They can also change the time range using the 1D, 1M, and 1Y filters to view daily, monthly, or yearly trends.

What you can see here:
- Utility revenue cards for electricity, thermal energy, and water.
- Summary cards such as Total Revenue, Utility Revenue, Pending Payments, Paid Bills, and Total Bills Generated.
- A Revenue Trend chart showing billed amounts, collected amounts, the collection gap, and collection rate.
- A Utility Revenue Breakdown chart showing how electricity, water, and thermal charges contribute to revenue.
- A Revenue Distribution chart showing the percentage share of each utility.
- Billing Status data showing bills by status, such as paid, partial, submitted, overdue, or open.
- Payment Review Status data showing pending, verified, and rejected payments.
- Recent Transactions showing the latest payment records across tenants and utilities.

In short, this page is used to check the financial health of billing: what was billed, what was paid, what still needs collection, and what finance tasks may need attention.`
}

function normalizeText(text = '') {
  return text.replace(/[…·]/g, '').replace(/m³/g, 'm3').trim()
}

function resolvePlayableAudioUrl(audioUrl = '') {
  if (!audioUrl) return ''

  try {
    const parsed = new URL(audioUrl, window.location.origin)
    const fileName = parsed.pathname.split('/').filter(Boolean).pop()
    if (!fileName) return audioUrl
    return `/py-audio/${fileName}`
  } catch {
    return audioUrl
  }
}

function pickPreferredFemaleVoice(voices = []) {
  if (!Array.isArray(voices) || voices.length === 0) return null

  const femaleHints = ['female', 'aria', 'zira', 'samantha', 'victoria', 'jenny', 'ava', 'susan', 'zira']
  const englishVoices = voices.filter((voice) => /^en[-_]/i.test(voice.lang || ''))
  const ranked = [...englishVoices, ...voices]

  return ranked.find((voice) =>
    femaleHints.some((hint) => `${voice.name} ${voice.voiceURI}`.toLowerCase().includes(hint))
  ) || ranked[0] || null
}

function renderMessageContent(content) {
  if (typeof content !== 'string') return content

  return content.split('\n').map((line, i) => {
    const parts = line.split(/(\*\*[^*]+\*\*)/)
    return (
      <span key={i}>
        {i > 0 && <br />}
        {parts.map((part, j) =>
          part.startsWith('**') && part.endsWith('**') ? (
            <strong key={j} className="font-semibold">
              {part.slice(2, -2)}
            </strong>
          ) : (
            <span key={j}>{part}</span>
          )
        )}
      </span>
    )
  })
}

function MessageBubble({ message }) {
  const isUser = message.role === 'user'
  const isSystem = message.role === 'system'

  if (isSystem) {
    return (
      <div className="flex justify-center my-2">
        <span className="text-[10px] text-slate-400 dark:text-slate-500 px-2 py-1 bg-slate-100 dark:bg-slate-700/50 rounded-full text-center">
          {message.content}
        </span>
      </div>
    )
  }

  return (
    <div className={`flex items-end gap-2 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      {!isUser && (
        <div className="flex-shrink-0 w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-sm">
          <Bot className="w-3.5 h-3.5 text-white" />
        </div>
      )}

      <div
        className={`max-w-[85%] break-words overflow-hidden px-3 py-2 rounded-2xl text-xs leading-relaxed shadow-sm ${
          isUser
            ? 'bg-gradient-to-br from-violet-600 to-indigo-600 text-white rounded-br-sm'
            : 'bg-white dark:bg-slate-700/80 text-slate-700 dark:text-slate-200 rounded-bl-sm border border-slate-200/60 dark:border-slate-600/50'
        }`}
        style={{ overflowWrap: 'anywhere', wordBreak: 'break-word' }}
      >
        {renderMessageContent(message.content)}

        <div className={`text-[10px] mt-1 ${isUser ? 'text-white/70' : 'text-slate-400 dark:text-slate-500'}`}>
          {message.time}
        </div>
      </div>
    </div>
  )
}

function SuggestionChip({ text, onClick }) {
  return (
    <button
      onClick={() => onClick(text)}
      className="px-3 py-1.5 rounded-full text-[11px] font-medium border border-violet-200 dark:border-violet-700/50 text-violet-700 dark:text-violet-300 bg-violet-50 dark:bg-violet-900/20 hover:bg-violet-100 dark:hover:bg-violet-900/40 transition-colors text-left leading-tight"
    >
      {text}
    </button>
  )
}

function TypingIndicator() {
  return (
    <div className="flex items-end gap-2">
      <div className="flex-shrink-0 w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
        <Bot className="w-3.5 h-3.5 text-white" />
      </div>
      <div className="bg-white dark:bg-slate-700/80 border border-slate-200/60 dark:border-slate-600/50 rounded-2xl rounded-bl-sm px-3 py-2.5 shadow-sm">
        <div className="flex items-center gap-1">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-slate-400"
              style={{
                animation: 'aiTyping 1.2s ease-in-out infinite',
                animationDelay: `${i * 0.2}s`,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

function TypingText({ text, active }) {
  return (
    <span>
      {text}
      {active && (
        <span className="inline-block w-2 h-4 ml-0.5 align-[-2px] rounded-[2px] bg-current opacity-70 animate-pulse" />
      )}
    </span>
  )
}

function StatusDot({ status }) {
  const config = {
    idle: { color: 'bg-emerald-400', pulse: false },
    listening: { color: 'bg-red-400', pulse: true },
    thinking: { color: 'bg-amber-400', pulse: true },
    speaking: { color: 'bg-violet-400', pulse: true },
  }

  const { color, pulse } = config[status] || config.idle

  return (
    <span
      className={`absolute top-0.5 right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-slate-800 ${color} ${pulse ? 'animate-pulse' : ''}`}
    />
  )
}

function ModeButton({ active, label, icon: Icon, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all min-w-0 ${
        active
          ? 'bg-violet-600 text-white shadow-sm'
          : 'bg-white dark:bg-slate-700/60 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600/50 hover:border-violet-300 dark:hover:border-violet-600'
      }`}
    >
      <Icon className="w-3.5 h-3.5 flex-shrink-0" />
      <span className="truncate">{label}</span>
    </button>
  )
}

export default function AIAssistant() {
  const location = useLocation()
  const { isAuthenticated, loading } = useAuth()
  const pageContext = useMemo(() => getPageContext(location.pathname), [location.pathname])
  const shouldHideAssistant = loading || !isAuthenticated || location.pathname === '/login'

  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([])
  const [inputValue, setInputValue] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [status, setStatus] = useState('idle')
  const [showSuggestions, setShowSuggestions] = useState(true)
  const [hasLoadedHistory, setHasLoadedHistory] = useState(false)
  const [voiceError, setVoiceError] = useState(null)
  const [showSettings, setShowSettings] = useState(false)
  const [outputMode, setOutputMode] = useState(() => {
    try {
      return localStorage.getItem('ai_output_mode') || 'text'
    } catch {
      return 'text'
    }
  })
  const [autoReadAloud, setAutoReadAloud] = useState(() => {
    try {
      const saved = localStorage.getItem('ai_auto_read_aloud')
      return saved == null ? true : saved === 'true'
    } catch {
      return true
    }
  })
  const [dragPos, setDragPos] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [isAISpeaking, setIsAISpeaking] = useState(false)
  const [isAnimatingReply, setIsAnimatingReply] = useState(false)

  const dragStart = useRef(null)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)
  const audioRef = useRef(null)
  const historyRequestIdRef = useRef(0)
  const hasInitializedHistoryRef = useRef(false)

  const voice = useVoiceInput({
    onTranscript: (text) => {
      setInputValue((prev) => (prev ? `${prev} ${text}` : text))
      setTimeout(() => inputRef.current?.focus(), 0)
    },
    onError: (err) => {
      setVoiceError(err)
      setStatus('idle')
      setTimeout(() => setVoiceError(null), 4000)
    },
  })

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, isTyping, isOpen, voice.interimText, isAISpeaking])

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => inputRef.current?.focus(), 150)
      return () => clearTimeout(timer)
    }
  }, [isOpen])

  useEffect(() => {
    try {
      localStorage.setItem('ai_output_mode', outputMode)
    } catch {}
  }, [outputMode])

  useEffect(() => {
    try {
      localStorage.setItem('ai_auto_read_aloud', String(autoReadAloud))
    } catch {}
  }, [autoReadAloud])

  useEffect(() => {
    if (!isOpen) return
    if (hasInitializedHistoryRef.current) {
      setHasLoadedHistory(true)
      return
    }

    const requestId = historyRequestIdRef.current + 1
    historyRequestIdRef.current = requestId
    hasInitializedHistoryRef.current = true
    setHasLoadedHistory(false)

    let cancelled = false

    const loadHistory = async () => {
      try {
        const result = await getAIChatHistory(location.pathname)
        if (cancelled || requestId !== historyRequestIdRef.current) return

        const history = Array.isArray(result?.data) ? result.data : []

        if (history.length > 0) {
          setMessages(
            history.map((message) => ({
              id: message.id ?? `${message.role}-${message.created_at ?? Date.now()}`,
              role: message.role,
              content: message.content,
              time: message.time || formatTime(),
            }))
          )
          setShowSuggestions(false)
        } else {
          setMessages([
            {
              id: `greeting-${location.pathname}`,
              role: 'assistant',
              content: formatGreeting(pageContext),
              time: formatTime(),
            },
          ])
          setShowSuggestions(true)
        }
      } catch {
        if (cancelled || requestId !== historyRequestIdRef.current) return
        setMessages([
          {
            id: `greeting-${location.pathname}`,
            role: 'assistant',
            content: formatGreeting(pageContext),
            time: formatTime(),
          },
        ])
        setShowSuggestions(true)
      } finally {
        if (!cancelled && requestId === historyRequestIdRef.current) {
          setHasLoadedHistory(true)
        }
      }
    }

    loadHistory()

    return () => {
      cancelled = true
    }
  }, [isOpen])

  useEffect(() => {
    if (isAISpeaking) {
      setStatus('speaking')
      return
    }
    if (voice.isListening) {
      setStatus('listening')
      return
    }
    if (isTyping || isAnimatingReply) {
      setStatus('thinking')
      return
    }
    setStatus('idle')
  }, [voice.isListening, isTyping, isAISpeaking, isAnimatingReply])

  const stopAllAudio = useCallback(() => {
    try {
      window.speechSynthesis.cancel()
    } catch {}

    try {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.currentTime = 0
        audioRef.current.src = ''
      }
    } catch {}

    setIsAISpeaking(false)
  }, [])

  const speakWithBrowser = useCallback((text) => {
    if (!text) return
    try {
      window.speechSynthesis.cancel()
      const utterance = new SpeechSynthesisUtterance(normalizeText(text).replace(/\*\*/g, '').replace(/\n+/g, ' '))
      const voices = window.speechSynthesis.getVoices?.() || []
      const preferredVoice = pickPreferredFemaleVoice(voices)
      if (preferredVoice) {
        utterance.voice = preferredVoice
        utterance.lang = preferredVoice.lang || 'en-US'
      }
      utterance.rate = 1.02
      utterance.pitch = 1.08
      utterance.volume = 1
      utterance.onstart = () => setIsAISpeaking(true)
      utterance.onend = () => setIsAISpeaking(false)
      utterance.onerror = () => setIsAISpeaking(false)
      window.speechSynthesis.speak(utterance)
    } catch {
      setIsAISpeaking(false)
    }
  }, [])

  const playAssistantAudio = useCallback(async (audioUrl, fallbackText = '') => {
    if (!audioUrl) {
      if (fallbackText) {
        speakWithBrowser(fallbackText)
      }
      return
    }

    try {
      const audio = audioRef.current
      if (!audio) {
        if (fallbackText) {
          speakWithBrowser(fallbackText)
        }
        return
      }

      window.speechSynthesis.cancel()
      audio.pause()
      audio.currentTime = 0
      const safeAudioUrl = resolvePlayableAudioUrl(audioUrl)
      audio.src = `${safeAudioUrl}${safeAudioUrl.includes('?') ? '&' : '?'}t=${Date.now()}`
      audio.onplay = () => setIsAISpeaking(true)
      audio.onended = () => setIsAISpeaking(false)
      audio.onerror = () => {
        setIsAISpeaking(false)
        if (fallbackText) {
          speakWithBrowser(fallbackText)
        }
      }
      await audio.play()
    } catch {
      setIsAISpeaking(false)
      if (fallbackText) {
        speakWithBrowser(fallbackText)
      }
    }
  }, [speakWithBrowser])

  const animateAssistantReply = useCallback((messageId, text) => {
    const fullText = text || ''

    return new Promise((resolve) => {
      if (!fullText) {
        setMessages((prev) =>
          prev.map((msg) => (msg.id === messageId ? { ...msg, isStreaming: false } : msg))
        )
        resolve()
        return
      }

      const reducedMotion =
        typeof window !== 'undefined' &&
        typeof window.matchMedia === 'function' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches

      if (reducedMotion) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === messageId ? { ...msg, content: fullText, isStreaming: false } : msg
          )
        )
        setIsAnimatingReply(false)
        resolve()
        return
      }

      const chunks = fullText.split(/(\s+)/).filter(Boolean)
      let index = 0
      setIsAnimatingReply(true)

      const step = () => {
        index += 1
        const nextText = chunks.slice(0, index).join('')

        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === messageId
              ? { ...msg, content: nextText, isStreaming: index < chunks.length }
              : msg
          )
        )

        if (index >= chunks.length) {
          setIsAnimatingReply(false)
          resolve()
          return
        }

        const currentChunk = chunks[index - 1] || ''
        const delay = /\s+/.test(currentChunk) ? 20 : currentChunk.length > 8 ? 55 : 38
        window.setTimeout(step, delay)
      }

      window.setTimeout(step, 80)
    })
  }, [])

  const sendMessage = useCallback(async (text) => {
    const content = (text || inputValue).trim()
    if (!content || isTyping || isAnimatingReply || !hasLoadedHistory) return

    const userMsg = {
      id: Date.now(),
      role: 'user',
      content,
      time: formatTime(),
    }

    setMessages((prev) => [...prev, userMsg])
    setInputValue('')
    setShowSuggestions(false)
    setIsTyping(true)
    stopAllAudio()

    if (!isEcbillsScopedQuestion(content, pageContext)) {
      const aiMsg = {
        id: Date.now() + 1,
        role: 'assistant',
        content: getOutOfScopeReply(pageContext),
        time: formatTime(),
      }

      setMessages((prev) => [...prev, aiMsg])
      setIsTyping(false)
      return
    }

    if (isGeneralSystemQuestion(content)) {
      const aiMsg = {
        id: Date.now() + 1,
        role: 'assistant',
        content: getSystemOverviewAnswer(pageContext),
        time: formatTime(),
      }

      setMessages((prev) => [...prev, aiMsg])
      setIsTyping(false)
      return
    }

    if (pageContext?.role === 'tenant' && isTenantPaymentHelpRequest(content)) {
      const aiMsg = {
        id: Date.now() + 1,
        role: 'assistant',
        content: getTenantPaymentHelpAnswer(),
        time: formatTime(),
      }

      setMessages((prev) => [...prev, aiMsg])
      setIsTyping(false)
      return
    }

    if (pageContext?.role === 'tenant' && isTenantConcernHelpRequest(content)) {
      const aiMsg = {
        id: Date.now() + 1,
        role: 'assistant',
        content: getTenantConcernHelpAnswer(),
        time: formatTime(),
      }

      setMessages((prev) => [...prev, aiMsg])
      setIsTyping(false)
      return
    }

    if (isBillGenerationHelpRequest(content)) {
      const aiMsg = {
        id: Date.now() + 1,
        role: 'assistant',
        content: getBillGenerationHelpAnswer(pageContext),
        time: formatTime(),
      }

      setMessages((prev) => [...prev, aiMsg])
      setIsTyping(false)
      return
    }

    if (pageContext?.page === 'Finance Dashboard' && isFinanceDashboardExplanationRequest(content)) {
      const aiMsg = {
        id: Date.now() + 1,
        role: 'assistant',
        content: getFinanceDashboardExplanation(),
        time: formatTime(),
      }

      setMessages((prev) => [...prev, aiMsg])
      setIsTyping(false)
      return
    }

    if (pageContext?.page === 'Finance Dashboard' && isCollectionRateRequest(content)) {
      const answer = getFinanceCollectionRateAnswer()
      if (answer) {
        const aiMsg = {
          id: Date.now() + 1,
          role: 'assistant',
          content: answer,
          time: formatTime(),
        }

        setMessages((prev) => [...prev, aiMsg])
        setIsTyping(false)
        return
      }
    }

    if (pageContext?.page === 'Finance Dashboard' && isPendingPaymentReviewsRequest(content)) {
      const answer = getFinancePendingPaymentReviewsAnswer()
      if (answer) {
        const aiMsg = {
          id: Date.now() + 1,
          role: 'assistant',
          content: answer,
          time: formatTime(),
        }

        setMessages((prev) => [...prev, aiMsg])
        setIsTyping(false)
        return
      }
    }

    if (pageContext?.page === 'Finance Dashboard' && isOutstandingBalancesRequest(content)) {
      const answer = getFinanceOutstandingBalancesAnswer()
      if (answer) {
        const aiMsg = {
          id: Date.now() + 1,
          role: 'assistant',
          content: answer,
          time: formatTime(),
        }

        setMessages((prev) => [...prev, aiMsg])
        setIsTyping(false)
        return
      }
    }

    try {
      const generateAudio = outputMode !== 'text'
      const ttsMode = outputMode === 'custom' ? 'clone' : 'edge'

      const result = await sendAIChat({
        pathname: location.pathname,
        question: buildAIQuestion(content, pageContext),
        generateAudio,
        ttsMode,
      })

      const responseText =
        result?.answer ||
        result?.response ||
        result?.message ||
        (result?.success === false
          ? 'Unable to process your request right now.'
          : 'No response received from AI service.')

      const audioUrl = result?.audio_url || result?.audioUrl || ''
      const aiMsgId = Date.now() + 1

      const aiMsg = {
        id: aiMsgId,
        role: 'assistant',
        content: '',
        time: formatTime(),
        isStreaming: true,
      }

      setMessages((prev) => [...prev, aiMsg])
      setIsTyping(false)

      if (!generateAudio && autoReadAloud) {
        speakWithBrowser(responseText)
      }

      await animateAssistantReply(aiMsgId, responseText)

      if (generateAudio) {
        await playAssistantAudio(audioUrl, responseText)
      }
    } catch (error) {
      const aiMsg = {
        id: Date.now() + 1,
        role: 'assistant',
        content:
          error?.response?.data?.message ||
          'Unable to contact the AI service right now.',
        time: formatTime(),
      }

      setMessages((prev) => [...prev, aiMsg])
    } finally {
      setIsTyping(false)
      setIsAnimatingReply(false)
    }
  }, [animateAssistantReply, autoReadAloud, hasLoadedHistory, inputValue, isAnimatingReply, isTyping, location.pathname, outputMode, pageContext, playAssistantAudio, speakWithBrowser, stopAllAudio])

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const handleReset = async () => {
    try {
      await clearAIChatHistory(location.pathname)
    } catch {}

    setMessages([])
    setShowSuggestions(true)
    setInputValue('')
    setShowSettings(false)
    setIsTyping(false)
    setIsAnimatingReply(false)
    setHasLoadedHistory(false)
    voice.stopListening()
    stopAllAudio()
    setMessages([
      {
        id: `greeting-${location.pathname}-${Date.now()}`,
        role: 'assistant',
        content: formatGreeting(pageContext),
        time: formatTime(),
      },
    ])
    setHasLoadedHistory(true)
  }

  const handleDragStart = (e) => {
    dragStart.current = {
      x: e.clientX - dragPos.x,
      y: e.clientY - dragPos.y,
      moved: false,
    }

    setIsDragging(false)

    const onMove = (moveEvent) => {
      const dx = moveEvent.clientX - dragStart.current.x
      const dy = moveEvent.clientY - dragStart.current.y

      if (Math.abs(dx - dragPos.x) > 4 || Math.abs(dy - dragPos.y) > 4) {
        dragStart.current.moved = true
        setIsDragging(true)
      }

      setDragPos({ x: dx, y: dy })
    }

    const onUp = () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
      setTimeout(() => setIsDragging(false), 50)
    }

    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  const handleButtonClick = () => {
    if (isDragging || dragStart.current?.moved) return
    setIsOpen((prev) => !prev)
  }

  const handleMicToggle = () => {
    if (!voice.isSupported) {
      setVoiceError(voice.availabilityReason || 'Speech recognition is not supported in this browser. Try Chrome or Edge.')
      setTimeout(() => setVoiceError(null), 4000)
      return
    }

    if (voice.availabilityReason) {
      setVoiceError(voice.availabilityReason)
      setTimeout(() => setVoiceError(null), 5000)
      return
    }

    voice.toggleListening()
  }

  const outputModeDescription = {
    text: autoReadAloud ? 'Fast text reply with voice readout' : 'Fastest reply, no audio',
    voice: 'Text + standard voice audio',
    custom: 'Text + custom voice, slower',
  }[outputMode]

  const panelStyle = {
    bottom: `calc(5rem - ${dragPos.y}px)`,
    right: `calc(1rem - ${dragPos.x}px)`,
  }

  const buttonStyle = {
    transform: `translate(${dragPos.x}px, ${dragPos.y}px)`,
  }

  if (shouldHideAssistant) {
    return null
  }

  return (
    <>
      <div className="fixed bottom-4 right-4 z-[9998] select-none" style={buttonStyle}>
        <button
          onMouseDown={handleDragStart}
          onClick={handleButtonClick}
          aria-label={isOpen ? 'Close AI assistant' : 'Open AI assistant'}
          className={`relative w-14 h-14 rounded-2xl shadow-xl flex items-center justify-center transition-all duration-300 cursor-grab active:cursor-grabbing ${
            isOpen
              ? 'bg-slate-700 dark:bg-slate-600 shadow-slate-900/30 scale-95'
              : 'bg-gradient-to-br from-violet-600 to-indigo-600 shadow-violet-500/40 hover:scale-110 hover:shadow-violet-500/60'
          }`}
        >
          {isOpen ? <ChevronDown className="w-5 h-5 text-white" /> : <Sparkles className="w-6 h-6 text-white" />}
          <StatusDot status={isOpen ? status : 'idle'} />
        </button>
      </div>

      {isOpen && (
        <div
          className="fixed z-[9997] flex h-[min(520px,calc(100vh-7rem))] w-[calc(100vw-1rem)] max-w-[420px] flex-col overflow-hidden rounded-2xl border border-slate-200/60 bg-white/95 shadow-2xl backdrop-blur-xl dark:border-slate-700/50 dark:bg-slate-800/95 sm:w-[420px]"
          style={panelStyle}
          role="dialog"
          aria-label="AI Assistant"
        >
          <div className="flex items-start justify-between gap-3 px-4 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 flex-shrink-0">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-white leading-tight">ECBills AI</p>
                <p className="text-[10px] text-white/80 leading-tight truncate">
                  {isAISpeaking ? 'Speaking...' : `${pageContext.page} - ${outputModeDescription}`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 flex-shrink-0">
              <button
                onClick={() => setShowSettings((prev) => !prev)}
                className={`p-2 rounded-lg transition-colors ${showSettings ? 'bg-white/30 text-white' : 'hover:bg-white/20 text-white/80 hover:text-white'}`}
                title="Assistant settings"
              >
                <Settings className="w-4 h-4" />
              </button>
              <button
                onClick={handleReset}
                className="p-2 rounded-lg hover:bg-white/20 text-white/80 hover:text-white transition-colors"
                title="Clear conversation"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  setIsOpen(false)
                  stopAllAudio()
                }}
                className="p-2 rounded-lg hover:bg-white/20 text-white/80 hover:text-white transition-colors"
                title="Close"
              >
                <Minus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {showSettings && (
            <div className="absolute inset-x-3 top-[60px] z-20 rounded-2xl border border-slate-200/60 bg-white/72 px-4 py-3 shadow-xl backdrop-blur-md dark:border-slate-700/50 dark:bg-slate-800/68">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2 font-medium">
                  Reply Mode
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <ModeButton active={outputMode === 'text'} label="Text only" icon={Volume2} onClick={() => { setOutputMode('text'); stopAllAudio() }} />
                  <ModeButton active={outputMode === 'voice'} label="Voice" icon={AudioLines} onClick={() => setOutputMode('voice')} />
                  <ModeButton active={outputMode === 'custom'} label="Custom Voice" icon={Waves} onClick={() => setOutputMode('custom')} />
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-700/60 px-3 py-2.5">
                <div className="min-w-0">
                  <p className="text-xs font-medium text-slate-700 dark:text-slate-200">Read replies aloud</p>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500">
                    {outputMode === 'text'
                      ? 'Uses browser voice while keeping backend in fast text mode.'
                      : 'Reads the AI answer using the selected voice mode.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (autoReadAloud) stopAllAudio()
                    setAutoReadAloud((prev) => !prev)
                  }}
                  className={`relative h-7 w-12 rounded-full transition-colors ${
                    autoReadAloud ? 'bg-violet-600' : 'bg-slate-300 dark:bg-slate-600'
                  }`}
                  aria-pressed={autoReadAloud}
                  title="Toggle read aloud"
                >
                  <span
                    className={`absolute top-1 left-1 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
                      autoReadAloud ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-700/60 px-3 py-2 text-[11px] text-slate-500 dark:text-slate-400">
                {outputMode === 'text' && (autoReadAloud
                  ? 'Text only stays fast and uses browser voice to read the response aloud.'
                  : 'Text only is the fastest mode and skips audio generation.')}
                {outputMode === 'voice' && 'Voice uses the faster standard speech output.'}
                {outputMode === 'custom' && 'Custom Voice uses your clone voice when possible, then falls back automatically if needed.'}
              </div>
            </div>
          )}

          <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3 scroll-smooth">
            <div className="flex min-h-full flex-col justify-end space-y-3">
              {messages.map((msg) => (
                <MessageBubble
                  key={msg.id}
                  message={{
                    ...msg,
                    content: msg.role === 'assistant' && msg.isStreaming
                      ? <TypingText text={msg.content} active />
                      : msg.content,
                  }}
                />
              ))}

              {isTyping && <TypingIndicator />}

              {voice.interimText && (
                <div className="flex justify-end">
                  <div className="max-w-[85%] px-3 py-2 rounded-2xl rounded-br-sm bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-300 text-xs italic opacity-80">
                    {voice.interimText}...
                  </div>
                </div>
              )}

              {showSuggestions && messages.length <= 1 && !isTyping && !isAnimatingReply && hasLoadedHistory && (
                <div className="pt-1">
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 px-1">Suggested</p>
                  <div className="flex flex-wrap gap-1.5">
                    {(pageContext.suggestions || []).map((suggestion, index) => (
                      <SuggestionChip key={index} text={suggestion} onClick={sendMessage} />
                    ))}
                  </div>
                </div>
              )}

              {isAISpeaking && (
                <div className="flex items-center gap-2 rounded-xl bg-violet-50 dark:bg-violet-900/20 border border-violet-200/70 dark:border-violet-700/40 px-3 py-2">
                  <div className="flex items-end gap-1 h-6">
                    {[0, 1, 2, 3, 4, 5].map((i) => (
                      <span
                        key={i}
                        className="w-1.5 rounded-full bg-gradient-to-t from-violet-600 to-fuchsia-400"
                        style={{
                          height: `${10 + (i % 4) * 3}px`,
                          animation: 'aiTyping 0.75s ease-in-out infinite',
                          animationDelay: `${i * 0.08}s`,
                        }}
                      />
                    ))}
                  </div>
                  <span className="text-[10px] text-violet-600 dark:text-violet-300 font-medium">AI speaking...</span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </div>

          {voiceError && (
            <div className="mx-3 mb-2 px-3 py-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700/40 rounded-xl text-xs text-red-600 dark:text-red-400 flex-shrink-0">
              {voiceError}
            </div>
          )}

          <div className="p-3 border-t border-slate-200/60 dark:border-slate-700/50 flex-shrink-0 bg-slate-50/80 dark:bg-slate-800/80 space-y-2.5">
            {voice.isListening && (
              <div className="rounded-xl border border-violet-200 dark:border-violet-700/40 bg-violet-50 dark:bg-violet-900/20 px-3 py-2 text-xs text-violet-700 dark:text-violet-300">
                {voice.interimText || 'Listening... speak now'}
              </div>
            )}

            {!voice.isListening && voice.availabilityReason && (
              <div className="rounded-xl border border-amber-200 dark:border-amber-700/40 bg-amber-50 dark:bg-amber-900/20 px-3 py-2 text-xs text-amber-700 dark:text-amber-300">
                {voice.availabilityReason}
                {!voice.isSupported && (
                  <div className="mt-1 text-[11px] opacity-80">
                    Try Chrome or Microsoft Edge for built-in voice input.
                  </div>
                )}
                {voice.isSupported && voice.availabilityReason.includes('HTTPS or localhost') && (
                  <div className="mt-1 text-[11px] opacity-80">
                    Text chat still works here. For voice input, use `localhost` in development or serve the app over HTTPS.
                  </div>
                )}
              </div>
            )}

            <div className="flex items-end gap-2">
              <button
                onClick={handleMicToggle}
                title={voice.isListening ? 'Stop recording' : 'Record voice message'}
                className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                  voice.isListening
                    ? 'bg-red-500 text-white shadow-lg shadow-red-500/30 scale-105'
                    : voice.availabilityReason
                      ? 'bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed opacity-70'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 hover:bg-violet-100 dark:hover:bg-violet-900/30 hover:text-violet-600 dark:hover:text-violet-400'
                }`}
              >
                {voice.isListening ? <WaveAnimation active size="sm" /> : <Mic className="w-4 h-4" />}
              </button>
              <textarea
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={voice.isListening ? 'Listening...' : 'Ask anything...'}
                rows={1}
                className="flex-1 resize-none px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 outline-none focus:border-violet-400 dark:focus:border-violet-500 transition-all max-h-24 overflow-y-auto leading-relaxed"
                style={{ minHeight: '40px' }}
                onInput={(e) => {
                  e.target.style.height = 'auto'
                  e.target.style.height = `${Math.min(e.target.scrollHeight, 96)}px`
                }}
                disabled={isTyping || isAnimatingReply || !hasLoadedHistory}
              />
              <button
                onClick={() => sendMessage()}
                disabled={!inputValue.trim() || isTyping || isAnimatingReply || !hasLoadedHistory}
                className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-violet-500/25 hover:scale-105 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:scale-100"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="px-3 py-1.5 border-t border-slate-200/60 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/50 flex-shrink-0">
            <p className="text-[10px] text-center text-slate-400 dark:text-slate-500">
              {isAISpeaking ? 'ECBills AI - Speaking...' : 'ECBills AI - Context-aware assistant'}
            </p>
          </div>
        </div>
      )}

      <audio ref={audioRef} hidden />
    </>
  )
}

