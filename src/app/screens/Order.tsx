import FFText from '@/src/components/FFText';
import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';

type Order = {
  id: string;
  customerName: string;
  customerAddress: string;
  items: string[];
  specialNote: string;
  status: string;
};

export default function OrderScreen() {
  const [orders, setOrders] = useState<Order[]>([
    {
      id: '1',
      customerName: 'Alice Johnson',
      customerAddress: '123 Main St',
      items: ['Burger', 'Fries', 'Coke'],
      specialNote: 'No pickles, please!',
      status: 'Pending',
    },
    {
      id: '2',
      customerName: 'John Doe',
      customerAddress: '456 Elm St',
      items: ['Pizza', 'Garlic Bread'],
      specialNote: '',
      status: 'Pending',
    },
  ]);

  const updateOrderStatus = (id: string, newStatus: string) => {
    setOrders((prevOrders) =>
      prevOrders.map((order) =>
        order.id === id ? { ...order, status: newStatus } : order
      )
    );
    Alert.alert('Success', `Order has been marked as "${newStatus}"`);
  };

  const renderOrder = ({ item }: { item: Order }) => (
    <View style={styles.orderCard}>
      <FFText style={styles.orderTitle}>Order #{item.id}</FFText>
      <FFText style={styles.orderDetail}>Customer: {item.customerName}</FFText>
      <FFText style={styles.orderDetail}>Address: {item.customerAddress}</FFText>
      <FFText style={styles.orderDetail}>Items: {item.items.join(', ')}</FFText>
      {item.specialNote ? (
        <FFText style={styles.orderDetail}>Note: {item.specialNote}</FFText>
      ) : null}
      <Text style={styles.orderStatus}>Status: {item.status}</Text>

      {item.status === 'Pending' && (
        <View style={styles.buttonGroup}>
          <TouchableOpacity
            style={styles.acceptButton}
            onPress={() => updateOrderStatus(item.id, 'In Preparation')}
          >
            <FFText style={styles.buttonText}>Accept</FFText>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.rejectButton}
            onPress={() => updateOrderStatus(item.id, 'Rejected')}
          >
            <FFText style={styles.buttonText}>Reject</FFText>
          </TouchableOpacity>
        </View>
      )}

      {item.status === 'In Preparation' && (
        <TouchableOpacity
          style={styles.updateButton}
          onPress={() => updateOrderStatus(item.id, 'The driver is delivering your food')}
        >
          <FFText style={styles.buttonText}>Mark as Delivering</FFText>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <FFText style={styles.header}>Incoming Orders</FFText>
      <FlatList
        data={orders}
        renderItem={renderOrder}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
    padding: 20,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  list: {
    paddingBottom: 20,
  },
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 5,
    elevation: 3,
  },
  orderTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  orderDetail: {
    fontSize: 14,
    marginBottom: 5,
  },
  orderStatus: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 10,
  },
  buttonGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  acceptButton: {
    backgroundColor: '#28a745',
    padding: 10,
    borderRadius: 5,
  },
  rejectButton: {
    backgroundColor: '#dc3545',
    padding: 10,
    borderRadius: 5,
  },
  updateButton: {
    backgroundColor: '#007bff',
    padding: 10,
    borderRadius: 5,
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: 'bold',
  },
});
