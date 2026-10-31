import React, { useState, useMemo, useEffect, useRef } from 'react';
import { MathFunctionSeries, MathGraphConfig } from '../../../../shared/types';

interface MathGraphWidgetProps {
  config: MathGraphConfig;
  onChange?: (updated: MathGraphConfig) => void;
  compact?: boolean;
}

/**
 * Safe deterministic mathematical expression evaluator for `f(x)` graphing.
 * Supports `sin`, `cos`, `tan`, `exp`, `log`, `sqrt`, `abs`, `pi`, `e`, and `^` power operator.
 */
export function evaluateMathExpression(expr: string, xVal: number): number {
  try {
    const sanitized = expr
      .toLowerCase()
      .replace(/\s+/g, '')
      .replace(/\^/g, '**')
      // Implicit multiplication e.g. 2x -> 2*x, 0.5x -> 0.5*x
      .replace(/(\d)(x|\(|sin|cos|tan|exp|log|sqrt|abs|pi)/g, '$1*$2')
      .replace(/\bpi\b/g, 'Math.PI')
      .replace(/\be\b/g, 'Math.E')
      .replace(/\bsin\b/g, 'Math.sin')
      .replace(/\bcos\b/g, 'Math.cos')
      .replace(/\btan\b/g, 'Math.tan')
      .replace(/\bexp\b/g, 'Math.exp')
      .replace(/\blog\b/g, 'Math.log')
      .replace(/\bsqrt\b/g, 'Math.sqrt')
      .replace(/\babs\b/g, 'Math.abs');

    // Reject any suspicious tokens outside math primitives
    const stripped = sanitized.replace(
      /Math\.(PI|E|sin|cos|tan|exp|log|sqrt|abs)|[0-9x+\-*/.(),]/g,
      ''
    );
    if (stripped.length > 0) {
      return NaN;
    }

    // eslint-disable-next-line no-new-func
    const fn = new Function('x', `return (${sanitized});`);
    const result = Number(fn(xVal));
    return Number.isFinite(result) ? result : NaN;
  } catch {
    return NaN;
  }
}

const MathGraphWidgetInner: React.FC<MathGraphWidgetProps> = ({
  config,
  onChange,
  compact = false
}) => {
  const [localConfig, setLocalConfig] = useState<MathGraphConfig>(config);
  const [hoverCoord, setHoverCoord] = useState<{ x: number; y: number } | null>(null);
  const [newExpr, setNewExpr] = useState<string>('');
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    setLocalConfig(config);
  }, [config]);

  useEffect(() => {
    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  const width = compact ? 460 : 640;
  const height = compact ? 260 : 340;
  const pad = 36;

  const { xMin, xMax, yMin, yMax, functions, showGrid } = localConfig;

  const updateDomain = (scaleFactor: number): void => {
    const xCenter = (xMin + xMax) / 2;
    const yCenter = (yMin + yMax) / 2;
    const halfX = ((xMax - xMin) / 2) * scaleFactor;
    const halfY = ((yMax - yMin) / 2) * scaleFactor;
    const updated: MathGraphConfig = {
      ...localConfig,
      xMin: Number((xCenter - halfX).toFixed(2)),
      xMax: Number((xCenter + halfX).toFixed(2)),
      yMin: Number((yCenter - halfY).toFixed(2)),
      yMax: Number((yCenter + halfY).toFixed(2))
    };
    setLocalConfig(updated);
    onChange?.(updated);
  };

  const resetDomain = (): void => {
    const updated: MathGraphConfig = {
      ...localConfig,
      xMin: -6,
      xMax: 6,
      yMin: -4,
      yMax: 4
    };
    setLocalConfig(updated);
    onChange?.(updated);
  };

  const addFunctionSeries = (): void => {
    if (!newExpr.trim()) return;
    const palette = ['#7E42C1', '#38BDF8', '#10B981', '#F59E0B', '#F43F5E'];
    const nextSeries: MathFunctionSeries = {
      id: `fn-${Date.now()}`,
      expression: newExpr.trim(),
      color: palette[functions.length % palette.length],
      label: `f${functions.length + 1}(x) = ${newExpr.trim()}`
    };
    const updated: MathGraphConfig = {
      ...localConfig,
      functions: [...functions, nextSeries]
    };
    setLocalConfig(updated);
    setNewExpr('');
    onChange?.(updated);
  };

  const toScreenX = (x: number): number =>
    pad + ((x - xMin) / Math.max(1e-6, xMax - xMin)) * (width - 2 * pad);
  const toScreenY = (y: number): number =>
    height - pad - ((y - yMin) / Math.max(1e-6, yMax - yMin)) * (height - 2 * pad);

  const polylines = useMemo(() => {
    const steps = compact ? 140 : 200;
    return functions.map((fn) => {
      const segments: string[] = [];
      let currentPoints: string[] = [];
      for (let i = 0; i <= steps; i++) {
        const x = xMin + (i / steps) * (xMax - xMin);
        const y = evaluateMathExpression(fn.expression, x);
        if (!Number.isNaN(y) && y >= yMin - 10 && y <= yMax + 10) {
          currentPoints.push(`${toScreenX(x).toFixed(1)},${toScreenY(y).toFixed(1)}`);
        } else if (currentPoints.length > 0) {
          segments.push(currentPoints.join(' '));
          currentPoints = [];
        }
      }
      if (currentPoints.length > 0) {
        segments.push(currentPoints.join(' '));
      }
      return { fn, segments };
    });
  }, [functions, xMin, xMax, yMin, yMax, width, height, compact]);

  const xTicks = useMemo(() => {
    const ticks: number[] = [];
    const xStep = Math.max(1, Math.round((xMax - xMin) / 8));
    for (let x = Math.ceil(xMin); x <= Math.floor(xMax); x += xStep) {
      ticks.push(x);
    }
    return ticks;
  }, [xMin, xMax]);

  const yTicks = useMemo(() => {
    const ticks: number[] = [];
    const yStep = Math.max(1, Math.round((yMax - yMin) / 6));
    for (let y = Math.ceil(yMin); y <= Math.floor(yMax); y += yStep) {
      ticks.push(y);
    }
    return ticks;
  }, [yMin, yMax]);

  const originX = toScreenX(0);
  const originY = toScreenY(0);

  return (
    <div className="rounded-lg border border-[#4A2574] bg-[#161616] p-3 my-2 select-none">
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 mb-2 border-b border-[#2D2D2D]">
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 text-[11px] font-semibold rounded bg-[#2A1B3D] text-[#E6E6E6] border border-[#4A2574]">
            f(x) Grapher
          </span>
          <span className="text-xs font-medium text-[#E6E6E6]">
            {localConfig.title || 'Interactive Function Plotter'}
          </span>
        </div>

        <div className="flex items-center gap-1.5 no-print">
          <button
            type="button"
            onClick={() => updateDomain(0.75)}
            className="px-2 py-1 text-xs rounded bg-[#1E1E1E] hover:bg-[#2A1B3D] text-[#E6E6E6] border border-[#2D2D2D] hover:border-[#4A2574]"
            title="Zoom In"
          >
            Zoom +
          </button>
          <button
            type="button"
            onClick={() => updateDomain(1.35)}
            className="px-2 py-1 text-xs rounded bg-[#1E1E1E] hover:bg-[#2A1B3D] text-[#E6E6E6] border border-[#2D2D2D] hover:border-[#4A2574]"
            title="Zoom Out"
          >
            Zoom −
          </button>
          <button
            type="button"
            onClick={resetDomain}
            className="px-2 py-1 text-xs rounded bg-[#1E1E1E] hover:bg-[#2A1B3D] text-[#9E9E9E] hover:text-[#E6E6E6] border border-[#2D2D2D]"
          >
            Reset [{xMin}, {xMax}]
          </button>
        </div>
      </div>

      <div className="relative overflow-hidden rounded border border-[#2D2D2D] bg-[#1E1E1E]">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto block cursor-crosshair"
          onMouseMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const clientX = e.clientX;
            const clientY = e.clientY;
            if (rafRef.current !== null) {
              cancelAnimationFrame(rafRef.current);
            }
            rafRef.current = requestAnimationFrame(() => {
              const relX = ((clientX - rect.left) / Math.max(1, rect.width)) * width;
              const relY = ((clientY - rect.top) / Math.max(1, rect.height)) * height;
              const mathX = xMin + ((relX - pad) / (width - 2 * pad)) * (xMax - xMin);
              const mathY = yMax - ((relY - pad) / (height - 2 * pad)) * (yMax - yMin);
              setHoverCoord({ x: mathX, y: mathY });
            });
          }}
          onMouseLeave={() => {
            if (rafRef.current !== null) {
              cancelAnimationFrame(rafRef.current);
            }
            setHoverCoord(null);
          }}
        >
          <defs>
            <clipPath id="plot-area-clip">
              <rect x={pad} y={pad} width={width - 2 * pad} height={height - 2 * pad} />
            </clipPath>
          </defs>

          {/* Grid Lines */}
          {showGrid &&
            xTicks.map((x) => (
              <g key={`gx-${x}`}>
                <line
                  x1={toScreenX(x)}
                  y1={pad}
                  x2={toScreenX(x)}
                  y2={height - pad}
                  stroke="#2D2D2D"
                  strokeWidth="1"
                  strokeDasharray="3 3"
                />
                <text
                  x={toScreenX(x)}
                  y={height - 12}
                  fill="#9E9E9E"
                  fontSize="10"
                  textAnchor="middle"
                >
                  {x}
                </text>
              </g>
            ))}

          {showGrid &&
            yTicks.map((y) => (
              <g key={`gy-${y}`}>
                <line
                  x1={pad}
                  y1={toScreenY(y)}
                  x2={width - pad}
                  y2={toScreenY(y)}
                  stroke="#2D2D2D"
                  strokeWidth="1"
                  strokeDasharray="3 3"
                />
                <text
                  x={pad - 8}
                  y={toScreenY(y) + 3}
                  fill="#9E9E9E"
                  fontSize="10"
                  textAnchor="end"
                >
                  {y}
                </text>
              </g>
            ))}

          {/* X & Y Axes */}
          {originY >= pad && originY <= height - pad && (
            <line
              x1={pad}
              y1={originY}
              x2={width - pad}
              y2={originY}
              stroke="#4A2574"
              strokeWidth="1.5"
            />
          )}
          {originX >= pad && originX <= width - pad && (
            <line
              x1={originX}
              y1={pad}
              x2={originX}
              y2={height - pad}
              stroke="#4A2574"
              strokeWidth="1.5"
            />
          )}

          {/* Function Curves */}
          <g clipPath="url(#plot-area-clip)">
            {polylines.map(({ fn, segments }) =>
              segments.map((pts, sIdx) => (
                <polyline
                  key={`${fn.id}-${sIdx}`}
                  fill="none"
                  stroke={fn.color || '#7E42C1'}
                  strokeWidth="2.4"
                  points={pts}
                />
              ))
            )}

            {/* Hover Coordinate Crosshair */}
            {hoverCoord && (
              <g>
                <line
                  x1={toScreenX(hoverCoord.x)}
                  y1={pad}
                  x2={toScreenX(hoverCoord.x)}
                  y2={height - pad}
                  stroke="#7E42C1"
                  strokeWidth="1"
                  strokeDasharray="2 2"
                />
                {functions.map((fn) => {
                  const yVal = evaluateMathExpression(fn.expression, hoverCoord.x);
                  if (Number.isNaN(yVal)) return null;
                  return (
                    <circle
                      key={`pt-${fn.id}`}
                      cx={toScreenX(hoverCoord.x)}
                      cy={toScreenY(yVal)}
                      r="4"
                      fill={fn.color || '#7E42C1'}
                      stroke="#161616"
                      strokeWidth="1.5"
                    />
                  );
                })}
              </g>
            )}
          </g>
        </svg>

        {hoverCoord && (
          <div className="absolute top-2 right-2 px-2 py-1 rounded bg-[#161616]/90 border border-[#4A2574] text-[11px] font-mono text-[#E6E6E6]">
            x = {hoverCoord.x.toFixed(2)}, y = {hoverCoord.y.toFixed(2)}
          </div>
        )}
      </div>

      {/* Legend & Live Function Input */}
      <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          {functions.map((fn) => (
            <span
              key={fn.id}
              className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-mono bg-[#1E1E1E] border border-[#2D2D2D] text-[#E6E6E6]"
            >
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: fn.color || '#7E42C1' }}
              />
              {fn.label || fn.expression}
            </span>
          ))}
        </div>

        {!compact && (
          <div className="flex items-center gap-1.5 no-print">
            <input
              type="text"
              value={newExpr}
              onChange={(e) => setNewExpr(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') addFunctionSeries();
              }}
              placeholder="Add f(x), e.g. cos(2*x)"
              className="px-2 py-1 text-xs rounded bg-[#1E1E1E] border border-[#2D2D2D] focus:border-[#4A2574] text-[#E6E6E6] font-mono focus:outline-none"
            />
            <button
              type="button"
              onClick={addFunctionSeries}
              className="px-2.5 py-1 text-xs font-medium rounded bg-[#4A2574] hover:bg-[#7E42C1] text-[#E6E6E6]"
            >
              Plot
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export const MathGraphWidget = React.memo(MathGraphWidgetInner);
MathGraphWidget.displayName = 'MathGraphWidget';
