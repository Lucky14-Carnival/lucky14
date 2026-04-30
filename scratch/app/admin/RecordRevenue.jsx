import React, { useEffect, useState } from 'react';
import {
  StyleSheet, View, Text, FlatList, SafeAreaView, TouchableOpacity,
  Platform, StatusBar, TextInput, Alert
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getRevenueRecords, saveRevenueRecords } from '../../services/adminApi';

const RecordRevenue = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [records, setRecords] = useState([]);

  useEffect(() => {
    const loadRecords = async () => {
      try {
        const data = await getRevenueRecords({ branchId: params.branchId });
        setRecords(data);
      } catch (error) {
        Alert.alert('Load Failed', error.message);
      }
    };

    loadRecords();
  }, []);

  const handleUpdate = (id, field, value) => {
    setRecords((prev) => prev.map((item) => (item.id === id ? { ...item, [field]: value } : item)));
  };

  const saveAndSync = () => {
    const total = records.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);

    Alert.alert(
      'Save & Sync Data',
      `Are you sure you want to sync the total revenue of PHP ${total.toLocaleString()} to the Dashboard?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Edit More', onPress: () => null },
        {
          text: 'Confirm & Sync',
          onPress: async () => {
            try {
              await saveRevenueRecords(records);
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

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Record Revenue</Text>
        <TouchableOpacity onPress={saveAndSync}>
          <MaterialCommunityIcons name="content-save-check" size={26} color="#FFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={styles.tableHeader}>
          <Text style={[styles.columnHeader, { flex: 1.2 }]}>Source</Text>
          <Text style={[styles.columnHeader, { flex: 1, textAlign: 'right' }]}>Amount (PHP)</Text>
        </View>

        <FlatList
          data={records}
          keyExtractor={(item) => item.id}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => (
            <View style={styles.tableRow}>
              <TextInput
                style={[styles.inputCell, { flex: 1.2, fontWeight: '600' }]}
                value={item.source}
                onChangeText={(txt) => handleUpdate(item.id, 'source', txt)}
              />

              <View style={[styles.amountContainer, { flex: 1 }]}>
                <Text style={styles.currencyPrefix}>P</Text>
                <TextInput
                  style={styles.inputAmount}
                  value={item.amount.toString()}
                  keyboardType="numeric"
                  onChangeText={(txt) => handleUpdate(item.id, 'amount', txt)}
                />
              </View>
            </View>
          )}
        />

        <View style={styles.footerTotal}>
          <Text style={styles.totalLabel}>Total Daily Revenue:</Text>
          <Text style={styles.totalValue}>
            P{records.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f4f4' },
  header: {
    backgroundColor: '#0f6915',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 10 : 50,
  },
  headerTitle: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  content: { flex: 1, padding: 15 },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#333',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  columnHeader: { fontSize: 12, fontWeight: 'bold', color: '#FFF', textTransform: 'uppercase' },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 10,
    backgroundColor: '#FFF',
    borderRadius: 8,
    marginBottom: 8,
    alignItems: 'center',
    elevation: 1,
  },
  inputCell: { fontSize: 14, color: '#333', paddingVertical: 5 },
  amountContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end' },
  currencyPrefix: { color: '#0f6915', fontWeight: 'bold', marginRight: 2 },
  inputAmount: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0f6915',
    textAlign: 'right',
    minWidth: 80,
    borderBottomWidth: 1,
    borderBottomColor: '#eee'
  },
  footerTotal: {
    backgroundColor: '#FFF',
    padding: 20,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    borderTopWidth: 4,
    borderTopColor: '#0f6915'
  },
  totalLabel: { fontSize: 14, fontWeight: 'bold', color: '#666' },
  totalValue: { fontSize: 18, fontWeight: 'bold', color: '#0f6915' }
});

export default RecordRevenue;
