import { useState, useEffect } from "react";
import { useLocation } from "react-router";
import Logo from "../components/Logo";
import { fetchStatus } from "../lib/api";

type StatusValue = "draft" | "pending" | "response_received";

export default function Status() {
  const location = useLocation();
  const stateId = (location.state as { id?: string } | null)?.id;
  // Falls back to the id saved on Send — this is what makes the status
  // page work even after a refresh, when route state is gone.
  const id = stateId ?? localStorage.getItem("commit_last_confession_id");

  const [status, setStatus] = useState<StatusValue | null>(null);
  const [response, setResponse] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setError("No confession to check yet — send one first.");
      return;
    }
    fetchStatus(id)
      .then((data) => {
        setStatus(data.status as StatusValue);
        setResponse(data.response);
      })
      .catch(() => setError("Couldn't reach the backend."));
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
            </div>
            <p className="text-text-secondary text-sm">
              {status === "pending"
                ? "Delivered. We'll keep nudging them until they respond."
                : status === "response_received"
                ? `They replied: "${response}"`
                : "Not sent yet."}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
