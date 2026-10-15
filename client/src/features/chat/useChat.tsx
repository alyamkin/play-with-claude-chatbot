import { useState } from 'react'
import { api } from '../../api/client'
import type { MessageSettings } from './useMessageSettings'
import type { ImageInput } from './images'

// Subset of the Anthropic Message object returned by the server
export type MessageResponse = {
  model: string
  stop_reason: string | null
  usage: { input_tokens: number; output_tokens: number }
  content: { type: string; text?: string }[]
}

export type ChatEntry = {
  id: string
  question: string
  images: ImageInput[]
  answer?: string
  error?: string
  response?: MessageResponse
}

export function useChat() {
  const [entries, setEntries] = useState<ChatEntry[]>([])
  const [loading, setLoading] = useState(false)
  // The server keeps the history for this id and sends it with every request
  const [conversationId, setConversationId] = useState(() => crypto.randomUUID())

  // Returns the new entry's id right away; the response fills it in later
  function ask(question: string, images: ImageInput[], settings: MessageSettings) {
    const id = crypto.randomUUID()
    setEntries((prev) => [...prev, { id, question, images }])
    void send(id, question, images, settings)
    return id
  }

  async function send(
    id: string,
    question: string,
    images: ImageInput[],
    { model, maxTokens, stopSequences, temperature }: MessageSettings,
  ) {
    setLoading(true)
    try {
      const res = await api.post<MessageResponse>('/anthropic/messages', {
        conversationId,
        text: question,
        images: images.length ? images : undefined,
        // Optional; the server fills in defaults for anything left out
        config: {
          model: model || undefined,
          maxTokens,
          stopSequences: stopSequences.length ? stopSequences : undefined,
          temperature,
        },
      })
      const answer = res.content
        .filter((b) => b.type === 'text')
        .map((b) => b.text)
        .join('\n')
      setEntries((prev) => prev.map((e) => (e.id === id ? { ...e, answer, response: res } : e)))
    } catch (e: unknown) {
      const error = e instanceof Error ? e.message : 'Failed'
      setEntries((prev) => prev.map((e) => (e.id === id ? { ...e, error } : e)))
    } finally {
      setLoading(false)
    }
  }

  function newChat() {
    // Best effort: the server only holds the history in memory anyway
    api.delete(`/anthropic/conversations/${conversationId}`).catch(() => {})
    setConversationId(crypto.randomUUID())
    setEntries([])
  }

  return { entries, loading, ask, newChat }
}
