# commit.

**Some things are easier to code than to say.**

commit. is an anonymous, code-themed message app. Write a message, choose how it is encoded, and send it to a phone number. The recipient gets a text from the app (never from you), opens the link, and runs a small piece of code to decode what you wrote. They can reply on the page, and you see both sides in a terminal-style log.

It isn't only for confessions of love. Apologies, secrets and long-overdue admissions fit just as well.

## How it works

1. **Write**: type a message (up to 500 characters) and pick an encoding.
2. **Preview**: see your readable draft next to the exact encoded artifact the recipient will get.
3. **Send**: enter the recipient's phone number. The backend saves the message and texts them a unique link. You can optionally add your own number to get a one-time text when they reply.
4. **Reveal**: the recipient opens the link, presses **Run**, and the message decodes word by word.
5. **Reply**: they choose a quick reply or write their own (up to 500 characters).
6. **Follow along**: your status page shows whether it has been read, plus a `$ log` of your message and their reply. It checks for updates by itself every 15 seconds.
7. **Nudge**: if the recipient never reads it, reminder texts go out (3 at most, 48 hours apart by default). They stop as soon as the message is read or answered.

## Encodings

The encoding is a presentation effect that makes the reveal feel earned. It is **not encryption**: anyone can decode these with free tools. The real privacy guarantee is that the sender is never identified to the recipient.

| Option | Encoding | What the recipient sees |
| --- | --- | --- |
| JavaScript | Base64 | `const encoded = "..."` then `atob(encoded)` |
| Python | ROT13 | `codecs.decode(encoded, "rot13")` |
| Terminal | Hexadecimal | `echo $encoded \| xxd -r -p` |
| Plain text | None | The message is simply shown, with no Run step |

Text is encoded through UTF-8, so emoji, accents and curly quotes work in every mode.

## Privacy model

- There are no accounts. Whoever holds a confession's id can act on it, which is the same trust model as the link itself. Treat your status link like a password.
- The recipient only ever receives the message and its encoding. Nothing that could identify the sender is returned to them.
- The sender's optional alert number is stored only until the single "they replied" text is queued, then erased. No endpoint ever returns it.
- The recipient's number is stored so reminders can be sent.
- The "read" receipt turns on when the recipient presses Run (or sees a plain-text message), not when the link is merely fetched, so link-preview bots can't trigger it. The recipient page tells them the sender can see this.

## Tech stack

| Layer | Choice |
| --- | --- |
| Frontend | React 19, Vite, TypeScript, Tailwind CSS v4 (tokens in an `@theme` block), react-router v8 |
| Backend | Python, FastAPI, SQLAlchemy, APScheduler for reminders |
| Database | Postgres on Neon in production (psycopg v3); SQLite locally by default |
| SMS | Africa's Talking (isolated in `app/sms.py`, so a provider swap touches one file) |
| Hosting | Render (API), Netlify (frontend), GitHub as the deploy source |

Design: a dark, terminal-flavored UI with VS Code Dark+ code colors. Pink is reserved for actions and feelings, and code is never pink. Interface text is Inter and anything terminal-flavored is JetBrains Mono.

## Project structure

```
commit-backend/
  app/
    main.py          # FastAPI app, CORS, startup, scheduler
    models.py        # SQLAlchemy model (one confessions table)
    schemas.py       # request/response models
    crud.py          # database operations
    database.py      # engine, session, startup schema upgrades
    routers/confessions.py
    sms.py           # SMS provider code
    reminders.py     # hourly reminder job
    phone.py         # Ghana number normalization
commit_frontend/
  src/pages/         # Landing, CreateConfession, Preview, Send, Recipient, Status, NotFound
  src/components/    # Button, CodeBlock, EncodedLines, Logo
  src/lib/           # api.ts, encoding.ts, languages.ts
  public/_redirects  # SPA fallback for Netlify
```

## Running it locally

You'll need Python 3.11 and Node 22.

### Backend

```bash
cd commit-backend
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env             # then fill in the values
uvicorn app.main:app --reload
```

The API runs at `http://localhost:8000`, with interactive docs at `/docs`. With no `DATABASE_URL`, it uses a local SQLite file. The database tables are created, and any later columns are added, automatically on startup.

### Frontend

```bash
cd commit_frontend
cp .env.example .env             # set VITE_API_BASE_URL
npm install
npm run dev
```

The app runs at `http://localhost:5173`. Vite reads `.env` only at startup, so restart `npm run dev` after changing it.

## Configuration

### Backend (`commit-backend/.env`)

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | Postgres connection string. Leave unset for local SQLite. |
| `AT_USERNAME` | Africa's Talking app username (`sandbox` while testing). |
| `AT_API_KEY` | API key for that app. |
| `AT_SENDER_ID` | Optional. Leave **empty** until a sender ID is approved, or sends fail with `InvalidSenderId`. |
| `APP_BASE_URL` | Public frontend URL, used to build the links in texts. |
| `REMINDER_MAX_COUNT` | Maximum reminders per message (default 3). |
| `REMINDER_INTERVAL_HOURS` | Hours between reminders (default 48). |
| `CORS_ORIGINS` | Optional extra allowed origins, comma-separated. |

### Frontend (`commit_frontend/.env`)

| Variable | Purpose |
| --- | --- |
| `VITE_API_BASE_URL` | URL of the backend, with no trailing slash. |

Never commit `.env` files. Only the `.env.example` files belong in the repo.

## API

| Method and path | Purpose |
| --- | --- |
| `POST /confessions` | Create a draft; returns its id |
| `POST /confessions/{id}/send` | Attach the recipient's number (and an optional alert number for the sender) and send the first text |
| `GET /confessions/{id}` | Recipient fetch: message and encoding only |
| `POST /confessions/{id}/read` | Record the first time the message was read |
| `POST /confessions/{id}/respond` | Record the recipient's reply |
| `GET /confessions/{id}/status` | Sender's view: status, read time, message, reply |

If the SMS provider rejects a send, `/send` returns `502` with the provider's message, and the frontend shows it. Success is only reported when the provider accepts the recipient.

## Deployment

**Backend on Render**

- Root directory: `commit-backend`
- Build command: `pip install -r requirements.txt`
- Start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- Environment: the backend variables above, plus `PYTHON_VERSION=3.11.9`

**Frontend on Netlify**

- Base directory: `commit_frontend`
- Build command: `npm run build`, publish directory: `dist`
- Environment: `VITE_API_BASE_URL` set to your Render URL
- `public/_redirects` contains `/* /index.html 200`, so links like `/r/abc12345` load the app

After deploying the frontend, set `APP_BASE_URL` on Render to the Netlify address and add that address to the CORS origins.

## Notes on SMS in Ghana

- Sandbox messages appear only in the Africa's Talking simulator, not on real phones.
- A custom alphanumeric sender ID (such as `commit`) needs a registered business, so individual developers send under the provider's default sender until that's in place.
- Messages that use emoji or curly quotes switch to a smaller per-segment limit and cost more. Keep the SMS text plain and short, and put the link last.
- Reminders multiply per-message cost, so check current rates before going live.

## Roadmap

- Full back-and-forth thread between sender and recipient, with separate keys for each side
- A calm gate screen before the code, a recipient opt-out, and a block-sender option
- A custom short domain for more trustworthy links
- An optional non-identifying hint from the sender

