import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import React, { useEffect, useState, useMemo } from "react";
import FFView from "@/src/components/FFView";
import FFSafeAreaView from "@/src/components/FFSafeAreaView";
import { LinearGradient } from "expo-linear-gradient";
import FFText from "@/src/components/FFText";
import IconIonicons from "react-native-vector-icons/Ionicons";
import FFBarChart from "@/src/components/FFBarChart";
import { useSelector } from "@/src/store/types";
import { RootState } from "@/src/store/store";
import axiosInstance from "@/src/utils/axiosConfig";
import { Picker } from "@react-native-picker/picker";
import { StackNavigationProp } from "@react-navigation/stack";
import { MainStackParamList } from "@/src/navigation/AppNavigator";
import { spacing } from "@/src/theme";
import { useNavigation } from "@react-navigation/native";

type TrackHistorySreenNavigationProp = StackNavigationProp<
  MainStackParamList,
  "Statistics"
>;

const months = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const days = Array.from({ length: 31 }, (_, i) => i + 1);
const years = Array.from(
  { length: 5 },
  (_, i) => new Date().getFullYear() - 2 + i
); // Từ 2 năm trước đến 2 năm sau

interface StatsData {
  total_orders: number;
  total_revenue: number;
  total_tips: number;
  total_online_hours: number;
}

