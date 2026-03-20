'use client';

interface GuesserViewProps {
  question: string;
}

/**
 * GuesserView Component
 * Display for the Guesser role - sees only the question
 */
export default function GuesserView({ question }: GuesserViewProps) {
  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {/* Role Header */}
      <div className="text-center space-y-2">
        <div className="text-5xl mb-2">🎯</div>
        <h2 className="text-2xl font-bold text-ocean-600">You are the Guesser</h2>
        <p className="text-gray-600">
          Your job is to find the Big Fish by asking questions and watching for suspicious behavior!
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

      {/* Instructions */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-3">
        <h3 className="font-semibold text-gray-800">Your Mission:</h3>
        <ul className="space-y-2 text-gray-700">
          <li className="flex items-start gap-2">
            <span className="text-ocean-600 font-bold">1.</span>
            <span>Listen carefully to each player&apos;s answer</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-ocean-600 font-bold">2.</span>
            <span>Watch for stuttering, eye contact, or &quot;fishy&quot; logic</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-ocean-600 font-bold">3.</span>
            <span>Eliminate players you think are Red Herrings</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-ocean-600 font-bold">4.</span>
            <span>Catch the Big Fish to win!</span>
          </li>
        </ul>
      </div>

      {/* Note */}
      <div className="text-center text-sm text-gray-500 italic">
        <p>Remember: Only the Big Fish knows the real answer!</p>
      </div>
    </div>
  );
}
