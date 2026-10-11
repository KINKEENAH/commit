import Button from "../components/Button";
import Logo from "../components/Logo";
import CodeBlock from "../components/CodeBlock";

export default function Landing() {
  return (
    <div className="min-h-screen bg-bg">
      <nav className="flex justify-between items-center px-6 md:px-12 py-6">
        <Logo />
        <span className="text-sm text-text-secondary hidden md:inline">How it works</span>
      </nav>

      {/* flex-col on mobile stacks the two blocks; md:flex-row turns the same
          two children into a side-by-side hero at the desktop breakpoint. */}
      <div className="flex flex-col md:flex-row md:items-center gap-10 px-6 md:px-12 py-10 md:py-16 max-w-5xl mx-auto">
        <div className="flex-1 md:flex-[1.15]">
          <p className="font-mono text-xs text-text-secondary mb-4">$ ./confess</p>
          <h1 className="text-3xl md:text-4xl font-semibold text-text-primary leading-tight mb-3">
            Some things are easier to code than to say.
          </h1>
          <p className="text-text-secondary mb-6 max-w-sm">
            Turn your feelings into something only you know how to decode.
          </p>
          <Button to="/create">Write a confession →</Button>
          <p className="text-xs text-text-muted mt-3">No login. No name. Just the code.</p>
        </div>

        <div className="flex-1">
          <CodeBlock tag="JS">
            <div>
              <span className="text-code-keyword">const</span>{" "}
              <span className="text-code-variable">priority</span> = [
              <span className="text-code-string">"you"</span>];
            </div>
            <div>
              <span className="text-code-function">console.log</span>(priority[
              <span className="text-code-number">0</span>]);
            </div>
            <div>&gt; you</div>
          </CodeBlock>
        </div>
      </div>
    </div>
  );
}
