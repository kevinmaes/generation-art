import type { VisualTransformerConfig } from '../../../transformers/types';

interface TransformerDescriptionProps {
  transformer: VisualTransformerConfig;
  isInPipeline: boolean;
  isExpanded?: boolean;
}

export function TransformerDescription({
  transformer,
  isInPipeline,
  isExpanded = false,
}: TransformerDescriptionProps) {
  return (
    <>
      {/* Short Description - always visible */}
      {transformer.shortDescription && (
        <p className="text-xs text-gray-800 font-medium mt-0.5 text-left">
          {transformer.shortDescription}
        </p>
      )}

      {/* Expandable Full Description - only for available transformers */}
      {!isInPipeline && isExpanded && transformer.description && (
        <div className="mt-2 pt-2 border-t border-gray-200">
          <p className="text-xs text-gray-700 text-left">
            {transformer.description}
          </p>
        </div>
      )}
    </>
  );
}
