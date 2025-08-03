import React from 'react';

interface GenerationProgressProps {
  /** Progress information for the current pipeline execution */
  progress?: {
    current: number;
    total: number;
    transformerName: string;
  } | null;
  /** Custom message to display (defaults to "Generating art...") */
  message?: string;
  /** Additional CSS classes to apply to the container */
  className?: string;
}

/**
 * GenerationProgress - A reusable component that displays a spinner with progress information
 *
 * Shows an animated spinner with optional progress tracking including:
 * - Current step vs total steps
 * - Current transformer name
 * - Visual progress bar
 */
export function GenerationProgress({
  progress = null,
  message = 'Generating art...',
  className = '',
}: GenerationProgressProps): React.ReactElement {
  return (
    <div className={`flex flex-col items-center space-y-4 ${className}`}>
      {/* Animated Spinner */}
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>

      {/* Main Message */}
      <p className="text-gray-600 font-medium">{message}</p>

      {/* Progress Details */}
      {progress && (
        <div className="flex flex-col items-center space-y-2">
          {/* Step Counter */}
          <p className="text-sm text-gray-500">
            Step {progress.current} of {progress.total}
          </p>

          {/* Current Transformer */}
          <p className="text-xs text-gray-400">{progress.transformerName}</p>

          {/* Progress Bar */}
          <div className="w-48 bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{
                width: `${String((progress.current / progress.total) * 100)}%`,
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
