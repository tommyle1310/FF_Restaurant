import FFText from '@/src/components/FFText';
import React from 'react';
import { View, Text, TextInput, Button, StyleSheet } from 'react-native';

export default function CustomerFeedback() {
  return (
    <View style={styles.container}>
      <FFText style={styles.title}>Customer Feedback</FFText>
      <View style={styles.feedback}>
        <FFText>Feedback #1: Great service!</FFText>
        <TextInput style={styles.input} placeholder="Reply here..." />
        <Button title="Send Reply" onPress={() => {}} />
      </View>
      <View style={styles.feedback}>
        <FFText>Feedback #2: Delivery was late.</FFText>
        <TextInput style={styles.input} placeholder="Reply here..." />
        <Button title="Send Reply" onPress={() => {}} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f8f8f8',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  feedback: {
    marginBottom: 15,
    padding: 10,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 10,
    marginTop: 10,
    marginBottom: 10,
  },
});
