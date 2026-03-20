'use client';

import LieGenerator from './LieGenerator';

interface RedHerringViewProps {
  question: string;
  bluffSuggestions: string[];
  onGenerateLie: () => Promise<string>;
}

/**
 * RedHerringView Component
 * Display for Red Herring role - sees question, bluff suggestions, and can generate lies
 */
export default function RedHerringView({
  question,
  bluffSuggestions,
  onGenerateLie,
}: RedHerringViewProps) {
  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {/* Role Header */}
      <div className="text-center space-y-2">
        <div className="text-5xl mb-2">🐠</div>
        <h2 className="text-2xl font-bold text-ocean-600">You are a Red Herring</h2>
        <p className="text-gray-600">
          You don&apos;t know the answer! Create a believable lie to fool the Guesser.
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

      {/* Bluff Suggestions */}
      {bluffSuggestions.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-3">
          <h3 className="font-semibold text-gray-800 flex items-center gap-2">
            <span>💡</span> Bluff Suggestions:
          </h3>
          <div className="space-y-2">
            {bluffSuggestions.map((bluff, index) => (
              <div
                key={index}
                className="bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg p-3 transition-colors"
              >
                <p className="text-gray-700">{bluff}</p>
              </div>
            ))}
          </div>
          <p className="text-sm text-gray-500 italic">
            You can use these suggestions or come up with your own lie!
          </p>
        </div>
      )}

      {/* AI Lie Generator */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <span>🎭</span> AI Lie Generator
        </h3>
        <LieGenerator onGenerate={onGenerateLie} />
      </div>

      {/* Instructions */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-3">
        <h3 className="font-semibold text-gray-800">Your Mission:</h3>
        <ul className="space-y-2 text-gray-700">
          <li className="flex items-start gap-2">
            <span className="text-ocean-600 font-bold">1.</span>
            <span>Come up with a believable but wrong answer</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-ocean-600 font-bold">2.</span>
            <span>Use the bluff suggestions or AI generator for inspiration</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-ocean-600 font-bold">3.</span>
            <span>Act confident when giving your answer</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-ocean-600 font-bold">4.</span>
            <span>Help the Big Fish blend in by making your lie believable</span>
          </li>
        </ul>
      </div>

      {/* Tip */}
      <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
        <p className="text-purple-800 text-sm">
          <strong>💡 Pro Tip:</strong> The best lies are close to the truth but definitely wrong. 
          Think of related concepts, similar items, or common misconceptions!
        </p>
      </div>
    </div>
  );
}
