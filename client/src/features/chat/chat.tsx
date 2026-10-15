import { useState, type FormEvent } from 'react'
import { useChat } from './useChat'
import { useMessageSettings } from './useMessageSettings'
import { SettingsDrawer } from './settingsDrawer'
import { ResponseDrawer } from './responseDrawer'
import { CopyButton } from './copyButton'
import { CodeBracketIcon, GearIcon } from './icons'
import { ImagePickerButton, ImagePreviews } from './imagePicker'
import { toDataUrl, type ImageInput } from './images'
import { DESKTOP_QUERY, useMediaQuery } from './useMediaQuery'

const answerClass =
  'w-fit max-w-[80%] rounded-lg bg-white px-4 py-2 whitespace-pre-wrap text-gray-900 shadow-sm'

export function Chat() {
  const { entries, loading, ask, newChat } = useChat()
  const messageSettings = useMessageSettings()
  const isDesktop = useMediaQuery(DESKTOP_QUERY)
  // Drawers start open only on desktop; on smaller screens they overlay the chat
  const [settingsOpen, setSettingsOpen] = useState(isDesktop)
  const [responseOpen, setResponseOpen] = useState(isDesktop)
  // Close both when the screen shrinks below desktop, so overlays don't cover the chat
  const [wasDesktop, setWasDesktop] = useState(isDesktop)
  if (wasDesktop !== isDesktop) {
    setWasDesktop(isDesktop)
    if (!isDesktop) {
      setSettingsOpen(false)
      setResponseOpen(false)
    }
  }
  // The entry expanded in the response drawer (null = all collapsed)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [input, setInput] = useState('')
  const [images, setImages] = useState<ImageInput[]>([])

  // Overlays don't stack: below desktop, opening one drawer closes the other
  function openSettings() {
    setSettingsOpen(true)
    if (!isDesktop) setResponseOpen(false)
  }

  function openResponse() {
    setResponseOpen(true)
    if (!isDesktop) setSettingsOpen(false)
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const question = input.trim()
    if (!question || loading || !messageSettings.isValid) return
    setInput('')
    setImages([])
    setExpandedId(ask(question, images, messageSettings.settings))
  }

  return (
    <div className="flex h-dvh">
      {!isDesktop && (settingsOpen || responseOpen) && (
        <div
          aria-hidden="true"
          onClick={() => {
            setSettingsOpen(false)
            setResponseOpen(false)
          }}
          className="fixed inset-0 z-20 bg-black/30"
        />
      )}

      {settingsOpen && (
        <SettingsDrawer {...messageSettings} onClose={() => setSettingsOpen(false)} />
      )}

      <main className="flex min-w-0 flex-1 flex-col p-3 sm:p-4">
        {/* Fills the space between the drawers, but the chat column stops growing at max-w-4xl */}
        <div className="mx-auto flex min-h-0 w-full max-w-4xl flex-1 flex-col">
          <header className="mb-4 flex items-center gap-3">
            {!settingsOpen && (
              <button
                type="button"
                onClick={openSettings}
                aria-label="Open settings"
                className="rounded-md border border-gray-300 p-1.5 text-gray-700 hover:bg-gray-100"
              >
                <GearIcon className="size-5" />
              </button>
            )}
            <h1 className="text-2xl font-semibold text-gray-900">Ask Claude</h1>
            <button
              type="button"
              onClick={() => {
                newChat()
                setExpandedId(null)
              }}
              disabled={loading || entries.length === 0}
              className="ml-auto rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              New chat
            </button>
            {!responseOpen && (
              <button
                type="button"
                onClick={openResponse}
                aria-label="Open response"
                className="rounded-md border border-gray-300 p-1.5 text-gray-700 hover:bg-gray-100"
              >
                <CodeBracketIcon className="size-5" />
              </button>
            )}
          </header>

          <section className="flex-1 space-y-4 overflow-y-auto rounded-lg border border-gray-200 bg-gray-50 p-3 sm:p-4">
            {entries.length === 0 && (
              <p className="text-gray-500">Ask a question to get started.</p>
            )}
            {entries.map((entry) => (
              <div key={entry.id} className="space-y-2">
                {entry.images.length > 0 && (
                  <div className="ml-auto flex w-fit max-w-[80%] flex-wrap justify-end gap-2">
                    {entry.images.map((image, i) => (
                      <img
                        key={i}
                        src={toDataUrl(image)}
                        alt=""
                        className="max-h-40 rounded-lg border border-gray-200"
                      />
                    ))}
                  </div>
                )}
                <div className="ml-auto w-fit max-w-[80%] rounded-lg bg-blue-600 px-4 py-2 text-white">
                  {entry.question}
                </div>
                {entry.response ? (
                  <div className="space-y-1">
                    <button
                      type="button"
                      onClick={() => {
                        setExpandedId(entry.id)
                        openResponse()
                      }}
                      title="Show raw response"
                      className={`${answerClass} block text-left ${
                        expandedId === entry.id
                          ? 'ring-2 ring-blue-300'
                          : 'hover:ring-2 hover:ring-gray-200'
                      }`}
                    >
                      {entry.answer}
                    </button>
                    <CopyButton text={entry.answer ?? ''} />
                  </div>
                ) : (
                  <div className={answerClass}>
                    {entry.error ? (
                      <span role="alert" className="text-red-600">
                        {entry.error}
                      </span>
                    ) : (
                      <span className="animate-pulse text-gray-400">Thinking…</span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </section>

          <ImagePreviews images={images} onChange={setImages} />
          <form onSubmit={handleSubmit} className="mt-2 flex gap-2">
            <ImagePickerButton images={images} onChange={setImages} disabled={loading} />
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a question…"
              className="min-w-0 flex-1 rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none"
            />
            <button
              type="submit"
              disabled={loading || !input.trim() || !messageSettings.isValid}
              className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? 'Sending…' : 'Send'}
            </button>
          </form>
        </div>
      </main>

      {responseOpen && (
        <ResponseDrawer
          entries={entries}
          expandedId={expandedId}
          onToggle={(id) => setExpandedId((prev) => (prev === id ? null : id))}
          onClose={() => setResponseOpen(false)}
        />
      )}
    </div>
  )
}
