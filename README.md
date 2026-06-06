# DevCircle — Developer Community Platform

DevCircle is a premier full-stack developer community platform combining micro-blogging timelines (Twitter-like feed) and technical query troubleshooting boards (Stack Overflow-like Q&A). The app is styled with a sleek glassmorphic dark UI, micro-animations, and integrated AI-assistance models.

---

## 🛠️ Tech Stack & Architecture

- **Frontend**: React 18 (Vite SPA launcher) + Redux Toolkit (global state managers) + Socket.io-client
- **Styling**: Curated custom Vanilla CSS (HSL variables, glass blur filters, spring micro-hovers, scrollbars)
- **Backend**: Node.js + Express (REST APIs) + Socket.io (1-on-1 chats and notifications timeline)
- **Database**: MongoDB + Mongoose (structured document schemas)
- **AI Integrations**: OpenAI API (proxy server middlewares: rephrase copilot, auto-taggers, vagueness validation)

---

## 📦 Project Directory Layout

```text
mahadev/
├── backend/                  # Node.js + Express + Socket.io server
│   ├── src/
│   │   ├── config/           # Database, Socket, and Seeding scripts
│   │   ├── controllers/      # Route handler controllers (Auth, AI, Chat, Posts, Q&As)
│   │   ├── middleware/       # JWT Auth and Express error formatters
│   │   ├── models/           # Mongoose schemas (User, Post, Comment, Question, etc.)
│   │   ├── routes/           # Express REST endpoints definition
│   │   └── index.js          # Entry point
│   ├── .env.example          # Sample environment variables
│   └── package.json
├── frontend/                 # Vite + React + Redux Toolkit SPA
│   ├── src/
│   │   ├── components/       # Custom Navbar, PostCard, AI Helper widgets
│   │   ├── store/            # Redux store configurations & slices
│   │   ├── pages/            # View pages (Feed, Q&As, Profile, Admin, Chats)
│   │   ├── App.jsx           # Router map
│   │   ├── index.css         # Design system tokens and variables
│   │   └── main.jsx          # DOM entry mount point
│   ├── index.html
│   ├── vite.config.js        # Vite configs with backend proxy
│   └── package.json
├── docker-compose.yml        # Multi-node compose pipeline
├── .gitignore
└── README.md                 # Complete system guide
```

---

## 🚀 Getting Started

### Prerequisites

Ensure you have Node.js (v18+) and MongoDB (running locally or a cloud URI) installed.

### 1. Environment Configurations

Create a `.env` file in the `backend/` directory (you can copy `backend/.env.example` as a template):

```ini
PORT=5000
MONGO_URI=mongodb://localhost:27017/devcircle
JWT_SECRET=devcircle_super_secret_key_1337
OPENAI_API_KEY=your_openai_api_key_here
```

> [!NOTE]
> If `OPENAI_API_KEY` is not provided, the server will automatically fall back to **realistic AI mock responders** so that you can verify and review all AI features (rephrasing, auto tag recommendations, quality validators) immediately without a paid API key!

---

### 2. Manual Installation & Seeding

Open a terminal in the project root folder:

```bash
# Install backend dependencies
cd backend
npm install

# Prepopulate database with rich developer mock data (Linus Torvalds, Dan Abramov, Grace Hopper)
npm run seed

# Run the backend dev server (launches on http://localhost:5000)
npm run dev
```

Open a second terminal window in the project root folder:

```bash
# Install frontend dependencies
cd frontend
npm install

# Run the frontend dev server (launches on http://localhost:5173 with proxy bindings)
npm run dev
```

Visit **`http://localhost:5173`** in your browser to explore the platform!

---

### 3. Docker Compose Orchestration

To boot the entire cluster (MongoDB + backend REST/Socket servers + frontend client) inside Docker containers:

1. Ensure Docker Desktop is running.
2. In the project root workspace directory, run:
   ```bash
   docker-compose up --build
   ```
3. Once booted, access the client at **`http://localhost:5173`**.

---

## 🔑 Key API REST Endpoints

### 1. Authentication (`/api/auth`)
- `POST /register`: Registers accounts, generates default bot identicons, signs JWTs.
- `POST /login`: Validates password hashes, returns profiles and JWTs.
- `GET /me` (Private): Returns profile identity of logged-in sessions.

### 2. User Profiles & Follows (`/api/users`)
- `GET /`: Search query for developer tags or usernames.
- `GET /profile/:username`: Public view of skills, stats, and follows lists.
- `PUT /profile` (Private): Customize biographical text, skills arrays, avatars.
- `POST /:id/follow` (Private): Follow or unfollow toggle, dispatches notifications.

### 3. Updates Timeline Feed (`/api/posts`)
- `GET /`: Timeline aggregation fetching followed feeds + trending updates with pagination.
- `POST /` (Private): Compose updates with text and optional image link.
- `POST /:id/like` (Private): Likes/unlikes post, dispatches alerts.
- `POST /:id/repost` (Private): Reposts another update.
- `POST /:id/comments` (Private): Comments on specific post.

### 4. Technical Q&As Section (`/api/questions`)
- `GET /`: Fetches developer questions list with filter-by-tag handles.
- `GET /:id`: Question details loaded with all technical answers.
- `POST /` (Private): Publish questions with title, details, and tags array.
- `POST /:id/vote` (Private): Upvotes/downvotes questions.
- `POST /:id/answers` (Private): Submits an answer.
- `POST /answers/:id/vote` (Private): Upvotes/downvotes technical answers.
- `POST /answers/:id/accept` (Private): Restricts question author to accept best answer, triggers alert.

### 5. AI Co-pilot middlewares (`/api/ai`)
- `POST /rephrase` (Private): Refines editor post draft for professional developer phrasing.
- `POST /tags` (Private): Automatically extracts keywords and recommends tags chips.
- `POST /validate-question` (Private): Reviews title + description to warn if too vague or lacking code snippets.

### 6. Moderation Flags (`/api/admin`)
- `POST /reports` (Private): Report/flag inappropriate community uploads.
- `GET /reports` (Private): Returns moderators pending flag stream.
- `POST /reports/:id/resolve` (Private): Action to dismiss flags or delete original post.

---

## 📡 Live Socket.io Events

- `register` (client-to-server): Logs active userId to establish connection mapping.
- `online_users` (server-to-client): Broadcasts array of logged-in user IDs to paint online status indicators.
- `send_message` (client-to-server): Packs direct messages and stores in MongoDB.
- `receive_message` (server-to-client): Forwards direct message to recipients active socket room instantly.
- `typing` (client-to-server): Broadcasts typing indicator toggles.
- `notification_alert` (server-to-client): Slides dynamic interaction toasts (likes, comments, accepted answers) in real-time.
