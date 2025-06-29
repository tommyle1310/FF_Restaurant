import {
  View,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  ScrollView,
  Dimensions,
} from "react-native";
import React, { useEffect, useState, useMemo } from "react";
import FFSafeAreaView from "@/src/components/FFSafeAreaView";
import { LinearGradient } from "expo-linear-gradient";
import FFText from "@/src/components/FFText";
import IconIonicons from "react-native-vector-icons/Ionicons";
import FFBarChart from "@/src/components/FFBarChart";
import FFLineChart from "@/src/components/FFLineChart";
import FFPieChart from "@/src/components/FFPieChart";
import FFCircularProgressBar from "@/src/components/FFCircularProgressBar";
import { useSelector } from "@/src/store/types";
import { RootState } from "@/src/store/store";
import axiosInstance from "@/src/utils/axiosConfig";
import { Picker } from "@react-native-picker/picker";
import { StackNavigationProp } from "@react-navigation/stack";
import { MainStackParamList } from "@/src/navigation/AppNavigator";
import { spacing } from "@/src/theme";
import { useNavigation } from "@react-navigation/native";
import { colors } from "@/src/theme/colors";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

type TrackHistorySreenNavigationProp = StackNavigationProp<
  MainStackParamList,
  "Statistics"
>;

const months = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

const days = Array.from({ length: 31 }, (_, i) => i + 1);
const years = Array.from(
  { length: 5 },
  (_, i) => new Date().getFullYear() - 2 + i
);

interface StatsData {
  total_orders: number;
  total_revenue: number;
  total_tips: number;
  total_online_hours: number;
  total_delivery_fee: number;
  total_commission: number;
  average_order_value: number;
  order_completion_rate: number;
  revenue_growth_rate: number;
}

interface PeakHoursData {
  hour: number;
  orders: number;
  revenue: number;
  avg_order_value: number;
}

interface PopularItem {
  name: string;
  item_id: string;
  revenue: number;
  quantity: number;
  avg_rating?: number;
  growth_rate?: number;
}

interface RatingSummary {
  average_overall_rating: number;
  review_count: number;
  total_ratings: number;
  rating_distribution: Record<string, number>;
}

interface OrderStatusSummary {
  pending: number;
  rejected: number;
  cancelled: number;
  completed: number;
  delivered: number;
  preparing: number;
  dispatched: number;
  in_progress: number;
  ready_for_pickup: number;
}

interface PerformanceMetrics {
  avg_delivery_time: number;
  avg_preparation_time: number;
  repeat_customer_rate: number;
  peak_efficiency_score: number;
  customer_satisfaction_score: number;
}

interface FinancialBreakdown {
  net_revenue: number;
  gross_revenue: number;
  tips_received: number;
  refunds_issued: number;
  commission_paid: number;
  delivery_fees_earned: number;
  avg_transaction_value: number;
  payment_methods: Record<string, number>;
}

