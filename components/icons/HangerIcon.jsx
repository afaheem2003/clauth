export function HangerIcon({ className = "w-6 h-6" }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M12 3L12 7" />
      <circle cx="12" cy="4" r="2" />
      <path d="M4.6 15L12 9L19.4 15" />
      <path d="M3 15L21 15L19 21L5 21L3 15Z" />
    </svg>
  );
} 