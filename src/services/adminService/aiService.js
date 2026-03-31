import api from '../../lib/api'

function resolveChatEndpoint(pathname = '') {
  if (pathname.startsWith('/tenant')) return '/api/tenant/ai/chat'
  if (
    pathname.startsWith('/admin') ||
    pathname.startsWith('/super-admin') ||
    pathname.startsWith('/facility') ||
    pathname.startsWith('/finance')
  ) {
    return '/api/ai/chat'
  }
  return null
}

function resolveHistoryEndpoint(pathname = '') {
  if (pathname.startsWith('/tenant')) return '/api/tenant/ai/history'
  if (
    pathname.startsWith('/admin') ||
    pathname.startsWith('/super-admin') ||
    pathname.startsWith('/facility') ||
    pathname.startsWith('/finance')
  ) {
    return '/api/ai/history'
  }
  return null
}

export async function sendAIChat({ pathname, question, generateAudio = false, ttsMode = 'edge', voice = 'en-US-AriaNeural' }) {
  const endpoint = resolveChatEndpoint(pathname)

  if (!endpoint) {
    return {
      success: false,
      answer: 'AI chat is not configured for this page.',
      audio_url: null,
    }
  }

  const res = await api.post(endpoint, {
    question,
    pathname,
    generate_audio: generateAudio,
    tts_mode: ttsMode,
    voice,
  })

  return res.data
}

export async function sendAdminAIChat(question, options = {}) {
  return sendAIChat({ pathname: '/admin', question, ...options })
}

export async function sendTenantAIChat(question, options = {}) {
  return sendAIChat({ pathname: '/tenant', question, ...options })
}

export async function analyzeAdminMeter(meterId) {
  const res = await api.get('/api/ai/analyze-meter', {
    params: { meter_id: meterId },
  })
  return res.data
}

export async function analyzeTenantMeter(meterId) {
  const res = await api.get('/api/tenant/ai/analyze-meter', {
    params: { meter_id: meterId },
  })
  return res.data
}

export async function getAIChatHistory(pathname) {
  const endpoint = resolveHistoryEndpoint(pathname)

  if (!endpoint) {
    return {
      success: false,
      data: [],
    }
  }

  const res = await api.get(endpoint, {
    params: { pathname },
  })

  return res.data
}

export async function clearAIChatHistory(pathname) {
  const endpoint = resolveHistoryEndpoint(pathname)

  if (!endpoint) {
    return {
      success: false,
      message: 'AI chat history is not configured for this page.',
    }
  }

  const res = await api.delete(endpoint, {
    params: { pathname },
  })

  return res.data
}
