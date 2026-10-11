import { useState } from "react";
import { useLocation, useNavigate } from "react-router";
import Button from "../components/Button";
import Logo from "../components/Logo";
import CodeBlock from "../components/CodeBlock";
import EncodedLines from "../components/EncodedLines";
import { encodeMessage } from "../lib/encoding";
import { getLanguage } from "../lib/languages";
import type { LanguageId } from "../lib/encoding";
import { createConfession } from "../lib/api";

type DraftState = { message?: string; language?: LanguageId };

export default function Preview() {
  const location = useLocation();
  const navigate = useNavigate();

  // Falls back to placeholder copy if this page is opened directly (e.g. a
  // page refresh), since route state doesn't survive a reload.
  const { message = "I still think about that day at the library.", language = "js" } =
    (location.state as DraftState) || {};

  const isPlain = language === "plain";
  const encoded = isPlain ? "" : encodeMessage(message, language);

  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerateLink = async () => {
    // This is the actual save-to-backend moment — the confession only
    // becomes a real row (status "draft") once this succeeds. Nothing is
    // persisted before this point.
    setError(null);
    setIsGenerating(true);
    try {
      const { id } = await createConfession(message, language);
      navigate("/send", { state: { id } });
    } catch {
      setError("Couldn't reach the backend — make sure it's running on port 8000.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg px-6 py-10">
      <div className="max-w-md mx-auto">
        <div className="flex justify-between items-center mb-6">
          <Logo />
          <span className="text-xs font-mono text-text-secondary">02 / 03</span>
        </div>

        <h1 className="text-2xl md:text-3xl font-semibold text-text-primary mb-2">
          This is what they'll see
        </h1>
        <p className="text-text-secondary mb-6">Check it before you send it.</p>

        <label className="block text-xs font-mono text-text-secondary tracking-wide mb-2">
          YOUR MESSAGE
        </label>
        <p className="text-text-primary text-sm leading-relaxed mb-6">{message}</p>

        {isPlain ? (
          <p className="text-xs text-text-muted mb-6">
            You chose plain text — this gets sent exactly as written, no decoding needed.
          </p>
        ) : (
          <>
            <div className="mb-3">
              <CodeBlock tag={getLanguage(language).tag}>
                <EncodedLines language={language} encoded={encoded} />
              </CodeBlock>
            </div>
            <p className="text-xs text-text-muted mb-6">
              This is what they'll get — they'll have to run it to reveal the message above.
            </p>
          </>
        )}

        {error && <p className="text-xs text-danger mb-4">{error}</p>}

        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => navigate(-1)}>
            Edit
          </Button>
          <Button variant="primary" onClick={handleGenerateLink} disabled={isGenerating}>
            {isGenerating ? "Generating…" : "Generate link →"}
          </Button>
        </div>
      </div>
    </div>
  );
}
