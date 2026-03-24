/**
 * AIAssistant.jsx
 * Floating AI assistant widget with chat and voice input modes.
 *
 * Features:
 * - Floating button at bottom-right (fixed position, always on top)
 * - Expands into a chat/voice panel
 * - Page-aware context and suggestions via aiContext.js
 * - Voice input via Web Speech API (useVoiceInput hook)
 * - Dark/light mode aware (inherits Tailwind dark: classes)
 * - Draggable floating button
 * - Minimizable panel
 * - Auto-focus on chat input when panel opens
 * - No external chat-UI library needed
 */

import { useState, useRef, useEffect, useCallback } from 'react'
import { useLocation } from 'react-router-dom'
import {
  MessageSquare, X, Send, Mic, MicOff, ChevronDown,
  Sparkles, RotateCcw, Volume2, Bot, Settings, VolumeX,
} from 'lucide-react'
import { getPageContext, generateAIResponse } from './aiContext'
import { useVoiceInput } from './useVoiceInput'
import WaveAnimation from './WaveAnimation'

// ── Message bubble ────────────────────────────────────────────────────────────
function MessageBubble({ message }) {
  const isUser = message.role === 'user'
  const isSystem = message.role === 'system'

  if (isSystem) {
    return (
      <div className="flex justify-center my-2">
        <span className="text-[10px] text-slate-400 dark:text-slate-500 px-2 py-1 bg-slate-100 dark:bg-slate-700/50 rounded-full">
          {message.content}
        </span>
      </div>
    )
  }

  return (
    <div className={`flex items-end gap-2 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* Avatar */}
      {!isUser && (
        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-sm">
          <Bot className="w-3.5 h-3.5 text-white" />
        </div>
      )}

      {/* Bubble */}
      <div
        className={`max-w-[82%] px-3 py-2 rounded-2xl text-xs leading-relaxed shadow-sm ${
          isUser
            ? 'bg-gradient-to-br from-violet-600 to-indigo-600 text-white rounded-br-sm'
            : 'bg-white dark:bg-slate-700/80 text-slate-700 dark:text-slate-200 rounded-bl-sm border border-slate-200/60 dark:border-slate-600/50'
        }`}
      >
        {/* Render simple markdown: **bold** and line breaks */}
        {message.content.split('\n').map((line, i) => {
          const parts = line.split(/(\*\*[^*]+\*\*)/)
          return (
            <span key={i}>
              {i > 0 && <br />}
              {parts.map((part, j) =>
                part.startsWith('**') && part.endsWith('**')
                  ? <strong key={j} className="font-semibold">{part.slice(2, -2)}</strong>
                  : part
              )}
            </span>
          )
        })}

        {/* Timestamp */}
        <div className={`text-[10px] mt-1 ${isUser ? 'text-white/60' : 'text-slate-400 dark:text-slate-500'}`}>
          {message.time}
        </div>
      </div>
    </div>
  )
}

// ── Suggestion chip ───────────────────────────────────────────────────────────
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

// ── Typing indicator ──────────────────────────────────────────────────────────
function TypingIndicator() {
  return (
    <div className="flex items-end gap-2">
      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
        <Bot className="w-3.5 h-3.5 text-white" />
      </div>
      <div className="bg-white dark:bg-slate-700/80 border border-slate-200/60 dark:border-slate-600/50 rounded-2xl rounded-bl-sm px-3 py-2.5 shadow-sm">
        <div className="flex items-center gap-1">
          {[0, 1, 2].map(i => (
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

// ── Status dot (floating button indicator) ───────────────────────────────────
function StatusDot({ status }) {
  const config = {
    idle:      { color: 'bg-emerald-400', pulse: false },
    listening: { color: 'bg-red-400',     pulse: true  },
    thinking:  { color: 'bg-amber-400',   pulse: true  },
  }
  const { color, pulse } = config[status] || config.idle
  return (
    <span
      className={`absolute top-0.5 right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-slate-800 ${color} ${pulse ? 'animate-pulse' : ''}`}
    />
  )
}

// ── Main widget ───────────────────────────────────────────────────────────────
export default function AIAssistant() {
  const location = useLocation()
  const pageContext = getPageContext(location.pathname)

  const [isOpen, setIsOpen] = useState(false)
  const [mode, setMode] = useState('chat') // 'chat' | 'voice'
  const [messages, setMessages] = useState([])
  const [inputValue, setInputValue] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [status, setStatus] = useState('idle') // 'idle' | 'listening' | 'thinking'
  const [showSuggestions, setShowSuggestions] = useState(true)
  const [hasGreeted, setHasGreeted] = useState(false)
  const [voiceError, setVoiceError] = useState(null)
  const [showSettings, setShowSettings] = useState(false)
  const [voiceWhileTyping, setVoiceWhileTyping] = useState(() => {
    try { return localStorage.getItem('ai_voice_while_typing') === 'true' } catch { return false }
  })

  // Dragging state
  const [dragPos, setDragPos] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const dragStart = useRef(null)
  const buttonRef = useRef(null)

  // Refs
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)
  const panelRef = useRef(null)

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, isTyping, isOpen])

  // Auto-focus chat input when panel opens
  useEffect(() => {
    if (isOpen && mode === 'chat') {
      setTimeout(() => inputRef.current?.focus(), 150)
    }
  }, [isOpen, mode])

  // Greet user when panel first opens
  useEffect(() => {
    if (isOpen && !hasGreeted) {
      const now = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
      const greeting = `Hi! 👋 I'm your ECBills AI assistant.\n\nYou're on **${pageContext.page}** — ${pageContext.description}\n\nHow can I help you?`
      setMessages([{ id: 1, role: 'assistant', content: greeting, time: now }])
      setHasGreeted(true)
    }
  }, [isOpen, hasGreeted, pageContext])

  // Reset greeting when page changes (panel already open)
  useEffect(() => {
    if (isOpen && hasGreeted) {
      const now = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
      setMessages(prev => [
        ...prev,
        {
          id: Date.now(),
          role: 'system',
          content: `Navigated to ${pageContext.page}`,
          time: now,
        },
      ])
      setShowSuggestions(true)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname])

  // ── Voice input setup ─────────────────────────────────────────────────────
  const handleVoiceTranscript = useCallback((text) => {
    setInputValue(prev => (prev ? `${prev} ${text}` : text))
    setMode('chat') // switch to chat to show the transcribed text
  }, [])

  const handleVoiceError = useCallback((err) => {
    setVoiceError(err)
    setStatus('idle')
    setTimeout(() => setVoiceError(null), 4000)
  }, [])

  const voice = useVoiceInput({
    onTranscript: handleVoiceTranscript,
    onError: handleVoiceError,
  })

  // Sync voice listening status
  useEffect(() => {
    setStatus(voice.isListening ? 'listening' : 'idle')
  }, [voice.isListening])

  // ── Voice-while-typing toggle ─────────────────────────────────────────────
  const toggleVoiceWhileTyping = useCallback(() => {
    setVoiceWhileTyping(prev => {
      const next = !prev
      try { localStorage.setItem('ai_voice_while_typing', String(next)) } catch {}
      if (!next) {
        try { window.speechSynthesis.cancel() } catch {}
      }
      return next
    })
  }, [])

  const speakText = useCallback((text) => {
    try {
      window.speechSynthesis.cancel()
      const plain = text.replace(/\*\*/g, '').replace(/\n+/g, ' ')
      const utt = new SpeechSynthesisUtterance(plain)
      utt.rate  = 1.05
      utt.pitch = 1
      utt.volume = 1
      window.speechSynthesis.speak(utt)
    } catch {}
  }, [])

  // ── Send message ──────────────────────────────────────────────────────────
  const sendMessage = useCallback(async (text) => {
    const content = (text || inputValue).trim()
    if (!content) return

    const now = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    const userMsg = { id: Date.now(), role: 'user', content, time: now }

    setMessages(prev => [...prev, userMsg])
    setInputValue('')
    setShowSuggestions(false)
    setIsTyping(true)
    setStatus('thinking')

    // Simulate AI thinking delay (150–600ms based on response complexity)
    const thinkTime = 300 + Math.min(content.length * 4, 900)
    await new Promise(r => setTimeout(r, thinkTime))

    const response = generateAIResponse(content, pageContext)
    const aiMsg = {
      id: Date.now() + 1,
      role: 'assistant',
      content: response,
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    }

    setMessages(prev => [...prev, aiMsg])
    setIsTyping(false)
    setStatus('idle')

    if (voiceWhileTyping) {
      speakText(response)
    }
  }, [inputValue, pageContext, voiceWhileTyping, speakText])

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const handleReset = () => {
    setMessages([])
    setHasGreeted(false)
    setShowSuggestions(true)
    setInputValue('')
    setShowSettings(false)
    voice.stopListening()
    try { window.speechSynthesis.cancel() } catch {}
  }

  // ── Drag logic ────────────────────────────────────────────────────────────
  const handleDragStart = (e) => {
    // Don't drag if it's a click (will open panel)
    dragStart.current = { x: e.clientX - dragPos.x, y: e.clientY - dragPos.y, moved: false }
    setIsDragging(false)

    const onMove = (me) => {
      const dx = me.clientX - dragStart.current.x
      const dy = me.clientY - dragStart.current.y
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
    setIsOpen(o => !o)
  }

  // ── Mic button in voice mode ──────────────────────────────────────────────
  const handleMicToggle = () => {
    if (!voice.isSupported) {
      setVoiceError('Speech recognition is not supported in this browser. Try Chrome or Edge.')
      setTimeout(() => setVoiceError(null), 4000)
      return
    }
    voice.toggleListening()
  }

  // ── Panel open/close state ────────────────────────────────────────────────
  const panelStyle = {
    bottom: `calc(5rem - ${dragPos.y}px)`,
    right: `calc(1.25rem - ${dragPos.x}px)`,
  }
  const buttonStyle = {
    transform: `translate(${dragPos.x}px, ${dragPos.y}px)`,
  }

  return (
    <>
      {/* ── Floating toggle button ───────────────────────────────────────── */}
      <div
        ref={buttonRef}
        className="fixed bottom-5 right-5 z-[9998] select-none"
        style={buttonStyle}
      >
        <button
          onMouseDown={handleDragStart}
          onClick={handleButtonClick}
          aria-label={isOpen ? 'Close AI assistant' : 'Open AI assistant'}
          className={`relative w-14 h-14 rounded-2xl shadow-xl flex items-center justify-center transition-all duration-300 cursor-grab active:cursor-grabbing ${
            isOpen
              ? 'bg-slate-700 dark:bg-slate-600 shadow-slate-900/30 rotate-0 scale-95'
              : 'bg-gradient-to-br from-violet-600 to-indigo-600 shadow-violet-500/40 hover:scale-110 hover:shadow-violet-500/60'
          }`}
        >
          <div className={`transition-all duration-300 ${isOpen ? 'rotate-0 scale-100' : 'rotate-0 scale-100'}`}>
            {isOpen
              ? <ChevronDown className="w-5 h-5 text-white" />
              : <Sparkles className="w-6 h-6 text-white" />
            }
          </div>
          <StatusDot status={isOpen ? (status === 'idle' ? 'idle' : status) : 'idle'} />
        </button>

        {/* Tooltip (only when closed) */}
        {!isOpen && (
          <div className="absolute bottom-full right-0 mb-2 pointer-events-none opacity-0 group-hover:opacity-100">
            <div className="bg-slate-800 text-white text-xs px-2 py-1 rounded-lg whitespace-nowrap">
              AI Assistant
            </div>
          </div>
        )}
      </div>

      {/* ── Chat/Voice Panel ─────────────────────────────────────────────── */}
      {isOpen && (
        <div
          ref={panelRef}
          className="fixed z-[9997] w-[340px] sm:w-[380px] max-h-[600px] flex flex-col rounded-2xl shadow-2xl border border-slate-200/60 dark:border-slate-700/50 bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl overflow-hidden"
          style={panelStyle}
          role="dialog"
          aria-label="AI Assistant"
        >
          {/* ── Header ───────────────────────────────────────────────────── */}
          <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 flex-shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white leading-tight">ECBills AI</p>
                <p className="text-[10px] text-white/70 leading-tight">{pageContext.page}</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {/* Mode toggle */}
              <div className="flex bg-white/20 rounded-lg p-0.5">
                <button
                  onClick={() => setMode('chat')}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                    mode === 'chat' ? 'bg-white text-violet-700' : 'text-white/80 hover:text-white'
                  }`}
                >
                  Chat
                </button>
                <button
                  onClick={() => setMode('voice')}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                    mode === 'voice' ? 'bg-white text-violet-700' : 'text-white/80 hover:text-white'
                  }`}
                >
                  Voice
                </button>
              </div>

              {/* Settings toggle */}
              <button
                onClick={() => setShowSettings(s => !s)}
                className={`p-1.5 rounded-lg transition-colors ${showSettings ? 'bg-white/30 text-white' : 'hover:bg-white/20 text-white/70 hover:text-white'}`}
                title="Chat settings"
              >
                <Settings className="w-3.5 h-3.5" />
              </button>

              {/* Reset */}
              <button
                onClick={handleReset}
                className="p-1.5 rounded-lg hover:bg-white/20 text-white/70 hover:text-white transition-colors"
                title="Clear conversation"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>

              {/* Close */}
              <button
                onClick={() => { setIsOpen(false); try { window.speechSynthesis.cancel() } catch {} }}
                className="p-1.5 rounded-lg hover:bg-white/20 text-white/70 hover:text-white transition-colors"
                title="Close"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* ── Settings panel ────────────────────────────────────────────── */}
          {showSettings && (
            <div className="px-4 py-3 bg-slate-50/90 dark:bg-slate-800/90 border-b border-slate-200/60 dark:border-slate-700/50 flex-shrink-0">
              <p className="text-[10px] uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2 font-medium">Settings</p>
              <button
                onClick={toggleVoiceWhileTyping}
                className="w-full flex items-center justify-between gap-3 px-3 py-2 rounded-xl bg-white dark:bg-slate-700/60 border border-slate-200 dark:border-slate-600/50 hover:border-violet-300 dark:hover:border-violet-600 transition-all group"
              >
                <div className="flex items-center gap-2.5">
                  {voiceWhileTyping
                    ? <Volume2 className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400" />
                    : <VolumeX className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                  }
                  <div className="text-left">
                    <p className="text-xs font-medium text-slate-700 dark:text-slate-200">Voice While Typing</p>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500">Speak AI responses aloud</p>
                  </div>
                </div>
                {/* Toggle pill */}
                <div className={`relative w-8 h-4.5 rounded-full transition-colors flex-shrink-0 ${voiceWhileTyping ? 'bg-violet-600' : 'bg-slate-300 dark:bg-slate-600'}`} style={{ height: '18px', width: '32px' }}>
                  <span className={`absolute top-0.5 w-3.5 h-3.5 rounded-full bg-white shadow transition-transform ${voiceWhileTyping ? 'translate-x-[14px]' : 'translate-x-0.5'}`} />
                </div>
              </button>
            </div>
          )}

          {/* ── Messages area ─────────────────────────────────────────────── */}
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3 min-h-[200px] max-h-[380px] scroll-smooth">
            {messages.map(msg => (
              <MessageBubble key={msg.id} message={msg} />
            ))}

            {isTyping && <TypingIndicator />}

            {/* Inline voice interim text */}
            {voice.interimText && (
              <div className="flex justify-end">
                <div className="max-w-[82%] px-3 py-2 rounded-2xl rounded-br-sm bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-300 text-xs italic opacity-70">
                  {voice.interimText}…
                </div>
              </div>
            )}

            {/* Suggestions */}
            {showSuggestions && messages.length <= 1 && !isTyping && (
              <div className="pt-1">
                <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 px-1">
                  Suggested
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {pageContext.suggestions.map((s, i) => (
                    <SuggestionChip key={i} text={s} onClick={sendMessage} />
                  ))}
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* ── Voice error banner ────────────────────────────────────────── */}
          {voiceError && (
            <div className="mx-3 mb-2 px-3 py-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700/40 rounded-xl text-xs text-red-600 dark:text-red-400 flex-shrink-0">
              {voiceError}
            </div>
          )}

          {/* ── CHAT mode input ───────────────────────────────────────────── */}
          {mode === 'chat' && (
            <div className="flex items-end gap-2 p-3 border-t border-slate-200/60 dark:border-slate-700/50 flex-shrink-0 bg-slate-50/80 dark:bg-slate-800/80">
              {/* Mic button (in chat mode, triggers voice then pastes) */}
              <button
                onClick={handleMicToggle}
                title={voice.isListening ? 'Stop recording' : 'Record voice message'}
                className={`flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                  voice.isListening
                    ? 'bg-red-500 text-white shadow-lg shadow-red-500/30 scale-110'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 hover:bg-violet-100 dark:hover:bg-violet-900/30 hover:text-violet-600 dark:hover:text-violet-400'
                }`}
              >
                {voice.isListening ? (
                  <WaveAnimation active size="sm" />
                ) : (
                  <Mic className="w-4 h-4" />
                )}
              </button>

              <div className="flex-1 flex items-end gap-1">
                <textarea
                  ref={inputRef}
                  value={inputValue}
                  onChange={e => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={voice.isListening ? 'Listening…' : 'Ask anything…'}
                  rows={1}
                  className="flex-1 resize-none px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 outline-none focus:border-violet-400 dark:focus:border-violet-500 transition-all max-h-24 overflow-y-auto leading-relaxed"
                  style={{ minHeight: '36px' }}
                  onInput={e => {
                    e.target.style.height = 'auto'
                    e.target.style.height = Math.min(e.target.scrollHeight, 96) + 'px'
                  }}
                  disabled={isTyping}
                />
                <button
                  onClick={() => sendMessage()}
                  disabled={!inputValue.trim() || isTyping}
                  className="flex-shrink-0 w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-violet-500/25 hover:scale-105 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:scale-100"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ── VOICE mode panel ──────────────────────────────────────────── */}
          {mode === 'voice' && (
            <div className="flex flex-col items-center gap-4 p-5 border-t border-slate-200/60 dark:border-slate-700/50 flex-shrink-0 bg-slate-50/80 dark:bg-slate-800/80">
              {/* Big mic button */}
              <button
                onClick={handleMicToggle}
                aria-label={voice.isListening ? 'Stop listening' : 'Start listening'}
                className={`relative w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-xl ${
                  voice.isListening
                    ? 'bg-red-500 shadow-red-500/40 scale-110'
                    : 'bg-gradient-to-br from-violet-600 to-indigo-600 shadow-violet-500/30 hover:scale-105'
                }`}
              >
                {voice.isListening
                  ? <MicOff className="w-7 h-7 text-white" />
                  : <Mic className="w-7 h-7 text-white" />
                }
                {voice.isListening && (
                  <span className="absolute inset-0 rounded-2xl border-2 border-red-400 animate-ping opacity-75" />
                )}
              </button>

              {/* Wave animation */}
              <WaveAnimation active={voice.isListening} size="lg" />

              {/* Status text */}
              <p className={`text-xs font-medium text-center transition-all ${
                voice.isListening
                  ? 'text-red-500 dark:text-red-400'
                  : 'text-slate-400 dark:text-slate-500'
              }`}>
                {voice.isListening
                  ? (voice.interimText || 'Listening… speak now')
                  : voice.isSupported
                  ? 'Tap to start speaking'
                  : 'Voice input not supported'
                }
              </p>

              {/* Interim text preview */}
              {voice.interimText && (
                <div className="w-full px-3 py-2 bg-violet-50 dark:bg-violet-900/20 rounded-xl border border-violet-200 dark:border-violet-700/40 text-xs text-violet-700 dark:text-violet-300 italic text-center">
                  "{voice.interimText}"
                </div>
              )}

              {/* Input box for voice mode (shows transcription) */}
              <div className="w-full flex items-end gap-2">
                <textarea
                  value={inputValue}
                  onChange={e => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Transcription appears here, or type…"
                  rows={2}
                  className="flex-1 resize-none px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 placeholder-slate-400 outline-none focus:border-violet-400 transition-all"
                />
                <button
                  onClick={() => sendMessage()}
                  disabled={!inputValue.trim() || isTyping}
                  className="flex-shrink-0 w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white flex items-center justify-center shadow-md disabled:opacity-40 disabled:cursor-not-allowed hover:scale-105 active:scale-95 transition-all"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ── Footer ───────────────────────────────────────────────────── */}
          <div className="px-3 py-1.5 border-t border-slate-200/60 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/50 flex-shrink-0">
            <p className="text-[10px] text-center text-slate-400 dark:text-slate-500">
              ECBills AI · Context-aware assistant
            </p>
          </div>
        </div>
      )}
    </>
  )
}
