import { useState, useEffect } from "react";
import { useParams } from "react-router";
import Logo from "../components/Logo";
import Button from "../components/Button";
import CodeBlock from "../components/CodeBlock";
import EncodedLines from "../components/EncodedLines";
import { encodeMessage, decodeMessage } from "../lib/encoding";
import { getLanguage } from "../lib/languages";
import type { LanguageId } from "../lib/encoding";
import { fetchConfession, respondToConfession } from "../lib/api";

const RESPONSES = ["I feel it too", "Let's talk", "Not right now"];

type Stage = "loading" | "encoded" | "decoding" | "revealed" | "error";

export default function Recipient() {
  const { id } = useParams();

  const [message, setMessage] = useState("");
  const [language, setLanguage] = useState<LanguageId>("js");
  const [stage, setStage] = useState<Stage>("loading");
  const [decoded, setDecoded] = useState("");
  const [revealedCount, setRevealedCount] = useState(0);
  const [responded, setResponded] = useState<string | null>(null);

  // The real fetch, replacing the old hardcoded placeholder — this is what
  // makes two different links actually show two different confessions.
  useEffect(() => {
    if (!id) {
      setStage("error");
      return;
    }
    fetchConfession(id)
      .then((data) => {
        setMessage(data.message);
        setLanguage(data.language);
        if (data.language === "plain") {
          setDecoded(data.message);
          setRevealedCount(data.message.split(" ").filter(Boolean).length);
          setStage("revealed");
        } else {
          setStage("encoded");
        }
      })
      .catch(() => setStage("error"));
  }, [id]);

  const isPlain = language === "plain";
  const encoded = stage === "loading" || stage === "error" || isPlain ? "" : encodeMessage(message, language);
  const words = decoded.split(" ").filter(Boolean);

  const handleRun = () => {
    setStage("decoding");
    setTimeout(() => {
      setDecoded(decodeMessage(encoded, language));
      setStage("revealed");
    }, 900);
  };

  // Streams the decoded message in one word at a time instead of dumping
  // the whole thing in at once.
  useEffect(() => {
    if (stage !== "revealed") return;
    if (revealedCount >= words.length) return;
    const t = setTimeout(() => setRevealedCount((c) => c + 1), 180);
    return () => clearTimeout(t);
  }, [stage, revealedCount, words.length]);

  const fullyRevealed = stage === "revealed" && words.length > 0 && revealedCount >= words.length;

  const handleRespond = (response: string) => {
    if (!id) return;
    // Optimistic — shows the confirmation immediately rather than waiting
    // on the network. If the request fails, the sender's status just never
    // flips, which is a quiet failure worth revisiting later with a retry.
    setResponded(response);
    respondToConfession(id, response).catch(() => {});
  };

  return (
    <div className="min-h-screen bg-bg px-6 py-10">
      <div className="max-w-md mx-auto">
        <Logo muted />

        {stage === "loading" && <p className="text-text-secondary text-sm mt-6">Loading…</p>}

        {stage === "error" && (
          <p className="text-sm text-danger mt-6">
            Couldn't load this confession — the link may be wrong, or the backend isn't running.
          </p>
        )}

        {isPlain && stage === "revealed" && (
          <p className="text-text-primary text-lg md:text-xl leading-relaxed mt-6 mb-8">
            "{message}"
          </p>
        )}

        {!isPlain && (stage === "encoded" || stage === "decoding" || stage === "revealed") && (
          <>
            <div className="mt-6 mb-6">
              <CodeBlock tag={getLanguage(language).tag}>
                {stage === "encoded" && <EncodedLines language={language} encoded={encoded} />}
                {stage === "decoding" && (
                  <div className="text-code-number">
                    $ decoding<span className="animate-pulse">_</span>
                  </div>
                )}
                {stage === "revealed" && (
                  <div className="text-code-plain">
                    &gt; "{words.slice(0, revealedCount).join(" ")}
                    {fullyRevealed ? '"' : <span className="animate-pulse ml-0.5">_</span>}
                  </div>
                )}
              </CodeBlock>
            </div>

            {stage === "encoded" && (
              <Button variant="primary" onClick={handleRun} className="w-full mb-8">
                ▶ Run
              </Button>
            )}
          </>
        )}

        {fullyRevealed && !responded && (
          <>
            <p className="text-xs font-mono text-text-secondary tracking-wide mb-3">RESPOND</p>
            <div className="flex flex-col md:flex-row gap-2">
              {RESPONSES.map((r) => (
                <Button
                  key={r}
                  variant="secondary"
                  className="flex-1"
                  onClick={() => handleRespond(r)}
                >
                  {r}
                </Button>
              ))}
            </div>
          </>
        )}

        {responded && (
          <p className="text-text-secondary text-sm">Your response has been sent.</p>
        )}
      </div>
    </div>
  );
}
