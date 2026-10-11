import { useState } from "react";
import { useLocation, useNavigate } from "react-router";
import Button from "../components/Button";
import Logo from "../components/Logo";
import { sendConfession } from "../lib/api";

export default function Send() {
  const location = useLocation();
  const navigate = useNavigate();
  const { id } = (location.state as { id?: string }) || {};

  const [phone, setPhone] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSend = async () => {
    if (!id) {
      setError("Missing confession — go back and generate a link first.");
      return;
    }
    setError(null);
    setIsSending(true);
    try {
      await sendConfession(id, phone);
      // No login means no other way for the sender to find this
      // confession again later — this is what lets the status page work
      // after a page refresh or a new visit, not just route state.
      localStorage.setItem("commit_last_confession_id", id);
      navigate("/status", { state: { id } });
    } catch (err) {
      const detail = err instanceof Error ? err.message : "Unknown error";
      setError(`Couldn't send: ${detail}`);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg px-6 py-10">
      <div className="max-w-md mx-auto">
        <Logo />

        <p className="text-xs font-mono text-text-secondary mt-6 mb-2">SEND IT</p>
        <label className="block text-text-secondary text-sm mb-2">Their phone number</label>
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="055 123 4567"
          className="w-full bg-surface border border-border rounded-xl p-3 text-text-primary placeholder-text-muted font-mono text-sm mb-4 focus:outline-none focus:border-accent"
        />

        {error && <p className="text-xs text-danger mb-4">{error}</p>}

        <Button variant="primary" disabled={!phone.trim() || isSending} onClick={handleSend}>
          {isSending ? "Sending…" : "Send confession"}
        </Button>
        <p className="text-xs text-text-muted mt-3">
          Sent from commit. They won't see your number.
        </p>
      </div>
    </div>
  );
}
