'use client';

import SecretReveal from './SecretReveal';

interface BigFishViewProps {
  question: string;
  secretWord: string;
}

/**
 * BigFishView Component
 * Display for the Big Fish role - sees question and secret word
 */
export default function BigFishView({ question, secretWord }: BigFishViewProps) {
  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {/* Role Header */}
      <div className="text-center space-y-2">
        <div className="text-5xl mb-2">🐟</div>
        <h2 className="text-2xl font-bold text-ocean-600">You are the Big Fish</h2>
        <p className="text-gray-600">
          You know the real answer! Don&apos;t get caught - blend in with the Red Herrings.
        </p>
      </div>

      {/* Question Card */}
      <div className="bg-gradient-to-br from-ocean-50 to-blue-50 border-2 border-ocean-200 rounded-xl p-8 shadow-lg">
        <p className="text-sm font-medium text-ocean-600 mb-3 uppercase tracking-wide">
          Question
        </p>
        <p className="text-2xl md:text-3xl font-bold text-gray-800 leading-relaxed">
          {question}
        </p>
      </div>

      {/* Secret Word - Tap to Reveal */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <SecretReveal
          secret={secretWord}
          label="The Correct Answer (Secret)"
        />
      </div>

      {/* Instructions */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-3">
        <h3 className="font-semibold text-gray-800">Your Mission:</h3>
        <ul className="space-y-2 text-gray-700">
          <li className="flex items-start gap-2">
            <span className="text-ocean-600 font-bold">1.</span>
            <span>Remember the secret word - it&apos;s your answer!</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-ocean-600 font-bold">2.</span>
            <span>Give a believable answer when it&apos;s your turn</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-ocean-600 font-bold">3.</span>
            <span>Try to blend in with the Red Herrings&apos; lies</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-ocean-600 font-bold">4.</span>
            <span>Don&apos;t get eliminated by the Guesser!</span>
          </li>
        </ul>
      </div>

      {/* Warning */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
        <p className="text-amber-800 text-sm">
          <strong>⚠️ Warning:</strong> If the Guesser eliminates you, you lose all points for this round!
          But if you survive, you and the remaining Red Herrings get points instead!
        </p>
      </div>
    </div>
  );
}
