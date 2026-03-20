'use client';

import { useState } from 'react';
import Button from '../ui/Button';

interface LieGeneratorProps {
  onGenerate: () => Promise<string>;
  initialLie?: string;
}

/**
 * LieGenerator Component
 * AI-powered lie generation assistant for Red Herrings
 */
export default function LieGenerator({ onGenerate, initialLie }: LieGeneratorProps) {
  const [currentLie, setCurrentLie] = useState(initialLie || '');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lieHistory, setLieHistory] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    setIsLoading(true);
    setError(null);
    setCopied(false);

    try {
      const lie = await onGenerate();
      setCurrentLie(lie);
      setLieHistory(prev => [lie, ...prev].slice(0, 5)); // Keep last 5
    } catch (err) {
      setError('Failed to generate lie. Please try again.');
      console.error('Lie generation error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!currentLie) return;

    try {
      await navigator.clipboard.writeText(currentLie);
      setCopied(true);
      
      // Reset copied state after 2 seconds
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleSelectLie = (lie: string) => {
    setCurrentLie(lie);
    setCopied(false);
  };

  return (
    <div className="w-full max-w-lg mx-auto space-y-4">
      {/* Generate Button */}
      <div className="text-center">
        <Button
          variant="primary"
          onClick={handleGenerate}
          isLoading={isLoading}
          disabled={isLoading}
          className="w-full md:w-auto"
        >
          {isLoading ? 'Generating...' : '🎭 Generate Lie'}
        </Button>
      </div>

      {/* Current Lie Display */}
      {currentLie && (
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 rounded-xl p-6 animate-fade-in">
          <div className="flex items-start justify-between gap-3 mb-3">
            <p className="text-sm font-medium text-purple-700">Your Lie:</p>
            <button
              onClick={handleCopy}
              className="text-xs text-purple-600 hover:text-purple-800 transition-colors flex items-center gap-1"
              title="Copy to clipboard"
            >
              {copied ? (
                <>
                  <span>✓</span> Copied!
                </>
              ) : (
                <>
                  <span>📋</span> Copy
                </>
              )}
            </button>
          </div>
          
          <p className="text-lg text-gray-800 leading-relaxed italic">
            &ldquo;{currentLie}&rdquo;
          </p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {/* Lie History */}
      {lieHistory.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-600">Previous Lies:</p>
          <div className="space-y-2">
            {lieHistory.map((lie, index) => (
              <button
                key={`${lie}-${index}`}
                onClick={() => handleSelectLie(lie)}
                className={`
                  w-full text-left p-3 rounded-lg
                  transition-all duration-200
                  ${currentLie === lie
                    ? 'bg-purple-100 border-2 border-purple-400'
                    : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
                  }
                `}
              >
                <p className="text-sm text-gray-700 line-clamp-2">&ldquo;{lie}&rdquo;</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Tips */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
        <p className="text-sm text-blue-800">
          <strong>💡 Tip:</strong> Your lie should sound believable but be clearly wrong. 
          Don&apos;t worry if it&apos;s not perfect - you can always change it before submitting!
        </p>
      </div>
    </div>
  );
}
