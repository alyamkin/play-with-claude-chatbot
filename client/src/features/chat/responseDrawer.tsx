import { useEffect, useRef } from 'react'
import type { ChatEntry } from './useChat'

type Props = {
  entries: ChatEntry[]
  expandedId: string | null
  onToggle: (id: string) => void
  onClose: () => void
}

export function ResponseDrawer({ entries, expandedId, onToggle, onClose }: Props) {
  const listRef = useRef<HTMLOListElement>(null)

  // Bring the expanded entry into view, e.g. after clicking an answer in the chat
  useEffect(() => {
    if (!expandedId) return
    listRef.current
      ?.querySelector(`[data-id="${expandedId}"]`)
      ?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [expandedId])

  return (
    <aside className="flex w-[40rem] max-w-[45vw] shrink-0 flex-col gap-4 border-l border-gray-200 bg-white p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Responses</h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close responses"
          className="rounded-md px-2 py-1 text-gray-500 hover:bg-gray-100 hover:text-gray-900"
        >
          ✕
        </button>
      </div>

      {entries.length === 0 ? (
        <p className="text-sm text-gray-500">Send a message to see the raw API responses.</p>
      ) : (
        <ol ref={listRef} className="flex-1 space-y-2 overflow-y-auto">
          {entries.map((entry, i) => {
            const expanded = entry.id === expandedId
            return (
              <li
                key={entry.id}
                data-id={entry.id}
                className={`rounded-lg border ${expanded ? 'border-blue-300' : 'border-gray-200'}`}
              >
                <button
                  type="button"
                  onClick={() => onToggle(entry.id)}
                  aria-expanded={expanded}
                  className="flex w-full items-start gap-2 rounded-lg px-3 py-2 text-left hover:bg-gray-50"
                >
                  <span className="text-gray-400">{expanded ? '▾' : '▸'}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-gray-900">
                      {i + 1}. {entry.question}
                    </span>
                    <EntryMeta entry={entry} />
                  </span>
                </button>

                {expanded && (
                  <div className="px-3 pb-3">
                    {entry.response ? (
                      <pre className="max-h-[60vh] overflow-auto rounded-lg bg-gray-900 p-3 font-mono text-xs leading-relaxed text-gray-100">
                        {JSON.stringify(entry.response, null, 2)}
                      </pre>
                    ) : (
                      <p className="text-sm text-gray-500">
                        {entry.error
                          ? 'No response: the request failed.'
                          : 'Waiting for the response…'}
                      </p>
                    )}
                  </div>
                )}
              </li>
            )
          })}
        </ol>
      )}
    </aside>
  )
}

function EntryMeta({ entry }: { entry: ChatEntry }) {
  const metaClass = 'block truncate text-xs'
  if (entry.error) return <span className={`${metaClass} text-red-600`}>{entry.error}</span>
  if (!entry.response) {
    return <span className={`${metaClass} animate-pulse text-gray-400`}>Thinking…</span>
  }

  const { model, stop_reason, usage } = entry.response
  return (
    <span className={`${metaClass} font-mono text-gray-500`}>
      {model} · {stop_reason ?? 'no stop reason'} · {usage.input_tokens} in / {usage.output_tokens}{' '}
      out
    </span>
  )
}
