import React from "react";
import { View, StyleSheet, Dimensions, Text, ScrollView } from "react-native";
import { useTheme } from "../hooks/useTheme";
import FFButton from "./FFButton";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CHART_HEIGHT = 200;
const BAR_WIDTH = 12;
const BAR_SPACING = 25;
const Y_AXIS_WIDTH = 50;
const PADDING_TOP = 20;
const PADDING_BOTTOM = 30;
const LABEL_HEIGHT = 20;

interface FFBarChartProps {
  data: number[];
  labels?: string[];
  unit?: string;
}

const FFBarChart: React.FC<FFBarChartProps> = ({
  data,
  labels = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"],
  unit = "",
}) => {
  const { theme } = useTheme();
  const currentTheme = {
    light: { background: "#ffffff", text: "#000000", barColor: "#4CAF50" },
    dark: { background: "#1a1a1a", text: "#ffffff", barColor: "#8BC34A" },
  }[theme as "light" | "dark"];

  // Ensure data and labels match
  const validData = data.slice(0, labels.length);
  const validLabels = labels.slice(0, data.length);

  // Calculate max value for scaling
  const maxValue = Math.max(...validData, 1);

  // Calculate Y-axis values
  const yAxisValues = [
    maxValue,
    maxValue * 0.75,
    maxValue * 0.5,
    maxValue * 0.25,
    0,
  ];

  // Calculate chart dimensions
  const chartAreaHeight = CHART_HEIGHT - PADDING_TOP - PADDING_BOTTOM - LABEL_HEIGHT;
  const totalBarWidth = validData.length * (BAR_WIDTH + BAR_SPACING) - BAR_SPACING;
  const chartWidth = Math.max(totalBarWidth + 40, SCREEN_WIDTH - 100);

  // Calculate y-position for a given value
  const getBarHeight = (value: number): number => {
    if (value === 0) return 2; // Minimum height for visibility
    return (value / maxValue) * chartAreaHeight;
  };

  return (
    <View
      style={[
        styles.wrapper,
        { backgroundColor: currentTheme.background }
      ]}
    >
      <View style={styles.container}>
        {/* Y-axis */}
        <View style={[styles.yAxis, { height: CHART_HEIGHT - LABEL_HEIGHT }]}>
          {yAxisValues.map((value, index) => (
            <Text
              key={index}
              style={[styles.yLabel, { color: currentTheme.text }]}
              numberOfLines={1}
            >
              {value.toFixed(0)} {unit}
            </Text>
          ))}
        </View>

        {/* Scrollable chart area */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={[styles.chartArea, { width: chartWidth }]}>
            {/* Grid lines */}
            {yAxisValues.map((value, index) => (
              <View
                key={`grid-${index}`}
                style={[
                  styles.gridLine,
                  {
                    bottom: (value / maxValue) * chartAreaHeight + LABEL_HEIGHT,
                    width: chartWidth - Y_AXIS_WIDTH,
                  }
                ]}
              />
            ))}

            {/* Bars and labels */}
            <View style={[styles.chartContainer, { height: chartAreaHeight }]}>
              {validData.map((value, index) => (
                <View key={index} style={styles.barWrapper}>
                  <View
                    style={[
                      styles.bar,
                      {
                        height: getBarHeight(value) ,
                        backgroundColor: currentTheme.barColor,
                        width: BAR_WIDTH,
                      },
                    ]}
                  />
                  <Text 
                    style={[
                      styles.xLabel, 
                      { 
                        color: currentTheme.text,
                        position: 'absolute',
                        bottom: -LABEL_HEIGHT - 10,
                      }
                    ]}
                  >
                    {validLabels[index]}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </ScrollView>
      </View>
      <View className="w-full">
        <FFButton className="w-full">View Details</FFButton>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: 12,
    gap: 16,
    elevation: 3,
    justifyContent: "center",
    width: "100%",
    padding: 16,
    paddingTop: 32,
  },
  container: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  yAxis: {
    justifyContent: "space-between",
    width: Y_AXIS_WIDTH,
    marginRight: 15,
  },
  yLabel: {
    fontSize: 12,
    textAlign: "right",
    width: Y_AXIS_WIDTH,
  },
  scrollContent: {
    flexGrow: 1,
  },
  chartArea: {
    position: 'relative',
    height: CHART_HEIGHT,
  },
  gridLine: {
    position: 'absolute',
    height: 1,
    backgroundColor: '#E0E0E0',
    left: Y_AXIS_WIDTH,
  },
  chartContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingRight: 20,
    position: 'absolute',
    bottom: LABEL_HEIGHT + 5,
    left: Y_AXIS_WIDTH,
    right: 0,
  },
  barWrapper: {
    alignItems: "center",
    marginHorizontal: BAR_SPACING / 2,
    position: 'relative',
  },
  bar: {
    borderRadius: 6,
  },
  xLabel: {
    fontSize: 12,
    textAlign: "center",
    width: BAR_WIDTH + BAR_SPACING,
  },
});

export default FFBarChart;
