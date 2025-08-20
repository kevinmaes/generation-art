import type { VisualTransformerConfig } from '../../../transformers/types';
import { DIMENSIONS } from '../../../transformers/dimensions';

interface TransformerMetadataProps {
  transformer: VisualTransformerConfig;
  isInPipeline: boolean;
  isExpanded?: boolean;
}

export function TransformerMetadata({
  transformer,
  isInPipeline,
  isExpanded = false,
}: TransformerMetadataProps) {
  if (isInPipeline || !isExpanded) {
    return null;
  }

  return (
    <div className="space-y-1">
      {/* Dimensions line */}
      <p className="text-xs text-left">
        <span className="text-gray-800 font-medium">Dimensions:</span>{' '}
        <span className="text-gray-600">
          {transformer.availableDimensions
            .map((dimId) => DIMENSIONS[dimId].label)
            .join(', ')}
        </span>
      </p>

      {/* Parameters line */}
      <p className="text-xs text-left">
        <span className="text-gray-800 font-medium">Parameters:</span>{' '}
        <span className="text-gray-600">
          {transformer.visualParameters
            .map((param) => param.label ?? param.name)
            .join(', ')}
        </span>
      </p>
    </div>
  );
}
