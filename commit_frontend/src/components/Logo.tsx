type LogoProps = {
  /** Muted styling for the recipient screen, where the brand should stay quiet. */
  muted?: boolean;
};

export default function Logo({ muted = false }: LogoProps) {
  return (
    <span
      className={`text-base font-medium font-sans ${
        muted ? "text-text-secondary" : "text-text-primary"
      }`}
    >
      commit.
    </span>
  );
}
