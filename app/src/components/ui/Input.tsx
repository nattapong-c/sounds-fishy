'use client';

interface InputProps {
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  onKeyPress?: (e: React.KeyboardEvent) => void;
  label?: string;
  error?: string;
  autoFocus?: boolean;
  className?: string;
  type?: string;
}

/**
 * Input Component
 * Reusable text input with label and error state
 */
export default function Input({
  placeholder,
  value,
  onChange,
  onKeyPress,
  label,
  error,
  autoFocus,
  className = '',
  type = 'text',
}: InputProps) {
  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyPress={onKeyPress}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className={`
          w-full px-4 py-3 border rounded-lg
          focus:outline-none focus:ring-2 focus:ring-ocean-500 focus:border-transparent
          transition-all duration-200
          ${error ? 'border-red-500' : 'border-gray-300'}
        `}
      />
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}
