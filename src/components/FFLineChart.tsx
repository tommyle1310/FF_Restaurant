import React from "react";
import { View, StyleSheet, Dimensions, Text, ScrollView } from "react-native";
import { useTheme } from "../hooks/useTheme";
import Svg, { Line, Circle, G, Text as SvgText, Path } from "react-native-svg";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CHART_HEIGHT = 200;
const Y_AXIS_WIDTH = 40;
const PADDING_TOP = 20;
const PADDING_BOTTOM = 30; // Increased to ensure space for x-axis labels
const MIN_POINT_SPACING = 50;

interface FFLineChartProps {
  data: number[];
  labels?: string[];
  color?: string;
  showPoints?: boolean;
  fillArea?: boolean;
  unit?: string;
}

const FFLineChart: React.FC<FFLineChartProps> = ({
  data,
  labels = [],
  color = "#4CAF50",
  showPoints = true,
  fillArea = false,
  unit = "",
}) => {
  const { theme } = useTheme();
  const currentTheme = {
    light: { background: "#ffffff", text: "#000000" },
    dark: { background: "#1a1a1a", text: "#ffffff" },
  }[theme as "light" | "dark"];

  const validData = data.slice(0, labels.length);
  const validLabels = labels.slice(0, data.length);

  if (validData.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={[styles.emptyText, { color: currentTheme.text }]}>
          No data available
        </Text>
      </View>
    );
  }

  // Calculate chart dimensions
  const availableWidth = SCREEN_WIDTH - 80 - Y_AXIS_WIDTH;
  const pointSpacing = Math.max(MIN_POINT_SPACING, availableWidth / (validData.length - 1 || 1));
  const chartWidth = pointSpacing * (validData.length - 1);
  const chartAreaHeight = CHART_HEIGHT - PADDING_TOP - PADDING_BOTTOM;

  // Calculate value range and scale
  const maxValue = Math.max(...validData, 1);
  const yAxisStep = maxValue / 4;
  const yAxisValues = Array.from({ length: 5 }, (_, i) => maxValue - (i * yAxisStep));

  // Calculate y-position for a given value
  const getYPosition = (value: number): number => {
    if (value === 0) return CHART_HEIGHT - PADDING_BOTTOM - 10; // Exact position for zero
    const yRatio = value / maxValue;
    return CHART_HEIGHT - PADDING_BOTTOM - (yRatio * chartAreaHeight);
  };

  // Generate points with correct positioning
  const chartPoints = validData.map((value, index) => ({
    x: index * pointSpacing + Y_AXIS_WIDTH,
    y: getYPosition(value),
    value
  }));

  // Create line path
  const linePath = chartPoints.length > 1 
    ? chartPoints.map((point, index) => 
        `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`
      ).join(' ')
    : '';

  // Create fill path
  const fillPath = fillArea && chartPoints.length > 1
    ? `${linePath} L ${chartPoints[chartPoints.length - 1].x} ${CHART_HEIGHT - PADDING_BOTTOM} L ${chartPoints[0].x} ${CHART_HEIGHT - PADDING_BOTTOM} Z`
    : '';

  return (
    <View style={[styles.container, { backgroundColor: currentTheme.background }]}>
      <View style={styles.chartWrapper}>
        {/* Y-axis */}
        <View style={styles.yAxis}>
          {yAxisValues.map((value, index) => (
            <Text
              key={index}
              style={[
                styles.yLabel,
                { color: currentTheme.text }
              ]}
              numberOfLines={1}
            >
              {unit}{Math.round(value)}
            </Text>
          ))}
        </View>

        {/* Chart */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <Svg width={chartWidth + Y_AXIS_WIDTH} height={CHART_HEIGHT}>
            {/* Grid lines */}
            {yAxisValues.map((value, index) => (
              <Line
                key={`grid-${index}`}
                x1={Y_AXIS_WIDTH}
                y1={getYPosition(value)}
                x2={chartWidth + Y_AXIS_WIDTH}
                y2={getYPosition(value)}
                stroke="#E0E0E0"
                strokeWidth={1}
                strokeDasharray="5,5"
              />
            ))}

            {/* Fill area */}
            {fillArea && fillPath && (
              <Path
                d={fillPath}
                fill={color}
                fillOpacity={0.1}
              />
            )}

            {/* Line */}
            {linePath && (
              <Path
                d={linePath}
                stroke={color}
                strokeWidth={3}
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            )}

            {/* Points */}
            {showPoints && chartPoints.map((point, index) => (
              <Circle
                key={`point-${index}`}
                cx={point.x}
                cy={point.y}
                r={6}
                fill={color}
                stroke={currentTheme.background}
                strokeWidth={2}
              />
            ))}

            {/* X-axis labels */}
            {validLabels.map((label, index) => {
              const x = index * pointSpacing + Y_AXIS_WIDTH;
              return (
                <SvgText
                  key={`label-${index}`}
                  x={x}
                  y={CHART_HEIGHT - 10}
                  fontSize="12"
                  fill={currentTheme.text}
                  textAnchor="middle"
                >
                  {label}
                </SvgText>
              );
            })}
          </Svg>
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  chartWrapper: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  yAxis: {
    height: CHART_HEIGHT - PADDING_BOTTOM,
    width: Y_AXIS_WIDTH,
    marginRight: 0,
    justifyContent: "space-between",
    position: 'absolute',
    left: 16, // Align with container padding
  },
  yLabel: {
    fontSize: 12,
    textAlign: "right",
    width: Y_AXIS_WIDTH - 8,
    height: 20,
  },
  scrollContent: {
    flexGrow: 1,
    paddingLeft: Y_AXIS_WIDTH, // Make space for y-axis
  },
  emptyContainer: {
    height: CHART_HEIGHT,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    fontSize: 14,
    color: "#999",
  },
});

export default FFLineChart; 