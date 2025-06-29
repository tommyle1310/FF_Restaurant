import React from "react";
import { View, StyleSheet, Text } from "react-native";
import { useTheme } from "../hooks/useTheme";
import Svg, { G, Path, Text as SvgText } from "react-native-svg";

interface PieChartData {
  label: string;
  value: number;
  color: string;
}

interface FFPieChartProps {
  data: PieChartData[];
  size?: number;
  showLabels?: boolean;
  showValues?: boolean;
}

const FFPieChart: React.FC<FFPieChartProps> = ({
  data,
  size = 200,
  showLabels = true,
  showValues = true,
}) => {
  const { theme } = useTheme();
  const currentTheme = {
    light: { background: "#ffffff", text: "#000000" },
    dark: { background: "#1a1a1a", text: "#ffffff" },
  }[theme as "light" | "dark"];

  const radius = size / 2;
  const centerX = size / 2;
  const centerY = size / 2;

  // Filter out zero values but keep all non-zero values
  const validData = data.filter(item => item.value > 0);
  const total = validData.reduce((sum, item) => sum + item.value, 0);

  if (total === 0 || validData.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={[styles.emptyText, { color: currentTheme.text }]}>
          No data available
        </Text>
      </View>
    );
  }

  let currentAngle = -90; // Start from top

  const createArc = (startAngle: number, endAngle: number, radius: number) => {
    const startRad = (startAngle * Math.PI) / 180;
    const endRad = (endAngle * Math.PI) / 180;

    const x1 = centerX + radius * Math.cos(startRad);
    const y1 = centerY + radius * Math.sin(startRad);
    const x2 = centerX + radius * Math.cos(endRad);
    const y2 = centerY + radius * Math.sin(endRad);

    const largeArcFlag = endAngle - startAngle <= 180 ? 0 : 1;

    return `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} L ${centerX} ${centerY} Z`;
  };

  const createLabelPosition = (angle: number, radius: number) => {
    const rad = (angle * Math.PI) / 180;
    const labelRadius = radius * 0.7;
    return {
      x: centerX + labelRadius * Math.cos(rad),
      y: centerY + labelRadius * Math.sin(rad),
    };
  };

  return (
    <View style={styles.container}>
      <Svg width={size} height={size}>
        <G>
          {validData.map((item, index) => {
            const percentage = (item.value / total) * 100;
            const angle = (percentage / 100) * 360;
            const startAngle = currentAngle;
            const endAngle = currentAngle + angle;

            const path = createArc(startAngle, endAngle, radius);
            const labelPos = createLabelPosition(startAngle + angle / 2, radius);

            currentAngle += angle;

            return (
              <G key={index}>
                <Path d={path} fill={item.color} />
                {showLabels && percentage > 3 && (
                  <SvgText
                    x={labelPos.x}
                    y={labelPos.y}
                    fontSize="11"
                    fill={currentTheme.text}
                    textAnchor="middle"
                    alignmentBaseline="middle"
                  >
                    {item.label}
                  </SvgText>
                )}
                {showValues && percentage > 5 && (
                  <SvgText
                    x={labelPos.x}
                    y={labelPos.y + 15}
                    fontSize="10"
                    fill={currentTheme.text}
                    textAnchor="middle"
                    alignmentBaseline="middle"
                  >
                    {percentage.toFixed(1)}%
                  </SvgText>
                )}
              </G>
            );
          })}
        </G>
      </Svg>

      {/* Legend */}
      {showLabels && (
        <View style={styles.legend}>
          {validData.map((item, index) => (
            <View key={index} style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: item.color }]} />
              <Text style={[styles.legendText, { color: currentTheme.text }]}>
                {item.label} ({item.value})
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
  emptyContainer: {
    height: 200,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    fontSize: 14,
    color: "#999",
  },
  legend: {
    marginTop: 16,
    width: "100%",
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  legendColor: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 8,
  },
  legendText: {
    fontSize: 12,
  },
});

export default FFPieChart; 