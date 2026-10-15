import Anthropic from '@anthropic-ai/sdk'
import {
  DEFAULT_MAX_TOKENS,
  DEFAULT_MODEL,
  MAX_TOKENS_LIMIT,
  MODELS,
  TEMPERATURE_LIMIT,
  type ModelId,
} from '../config/models.js'

import { appendTurns, clearHistory, getHistory } from './conversationStore.js'

// Settings for a single message. `model` and `maxTokens` are required by the API, so they
// always have a value; add further settings as optional fields and only send them when set.
export interface MessageConfig {
  model: ModelId
  maxTokens: number
  stopSequences?: string[]
  temperature?: number
}

// What a caller may pass: every field is optional, required ones fall back to defaults
export type MessageConfigInput = Partial<MessageConfig>

// The image types the API accepts
export const IMAGE_MEDIA_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'] as const
export type ImageMediaType = (typeof IMAGE_MEDIA_TYPES)[number]

export function isImageMediaType(value: unknown): value is ImageMediaType {
  return IMAGE_MEDIA_TYPES.includes(value as ImageMediaType)
}

// An image as the client sends it: base64 data without the `data:...;base64,` prefix
export interface ImageInput {
  mediaType: ImageMediaType
  data: string
}

const client = new Anthropic()

function resolveConfig({
  model = DEFAULT_MODEL,
  maxTokens = DEFAULT_MAX_TOKENS,
  ...optional
}: MessageConfigInput): MessageConfig {
  return { model, maxTokens, ...optional }
}

// Images go before the text, which tends to give better results
function createUserTurn(text: string, images: ImageInput[]): Anthropic.MessageParam {
  if (images.length === 0) return { role: 'user', content: text }
  return {
    role: 'user',
    content: [
      ...images.map(({ mediaType, data }): Anthropic.ImageBlockParam => ({
        type: 'image',
        source: { type: 'base64', media_type: mediaType, data },
      })),
      { type: 'text', text },
    ],
  }
}

function createPayload(
  messages: Anthropic.MessageParam[],
  { model, maxTokens, stopSequences, temperature }: MessageConfig,
): Anthropic.MessageCreateParamsNonStreaming {
  return {
    model,
    max_tokens: maxTokens,
    messages,
    ...(stopSequences?.length ? { stop_sequences: stopSequences } : {}),
    ...(temperature !== undefined ? { temperature } : {}),
  }
}

// Everything the client needs to build its message settings UI
export function getConfig() {
  return {
    models: MODELS,
    defaults: { model: DEFAULT_MODEL, maxTokens: DEFAULT_MAX_TOKENS },
    limits: { maxTokens: { min: 1, max: MAX_TOKENS_LIMIT }, temperature: TEMPERATURE_LIMIT },
  }
}

export async function sendMessage(
  conversationId: string,
  text: string,
  images: ImageInput[] = [],
  config: MessageConfigInput = {},
) {
  const userTurn = createUserTurn(text, images)
  const payload = createPayload([...getHistory(conversationId), userTurn], resolveConfig(config))
  const message = await client.messages.create(payload)

  // Save only after success, and keep every block so tool_use blocks can be sent back later.
  // The API rejects an empty assistant turn, so skip the whole exchange if there's no content.
  if (message.content.length > 0) {
    appendTurns(conversationId, userTurn, { role: 'assistant', content: message.content })
  }
  return message
}

export function resetConversation(conversationId: string) {
  clearHistory(conversationId)
}
