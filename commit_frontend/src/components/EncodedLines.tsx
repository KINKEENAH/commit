import type { LanguageId } from "../lib/encoding";

type Props = {
  language: LanguageId;
  encoded: string;
};

// Each language gets real, distinct syntax — not just a different tag on
// the same two lines. "plain" never reaches this component (see Preview.tsx
// and Recipient.tsx), so it's not handled here.
export default function EncodedLines({ language, encoded }: Props) {
  if (language === "js") {
    return (
      <>
        <div className="break-all">
          <span className="text-code-keyword">const</span>{" "}
          <span className="text-code-variable">encoded</span> ={" "}
          <span className="text-code-string">"{encoded}"</span>;
        </div>
        <div className="mt-2">
          <span className="text-code-function">atob</span>(encoded);
        </div>
      </>
    );
  }

  if (language === "python") {
    return (
      <>
        <div className="break-all">
          <span className="text-code-variable">encoded</span> ={" "}
          <span className="text-code-string">"{encoded}"</span>
        </div>
        <div className="mt-2">
          <span className="text-code-function">codecs.decode</span>(encoded,{" "}
          <span className="text-code-string">"rot13"</span>)
        </div>
      </>
    );
  }

  // terminal (hex)
  return (
    <>
      <div className="break-all">
        <span className="text-code-comment">$</span>{" "}
        <span className="text-code-variable">encoded</span>=
        <span className="text-code-string">"{encoded}"</span>
      </div>
      <div className="mt-2">
        <span className="text-code-comment">$</span> echo $encoded |{" "}
        <span className="text-code-function">xxd</span> -r -p
      </div>
    </>
  );
}
