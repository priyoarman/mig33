# mig33

A Twitter/X-style social feed built with Next.js (App Router), TypeScript, MongoDB, and Socket.IO. Users can post updates with images or GIFs, follow other users, comment, like, repost, message each other in real time, and get browser push notifications.

**Live demo:** https://mig33.vercel.app/

> **Note on production behavior:** the hosted demo runs on Vercel's standard serverless deployment, so the Socket.IO layer described below is not attached in that environment (see [Deployment](#deployment)). Real-time features fall back to polling on the live demo; they run at full speed when self-hosted or run locally.

## Project overview

mig33 originally started as a project built during ReDI School Germany's Fullstack Development Bootcamp (originally named "redilink") and has since been independently extended with a rewritten TypeScript codebase, a custom Socket.IO real-time layer, direct messaging, notifications, web push, hashtags/mentions, search, and PWA support.

The project exists to demonstrate practical full-stack skills: authentication and authorization, relational-style data modeling in MongoDB, file/image upload handling, real-time bidirectional communication, background/push notifications, and building a production-style Next.js application end to end — not just a CRUD demo.

## Key features

- **Authentication** — email/password (bcrypt-hashed) via NextAuth Credentials provider, plus Google and GitHub OAuth
- **User profiles** — bio, location, website, profile image, cover image, editable by the owner
- **Posts** — create, edit, delete own posts; body text, multiple images, or a GIF
- **Image uploads** — via Cloudinary
- **GIF support** — search and attach GIFs (Giphy API)
- **Likes** on posts
- **Comments** — nested under posts, with their own mention support
- **Reposts** — repost another user's post to your own feed
- **Follows** — follow/unfollow users, followers/following lists
- **Mentions (@username)** — resolved to real users, triggers a notification
- **Hashtags (#tag)** — extracted from post bodies, browsable hashtag feed, hashtag suggestions while typing
- **Search** — search posts, users, and a per-user search history
- **Realtime messaging** — direct messages over Socket.IO, with delivery/read state
- **Realtime notifications** — likes, comments, follows, mentions, and reposts pushed live over Socket.IO, with a polling fallback when no socket connection is available
- **Push notifications** — Web Push (VAPID) via a service worker, for new messages and notifications even when the tab is closed
- **PWA / "Add to Home Screen"** — web app manifest, iOS install banner, install onboarding page
- **Dark/light mode** — theme toggle
- **Responsive UI** — mobile-first layout, dedicated mobile top bar and search modal
- **Cursor-based pagination** — "load more" style pagination on the feed

## Tech stack

| Layer                | Technology                                   |
| --------------------- | --------------------------------------------- |
| Framework              | Next.js 16 (App Router), custom Node server   |
| Language               | TypeScript                                    |
| UI                     | React 19, Tailwind CSS 4                      |
| Authentication         | NextAuth.js (Credentials, Google, GitHub)     |
| Database / ORM         | MongoDB with Mongoose                         |
| Realtime               | Socket.IO (server + client)                   |
| Image hosting          | Cloudinary                                    |
| GIFs                   | Giphy API                                     |
| Push notifications     | web-push (VAPID) + a service worker           |
| Password hashing       | bcryptjs                                      |
| Dev process runner     | tsx (runs the custom `server.ts`)             |
| Linting / formatting   | ESLint, Prettier (with `prettier-plugin-tailwindcss`) |
| Analytics              | Vercel Analytics, Vercel Speed Insights       |
| Deployment             | Vercel                                        |

## Architecture

```
                        ┌───────────────────────────┐
                        │        Browser (PWA)      │
                        │  React 19 + Tailwind CSS  │
                        └─────────────┬─────────────┘
                                      │ HTTPS
                 ┌────────────────────┼────────────────────┐
                 │                    │                    │
                 ▼                    ▼                    ▼
        Next.js App Router     Socket.IO client      Service worker
        pages + Route          (chat, live           (Web Push
        Handlers (app/api/*)   notifications)        notifications)
                 │                    │
                 │        (only connects on localhost, or
                 │      when NEXT_PUBLIC_SOCKET_URL is set)
                 │                    │
                 ▼                    ▼
        ┌───────────────────────────────────────┐
        │     server.ts (custom Node server)    │
        │  Next.js request handler + Socket.IO  │
        └────────────────┬──────────────────────┘
                         │
        ┌────────────────┼────────────────┐
        ▼                ▼                ▼
   MongoDB          Cloudinary        Giphy / web-push
  (Mongoose)       (image uploads)    (GIFs / push)
```

- **`server.ts`** is a custom Node server that boots Next.js and attaches a Socket.IO server to the same HTTP server. It authenticates each socket connection using the NextAuth session cookie/JWT, and is what `npm run dev` and `npm start` run locally.
- **API routes** (`app/api/**/route.ts`) handle everything else: auth, posts, comments, likes, reposts, follows, messages, notifications, search, hashtags, and push subscriptions. They talk to MongoDB via Mongoose models in [models/](models/).
- **Shared server logic** (feed pagination, mention/hashtag resolution, push sending, realtime emit helpers) lives in [lib/](lib/).
- **Client realtime state** (`app/components/RealtimeProvider.tsx`) opens a Socket.IO connection when possible and otherwise polls `/api/notifications` and `/api/messages` on an interval, so the UI keeps working even without a live socket.

## Local development

### Prerequisites

- Node.js 20+
- A MongoDB connection string (local MongoDB or a hosted instance such as MongoDB Atlas)

### Setup

1. **Clone the repo:**

   ```bash
   git clone https://github.com/priyoarman/mig33.git
   cd mig33
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Create a `.env.local` file** at the project root (see [Environment variables](#environment-variables) below for the full list).

4. **Start the dev server** (runs the custom Socket.IO-enabled server via `tsx`):

   ```bash
   npm run dev
   ```

   Open http://localhost:3000.

## Environment variables

Create `.env.local` in the project root. Never commit this file — it's already covered by `.gitignore`.

| Variable | Required | Purpose |
| --- | --- | --- |
| `MONGODB_URI` | Yes | MongoDB connection string |
| `NEXTAUTH_SECRET` | Yes | Secret used by NextAuth to sign/encrypt session tokens |
| `NEXTAUTH_URL` | Yes | Canonical URL of the app (e.g. `http://localhost:3000`) |
| `NEXT_PUBLIC_APP_URL` | Yes | Public base URL used by client code (e.g. `http://localhost:3000`) |
| `GOOGLE_CLIENT_ID` | No | Enables "Sign in with Google" |
| `GOOGLE_CLIENT_SECRET` | No | Enables "Sign in with Google" |
| `GITHUB_CLIENT_ID` | No | Enables "Sign in with GitHub" |
| `GITHUB_CLIENT_SECRET` | No | Enables "Sign in with GitHub" |
| `CLOUDINARY_CLOUD_NAME` | No* | Enables image uploads on posts |
| `CLOUDINARY_API_KEY` | No* | Enables image uploads on posts |
| `CLOUDINARY_API_SECRET` | No* | Enables image uploads on posts |
| `GIPHY_API_KEY` | No* | Enables GIF search/attachment on posts |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | No* | Enables Web Push notifications (public VAPID key) |
| `VAPID_PRIVATE_KEY` | No* | Enables Web Push notifications (private VAPID key) |
| `VAPID_SUBJECT` | No* | Contact identity (e.g. `mailto:you@example.com`) required by the Web Push spec |
| `NEXT_PUBLIC_NEWS_API` | No | Enables the news headlines widget in the right sidebar ([newsapi.org](https://newsapi.org) key) |
| `NEXT_PUBLIC_SOCKET_URL` | No | Base URL of a separately hosted Socket.IO server, for enabling realtime features in a non-localhost deployment (see [Deployment](#deployment)) |

\* The app degrades gracefully without these — the related feature is simply unavailable (upload/GIF/push actions return an error, or the UI hides the option) rather than crashing.

## Testing

```bash
npm run lint       # ESLint
npm run typecheck  # tsc --noEmit
npm run build      # production build (next build)
```

**Note:** this project does not currently have an automated test suite or a `test` script in `package.json`. Adding unit/integration tests (e.g. for the mention/hashtag parsing in [lib/mentionsAndTags.ts](lib/mentionsAndTags.ts) and the feed pagination in [lib/posts.ts](lib/posts.ts)) is tracked as a known gap rather than something faked here — see [Known limitations](#known-limitations).

## Deployment

The live demo is deployed to Vercel from the `main` branch, using Vercel's standard Next.js build (`next build`) and serverless functions for all `app/api/**` routes.

This has one important consequence: **Vercel does not run `server.ts`.** The custom Node server that hosts the Socket.IO server only runs when the app is started with `npm run dev` or `npm start` (e.g. locally, or on a persistent Node host such as a VM, Docker container, or a platform like Render/Fly.io). On Vercel, there is no long-lived process for a Socket.IO server to attach to.

To account for this, the client (`app/components/RealtimeProvider.tsx`) only opens a Socket.IO connection when running on `localhost`, or when `NEXT_PUBLIC_SOCKET_URL` is set to point at a separately hosted Socket.IO instance. Otherwise it falls back to polling `/api/notifications` and `/api/messages` every few seconds. In other words:

- **Local dev:** full realtime (Socket.IO) messaging and notifications.
- **Vercel demo (no `NEXT_PUBLIC_SOCKET_URL` configured):** the app works fully, but new messages/notifications arrive via polling instead of instantly.
- **A production setup with a dedicated Socket.IO host:** set `NEXT_PUBLIC_SOCKET_URL` to that host's URL to restore true realtime behavior on Vercel too.

To deploy your own copy:

1. Push the repo to GitHub.
2. Import it into Vercel.
3. Add the environment variables from the table above in the Vercel project settings.
4. Deploy.

## Known limitations

- **No automated tests.** Lint, type-checking, and a production build are enforced, but there is no test suite yet.
- **Realtime on Vercel requires a separate Socket.IO host.** As explained above, the hosted demo runs without one and relies on polling; this is a deliberate tradeoff for using free serverless hosting rather than a bug.
- **Search is a simple MongoDB regex/text match**, not a dedicated search engine — it's fine for portfolio/demo scale but wouldn't scale to a large dataset.
- **Single MongoDB instance, no caching layer** (e.g. Redis) — acceptable for the current scale, but a bottleneck under real load.
- **No license file** is currently included, so no explicit open-source license applies to this code.

## Contributing

This is primarily a personal portfolio project, but issues and pull requests are welcome.

1. Fork the repo
2. Create a feature branch (`git checkout -b feature/my-feature`)
3. Commit your changes
4. Push to the branch and open a Pull Request
