# play-with-claude-chatbot

A multi-turn chat with Claude, built on the [Anthropic Messages API](https://docs.anthropic.com/en/api/messages). It has a React frontend and an Express + TypeScript backend.

## Features

- **Multi-turn conversations.** The server keeps each conversation's history, and "New chat" starts a fresh one.
- **Image input.** Attach JPEG, PNG, GIF or WebP images to a message. They're sent to Claude as base64 image blocks.
- **Per-message settings.** Pick the model and set `max_tokens`, stop sequences and `temperature` in a settings drawer. The temperature field only appears for models that accept it.
- **Copy responses.** Each answer has a copy button that puts its text on the clipboard.
- **Raw response viewer.** Inspect the full API `Message` (content blocks, stop reason, token usage) for any answer.
- **Server-side validation.** Every setting is checked before it reaches the API, and errors come back as clear 400s.

## Tech stack

|          |                                                           |
| -------- | --------------------------------------------------------- |
| Frontend | React 19, Vite, Tailwind CSS v4, TypeScript               |
| Backend  | Node.js, Express 5, `@anthropic-ai/sdk`, TypeScript (ESM) |
| Tooling  | npm workspaces, ESLint, Prettier, `tsx`, `concurrently`   |

## Getting started

Requirements: Node.js 20.11 or later (see `.nvmrc`) and an [Anthropic API key](https://console.anthropic.com/).

```bash
npm install
cp server/.env.example server/.env   # then set ANTHROPIC_API_KEY
npm run dev
```

Open http://localhost:5173. Vite proxies `/api` requests to the server on port 3000.

## Scripts

| Command             | Description                                                      |
| ------------------- | ---------------------------------------------------------------- |
| `npm run dev`       | Run the client and server together with hot reload               |
| `npm run build`     | Build the client and the server                                  |
| `npm start`         | Run the built server (environment variables must already be set) |
| `npm run typecheck` | Type-check both workspaces                                       |
| `npm run lint`      | Lint the client                                                  |
| `npm run format`    | Format with Prettier                                             |

## Project structure

```
client/   React app: features/chat holds the chat UI and its hooks
server/   Express API: routes → controllers (validation) → services (Anthropic SDK, conversation store)
```

### API

| Method   | Path                               | Description                                                                         |
| -------- | ---------------------------------- | ----------------------------------------------------------------------------------- |
| `GET`    | `/api/anthropic/config`            | Available models, defaults and setting limits                                       |
| `POST`   | `/api/anthropic/messages`          | Send `{ conversationId, text, images?, config? }` and get back the Claude `Message` |
| `DELETE` | `/api/anthropic/conversations/:id` | Clear a conversation's history                                                      |

Conversations are kept in memory, so they're lost when the server restarts.
