import { ReactNode } from 'react';

interface AnimatedCardProps {
  children: ReactNode;
}

export function AnimatedCard({ children }: AnimatedCardProps) {
  return (
    <div className="transform transition-transform hover:scale-105 hover:rotate-1 duration-300">
      {children}
    </div>
  );
} 