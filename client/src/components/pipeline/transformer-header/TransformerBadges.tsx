import { getProviderInfo } from '../../../services/llm-service';

interface TransformerBadgesProps {
  requiresLLM?: boolean;
  hasBeenModified: boolean;
}

export function TransformerBadges({
  requiresLLM,
  hasBeenModified,
}: TransformerBadgesProps) {
  return (
    <>
      {requiresLLM && (
        <span className="ml-2 font-mono text-xs text-gray-500 font-normal">
          {getProviderInfo().model}
        </span>
      )}
      {hasBeenModified && (
        <span className="text-xs bg-yellow-200 text-yellow-800 px-1.5 py-0.5 rounded">
          Modified
        </span>
      )}
    </>
  );
}
