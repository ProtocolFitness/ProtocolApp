import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path, Circle, Line, Text as SvgText, Defs, LinearGradient, Stop, Rect } from 'react-native-svg';
import { colors, fontSize } from '../theme';

interface DataPoint {
  label: string;
  value: number;
}

interface LineChartProps {
  data: DataPoint[];
  width: number;
  height?: number;
  color?: string;
  showDots?: boolean;
  showGrid?: boolean;
  yMin?: number;
  yMax?: number;
  unit?: string;
}

export function LineChart({
  data,
  width,
  height = 180,
  color = colors.accent,
  showDots = true,
  showGrid = true,
  yMin,
  yMax,
  unit = '',
}: LineChartProps) {
  if (!data || data.length < 2) {
    return (
      <View style={[styles.empty, { width, height }]}>
        <Text style={styles.emptyText}>Not enough data</Text>
      </View>
    );
  }

  const paddingLeft = 40;
  const paddingRight = 16;
  const paddingTop = 16;
  const paddingBottom = 32;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  const values = data.map((d) => d.value);
  const minVal = yMin ?? Math.min(...values);
  const maxVal = yMax ?? Math.max(...values);
  const range = maxVal - minVal || 1;

  const getX = (i: number) => paddingLeft + (i / (data.length - 1)) * chartWidth;
  const getY = (val: number) => paddingTop + chartHeight - ((val - minVal) / range) * chartHeight;

  // Build SVG path
  let pathD = '';
  let areaD = '';
  data.forEach((d, i) => {
    const x = getX(i);
    const y = getY(d.value);
    if (i === 0) {
      pathD += `M ${x} ${y}`;
      areaD += `M ${x} ${paddingTop + chartHeight} L ${x} ${y}`;
    } else {
      // Smooth curve using cubic bezier
      const prevX = getX(i - 1);
      const prevY = getY(data[i - 1].value);
      const cpX = (prevX + x) / 2;
      pathD += ` C ${cpX} ${prevY}, ${cpX} ${y}, ${x} ${y}`;
      areaD += ` C ${cpX} ${prevY}, ${cpX} ${y}, ${x} ${y}`;
    }
  });

  const lastX = getX(data.length - 1);
  areaD += ` L ${lastX} ${paddingTop + chartHeight} Z`;

  // Y-axis labels
  const yLabels = [minVal, minVal + range / 2, maxVal];
  const gridLines = showGrid ? yLabels : [];

  // X-axis labels (show first, middle, last)
  const xLabelIndices = [0, Math.floor(data.length / 2), data.length - 1];

  return (
    <Svg width={width} height={height}>
      <Defs>
        <LinearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor={color} stopOpacity={0.25} />
          <Stop offset="100%" stopColor={color} stopOpacity={0} />
        </LinearGradient>
      </Defs>

      {/* Grid lines */}
      {gridLines.map((val, i) => {
        const y = getY(val);
        return (
          <React.Fragment key={i}>
            <Line
              x1={paddingLeft}
              y1={y}
              x2={width - paddingRight}
              y2={y}
              stroke={colors.border}
              strokeWidth={1}
              strokeDasharray="4,4"
            />
            <SvgText
              x={paddingLeft - 6}
              y={y + 4}
              textAnchor="end"
              fontSize={fontSize.xs}
              fill={colors.textMuted}
            >
              {Number.isInteger(val) ? val : val.toFixed(1)}
            </SvgText>
          </React.Fragment>
        );
      })}

      {/* Area fill */}
      <Path d={areaD} fill="url(#grad)" />

      {/* Line */}
      <Path d={pathD} stroke={color} strokeWidth={2.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />

      {/* Dots */}
      {showDots &&
        data.map((d, i) => (
          <Circle
            key={i}
            cx={getX(i)}
            cy={getY(d.value)}
            r={4}
            fill={colors.bg}
            stroke={color}
            strokeWidth={2}
          />
        ))}

      {/* X-axis labels */}
      {xLabelIndices.map((i) => {
        if (i >= data.length) return null;
        return (
          <SvgText
            key={i}
            x={getX(i)}
            y={height - 6}
            textAnchor="middle"
            fontSize={fontSize.xs}
            fill={colors.textMuted}
          >
            {data[i].label}
          </SvgText>
        );
      })}
    </Svg>
  );
}

const styles = StyleSheet.create({
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderRadius: 8,
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
  },
});
