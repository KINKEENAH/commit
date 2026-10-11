import { ReactNode } from "react";
import { Link } from "react-router";

type ButtonProps = {
  children: ReactNode;
  variant?: "primary" | "secondary";
  disabled?: boolean;
  onClick?: () => void;
  /** If set, the button navigates via <Link> instead of calling onClick. */
  to?: string;
  className?: string;
};

export default function Button({
  children,
  variant = "primary",
  disabled = false,
  onClick,
  to,
  className = "",
}: ButtonProps) {
  const base =
    "rounded-xl px-5 py-3 text-sm font-semibold font-sans transition-colors inline-block text-center";

  const styles =
    variant === "primary"
      ? disabled
        ? "bg-border text-text-muted cursor-not-allowed"
        : "bg-accent text-bg"
      : "bg-transparent border border-border text-text-secondary";

  const classes = `${base} ${styles} ${className}`;

  // A button that only navigates (no logic first) renders as a real <a> via
  // Link — gives you right-click/new-tab and correct history for free.
  if (to && !disabled) {
    return (
      <Link to={to} className={classes}>
        {children}
      </Link>
    );
  }

  // A button with logic before navigation (API calls, validation) stays a
  // real <button> and navigates itself via useNavigate() in the page.
  return (
    <button onClick={onClick} disabled={disabled} className={classes}>
      {children}
    </button>
  );
}
