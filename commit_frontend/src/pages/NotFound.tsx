import Logo from "../components/Logo";
import Button from "../components/Button";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-bg px-6 py-10 flex flex-col items-center justify-center text-center">
      <Logo />
      <p className="text-text-primary text-lg mt-6 mb-2">Page not found.</p>
      <p className="text-text-secondary text-sm mb-6">
        That link doesn't match anything in commit.
      </p>
      <Button to="/">Back to start</Button>
    </div>
  );
}
