const TONES = {
  success: "border-success/20 bg-success/10 text-success",
  warning: "border-warning/25 bg-warning/10 text-warning",
  danger: "border-danger/20 bg-danger/10 text-danger",
  info: "border-wine-700/15 bg-wine-50 text-wine-700",
  neutral: "border-ink/10 bg-paper text-ink-soft",
  muted: "border-ink/10 bg-ink/5 text-ink-muted",
  gold: "border-gold/30 bg-gold/10 text-gold-dark",
};

export default function Badge({ tone = "neutral", children, className = "" }) {
  return <span className={`chip ${TONES[tone] || TONES.neutral} ${className}`}>{children}</span>;
}
