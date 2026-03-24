/**
 * useVoiceInput.js
 * Custom hook wrapping the Web Speech API (SpeechRecognition).
 * Provides a clean interface for start/stop, transcript, and status.
 * Falls back gracefully when the API is unavailable (e.g. Firefox, mobile).
 */

import { useState, useRef, useCallback, useEffect } from 'react'

const SpeechRecognition =
  window.SpeechRecognition || window.webkitSpeechRecognition || null

export function useVoiceInput({ onTranscript, onError } = {}) {
  const [isListening, setIsListening] = useState(false)
  const [interimText, setInterimText] = useState('')
  const [isSupported] = useState(() => !!SpeechRecognition)
  const recognitionRef = useRef(null)

  // Clean up on unmount
  useEffect(() => {
    return () => {
      recognitionRef.current?.abort()
    }
  }, [])

  const startListening = useCallback(() => {
    if (!SpeechRecognition) {
      onError?.('Speech recognition is not supported in this browser.')
      return
    }

    if (isListening) return

    const recognition = new SpeechRecognition()
    recognition.lang = 'en-US'
    recognition.interimResults = true
    recognition.maxAlternatives = 1
    recognition.continuous = false

    recognition.onstart = () => {
      setIsListening(true)
      setInterimText('')
    }

    recognition.onresult = (event) => {
      let interim = ''
      let final = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript
        if (event.results[i].isFinal) {
          final += transcript
        } else {
          interim += transcript
        }
      }
      setInterimText(interim)
      if (final) {
        onTranscript?.(final.trim())
        setInterimText('')
      }
    }

    recognition.onerror = (event) => {
      setIsListening(false)
      setInterimText('')
      if (event.error !== 'no-speech' && event.error !== 'aborted') {
        onError?.(
          event.error === 'not-allowed'
            ? 'Microphone access denied. Please allow microphone permission.'
            : `Voice error: ${event.error}`
        )
      }
    }

    recognition.onend = () => {
      setIsListening(false)
      setInterimText('')
    }

    recognitionRef.current = recognition
    recognition.start()
  }, [isListening, onTranscript, onError])

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop()
    setIsListening(false)
    setInterimText('')
  }, [])

  const toggleListening = useCallback(() => {
    if (isListening) stopListening()
    else startListening()
  }, [isListening, startListening, stopListening])

  return {
    isListening,
    interimText,
    isSupported,
    startListening,
    stopListening,
    toggleListening,
  }
}
