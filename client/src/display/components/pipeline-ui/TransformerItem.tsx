import type { VisualTransformerConfig } from '../../../transformers/types';

interface TransformerItemProps {
  transformer: VisualTransformerConfig;
  isSelected: boolean;
  handleTransformerSelect: (transformerId: string) => void;
  index: number;
  isInPipeline: boolean;
  onAddTransformer?: (transformerId: string) => void;
  onRemoveTransformer?: (transformerId: string) => void;
}

/**
 * A component that displays a transformer item in the pipeline.
 * @param param0 - The props for the transformer item.
 * @returns A React component that displays a transformer item in the pipeline.
 */
export function TransformerItem({
  transformer,
  isSelected,
  handleTransformerSelect,
  index,
  isInPipeline,
  onAddTransformer,
  onRemoveTransformer,
}: TransformerItemProps) {
  return (
    <div
      key={transformer.id}
      className={`p-3 rounded border cursor-pointer transition-colors ${
        isSelected
          ? 'bg-purple-100 border-purple-300'
          : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
      }`}
      onClick={() => {
        handleTransformerSelect(transformer.id);
      }}
    >
      <div className="flex items-center w-full">
        <div className="flex items-center space-x-2 flex-1 text-left">
          <span className="text-xs bg-gray-300 text-gray-700 px-2 py-1 rounded">
            {index + 1}
          </span>
          <span className="font-medium text-sm">
            {transformer.name || transformer.id}
          </span>
        </div>
        {isInPipeline ? (
          <button
            className="text-gray-400 hover:text-red-500 text-sm flex-shrink-0"
            onClick={(e) => {
              e.stopPropagation();
              onRemoveTransformer?.(transformer.id);
            }}
          >
            ×
          </button>
        ) : (
          <button
            className="text-gray-400 hover:text-green-500 text-sm flex-shrink-0"
            onClick={(e) => {
              e.stopPropagation();
              onAddTransformer?.(transformer.id);
            }}
          >
            +
          </button>
        )}
      </div>
      {transformer.description && (
        <p className="text-xs text-gray-600 mt-1 text-left">
          {transformer.description}
        </p>
      )}
    </div>
  );
}
