import React from 'react';

interface CollapsiblePanelProps {
  title: string;
  subtitle?: string;
  isCollapsed: boolean;
  onToggle: () => void;
  buttons?: React.ReactNode;
  children: React.ReactNode;
  hasContent?: boolean;
  maxHeight?: number;
  allowExpansion?: boolean;
}

export const CollapsiblePanel: React.FC<CollapsiblePanelProps> = ({
  title,
  subtitle,
  isCollapsed,
  onToggle,
  buttons,
  children,
  hasContent = false,
  maxHeight,
  allowExpansion = false,
}) => (
  <div
    className="border-l border-r border-t last:border-b flex flex-col"
    style={{
      flexShrink: 0,
      ...(allowExpansion && !isCollapsed ? { flex: 1 } : {}),
    }}
  >
    {/* Clickable Header */}
    <div
      className="bg-gray-100 border-b px-3 py-2 flex items-center justify-between cursor-pointer hover:bg-gray-200 transition-colors flex-shrink-0"
      onClick={onToggle}
    >
      <div className="flex items-center space-x-2 min-w-0 flex-1">
        {/* Rotating Arrow Caret */}
        <svg
          className={`w-3 h-3 transition-transform duration-200 flex-shrink-0 ${
            isCollapsed ? '-rotate-90' : 'rotate-0'
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
        <div className="min-w-0 flex-1">
          <h4 className="font-medium text-sm text-gray-700 truncate text-left">
            {title}
          </h4>
          {subtitle && (
            <span className="text-xs text-gray-500 truncate block text-left">
              {subtitle}
            </span>
          )}
        </div>
      </div>
      {/* Buttons - prevent click propagation */}
      {buttons && (
        <div
          className="flex space-x-1 flex-shrink-0 ml-2"
          onClick={(e) => e.stopPropagation()}
        >
          {buttons}
        </div>
      )}
    </div>

    {/* Collapsible Content */}
    {!isCollapsed && (
      <div
        className={`overflow-auto p-4 ${allowExpansion ? 'flex-1 min-h-0' : ''}`}
        style={{
          maxHeight:
            hasContent && maxHeight && !allowExpansion
              ? `${String(maxHeight)}px`
              : undefined,
        }}
      >
        {children}
      </div>
    )}
  </div>
);
