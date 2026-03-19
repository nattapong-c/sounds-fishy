'use client';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
}

/**
 * Card Component
 * Container with shadow and rounded corners
 */
export default function Card({ children, className = '', title }: CardProps) {
  return (
    <div className={`bg-white rounded-xl shadow-lg p-6 ${className}`}>
      {title && (
        <h2 className="text-xl font-semibold mb-4 text-gray-800">{title}</h2>
      )}
      {children}
    </div>
  );
}
