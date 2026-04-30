import React, { useEffect, useState } from 'react';
import {
  StyleSheet, View, Text, FlatList, SafeAreaView, TouchableOpacity, Platform, StatusBar, Alert
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getBorrowedFunds, saveBorrowedFunds } from '../../services/adminApi';
import { useCallback } from 'react';

const BorrowedFunds = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [borrowedRecords, setBorrowedRecords] = useState([]);

  const loadItems = useCallback(async () => {
    try {
      const data = await getBorrowedFunds({ branchId: params.branchId });
      setBorrowedRecords(data);
    } catch (error) {
      Alert.alert('Load Failed', error.message);
    }
  }, [params.branchId]);

  useFocusEffect(
    useCallback(() => {
      loadItems();
    }, [loadItems])
  );

  const syncToDashboard = () => {
    const totalPending = borrowedRecords
      .filter((item) => !item.isReturned)
      .reduce((sum, item) => sum + item.amount, 0);

    Alert.alert(
      'Sync Borrowed Funds',
      `Pending Amount to Sync: PHP ${totalPending.toLocaleString()}\n\nThis will update the Borrowed Funds total in the Dashboard. Proceed?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Edit More', onPress: () => null },
        {
          text: 'Confirm & Sync',
          onPress: async () => {
            try {
              await saveBorrowedFunds(borrowedRecords);
              router.replace({ pathname: '../admin/AdminDashboard', params });
            } catch (error) {
              Alert.alert('Save Failed', error.message);
            }
          }
        }
      ],
      { cancelable: true }
    );
  };

  const toggleStatus = (id) => {
    setBorrowedRecords((prevRecords) =>
      prevRecords.map((item) =>
        item.id === id ? { ...item, isReturned: !item.isReturned } : item
      )
    );
  };

  const renderItem = ({ item }) => (
    <View style={styles.tableRow}>
      <View style={{ flex: 1.5 }}>
        <Text style={styles.cellDate}>{item.date}</Text>
        <Text style={styles.cellManager}>{item.manager}</Text>
        <Text style={styles.cellTable}>{item.table}</Text>
      </View>

      <View style={{ flex: 1, alignItems: 'flex-end', justifyContent: 'center' }}>
        <Text style={styles.cellAmount}>P{item.amount.toLocaleString()}</Text>
        <TouchableOpacity
          onPress={() => toggleStatus(item.id)}
          style={[
            styles.statusBadge,
            { backgroundColor: item.isReturned ? '#E8F5E9' : '#FFEBEE' }
          ]}
        >
          <MaterialCommunityIcons
            name={item.isReturned ? 'check-circle' : 'clock-alert-outline'}
            size={12}
            color={item.isReturned ? '#0f6915' : '#c62828'}
          />
          <Text style={[styles.statusText, { color: item.isReturned ? '#0f6915' : '#c62828' }]}>
            {item.isReturned ? ' APPROVED' : ' PENDING'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Borrowed Funds</Text>
        <TouchableOpacity onPress={syncToDashboard}>
          <MaterialCommunityIcons name="content-save-check" size={26} color="#FFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={styles.summaryContainer}>
          <Text style={styles.summaryLabel}>Total Pending Borrowed:</Text>
          <Text style={styles.summaryValue}>
            P{borrowedRecords.filter((i) => !i.isReturned).reduce((s, i) => s + i.amount, 0).toLocaleString()}
          </Text>
        </View>

        <View style={styles.infoBox}>
          <MaterialCommunityIcons name="information" size={16} color="#666" />
          <Text style={styles.infoText}>Tap status to toggle. Only pending records will show on Dashboard.</Text>
        </View>

        <View style={styles.tableHeader}>
          <Text style={[styles.columnHeader, { flex: 1.5 }]}>Manager / Table</Text>
          <Text style={[styles.columnHeader, { flex: 1, textAlign: 'right' }]}>Amount / Status</Text>
        </View>

        <FlatList
          data={borrowedRecords}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          ListEmptyComponent={<Text style={styles.emptyText}>No fund records found.</Text>}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  header: {
    backgroundColor: '#0f6915', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 15,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 10 : 50,
  },
  headerTitle: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  backButton: { padding: 5 },
  content: { flex: 1, padding: 15 },
  summaryContainer: {
    backgroundColor: '#FFF', padding: 15, borderRadius: 12, marginBottom: 15,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderLeftWidth: 5, borderLeftColor: '#c62828', elevation: 2
  },
  summaryLabel: { fontSize: 13, fontWeight: 'bold', color: '#666' },
  summaryValue: { fontSize: 18, fontWeight: 'bold', color: '#c62828' },
  infoBox: { flexDirection: 'row', backgroundColor: '#e3f2fd', padding: 10, borderRadius: 8, alignItems: 'center', marginBottom: 15 },
  infoText: { fontSize: 10, color: '#1976d2', marginLeft: 8, fontStyle: 'italic' },
  tableHeader: { flexDirection: 'row', backgroundColor: '#E6912C', paddingVertical: 12, paddingHorizontal: 15, borderRadius: 10, marginBottom: 10 },
  columnHeader: { fontSize: 12, fontWeight: 'bold', color: '#FFF' },
  tableRow: { flexDirection: 'row', padding: 15, backgroundColor: '#FFF', marginBottom: 8, borderRadius: 12, elevation: 2 },
  cellDate: { fontSize: 10, color: '#999' },
  cellManager: { fontSize: 15, fontWeight: 'bold', color: '#333' },
  cellTable: { fontSize: 12, color: '#0f6915', fontWeight: '500' },
  cellAmount: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 5 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 15, borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)' },
  statusText: { fontSize: 10, fontWeight: 'bold' },
  emptyText: { textAlign: 'center', marginTop: 50, color: '#999' }
});

export default BorrowedFunds;
