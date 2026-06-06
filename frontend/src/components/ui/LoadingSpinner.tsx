type LoadingSpinnerSize = "xs" | "sm" | "md" | "lg";

type LoadingSpinnerProps = {
  size?: LoadingSpinnerSize;
  label?: string;
  className?: string;
};

export default function LoadingSpinner({
  size = "md",
  label,
  className = "",
}: LoadingSpinnerProps) {
  return (
    <span
      className={`pz-loading-spinner pz-loading-spinner-${size}${className ? ` ${className}` : ""}`}
      role={label ? "status" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    />
  );
}
