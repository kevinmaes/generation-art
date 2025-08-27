import React, { useEffect, useState, useRef } from 'react';
import type { Individual } from '../../../shared/types';

interface NodeTooltipProps {
  individual: Individual;
  position: { x: number; y: number };
  canvasBounds: DOMRect;
  isDevelopment?: boolean;
}

export const NodeTooltip: React.FC<NodeTooltipProps> = ({
  individual,
  position,
  canvasBounds,
  isDevelopment = false,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [arrowPosition, setArrowPosition] = useState({ x: 0, side: 'bottom' as 'top' | 'bottom' });
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Delay showing tooltip for smooth UX
    const showTimer = setTimeout(() => setIsVisible(true), 200);
    return () => clearTimeout(showTimer);
  }, []);

  useEffect(() => {
    if (!tooltipRef.current || !isVisible) return;

    const tooltip = tooltipRef.current;
    const tooltipRect = tooltip.getBoundingClientRect();

    // Calculate initial position (centered above node)
    let x = position.x - tooltipRect.width / 2;
    let y = position.y - tooltipRect.height - 15; // 15px above node (reduced gap for arrow)
    let arrowSide: 'top' | 'bottom' = 'bottom'; // Arrow points down by default

    // Adjust if tooltip goes off screen
    // Check right boundary
    if (x + tooltipRect.width > canvasBounds.width) {
      x = canvasBounds.width - tooltipRect.width - 10;
    }

    // Check left boundary
    if (x < 10) {
      x = 10;
    }

    // Check top boundary (flip to below node if needed)
    if (y < 10) {
      y = position.y + 30; // Below node (reduced gap for arrow)
      arrowSide = 'top'; // Arrow points up when tooltip is below
    }

    // Check bottom boundary
    if (y + tooltipRect.height > canvasBounds.height - 10) {
      y = canvasBounds.height - tooltipRect.height - 10;
    }

    // Calculate arrow position (should point to node center)
    const arrowX = Math.min(
      Math.max(position.x - x, 15), // At least 15px from left edge
      tooltipRect.width - 15 // At least 15px from right edge
    );

    setTooltipPosition({ x, y });
    setArrowPosition({ x: arrowX, side: arrowSide });
  }, [position, canvasBounds, isVisible]);

  // Extract birth and death country information
  const birthCountry = individual.birth?.country?.iso2;
  const deathCountry = individual.death?.country?.iso2;

  // Generate flag URLs - using flag-icons CDN
  // Converts ISO2 to lowercase as required by the CDN
  const birthFlagUrl = birthCountry
    ? `https://cdn.jsdelivr.net/gh/lipis/flag-icons@7.2.3/flags/4x3/${birthCountry.toLowerCase()}.svg`
    : null;

  const deathFlagUrl = deathCountry
    ? `https://cdn.jsdelivr.net/gh/lipis/flag-icons@7.2.3/flags/4x3/${deathCountry.toLowerCase()}.svg`
    : null;

  return (
    <div
        ref={tooltipRef}
        className={`absolute z-50 bg-white rounded-lg shadow-lg border border-gray-200 p-3 pointer-events-auto transition-opacity duration-200 ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}
        style={{
          left: `${String(tooltipPosition.x)}px`,
          top: `${String(tooltipPosition.y)}px`,
          minWidth: '200px',
          maxWidth: '300px',
        }}
      >
        {/* Arrow pointer */}
        <div
          className="absolute w-0 h-0 pointer-events-auto"
          style={{
            left: `${arrowPosition.x}px`,
            ...(arrowPosition.side === 'bottom'
              ? {
                  bottom: '-8px',
                  borderLeft: '8px solid transparent',
                  borderRight: '8px solid transparent',
                  borderTop: '8px solid white',
                  filter: 'drop-shadow(0 2px 2px rgba(0,0,0,0.1))',
                }
              : {
                  top: '-8px',
                  borderLeft: '8px solid transparent',
                  borderRight: '8px solid transparent',
                  borderBottom: '8px solid white',
                  filter: 'drop-shadow(0 -2px 2px rgba(0,0,0,0.1))',
                }),
            transform: 'translateX(-50%)',
          }}
        />
      {/* Name */}
      <div className="font-semibold text-gray-900 text-sm mb-1 text-center">
        {individual.name || 'Unknown'}
      </div>

      {/* Birth Information */}
      {birthCountry && (
        <div className="flex items-center justify-center gap-1.5 text-xs text-gray-600 mb-1">
          <span>Born {birthCountry}</span>
          {birthFlagUrl && (
            <img
              src={birthFlagUrl}
              alt={`${birthCountry} flag`}
              className="w-4 h-auto rounded-sm shadow-sm"
              onError={(e) => {
                // Hide image if flag fails to load
                e.currentTarget.style.display = 'none';
              }}
            />
          )}
        </div>
      )}

      {/* Death Information */}
      {deathCountry && (
        <div className="flex items-center justify-center gap-1.5 text-xs text-gray-600 mb-2">
          <span>Died {deathCountry}</span>
          {deathFlagUrl && (
            <img
              src={deathFlagUrl}
              alt={`${deathCountry} flag`}
              className="w-4 h-auto rounded-sm shadow-sm"
              onError={(e) => {
                // Hide image if flag fails to load
                e.currentTarget.style.display = 'none';
              }}
            />
          )}
        </div>
      )}

      {/* Individual ID (development mode) */}
      {isDevelopment && (
        <div className="text-xs text-gray-400 font-mono">
          ID: {individual.id}
        </div>
      )}
      
      {/* Hint text */}
      <div className="text-xs text-gray-500 italic mt-2 text-center">
        Click to select
      </div>
    </div>
  );
};
