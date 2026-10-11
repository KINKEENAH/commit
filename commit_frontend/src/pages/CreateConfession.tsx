import { useState } from "react";
import { useNavigate } from "react-router";
import Button from "../components/Button";
import Logo from "../components/Logo";
import { LANGUAGES } from "../lib/languages";
import type { LanguageId } from "../lib/encoding";

export default function CreateConfession() {
  const [message, setMessage] = useState("");
  const [language, setLanguage] = useState<LanguageId | null>(null);
  const navigate = useNavigate();

  const canContinue = message.trim().length > 0 && language !== null;

  const handleContinue = () => {
    if (!canContinue) return;
    // No backend yet — the draft rides along as route state to the next
    // screen. Swap this for a real save-confession API call later.
    navigate("/preview", { state: { message, language } });
  };

  return (
    <div className="min-h-screen bg-bg px-6 py-10">
      <div className="max-w-md mx-auto">
        <div className="flex justify-between items-center mb-6">
          <Logo />
          <span className="text-xs font-mono text-text-secondary">01 / 03</span>
        </div>

        <h1 className="text-2xl md:text-3xl font-semibold text-text-primary mb-2">
          What can't you say out loud?
        </h1>
        <p className="text-text-secondary mb-6">
          Write it however you want. We'll help you encode it.
        </p>

        <label className="block text-xs font-mono text-text-secondary tracking-wide mb-2">
          YOUR MESSAGE
        </label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value.slice(0, 500))}
          placeholder="Tell them what you've been meaning to say..."
          className="w-full min-h-[120px] bg-surface border border-border rounded-xl p-4 text-text-primary placeholder-text-muted focus:outline-none focus:border-accent"
        />
        <p className="text-right text-xs text-text-muted mb-6">{message.length} / 500</p>

        <label className="block text-xs font-mono text-text-secondary tracking-wide mb-3">
          ENCODE IT AS
        </label>
        {/* Four real options now (base64 / rot13 / hex / plain) — a clean
            2x2 grid at every width, no more forcing a card to span columns. */}
        <div className="grid grid-cols-2 gap-2 mb-8">
          {LANGUAGES.map((lang) => {
            const selected = language === lang.id;
            return (
              <button
                key={lang.id}
                onClick={() => setLanguage(lang.id)}
                className={`relative text-left rounded-xl border p-3 ${
                  selected ? "border-accent bg-accent/[0.06]" : "border-border bg-surface"
                }`}
              >
                {selected && (
                  <span className="absolute top-2.5 right-3 text-[9px] font-semibold text-accent">
                    SELECTED
                  </span>
                )}
                <div className="text-text-primary text-base mt-1 mb-1.5">{lang.icon}</div>
                <div className="text-text-primary text-sm font-medium">{lang.name}</div>
                <div className="text-text-secondary text-xs">{lang.tagline}</div>
              </button>
            );
          })}
        </div>

        <div className="flex md:justify-end">
          <Button
            variant="primary"
            disabled={!canContinue}
            onClick={handleContinue}
            className="w-full md:w-auto"
          >
            Continue →
          </Button>
        </div>
      </div>
    </div>
  );
}