const StatisticsScreen = () => {
  const navigation = useNavigation<TrackHistorySreenNavigationProp>();
  const { restaurant_id } = useSelector((state: RootState) => state.auth);

  const [isLoading, setIsLoading] = useState(false);
  const [startDate, setStartDate] = useState(() => {
    const now = new Date();
    now.setDate(now.getDate() - 7);
    now.setHours(0, 0, 0, 0);
    return now;
  });
  const [endDate, setEndDate] = useState(() => {
    const now = new Date();
    const tomorrow = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + 1
    );
    return tomorrow;
  });

  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [tempStartYear, setTempStartYear] = useState(startDate.getFullYear());
  const [tempStartMonth, setTempStartMonth] = useState(startDate.getMonth());
  const [tempStartDay, setTempStartDay] = useState(startDate.getDate());
  const [tempEndYear, setTempEndYear] = useState(endDate.getFullYear());
  const [tempEndMonth, setTempEndMonth] = useState(endDate.getMonth());
  const [tempEndDay, setTempEndDay] = useState(endDate.getDate());

  // Enhanced state for rich data
  const [statsData, setStatsData] = useState<StatsData>({
    total_orders: 0,
    total_revenue: 0,
    total_tips: 0,
    total_online_hours: 0,
    total_delivery_fee: 0,
    total_commission: 0,
    average_order_value: 0,
    order_completion_rate: 0,
    revenue_growth_rate: 0,
  });
  const [statsRecords, setStatsRecords] = useState<any[]>([]);
  const [peakHoursData, setPeakHoursData] = useState<PeakHoursData[]>([]);
  const [popularItems, setPopularItems] = useState<PopularItem[]>([]);
  const [ratingSummary, setRatingSummary] = useState<RatingSummary>({
    average_overall_rating: 0,
    review_count: 0,
    total_ratings: 0,
    rating_distribution: {},
  });
  const [orderStatusSummary, setOrderStatusSummary] = useState<OrderStatusSummary>({
    pending: 0,
    rejected: 0,
    cancelled: 0,
    completed: 0,
    delivered: 0,
    preparing: 0,
    dispatched: 0,
    in_progress: 0,
    ready_for_pickup: 0,
  });
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics>({
    avg_delivery_time: 0,
    avg_preparation_time: 0,
    repeat_customer_rate: 0,
    peak_efficiency_score: 0,
    customer_satisfaction_score: 0,
  });
  const [financialBreakdown, setFinancialBreakdown] = useState<FinancialBreakdown>({
    net_revenue: 0,
    gross_revenue: 0,
    tips_received: 0,
    refunds_issued: 0,
    commission_paid: 0,
    delivery_fees_earned: 0,
    avg_transaction_value: 0,
    payment_methods: {},
  });

  // Chart states
  const [activeTab, setActiveTab] = useState<"revenue" | "orders" | "efficiency">("revenue");
  const [activeSection, setActiveSection] = useState<"overview" | "analytics" | "performance">("overview");

  // Chart data
  const chartLabels = useMemo(() => {
    return statsRecords.map((record) => {
      const date = new Date(parseInt(record.period_start) * 1000);
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
    });
  }, [statsRecords]);

  const chartData = useMemo(() => {
    return statsRecords.map((record) => {
      switch (activeTab) {
        case "revenue":
          return record.total_revenue || 0;
        case "orders":
          return record.total_orders || 0;
        case "efficiency":
          return record.order_completion_rate || 0;
        default:
          return 0;
      }
    });
  }, [statsRecords, activeTab]);

  // Peak hours chart data
  const peakHoursChartData = useMemo(() => {
    return peakHoursData.map(hour => hour.revenue);
  }, [peakHoursData]);

  const peakHoursLabels = useMemo(() => {
    return peakHoursData.map(hour => `${hour.hour}:00`);
  }, [peakHoursData]);

  useEffect(() => {
    if (restaurant_id) {
      fetchRestaurantStats();
    }
  }, [restaurant_id, startDate, endDate]);

  const fetchRestaurantStats = async () => {
    setIsLoading(true);
    try {
      const startDateStr = startDate.toISOString().split("T")[0];
      const adjustedEndDate = new Date(endDate);
      adjustedEndDate.setDate(adjustedEndDate.getDate() + 1);
      const endDateStr = adjustedEndDate.toISOString().split("T")[0];

      console.log(
        `[Request] /restaurant-stats/${restaurant_id}?start_date=${startDateStr}&end_date=${endDateStr}`
      );

      const res = await axiosInstance.get(
        `/restaurant-stats/${restaurant_id}?start_date=${startDateStr}&end_date=${endDateStr}`
      );
      const { EC, EM, data } = res.data;

      if (EC === 0) {
        console.log("Restaurant stats data:", data);
        setStatsRecords(data);

        // Process aggregated data
        const totalStats = data.reduce(
          (acc: StatsData, record: any) => ({
            total_orders: acc.total_orders + (record.total_orders || 0),
            total_revenue: acc.total_revenue + (record.total_revenue || 0),
            total_tips: acc.total_tips + (record.total_tips || 0),
            total_online_hours: acc.total_online_hours + (record.total_online_hours || 0),
            total_delivery_fee: acc.total_delivery_fee + (record.total_delivery_fee || 0),
            total_commission: acc.total_commission + (record.total_commission || 0),
            average_order_value: record.average_order_value || 0,
            order_completion_rate: record.order_completion_rate || 0,
            revenue_growth_rate: record.revenue_growth_rate || 0,
          }),
          {
            total_orders: 0,
            total_revenue: 0,
            total_tips: 0,
            total_online_hours: 0,
            total_delivery_fee: 0,
            total_commission: 0,
            average_order_value: 0,
            order_completion_rate: 0,
            revenue_growth_rate: 0,
          }
        );

        setStatsData(totalStats);

        // Process peak hours data from the most recent record with data
        const recordWithPeakHours = data.find((record: any) => 
          record.peak_hours_analysis && record.peak_hours_analysis.hourly_distribution
        );
        
        if (recordWithPeakHours?.peak_hours_analysis?.hourly_distribution) {
          const hourlyData = Object.entries(recordWithPeakHours.peak_hours_analysis.hourly_distribution)
            .map(([hour, data]: [string, any]) => ({
              hour: parseInt(hour),
              orders: data.orders || 0,
              revenue: data.revenue || 0,
              avg_order_value: data.avg_order_value || 0,
            }))
            .sort((a, b) => a.hour - b.hour);
          setPeakHoursData(hourlyData);
        }

        // Process popular items
        const allPopularItems = data.flatMap((record: any) => record.popular_items || []);
        const itemMap = new Map<string, PopularItem>();
        
        allPopularItems.forEach((item: any) => {
          const existing = itemMap.get(item.item_id);
          if (existing) {
            existing.revenue += item.revenue || 0;
            existing.quantity += item.quantity || 0;
          } else {
            itemMap.set(item.item_id, { ...item });
          }
        });
        
        setPopularItems(Array.from(itemMap.values()).sort((a, b) => b.revenue - a.revenue).slice(0, 5));

        // Process rating summary from most recent record
        const recordWithRatings = data.find((record: any) => 
          record.rating_summary && record.rating_summary.total_ratings > 0
        );
        if (recordWithRatings?.rating_summary) {
          setRatingSummary(recordWithRatings.rating_summary);
        }

        // Process order status summary
        const recordWithOrderStatus = data.find((record: any) => 
          record.order_status_summary
        );
        if (recordWithOrderStatus?.order_status_summary) {
          setOrderStatusSummary(recordWithOrderStatus.order_status_summary);
        }

        // Process performance metrics
        const recordWithPerformance = data.find((record: any) => 
          record.performance_metrics
        );
        if (recordWithPerformance?.performance_metrics) {
          setPerformanceMetrics(recordWithPerformance.performance_metrics);
        }

        // Process financial breakdown
        const recordWithFinancial = data.find((record: any) => 
          record.financial_breakdown
        );
        if (recordWithFinancial?.financial_breakdown) {
          setFinancialBreakdown(recordWithFinancial.financial_breakdown);
        }

      } else {
        console.error("Error from API:", EM);
        resetAllData();
      }
    } catch (err) {
      console.error("Error fetching restaurant stats:", err);
      resetAllData();
    } finally {
      setIsLoading(false);
    }
  };

  const resetAllData = () => {
    setStatsRecords([]);
    setStatsData({
      total_orders: 0,
      total_revenue: 0,
      total_tips: 0,
      total_online_hours: 0,
      total_delivery_fee: 0,
      total_commission: 0,
      average_order_value: 0,
      order_completion_rate: 0,
      revenue_growth_rate: 0,
    });
    setPeakHoursData([]);
    setPopularItems([]);
    setRatingSummary({
      average_overall_rating: 0,
      review_count: 0,
      total_ratings: 0,
      rating_distribution: {},
    });
    setOrderStatusSummary({
      pending: 0,
      rejected: 0,
      cancelled: 0,
      completed: 0,
      delivered: 0,
      preparing: 0,
      dispatched: 0,
      in_progress: 0,
      ready_for_pickup: 0,
    });
    setPerformanceMetrics({
      avg_delivery_time: 0,
      avg_preparation_time: 0,
      repeat_customer_rate: 0,
      peak_efficiency_score: 0,
      customer_satisfaction_score: 0,
    });
    setFinancialBreakdown({
      net_revenue: 0,
      gross_revenue: 0,
      tips_received: 0,
      refunds_issued: 0,
      commission_paid: 0,
      delivery_fees_earned: 0,
      avg_transaction_value: 0,
      payment_methods: {},
    });
  };

  const handleTabChange = (tab: "revenue" | "orders" | "efficiency") => {
    setActiveTab(tab);
  };

  const onStartDateConfirm = () => {
    const newDate = new Date(tempStartYear, tempStartMonth, tempStartDay);
    if (newDate <= endDate) {
      setStartDate(newDate);
    }
    setShowStartPicker(false);
  };

  const onEndDateConfirm = () => {
    const newDate = new Date(
      tempEndYear,
      tempEndMonth,
      tempEndDay,
      23,
      59,
      59,
      999
    );
    if (newDate >= startDate) {
      setEndDate(newDate);
    }
    setShowEndPicker(false);
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatCurrency = (amount: number): string => {
    return `$${amount.toFixed(2)}`;
  };

  const getGrowthColor = (rate: number): string => {
    if (rate > 0) return colors.success;
    if (rate < 0) return colors.error;
    return colors.textSecondary;
  };

  const getGrowthIcon = (rate: number): string => {
    if (rate > 0) return "trending-up";
    if (rate < 0) return "trending-down";
    return "remove";
  };

  const renderMetricCard = (title: string, value: string | number, subtitle?: string, icon?: string, color?: string) => (
    <View style={[styles.metricCard, { borderLeftColor: color || colors.primary }]}>
      <View style={styles.metricHeader}>
        {icon && (
          <IconIonicons 
            name={icon as any} 
            size={20} 
            color={color || colors.primary} 
            style={styles.metricIcon}
          />
        )}
        <FFText style={styles.metricTitle}>{title}</FFText>
      </View>
      <FFText style={{...styles.metricValue, color: color || colors.primary}}>
        {typeof value === 'number' && title.toLowerCase().includes('revenue') ? formatCurrency(value) : value}
      </FFText>
      {subtitle && (
        <FFText style={styles.metricSubtitle}>{subtitle}</FFText>
      )}
    </View>
  );

  const renderOverviewSection = () => (
    <View style={styles.section}>
      <FFText style={styles.sectionTitle}>Overview</FFText>
      <View style={styles.metricsGrid}>
        {renderMetricCard(
          "Total Revenue",
          statsData.total_revenue,
          `${statsData.revenue_growth_rate > 0 ? '+' : ''}${statsData.revenue_growth_rate.toFixed(1)}% from last period`,
          "cash-outline",
          colors.primary
        )}
        {renderMetricCard(
          "Total Orders",
          statsData.total_orders,
          `${statsData.average_order_value > 0 ? formatCurrency(statsData.average_order_value) : 'N/A'} avg order`,
          "receipt-outline",
          colors.info
        )}
        {renderMetricCard(
          "Completion Rate",
          `${statsData.order_completion_rate.toFixed(1)}%`,
          `${statsData.total_orders} orders processed`,
          "checkmark-circle-outline",
          colors.success
        )}
        {renderMetricCard(
          "Net Revenue",
          financialBreakdown.net_revenue,
          `After ${formatCurrency(financialBreakdown.commission_paid)} commission`,
          "wallet-outline",
          colors.violet
        )}
      </View>
    </View>
  );

  const renderAnalyticsSection = () => (
    <View style={styles.section}>
      <FFText style={styles.sectionTitle}>Analytics</FFText>
      
      {/* Chart Tabs */}
      <View style={styles.chartTabs}>
        <TouchableOpacity
          style={[styles.chartTab, activeTab === "revenue" && styles.activeChartTab]}
          onPress={() => handleTabChange("revenue")}
        >
          <FFText style={activeTab === "revenue" ? styles.activeChartTabText : styles.chartTabText}>
            Revenue
          </FFText>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.chartTab, activeTab === "orders" && styles.activeChartTab]}
          onPress={() => handleTabChange("orders")}
        >
          <FFText style={activeTab === "orders" ? styles.activeChartTabText : styles.chartTabText}>
            Orders
          </FFText>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.chartTab, activeTab === "efficiency" && styles.activeChartTab]}
          onPress={() => handleTabChange("efficiency")}
        >
          <FFText style={activeTab === "efficiency" ? styles.activeChartTabText : styles.chartTabText}>
            Efficiency
          </FFText>
        </TouchableOpacity>
      </View>

      {/* Main Chart */}
      {statsRecords.length > 0 && (
          <FFBarChart 
            data={chartData} 
            labels={chartLabels} 
            unit={activeTab === "revenue" ? "$" : activeTab === "orders" ? "" : "%"}
          />
      )}

      {/* Peak Hours Chart */}
      {peakHoursData.length > 0 && (
        <View style={{...styles.chartContainer, marginTop: spacing.md}}>
          <FFText style={styles.chartTitle}>Peak Hours Revenue</FFText>
          <FFLineChart 
            data={peakHoursChartData} 
            labels={peakHoursLabels} 
            color={colors.primary} 
            unit="$"
          />
        </View>
      )}

      {/* Order Status Pie Chart */}
      {Object.values(orderStatusSummary).some(count => count > 0) && (
        <View style={styles.chartContainer}>
          <FFText style={styles.chartTitle}>Order Status Distribution</FFText>
          <FFPieChart
            data={Object.entries(orderStatusSummary)
              .filter(([_, count]) => count > 0)
              .map(([status, count], index) => ({
                label: status.replace('_', ' ').toUpperCase(),
                value: count,
                color: [
                  colors.primary, 
                  colors.info, 
                  colors.success, 
                  colors.warning, 
                  colors.error, 
                  colors.violet,
                  colors.grey,
                  colors.textSecondary
                ][index % 8]
              }))}
            size={250}
            showLabels={true}
            showValues={true}
          />
        </View>
      )}
    </View>
  );

  const renderPerformanceSection = () => (
    <View style={styles.section}>
      <FFText style={styles.sectionTitle}>Performance</FFText>
      
      {/* Performance Metrics */}
      <View style={styles.performanceGrid}>
        {/* <View style={styles.performanceCard}>
          <FFCircularProgressBar
            label="Customer Satisfaction"
            initialProgress={performanceMetrics.customer_satisfaction_score}
            size="small"
            progressFill={colors.success}
          />
        </View>
        <View style={styles.performanceCard}>
          <FFCircularProgressBar
            label="Repeat Customers"
            initialProgress={performanceMetrics.repeat_customer_rate}
            size="small"
            progressFill={colors.info}
          />
        </View> */}
        <View style={styles.performanceCard}>
          <FFCircularProgressBar
            label="Efficiency Score"
            initialProgress={performanceMetrics.peak_efficiency_score * 100}
            size="small"
            progressFill={colors.violet}
          />
        </View>
      </View>

      {/* Order Status Summary */}
      <View style={styles.statusContainer}>
        <FFText style={styles.statusTitle}>Order Status</FFText>
        <View style={styles.statusGrid}>
          {Object.entries(orderStatusSummary).map(([status, count]) => (
            count > 0 && (
              <View key={status} style={styles.statusItem}>
                <FFText style={styles.statusCount}>{count}</FFText>
                <FFText style={styles.statusLabel}>{status.replace('_', ' ')}</FFText>
              </View>
            )
          ))}
        </View>
      </View>

      {/* Popular Items */}
      {popularItems.length > 0 && (
        <View style={styles.popularItemsContainer}>
          <FFText style={styles.popularItemsTitle}>Popular Items</FFText>
          {popularItems.map((item, index) => (
            <View key={item.item_id} style={styles.popularItem}>
              <View style={styles.popularItemInfo}>
                <FFText style={styles.popularItemName}>{item.name}</FFText>
                <FFText style={styles.popularItemDetails}>
                  {item.quantity} orders • {formatCurrency(item.revenue)}
                </FFText>
              </View>
              <View style={styles.popularItemRank}>
                <FFText style={styles.rankNumber}>#{index + 1}</FFText>
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );

  return (
    <FFSafeAreaView>
      <ScrollView style={styles.container}>
        {/* Header */}
        <LinearGradient
          colors={[colors.primary, colors.green_soft]}
          start={[0, 0]}
          end={[1, 0]}
          style={styles.headerGradient}
        >
          <View style={styles.headerContent}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <IconIonicons name="chevron-back" color={colors.white} size={24} />
            </TouchableOpacity>
            
            <View style={styles.headerInfo}>
              <FFText style={styles.headerTitle}>Restaurant Analytics</FFText>
              <View style={styles.dateRange}>
                <TouchableOpacity onPress={() => setShowStartPicker(true)}>
                  <FFText style={styles.dateText}>{formatDate(startDate)}</FFText>
                </TouchableOpacity>
                <FFText style={styles.dateSeparator}>-</FFText>
                <TouchableOpacity onPress={() => setShowEndPicker(true)}>
                  <FFText style={styles.dateText}>{formatDate(endDate)}</FFText>
                </TouchableOpacity>
              </View>
              <FFText style={styles.totalRevenue}>
                {formatCurrency(statsData.total_revenue)}
              </FFText>
            </View>
          </View>
        </LinearGradient>

        {/* Section Navigation */}
        <View style={styles.sectionNav}>
          <TouchableOpacity
            style={[styles.sectionTab, activeSection === "overview" && styles.activeSectionTab]}
            onPress={() => setActiveSection("overview")}
          >
            <FFText fontSize="sm" style={activeSection === "overview" ? styles.activeSectionTabText : styles.sectionTabText}>
              Overview
            </FFText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.sectionTab, activeSection === "analytics" && styles.activeSectionTab]}
            onPress={() => setActiveSection("analytics")}
          >
            <FFText fontSize="sm" style={activeSection === "analytics" ? styles.activeSectionTabText : styles.sectionTabText}>
              Analytics
            </FFText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.sectionTab, activeSection === "performance" && styles.activeSectionTab]}
            onPress={() => setActiveSection("performance")}
          >
            <FFText fontSize="sm" style={activeSection === "performance" ? styles.activeSectionTabText : styles.sectionTabText}>
              Performance
            </FFText>
          </TouchableOpacity>
        </View>

        {/* Loading Indicator */}
        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <FFText style={styles.loadingText}>Loading analytics...</FFText>
          </View>
        )}

        {/* No Data Message */}
        {!isLoading && statsRecords.length === 0 && (
          <View style={styles.noDataContainer}>
            <IconIonicons name="analytics-outline" size={64} color={colors.grey} />
            <FFText style={styles.noDataText}>No statistics available for the selected period.</FFText>
          </View>
        )}

        {/* Content Sections */}
        {!isLoading && statsRecords.length > 0 && (
          <>
            {activeSection === "overview" && renderOverviewSection()}
            {activeSection === "analytics" && renderAnalyticsSection()}
            {activeSection === "performance" && renderPerformanceSection()}
          </>
        )}

        {/* Date Pickers */}
        <Modal visible={showStartPicker} transparent animationType="slide">
          <View style={styles.modalContainer}>
            <View style={styles.pickerContainer}>
              <FFText style={styles.modalTitle}>Select Start Date</FFText>
              <View style={styles.pickerRow}>
                <Picker
                  selectedValue={tempStartYear}
                  onValueChange={(itemValue) => setTempStartYear(itemValue)}
                  style={styles.picker}
                >
                  {years.map((year) => (
                    <Picker.Item key={year} label={`${year}`} value={year} />
                  ))}
                </Picker>
                <Picker
                  selectedValue={tempStartMonth}
                  onValueChange={(itemValue) => setTempStartMonth(itemValue)}
                  style={styles.picker}
                >
                  {months.map((month, index) => (
                    <Picker.Item key={index} label={month} value={index} />
                  ))}
                </Picker>
                <Picker
                  selectedValue={tempStartDay}
                  onValueChange={(itemValue) => setTempStartDay(itemValue)}
                  style={styles.picker}
                >
                  {days.map((day) => (
                    <Picker.Item key={day} label={`${day}`} value={day} />
                  ))}
                </Picker>
              </View>
              <View style={styles.buttonRow}>
                <TouchableOpacity
                  onPress={() => setShowStartPicker(false)}
                  style={styles.cancelButton}
                >
                  <FFText>Cancel</FFText>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={onStartDateConfirm}
                  style={styles.confirmButton}
                >
                  <FFText style={{ color: colors.white }}>Confirm</FFText>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        <Modal visible={showEndPicker} transparent animationType="slide">
          <View style={styles.modalContainer}>
            <View style={styles.pickerContainer}>
              <FFText style={styles.modalTitle}>Select End Date</FFText>
              <View style={styles.pickerRow}>
                <Picker
                  selectedValue={tempEndYear}
                  onValueChange={(itemValue) => setTempEndYear(itemValue)}
                  style={styles.picker}
                >
                  {years.map((year) => (
                    <Picker.Item key={year} label={`${year}`} value={year} />
                  ))}
                </Picker>
                <Picker
                  selectedValue={tempEndMonth}
                  onValueChange={(itemValue) => setTempEndMonth(itemValue)}
                  style={styles.picker}
                >
                  {months.map((month, index) => (
                    <Picker.Item key={index} label={month} value={index} />
                  ))}
                </Picker>
                <Picker
                  selectedValue={tempEndDay}
                  onValueChange={(itemValue) => setTempEndDay(itemValue)}
                  style={styles.picker}
                >
                  {days.map((day) => (
                    <Picker.Item key={day} label={`${day}`} value={day} />
                  ))}
                </Picker>
              </View>
              <View style={styles.buttonRow}>
                <TouchableOpacity
                  onPress={() => setShowEndPicker(false)}
                  style={styles.cancelButton}
                >
                  <FFText>Cancel</FFText>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={onEndDateConfirm}
                  style={styles.confirmButton}
                >
                  <FFText style={{ color: colors.white }}>Confirm</FFText>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </ScrollView>
    </FFSafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundSecondary,
  },
  headerGradient: {
    paddingHorizontal: 16,
    paddingVertical: 24,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  headerContent: {
    position: "relative",
    alignItems: "center",
  },
  backButton: {
    position: "absolute",
    left: 0,
    top: 0,
    zIndex: 1,
  },
  headerInfo: {
    alignItems: "center",
    marginTop: 16,
  },
  headerTitle: {
    color: colors.white,
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 8,
  },
  dateRange: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  dateText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: "500",
  },
  dateSeparator: {
    color: colors.white,
    fontSize: 14,
    marginHorizontal: 8,
  },
  totalRevenue: {
    color: colors.white,
    fontSize: 32,
    fontWeight: "bold",
  },
  sectionNav: {
    flexDirection: "row",
    backgroundColor: colors.white,
    marginHorizontal: 16,
    marginTop: -16,
    borderRadius: 12,
    padding: 4,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  sectionTab: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  activeSectionTab: {
    backgroundColor: colors.primary,
  },
  sectionTabText: {
    color: colors.textSecondary,
    fontWeight: "500",
  },
  activeSectionTabText: {
    color: colors.white,
    fontWeight: "bold",
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: colors.text,
    marginBottom: 16,
  },
  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  metricCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    flex: 1,
    minWidth: (SCREEN_WIDTH - 44) / 2,
    borderLeftWidth: 4,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  metricHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  metricIcon: {
    marginRight: 8,
  },
  metricTitle: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: "500",
  },
  metricValue: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 4,
  },
  metricSubtitle: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  chartTabs: {
    flexDirection: "row",
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  chartTab: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  activeChartTab: {
    backgroundColor: colors.primary,
  },
  chartTabText: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.textSecondary,
  },
  activeChartTabText: {
    color: colors.white,
    fontWeight: "bold",
  },
  chartContainer: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: colors.text,
    marginBottom: 12,
  },
  performanceGrid: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 24,
    flexWrap: "wrap",
    gap: 12,
  },
  performanceCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    minWidth: 100,
    flex: 1,
  },
  statusContainer: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: colors.text,
    marginBottom: 12,
  },
  statusGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  statusItem: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 8,
    padding: 8,
    alignItems: "center",
    minWidth: 70,
    flex: 1,
  },
  statusCount: {
    fontSize: 16,
    fontWeight: "bold",
    color: colors.primary,
  },
  statusLabel: {
    fontSize: 10,
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: 2,
  },
  popularItemsContainer: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: spacing.veryLarge,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  popularItemsTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: colors.text,
    marginBottom: 12,
  },
  popularItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  popularItemInfo: {
    flex: 1,
  },
  popularItemName: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.text,
    marginBottom: 4,
  },
  popularItemDetails: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  popularItemRank: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  rankNumber: {
    color: colors.white,
    fontSize: 12,
    fontWeight: "bold",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 60,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.textSecondary,
  },
  noDataContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 60,
  },
  noDataText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: "center",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  pickerContainer: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 24,
    width: "90%",
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
    color: colors.text,
  },
  pickerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  picker: {
    width: "33%",
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginTop: 24,
  },
  cancelButton: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: colors.backgroundSecondary,
  },
  confirmButton: {
    padding: 12,
    backgroundColor: colors.primary,
    borderRadius: 8,
  },
});

export default StatisticsScreen;
