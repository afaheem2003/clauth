export default function AnimatedCard({ children }) {
  return (
    <div className="transform transition-transform hover:scale-105 hover:rotate-1 duration-300">
      {children}
    </div>
  );
} 