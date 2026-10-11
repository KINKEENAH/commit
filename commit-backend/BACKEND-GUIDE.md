# commit. backend — how this was built

Same idea as `BUILD-GUIDE.md` on the frontend: read this alongside the
actual files, in the order they're listed.

## 1. Why SQLite by default

`database.py` defaults `DATABASE_URL` to a local SQLite file so you can run
this immediately with zero setup — no Postgres server to install or start
first. Swap it for a Postgres URL in `.env` whenever you want (matching
Hudiccon's setup) — nothing else in the code changes, since SQLAlchemy
abstracts the actual database engine.

## 2. The data model — one table

`models.py` has a single `Confession` table. A few fields exist only
because there's no login system:

- `id` — this is the SAME token used in the recipient link
  (`commit.app/r/<id>`) AND for the sender checking status later. There's
  no separate "sender token," because the trust model is already "whoever
  has the id can act on this confession" — same as the link itself.
- `status` — `draft` (created, not sent) → `pending` (sent, waiting) →
  `response_received`. This is what `Status.tsx` on the frontend reads.
- `reminder_count` / `last_reminded_at` — what makes the "keep prompting"
  mechanic actually bounded instead of indefinite (see part 5).

## 3. Schemas vs. models

`schemas.py` defines what the API actually accepts and returns —
deliberately narrower than the database row. `ConfessionPublic` (what the
recipient endpoint returns) only has `message` and `language`, nothing that
could identify the sender, because the recipient page should never be able
to see more than that even if someone inspected the network request.

## 4. The phone number problem (and why the SMS provider changed)

The backend originally used Twilio, but Ghana numbers aren't issuable to
individuals there, and Twilio's trial tier flatly blocks alphanumeric
sender IDs (error 21267) — no way around it short of paying upfront.
**Switched to Africa's Talking** instead, which is built around African
markets rather than treating them as an afterthought, and its sandbox
doesn't require a registered sender id just to test.

One thing that *didn't* need to change: Twilio also required E.164-format
numbers, and so does Africa's Talking — `phone.py`'s
`normalize_ghana_phone()` works unchanged regardless of which provider is
behind `sms.py`.

**Because `send_confession_link()` and `send_reminder()` kept the exact
same function signatures, nothing outside `sms.py` had to change** —
`routers/confessions.py` and `reminders.py` call those two functions and
have no idea which provider is behind them. That's the payoff of having
isolated the provider-specific code into one file from the start.

## 5. The reminder mechanic

`reminders.py` is what implements "keep prompting until they respond,"
bounded on purpose:

- `REMINDER_MAX_COUNT` (default 3) — a confession stops getting reminded
  once it's been nudged this many times, whether or not the recipient ever
  responds.
- `REMINDER_INTERVAL_HOURS` (default 48) — reminders are spaced out, not
  sent back-to-back.
- `start_scheduler()` runs an hourly check in-process (via APScheduler, no
  separate infrastructure like Redis needed) that finds confessions due for
  a nudge and sends one.

Both numbers live in `.env`, not hardcoded, so you can tune the cadence
without touching code.

## 6. Routes, in the order a confession moves through them

`routers/confessions.py`:

1. `POST /confessions` — create (draft status), returns the id
2. `POST /confessions/{id}/send` — attach a recipient phone, send the first
   text, flip to pending
3. `GET /confessions/{id}` — what the recipient screen fetches
4. `POST /confessions/{id}/respond` — records the response, flips to
   response_received
5. `GET /confessions/{id}/status` — what the sender's status screen polls

## 7. Running it

```
pip install -r requirements.txt
cp .env.example .env    # then fill in your real Twilio credentials
uvicorn app.main:app --reload
```

FastAPI's automatic docs at `http://localhost:8000/docs` let you try every
endpoint by hand before the frontend is wired up to them at all — a good
way to confirm the backend works on its own first.

## 8. Cost, worth knowing before you test with real numbers

Pricing differs from what Twilio would have charged — check your Africa's
Talking dashboard for current Ghana rates before sending at any real
volume, since reminders mean one confession can trigger several charges,
not just one. The sandbox app is free regardless, which is one more reason
to do your early testing there before moving to a real app.

## 9. If you use Neon instead of a self-hosted Postgres

Neon works exactly like any Postgres database from SQLAlchemy's side — same
driver, same `DATABASE_URL` format, nothing to branch on in code. Two
things specific to it:

- Neon gives you **direct** and **pooled** connection strings (the pooled
  one has `-pooler` in the hostname). Use the direct one here — this app
  already has its own connection pool via SQLAlchemy, running in one
  long-lived process, which is exactly the case Neon's pooler isn't needed
  for.
- `database.py`'s `pool_pre_ping=True` exists specifically for providers
  like Neon that close idle connections — without it, a long-idle
  connection can get reused after Neon's already dropped it, failing with
  `SSL connection has been closed unexpectedly`.

## 10. What's still not connected

The frontend (`CreateConfession.tsx`, `Preview.tsx`, `Send.tsx`,
`Status.tsx`, `Recipient.tsx`) still has its original `// TODO` comments —
none of it calls this API yet. That's the next piece: swapping each TODO
for a real `fetch()` call to the matching endpoint above.
