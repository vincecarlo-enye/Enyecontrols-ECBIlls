import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import {
  X,
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
import { getPageContext } from './aiContext'
import { useVoiceInput } from './useVoiceInput'
import WaveAnimation from './WaveAnimation'
import { clearAIChatHistory, getAIChatHistory, sendAIChat } from '@/services/adminService/aiService'
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
        className={`max-w-[85%] px-3 py-2 rounded-2xl text-xs leading-relaxed shadow-sm ${
          isUser
            ? 'bg-gradient-to-br from-violet-600 to-indigo-600 text-white rounded-br-sm'
            : 'bg-white dark:bg-slate-700/80 text-slate-700 dark:text-slate-200 rounded-bl-sm border border-slate-200/60 dark:border-slate-600/50'
        }`}
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

    const requestId = historyRequestIdRef.current + 1
    historyRequestIdRef.current = requestId
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
  }, [isOpen, location.pathname, pageContext])

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
      utterance.rate = 1.02
      utterance.pitch = 1
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

    try {
      const generateAudio = outputMode !== 'text'
      const ttsMode = outputMode === 'custom' ? 'clone' : 'edge'

      const result = await sendAIChat({
        pathname: location.pathname,
        question: content,
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
      await animateAssistantReply(aiMsgId, responseText)

      if (generateAudio) {
        await playAssistantAudio(audioUrl, responseText)
      } else if (autoReadAloud) {
        speakWithBrowser(responseText)
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
  }, [animateAssistantReply, autoReadAloud, hasLoadedHistory, inputValue, isAnimatingReply, isTyping, location.pathname, outputMode, playAssistantAudio, speakWithBrowser, stopAllAudio])

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
          className="fixed z-[9997] w-[calc(100vw-1rem)] max-w-[420px] sm:w-[420px] max-h-[min(78vh,680px)] flex flex-col rounded-2xl shadow-2xl border border-slate-200/60 dark:border-slate-700/50 bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl overflow-hidden"
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
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {showSettings && (
            <div className="px-4 py-3 bg-slate-50/90 dark:bg-slate-800/90 border-b border-slate-200/60 dark:border-slate-700/50 flex-shrink-0 space-y-3">
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

          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3 min-h-[220px] max-h-[420px] scroll-smooth">
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

          {voiceError && (
            <div className="mx-3 mb-2 px-3 py-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700/40 rounded-xl text-xs text-red-600 dark:text-red-400 flex-shrink-0">
              {voiceError}
            </div>
          )}

          <div className="p-3 border-t border-slate-200/60 dark:border-slate-700/50 flex-shrink-0 bg-slate-50/80 dark:bg-slate-800/80 space-y-2.5">
            <div className="flex items-center gap-2">
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

              <div className="min-w-0 flex-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-700/60 px-3 py-2">
                <p className="text-[10px] uppercase tracking-wide text-slate-400 dark:text-slate-500">Current Mode</p>
                <p className="text-xs text-slate-700 dark:text-slate-200 truncate">
                  {outputMode === 'text' && (autoReadAloud ? 'Text only + read aloud' : 'Text only')}
                  {outputMode === 'voice' && 'Voice response'}
                  {outputMode === 'custom' && 'Custom voice response'}
                </p>
              </div>
            </div>

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

