# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

`play-with-claude-chatbot`: an npm-workspaces monorepo (`client/` + `server/`) for a multi-turn "Ask Claude" chat: a React UI posts a question (optionally with images and per-message settings) to an Express API, which calls the Anthropic Messages API with the conversation's history and returns the raw `Message` object.

## Commands

Run from the repo root (Node version in `.nvmrc`; `engines` requires >= 20.11):

- `npm run dev`: client (Vite, :5173) and server (tsx watch, :3000) together via `concurrently`
- `npm run dev:client` / `npm run dev:server`: just one side
- `npm run build`: builds the client (`tsc -b && vite build`), then the server (`tsc` → `server/dist`)
- `npm start`: runs the built server (`node dist/index.js`)
- `npm run typecheck`: both workspaces
- `npm run lint`: ESLint, **client only** (the server has no linter)
- `npm run format` / `npm run format:check`: Prettier (no semicolons, single quotes, 100 cols, trailing commas)

There is no test framework set up yet.

## Environment

The server loads `server/.env` through `tsx --env-file=.env`, so this only happens in `dev`. `npm start` doesn't load it, so the variables have to be set in the environment. `server/src/config/env.ts` is the single source of truth for config. `ANTHROPIC_API_KEY` is required and the server throws at boot if it's missing. Every variable belongs in `server/.env.example` (copy it to `.env`). The Anthropic SDK client (`new Anthropic()`) also reads that key from the environment on its own.

## Architecture

**Request flow:** The browser calls `/api/...`. In dev, the Vite proxy (`client/vite.config.ts`) forwards these calls to `localhost:3000`, so the client never hardcodes the server origin. On the server, `app.ts` mounts all routes under `/api`, then `notFoundHandler`, then `errorHandler` (which must stay last). The JSON body limit is raised to 20mb because images arrive as base64.

**Anthropic endpoints** (`routes/anthropic.ts`): `GET /config` (models, defaults, limits for the settings UI), `POST /messages` (`{ conversationId, text, images?, config? }`), `DELETE /conversations/:id`.

**Server layering** (`server/src/`), one file per resource in each layer:

- `routes/<resource>.ts`: the Express `Router`. Each one is registered in `routes/index.ts` (currently just `/anthropic`).
- `controllers/<resource>Controller.ts`: `RequestHandler`s that pull data from `req`, validate it (throwing `badRequest`), and call the service. They're async and can just `throw`, because Express 5 forwards rejected promises to the error handler.
- `config/models.ts`: the selectable model list (with prices and a `supportsTemperature` flag, since newer models reject `temperature` with a 400), defaults, and limits/validators for `max_tokens` (capped at 21,333 because the SDK refuses longer non-streaming requests) and `temperature`. The client gets all of this from `GET /config` instead of duplicating it, so add models or settings here.
- `services/<resource>Service.ts`: the logic and external calls. `anthropicService.ts` wraps the Anthropic SDK: it fills in default `model`/`maxTokens`, builds the user turn (image blocks before the text), and only adds optional params (`stop_sequences`, `temperature`) to the payload when set. New per-message settings follow the same path: optional field on `MessageConfig` → validated in `parseMessageConfig` → added in `createPayload` → exposed in `getConfig` if the UI needs limits. `conversationStore.ts` keeps each conversation's history in memory as `Anthropic.MessageParam[]`, keyed by a client-generated id; turns are saved only after a successful API call.
- Errors: throw `HttpError` (or the `badRequest` / `notFound` helpers from `middleware/httpError.ts`). `errorHandler` turns them into `{ message }` JSON. In production it hides the message of any 5xx.

The server is ESM with `module: NodeNext` and `verbatimModuleSyntax`. Relative imports **must use the `.js` extension** (`'./routes/index.js'`), and type-only imports must use `import type`.

**Client** (`client/src/`): React 19, Vite, and Tailwind v4 (through `@tailwindcss/vite`, so there's no Tailwind config file).

- `api/client.ts`: a small `fetch` wrapper (`api.get/post/delete`) that prefixes `/api` and throws `ApiError` using the server's `{ message }`.
- `features/<feature>/`: a `useX` hook that owns the state and API calls, plus a component that renders it. `chat` is the only feature and is rendered by `App.tsx`.
- `useChat` gets back the full Anthropic `Message` and joins its `text` content blocks on the client. It sends a `conversationId` (a `crypto.randomUUID()`) with each request; the server holds the history. "New chat" deletes it (`DELETE /api/anthropic/conversations/:id`) and starts a new id.
- `useMessageSettings` loads `GET /api/anthropic/config` and owns the settings drawer's form state (model, max tokens, comma-separated stop sequences, temperature only when the model supports it). Images are read in the browser as base64 without the `data:` prefix (`images.ts`).
- There's no shared types package: the client re-declares the response/config shapes it uses as local types, so keep them in sync when the server's shapes change.
