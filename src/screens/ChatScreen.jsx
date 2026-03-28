import { useEffect, useRef, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import API from "../api/api"
import { Send, AlertCircle, CheckCircle, Loader, Bot, MessageSquare } from "lucide-react"
import { useVisualizationStore } from "../store/useVisualizationStore"

function normalizeUserQuestion(question) {
  const q = String(question || "").trim()
  const lower = q.toLowerCase()

  const sortIntent = /(sort|order\s*by|ascending|descending|asc\b|desc\b)/i.test(lower)
  const shortSortPattern = /^sort\s+(ascendingly|descendingly|asc|desc)?\s*(for|by)?\s+[a-zA-Z0-9_]+\s*$/i

  if (sortIntent && shortSortPattern.test(q)) {
    const colMatch = q.match(/([a-zA-Z_][a-zA-Z0-9_]*)\s*$/)
    const col = colMatch ? colMatch[1] : "id"
    const direction = /(desc|descending)/i.test(lower) ? "descending" : "ascending"
    return `Show top 20 rows sorted by ${col} in ${direction} order. Use a read-only SELECT query.`
  }

  return q
}

function shouldRetryWithClarifiedPrompt(body) {
  const explanation = String(body?.explanation || body?.message || "").toLowerCase()
  const executionError = String(body?.execution_error || "").toLowerCase()
  const sql = String(body?.sql || body?.query || "").trim().toLowerCase()

  const hasFallbackSignal =
    body?.used_fallback === true ||
    explanation.includes("empty sql generated") ||
    explanation.includes("self-correction") ||
    explanation.includes("returning fallback data") ||
    executionError.length > 0

  const sqlLooksInvalid = !sql || (!sql.startsWith("select") && !sql.startsWith("with"))
  return hasFallbackSignal && sqlLooksInvalid
}

function buildRetryPrompt(question) {
  return [
    "Rewrite the request into a single valid read-only SQL task.",
    "Use only SELECT/WITH SQL semantics.",
    "If sorting is requested, include ORDER BY with ASC/DESC.",
    `User request: ${question}`,
  ].join("\n")
}

function TypewriterText({ text, speed = 18, onDone }) {
  const [display, setDisplay] = useState("")
  const doneRef = useRef(false)

  useEffect(() => {
    doneRef.current = false
    setDisplay("")
    const fullText = String(text || "")
    if (!fullText) {
      if (!doneRef.current && onDone) {
        doneRef.current = true
        onDone()
      }
      return
    }

    let i = 0
    const timer = setInterval(() => {
      i += 1
      setDisplay(fullText.slice(0, i))
      if (i >= fullText.length) {
        clearInterval(timer)
        if (!doneRef.current && onDone) {
          doneRef.current = true
          onDone()
        }
      }
    }, speed)

    return () => clearInterval(timer)
  }, [text])

  return (
    <>
      {display}
      <span className="inline-block w-[6px] h-[1em] ml-0.5 align-middle bg-primary/80 animate-pulse" />
    </>
  )
}

function hasExecutionIssue(msg) {
  if (msg?.execution_ok === false && msg?.used_fallback !== true) return true

  const executionError = String(msg?.execution_error || "").trim()
  if (executionError.length > 0) return true
  if (msg?.execution_ok === false) return true
  
  // Do NOT passively fail on the word 'error' in AI explanations (caused false positives)
  return false
}

function isFallbackWithData(msg) {
  if (msg?.used_fallback === true) return true

  const hasData = Array.isArray(msg?.results) && msg.results.length > 0
  const hasError = String(msg?.execution_error || "").trim().length > 0
  return hasData && hasError
}

export default function ChatScreen() {
  const [messages, setMessages] = useState([])
  const [revealedMessages, setRevealedMessages] = useState({})
  const [input, setInput] = useState("")
  const [isThinking, setIsThinking] = useState(false)
  const messageIdRef = useRef(0)
  const highlightQueriedTables = useVisualizationStore((s) => s.highlightQueriedTables)

  async function handleSend(questionOverride) {
    if (isThinking) return

    const questionValue =
      typeof questionOverride === "string" ? questionOverride : input

    if (!questionValue.trim()) return

    const normalizedQuestion = normalizeUserQuestion(questionValue)
    const userMsg = { id: ++messageIdRef.current, role: "user", text: questionValue }

    setMessages((prev) => [...prev, userMsg])
    setInput("")
    setIsThinking(true)

    try {
      // Backend contract expects `query`; sending extra keys can cause 422 on some deployments.
      let res = await API.post("/query", { query: normalizedQuestion })
      let body = res?.data || {}

      if (shouldRetryWithClarifiedPrompt(body)) {
        const retryPrompt = buildRetryPrompt(normalizedQuestion)
        res = await API.post("/query", { query: retryPrompt })
        body = res?.data || {}
      }

      console.log("Raw API response from /query:", body)
      const queriedTables = Array.isArray(body.queried_tables) ? body.queried_tables : []

      const results = Array.isArray(body.data) ? body.data : (Array.isArray(body.results) ? body.results : [])

      const aiMsg = {
        id: ++messageIdRef.current,
        role: "ai",
        kind: "result",
        sql: body.sql ?? body.query ?? "No SQL returned",
        explanation: body.explanation ?? body.message ?? "No explanation returned",
        results,
        execution_ok: body.execution_ok,
        execution_error: body.execution_error,
        used_fallback: body.used_fallback
      }

      setMessages((prev) => [...prev, aiMsg])

      if (queriedTables.length > 0) {
        highlightQueriedTables(queriedTables)
      }
    } catch (err) {
      console.error(err)
      setMessages((prev) => [
        ...prev,
        {
          role: "ai",
          id: ++messageIdRef.current,
          kind: "network_error",
          error: "Something went wrong. Please try again.",
          retryQuestion: questionValue
        }
      ])
    } finally {
      setIsThinking(false)
    }
  }

  return (
    <div className="h-screen overflow-hidden bg-[var(--bg-base)]">
      <header className="flex h-[76px] items-center justify-between border-b border-[var(--border-default)] px-6">
        <div>
          <div className="flex items-center gap-1 text-xs text-[var(--text-muted)]">
            <span>SchemaSense AI</span>
            <span>/</span>
            <span className="text-[var(--text-primary)]">Chat</span>
          </div>
          <h1 className="mt-1 text-base font-semibold text-[var(--text-primary)]">SQL Copilot</h1>
        </div>

        <div className="hidden items-center gap-2 md:flex">
          <span className="badge badge-muted inline-flex items-center gap-1">
            <MessageSquare className="h-3 w-3" />
            {messages.length} messages
          </span>
          <span className="badge badge-accent inline-flex items-center gap-1">
            <Bot className="h-3 w-3" />
            Assistant Active
          </span>
        </div>
      </header>

      <div className="grid h-[calc(100vh-76px)] grid-rows-[1fr_auto]">
        <div className="overflow-y-auto px-4 py-5 md:px-6">
          <div className="mx-auto max-w-5xl space-y-4">
            {messages.length === 0 && (
              <div className="card grid min-h-[260px] place-items-center border border-[var(--border-default)]">
                <div className="text-center">
                  <Bot className="mx-auto mb-3 h-7 w-7 text-[var(--text-muted)]" />
                  <p className="text-sm text-[var(--text-secondary)]">Ask anything about your dataset.</p>
                  <p className="mt-1 font-mono text-xs text-[var(--text-muted)]">Example: Show top 20 orders by total_price desc</p>
                </div>
              </div>
            )}

            <AnimatePresence>
              {messages.map((msg, i) => (
                <motion.div
                  key={msg.id ?? i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                >
                  {msg.role === "user" && (
                    <div className="mb-4 flex justify-end">
                      <motion.div
                        initial={{ scale: 0.97 }}
                        animate={{ scale: 1 }}
                        className="inline-block max-w-xs rounded-2xl border border-[var(--border-accent)] bg-[var(--accent-dim)] px-4 py-3 text-sm text-[var(--text-primary)] shadow-[var(--shadow-sm)] lg:max-w-md"
                      >
                        {msg.text}
                      </motion.div>
                    </div>
                  )}

                  {msg.role === "ai" && (
                    <div className="mb-4 flex justify-start">
                      <div className="w-full max-w-3xl">
                        {msg.kind === "network_error" ? (
                          <div className="flex gap-3 rounded-[var(--radius-lg)] border border-[rgba(239,68,68,0.35)] bg-[var(--danger-dim)] p-4">
                            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-[var(--danger)]" />
                            <div className="flex-1">
                              <p className="mb-3 text-sm text-[var(--danger)]">{msg.error}</p>
                              <button
                                onClick={() => handleSend(msg.retryQuestion)}
                                className="rounded-[var(--radius-md)] border border-[var(--border-accent)] bg-[var(--accent-dim)] px-3 py-1.5 text-xs text-[var(--accent-bright)] transition hover:bg-[rgba(99,102,241,0.25)]"
                              >
                                Retry
                              </button>
                            </div>
                          </div>
                        ) : (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="card space-y-3 rounded-[var(--radius-lg)] border border-[var(--border-default)] p-4"
                          >
                            {(() => {
                              const hasIssue = hasExecutionIssue(msg)
                              const fallbackData = isFallbackWithData(msg)
                              const isSuccess = msg.execution_ok === true && !hasIssue

                              return (
                                <>
                                  {fallbackData && (
                                    <div className="flex gap-2 rounded-[var(--radius-sm)] border border-[rgba(245,158,11,0.35)] bg-[var(--warning-dim)] p-3">
                                      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-[var(--warning)]" />
                                      <p className="text-xs text-[var(--warning)]">
                                        Backend returned fallback rows due to SQL guardrails. Results may not match your question exactly.
                                      </p>
                                    </div>
                                  )}

                                  {hasIssue && !fallbackData && (
                                    <div className="flex gap-2 rounded-[var(--radius-sm)] border border-[rgba(239,68,68,0.35)] bg-[var(--danger-dim)] p-3">
                                      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-[var(--danger)]" />
                                      <p className="text-xs text-[var(--danger)]">
                                        {msg.execution_error || "Query fallback/error detected in execution details."}
                                      </p>
                                    </div>
                                  )}

                                  {isSuccess && (
                                    <div className="flex gap-2 rounded-[var(--radius-sm)] border border-[rgba(16,185,129,0.35)] bg-[var(--success-dim)] p-3">
                                      <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-[var(--success)]" />
                                      <p className="text-xs text-[var(--success)]">Query executed successfully</p>
                                    </div>
                                  )}
                                </>
                              )
                            })()}

                            <div className="rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-input)] p-3">
                              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.1em] text-[var(--text-muted)]">SQL Query</p>
                              <pre className="overflow-hidden whitespace-pre-wrap break-words font-mono text-xs text-[var(--accent-bright)]">
                                <TypewriterText text={msg.sql} speed={10} />
                              </pre>
                            </div>

                            <div>
                              <p className="mb-1 text-xs font-semibold uppercase tracking-[0.1em] text-[var(--text-muted)]">Explanation</p>
                              <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
                                <TypewriterText
                                  text={msg.explanation}
                                  speed={15}
                                  onDone={() => {
                                    if (!revealedMessages[msg.id]) {
                                      setRevealedMessages((prev) => ({ ...prev, [msg.id]: true }))
                                    }
                                  }}
                                />
                              </p>
                            </div>

                            {revealedMessages[msg.id] && Array.isArray(msg.results) && msg.results.length > 0 ? (
                              <div className="overflow-x-auto rounded-[var(--radius-md)] border border-[var(--border-default)]">
                                <p className="border-b border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3 py-2 text-xs font-semibold uppercase tracking-[0.1em] text-[var(--text-muted)]">
                                  Results
                                </p>
                                <table className="w-full text-xs">
                                  <thead>
                                    <tr className="border-b border-[var(--border-subtle)]">
                                      {Object.keys(msg.results[0] || {}).map((key) => (
                                        <th key={key} className="px-2 py-2 text-left font-semibold text-[var(--text-muted)]">
                                          {key}
                                        </th>
                                      ))}
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {msg.results.slice(0, 10).map((row, idx) => (
                                      <tr key={idx} className="border-b border-[var(--border-subtle)] hover:bg-[rgba(255,255,255,0.02)]">
                                        {Object.values(row).map((val, valIdx) => (
                                          <td key={valIdx} className="px-2 py-2 text-[var(--text-secondary)]">
                                            {String(val).substring(0, 50)}
                                          </td>
                                        ))}
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                                {msg.results.length > 10 && (
                                  <p className="px-3 py-2 text-xs text-[var(--text-muted)]">... and {msg.results.length - 10} more rows</p>
                                )}
                              </div>
                            ) : revealedMessages[msg.id] ? (
                              <p className="text-xs italic text-[var(--text-muted)]">No results returned</p>
                            ) : (
                              <p className="text-xs italic text-[var(--text-muted)]">Preparing result table...</p>
                            )}
                          </motion.div>
                        )}
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>

            {isThinking && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex justify-start"
              >
                <div className="flex items-center gap-2 rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-surface)] px-4 py-3">
                  <Loader className="h-4 w-4 animate-spin text-[var(--accent-bright)]" />
                  <span className="text-sm text-[var(--text-secondary)]">AI is thinking...</span>
                </div>
              </motion.div>
            )}
          </div>
        </div>

        <div className="border-t border-[var(--border-default)] bg-[var(--bg-surface)]/85 px-4 py-3 backdrop-blur md:px-6">
          <div className="mx-auto flex max-w-5xl gap-3">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !isThinking) {
                  handleSend()
                }
              }}
              placeholder="Ask something like 'Show all orders'"
              disabled={isThinking}
              aria-label="Ask SQL assistant"
              className="h-11 flex-1 rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-input)] px-4 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none transition focus:border-[var(--accent)] disabled:opacity-50"
            />
            <button
              onClick={handleSend}
              disabled={isThinking || !input.trim()}
              className="inline-flex h-11 items-center gap-2 rounded-[var(--radius-md)] border border-[var(--border-accent)] bg-[var(--accent-dim)] px-5 text-sm font-medium text-[var(--accent-bright)] transition hover:bg-[rgba(99,102,241,0.25)] disabled:opacity-50"
              aria-label="Send message"
            >
              {isThinking ? (
                <>
                  <Loader className="h-4 w-4 animate-spin" />
                  Thinking...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Send
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}