import axios from "axios"

const DEFAULT_TIMEOUT_MS = 12_000
const INGEST_CLEAR_TIMEOUT_MS = 60_000
const INGEST_UPLOAD_TIMEOUT_MS = 300_000
const SCHEMA_TIMEOUT_MS = 45_000

const API = axios.create({
  baseURL: "https://olivaceous-shaunte-indeterminedly.ngrok-free.dev",
  timeout: DEFAULT_TIMEOUT_MS,
})

// 🔥 IMPORTANT FIX FOR NGROK
API.defaults.headers["ngrok-skip-browser-warning"] = "true"

export default API

let authGetter = null
export const setTokenGetter = (getter) => {
  authGetter = getter
}

const AUTH_TOKEN_TIMEOUT_MS = 8000

async function getAuthTokenWithTimeout() {
  if (!authGetter) return null

  try {
    const token = await Promise.race([
      authGetter(),
      new Promise((resolve) => {
        setTimeout(() => resolve(null), AUTH_TOKEN_TIMEOUT_MS)
      }),
    ])

    return token || null
  } catch (err) {
    console.warn("Failed to retrieve Clerk token for API request", err)
    return null
  }
}

API.interceptors.request.use(async (config) => {
  const token = await getAuthTokenWithTimeout()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

API.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error?.response?.status
    const originalConfig = error?.config

    if (status === 401 && originalConfig && !originalConfig.__authRetried) {
      const token = await getAuthTokenWithTimeout()
      if (token) {
        originalConfig.__authRetried = true
        originalConfig.headers = {
          ...(originalConfig.headers || {}),
          Authorization: `Bearer ${token}`,
        }
        return API.request(originalConfig)
      }
    }

    return Promise.reject(error)
  }
)

let schemaCache = null
let schemaCacheTime = 0
const SCHEMA_CACHE_TTL_MS = 60_000

// API FUNCTIONS
export const getSchema = () => API.get(`/schema?t=${Date.now()}`, { timeout: SCHEMA_TIMEOUT_MS })
export const getSchemaWithCache = async ({ force = false } = {}) => {
  const age = Date.now() - schemaCacheTime
  if (!force && schemaCache && age < SCHEMA_CACHE_TTL_MS) {
    return schemaCache
  }

  const res = await API.get(`/schema?t=${Date.now()}`, { timeout: SCHEMA_TIMEOUT_MS })
  schemaCache = res
  schemaCacheTime = Date.now()
  return res
}

export const bustSchemaCache = () => {
  schemaCache = null
  schemaCacheTime = 0
}

export const getQuality = () => API.get(`/quality?t=${Date.now()}`)
export const getTableQuality = (tableName) => API.get(`/quality/${tableName}?t=${Date.now()}`)
export const getTableAnalysis = (tableName) => API.get(`/analysis/${encodeURIComponent(tableName)}?t=${Date.now()}`)
export const getRelationships = () => API.get(`/relationships?t=${Date.now()}`)
export const getGraphData = (payload = {}) => API.post("/graph-data", payload)
export const postQuery = (query) => API.post("/query", { query })
export const analyzeTableWithAI = (prompt) => API.post("/query", { query: prompt })
export const postColumnChat = (payload) => API.post("/column-chat", payload)
export const clearDatabase = () =>
  API.post("/ingest/clear", undefined, {
    timeout: INGEST_CLEAR_TIMEOUT_MS,
  })

export async function streamColumnChat(
  { table, column, question },
  { onMeta, onDelta, onDone, onError, signal } = {}
) {
  const headers = {
    "Content-Type": "application/json",
    "ngrok-skip-browser-warning": "true",
  }

  const token = await getAuthTokenWithTimeout()
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  const response = await fetch(`${API.defaults.baseURL}/query/stream`, {
    method: "POST",
    headers,
    body: JSON.stringify({ mode: "column_chat", table, column, question }),
    signal,
  })

  if (!response.ok || !response.body) {
    throw new Error(`Streaming request failed (${response.status})`)
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder("utf-8")
  let buffer = ""

  const emitEvent = (eventName, payload) => {
    const type = payload?.type || eventName || ""
    if (type === "meta") {
      onMeta?.(payload?.context || payload)
      return
    }
    if (type === "delta") {
      onDelta?.(payload?.chunk || payload?.delta || payload?.token || payload?.content || "")
      return
    }
    if (type === "done") {
      onDone?.(payload?.payload || payload)
      return
    }
    if (type === "error") {
      onError?.(payload?.message || "Streaming failed")
    }
  }

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const chunks = buffer.split("\n\n")
    buffer = chunks.pop() || ""

    for (const chunk of chunks) {
      if (!chunk.trim()) continue
      let eventName = "message"
      const dataLines = []

      for (const line of chunk.split("\n")) {
        if (line.startsWith("event:")) {
          eventName = line.slice(6).trim()
        }
        if (line.startsWith("data:")) {
          dataLines.push(line.slice(5).trim())
        }
      }

      if (!dataLines.length) continue
      const dataString = dataLines.join("\n")

      try {
        const payload = JSON.parse(dataString)
        emitEvent(eventName, payload)
      } catch {
        emitEvent(eventName, { type: eventName, delta: dataString })
      }
    }
  }
}

export const uploadFile = async (file) => {
  const formData = new FormData()
  formData.append("file", file)

  try {
    const res = await API.post("/ingest/file", formData, {
      // File ingest can take longer than regular metadata requests.
      timeout: INGEST_UPLOAD_TIMEOUT_MS,
    })
    return res
  } catch (err) {
    throw err
  }
}