import { useState, useEffect } from "react";
import { useLocation, useSearchParams } from "react-router";
import Logo from "../components/Logo";
import { fetchStatus } from "../lib/api";

type StatusValue = "draft" | "pending" | "response_received";

const POLL_MS = 15000;

function formatWhen(iso: string): string {
  return new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

export default function Status() {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const stateId = (location.state as { id?: string } | null)?.id;
  // The "they replied" text links to /status?id=..., so the page also works
  // on a device that never sent the confession. Ids are 8 hex characters;
  // anything else in the URL is ignored.
  const rawQueryId = searchParams.get("id");
  const queryId = rawQueryId && /^[a-f0-9]{8}$/.test(rawQueryId) ? rawQueryId : null;
  // Falls back to the id saved on Send — this is what makes the status
  // page work even after a refresh, when route state is gone.
  const id = stateId ?? queryId ?? localStorage.getItem("commit_last_confession_id");

  const [status, setStatus] = useState<StatusValue | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [sentAt, setSentAt] = useState<string | null>(null);
  const [response, setResponse] = useState<string | null>(null);
  const [respondedAt, setRespondedAt] = useState<string | null>(null);
  const [readAt, setReadAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setError("No confession to check yet — send one first.");
      return;
    }
    let cancelled = false;
    let timer: number | undefined;

    // Re-checks every 15s while still pending, so a reply shows up without
    // the sender having to refresh. Stops once a reply has arrived.
    const load = async () => {
      try {
        const data = await fetchStatus(id);
        if (cancelled) return;
        setStatus(data.status as StatusValue);
        setMessage(data.message);
        setSentAt(data.sent_at);
        setResponse(data.response);
        setRespondedAt(data.responded_at);
        setReadAt(data.read_at);
        setError(null);
        if (data.status === "pending") timer = window.setTimeout(load, POLL_MS);
      } catch {
        if (!cancelled) setError("Couldn't reach the backend.");
      }
    };
    load();

    return () => {
      cancelled = true;
      if (timer) window.clearTimeout(timer);
    };
  }, [id]);

  return (
    <div className="min-h-screen bg-bg px-6 py-10">
      <div className="max-w-md mx-auto">
        <Logo />

        {error && <p className="text-sm text-danger mt-6">{error}</p>}

        {status && (
          <>
            <div className="bg-surface border border-border rounded-xl p-4 mt-6 mb-4 font-mono text-sm">
              <div className="text-text-muted">$ status</div>
              <div className={status === "pending" ? "text-code-function" : "text-accent"}>
                {status === "pending"
                  ? "PENDING"
                  : status === "response_received"
                  ? "RESPONSE_RECEIVED"
                  : "DRAFT"}
              </div>
              {status !== "draft" && (
                <>
                  <div className="text-text-muted mt-3">$ read</div>
                  <div className={readAt ? "text-code-number" : "text-text-secondary"}>
                    {readAt ? `YES · ${formatWhen(readAt)}` : "NO"}
                  </div>
                </>
              )}
            </div>

            {status === "pending" && !readAt && (
              <p className="text-text-secondary text-sm">
                Sent, but not read yet. We'll nudge them a few times if they don't open it. This
                page checks on its own.
              </p>
            )}

            {status === "pending" && readAt && (
              <p className="text-text-secondary text-sm">
                They've read it. Waiting on a reply, and this page checks on its own.
              </p>
            )}

            {status === "draft" && <p className="text-text-secondary text-sm">Not sent yet.</p>}

            {/* The log: the sender's message and, once it arrives, the reply. */}
            {status !== "draft" && message !== null && (
              <div className="bg-surface border border-border rounded-xl p-4 mt-4">
                <div className="font-mono text-sm text-text-muted">$ log</div>

                <div className="mt-3">
                  <div className="font-mono text-xs text-code-function">
                    you{sentAt ? ` · ${formatWhen(sentAt)}` : ""}
                  </div>
                  <p className="text-text-primary leading-relaxed whitespace-pre-wrap mt-1">
                    {message}
                  </p>
                </div>

                <div className="mt-4">
                  {response ? (
                    <>
                      <div className="font-mono text-xs text-accent">
                        them{respondedAt ? ` · ${formatWhen(respondedAt)}` : ""}
                      </div>
                      <p className="text-text-primary leading-relaxed whitespace-pre-wrap mt-1">
                        {response}
                      </p>
                    </>
                  ) : (
                    <div className="font-mono text-sm text-text-secondary">
                      waiting for reply<span className="animate-pulse">_</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