const StatisticsScreen = () => {
  const navigation = useNavigation<TrackHistorySreenNavigationProp>();
  const { restaurant_id } = useSelector((state: RootState) => state.auth);

  const [isLoading, setIsLoading] = useState(false);
  const [startDate, setStartDate] = useState(() => {
    const now = new Date();
    now.setDate(now.getDate() - 7); // 7 ngày trước
    now.setHours(0, 0, 0, 0);
    return now;
  });
  const [endDate, setEndDate] = useState(() => {
    const now = new Date();
    now.setHours(23, 59, 59, 999);
    return now;
  });
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [tempStartYear, setTempStartYear] = useState(startDate.getFullYear());
  const [tempStartMonth, setTempStartMonth] = useState(startDate.getMonth());
  const [tempStartDay, setTempStartDay] = useState(startDate.getDate());
  const [tempEndYear, setTempEndYear] = useState(endDate.getFullYear());
  const [tempEndMonth, setTempEndMonth] = useState(endDate.getMonth());
  const [tempEndDay, setTempEndDay] = useState(endDate.getDate());

  // State cho dữ liệu từ API
  const [statsData, setStatsData] = useState<StatsData>({
    total_orders: 0,
    total_revenue: 0,
    total_tips: 0,
    total_online_hours: 0,
  });
  const [statsRecords, setStatsRecords] = useState<any[]>([]);

  // State cho tab và dữ liệu chart
  const [activeTab, setActiveTab] = useState<"revenue" | "tips" | "hours">(
    "revenue"
  );

  // Lưu trữ nhãn và dữ liệu chart
  const chartLabels = useMemo(() => {
    return statsRecords.map((record) => {
      const date = new Date(parseInt(record.period_start) * 1000);
      return date.toLocaleDateString("en-VN", {
        month: "numeric",
        day: "numeric",
      });
    });
  }, [statsRecords]);

  const chartData = useMemo(() => {
    return statsRecords.map((record) => {
      switch (activeTab) {
        case "revenue":
          return record.total_revenue || 0;
        case "tips":
          return record.total_tips || 0;
        case "hours":
          return record.total_online_hours || 0;
        default:
          return 0;
      }
    });
  }, [statsRecords, activeTab]);


  useEffect(() => {
    if (restaurant_id) {
      fetchRestaurantStats();
    }
  }, [restaurant_id, startDate, endDate]);
 

  const fetchRestaurantStats = async () => {
    setIsLoading(true);
    try {
      const startDateStr = startDate.toISOString().split("T")[0];
      const endDateStr = endDate.toISOString().split("T")[0];
      console.log(
        `[Request] /restaurant-stats/${restaurant_id}?start_date=${startDateStr}&end_date=${endDateStr}&force_refresh=true`
      );
      const res = await axiosInstance.get(
        `/restaurant-stats/${restaurant_id}?start_date=${startDateStr}&end_date=${endDateStr}&force_refresh=true`
      );
      const { EC, EM, data } = res.data;
      if (EC === 0) {
        console.log("Restaurant stats data:", data);
        setStatsRecords(data);

        // Tính tổng các chỉ số
        const totalStats = data.reduce(
          (acc: StatsData, record: any) => ({
            total_orders: acc.total_orders + (record.total_orders || 0),
            total_revenue: acc.total_revenue + (record.total_revenue || 0),
            total_tips: acc.total_tips + (record.total_tips || 0),
            total_online_hours:
              acc.total_online_hours + (record.total_online_hours || 0),
          }),
          {
            total_orders: 0,
            total_revenue: 0,
            total_tips: 0,
            total_online_hours: 0,
          }
        );

        setStatsData(totalStats);
      } else {
        console.error("Error from API:", EM);
        setStatsRecords([]);
        setStatsData({
          total_orders: 0,
          total_revenue: 0,
          total_tips: 0,
          total_online_hours: 0,
        });
      }
    } catch (err) {
      console.error("Error fetching restaurant stats:", err);
      setStatsRecords([]);
      setStatsData({
        total_orders: 0,
        total_revenue: 0,
        total_tips: 0,
        total_online_hours: 0,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTabChange = (tab: "revenue" | "tips" | "hours") => {
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


  return (
    <FFSafeAreaView>
     <ScrollView>
     <LinearGradient
        colors={["#63c550", "#a3d98f"]}
        start={[0, 0]}
        end={[1, 0]}
        style={styles.headerGradient}
      >
        <View
          style={{
            paddingHorizontal: 16,
            paddingTop: 16,
            alignItems: "center",
            position: "relative",
          }}
        >
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <IconIonicons name="chevron-back" color={"#fff"} size={24} />
          </TouchableOpacity>
        </View>
        <View
          style={{
            alignItems: "center",
            justifyContent: "center",
            gap: spacing.sm,
          }}
        >
          <FFText style={styles.headerText}>Restaurant Statistics</FFText>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <TouchableOpacity onPress={() => setShowStartPicker(true)}>
              <FFText fontSize="sm" fontWeight="500" style={{ color: "#fff" }}>
                {formatDate(startDate)}
              </FFText>
            </TouchableOpacity>
            <FFText fontSize="sm" style={{ color: "#fff" }}>
              -
            </FFText>
            <TouchableOpacity onPress={() => setShowEndPicker(true)}>
              <FFText fontSize="sm" fontWeight="500" style={{ color: "#fff" }}>
                {formatDate(endDate)}
              </FFText>
            </TouchableOpacity>
          </View>
          <FFText fontWeight="700" fontSize="lg" style={{ color: "#fff" }}>
            ${statsData.total_revenue.toFixed(2)}
          </FFText>
        </View>
      </LinearGradient>

      {/* Summary Cards */}
      <View
        style={{ marginTop: -32, padding: 16, flexDirection: "row", gap: 12 }}
      >
        <View style={styles.summaryCard}>
          <FFText>Orders</FFText>
          <FFText fontSize="lg" fontWeight="800" style={{ color: "#4d9c39" }}>
            {statsData.total_orders}
          </FFText>
        </View>
        <View style={styles.summaryCard}>
          <FFText>Revenue</FFText>
          <FFText fontSize="lg" fontWeight="800" style={{ color: "#4d9c39" }}>
            ${statsData.total_revenue.toFixed(2)}
          </FFText>
        </View>
      </View>

      {/* Loading Indicator */}
      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#63c550" />
        </View>
      )}

      {/* No Data Message */}
      {!isLoading && statsRecords.length === 0 && (
        <View style={styles.noDataContainer}>
          <FFText>No statistics available for the selected period.</FFText>
        </View>
      )}

      {/* Start Date Picker Modal */}
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
                <FFText style={{ color: "#fff" }}>Confirm</FFText>
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
                <FFText style={{ color: "#fff" }}>Confirm</FFText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      {/* Tabs */}
      {statsRecords.length > 0 && (
        <>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-around",
              marginVertical: 16,
            }}
          >
            <TouchableOpacity
              style={[styles.tab, activeTab === "revenue" && styles.activeTab]}
              onPress={() => handleTabChange("revenue")}
            >
              <FFText
                style={
                  activeTab === "revenue"
                    ? styles.activeTabText
                    : styles.tabText
                }
              >
                Revenue
              </FFText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === "tips" && styles.activeTab]}
              onPress={() => handleTabChange("tips")}
            >
              <FFText
                style={
                  activeTab === "tips" ? styles.activeTabText : styles.tabText
                }
              >
                Tips
              </FFText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === "hours" && styles.activeTab]}
              onPress={() => handleTabChange("hours")}
            >
              <FFText
                style={
                  activeTab === "hours" ? styles.activeTabText : styles.tabText
                }
              >
                Hours
              </FFText>
            </TouchableOpacity>
          </View>

          {/* Chart */}
          <FFBarChart data={chartData} labels={chartLabels} />
        </>
      )}

      {/* Popular Items */}
      {statsRecords.length > 0 && (
        <View style={{ padding: 16 }}>
          <FFText style={{ fontSize: 18, fontWeight: "bold", marginBottom: 8 }}>
            Popular Items
          </FFText>
          {statsRecords.map((record, index) =>
            record.popular_items.map((item: any, itemIndex: number) => (
              <View key={`${index}-${itemIndex}`} style={styles.itemContainer}>
                <FFText>{item.name}</FFText>
                <FFText>
                  Qty: {item.quantity} | ${item.revenue.toFixed(2)}
                </FFText>
              </View>
            ))
          )}
        </View>
      )}
     </ScrollView>
    </FFSafeAreaView>
  );
};

const styles = StyleSheet.create({
  headerGradient: {
    paddingHorizontal: 12,
    paddingVertical: 24,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    height: 160,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 5,
  },
  backButton: {
    position: "absolute",
    left: 16,
    top: 16,
  },
  headerText: {
    color: "#fff",
    fontSize: 24,
  },
  summaryCard: {
    elevation: 3,
    padding: 16,
    alignItems: "center",
    borderRadius: 8,
    backgroundColor: "#fff",
    flex: 1,
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  pickerContainer: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 20,
    width: "90%",
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
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
    marginTop: 20,
  },
  cancelButton: {
    padding: 10,
  },
  confirmButton: {
    padding: 10,
    backgroundColor: "#63c550",
    borderRadius: 5,
  },
  tab: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  activeTab: {
    backgroundColor: "#63c550",
  },
  tabText: {
    color: "#000",
  },
  activeTabText: {
    color: "#fff",
    fontWeight: "bold",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
  },
  noDataContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
  },
  itemContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
});

export default StatisticsScreen;
