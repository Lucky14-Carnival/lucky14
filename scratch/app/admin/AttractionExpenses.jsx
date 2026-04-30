import React, { useCallback, useState } from 'react';
import {
  StyleSheet, View, Text, FlatList, SafeAreaView, TouchableOpacity,
  Platform, StatusBar, TextInput, Alert
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getAttractionExpenses, saveAttractionExpenses } from '../../services/adminApi';

const toNumber = (value) => {
  const normalized = String(value ?? '').replace(/,/g, '').trim();
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
};

const AttractionExpenses = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [expenseData, setExpenseData] = useState([]);

  const loadItems = useCallback(async () => {
    try {
      const data = await getAttractionExpenses({ branchId: params.branchId });
      setExpenseData(data);
    } catch (error) {
      Alert.alert('Load Failed', error.message);
    }
  }, [params.branchId]);

  useFocusEffect(
    useCallback(() => {
      loadItems();
    }, [loadItems])
  );

  const handleUpdate = (id, field, value) => {
    setExpenseData((prev) => prev.map((item) => (item.id === id ? { ...item, [field]: value } : item)));
  };

  const syncToDashboard = () => {
    const totalExp = expenseData.reduce((sum, item) => sum + toNumber(item.expense), 0);
    const totalProfit = expenseData.reduce((sum, item) => sum + toNumber(item.profit), 0);

    Alert.alert(
      'Sync Attraction Data',
      `Total Expenses: PHP ${totalExp.toLocaleString()}\nTotal Profit: PHP ${totalProfit.toLocaleString()}\n\nDo you want to sync this to the Dashboard?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Edit More', onPress: () => null },
        {
          text: 'Confirm & Sync',
          onPress: async () => {
            try {
              await saveAttractionExpenses(expenseData, {
                branchId: params.branchId,
                userId: params.userId,
              });
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

  const renderItem = ({ item }) => (
    <View style={styles.tableRow}>
      <View style={{ flex: 1.5 }}>
        <Text style={styles.cellDate}>{item.date}</Text>
        <TextInput
          style={styles.inputSource}
          value={item.source}
          onChangeText={(txt) => handleUpdate(item.id, 'source', txt.replace(/\s{2,}/g, ' '))}
        />
      </View>

      <View style={{ flex: 1, alignItems: 'center' }}>
        <Text style={styles.labelSmall}>Expense</Text>
        <View style={styles.editContainer}>
          <Text style={styles.currency}>P</Text>
          <TextInput
            style={styles.inputExpense}
            value={item.expense.toString()}
            keyboardType="numeric"
            onChangeText={(txt) => handleUpdate(item.id, 'expense', txt)}
          />
        </View>
      </View>

      <View style={{ flex: 1.2, alignItems: 'flex-end' }}>
        <Text style={styles.labelSmall}>Net Profit</Text>
        <View style={styles.editContainer}>
          <Text style={[styles.currency, { color: '#0f6915' }]}>P</Text>
          <TextInput
            style={styles.inputProfit}
            value={item.profit.toString()}
            keyboardType="numeric"
            onChangeText={(txt) => handleUpdate(item.id, 'profit', txt)}
          />
        </View>
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
        <Text style={styles.headerTitle}>Attraction Expenses</Text>
        <TouchableOpacity onPress={syncToDashboard}>
          <MaterialCommunityIcons name="cloud-upload" size={26} color="#FFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={styles.tableHeader}>
          <Text style={[styles.columnHeader, { flex: 1.5 }]}>Unit Name</Text>
          <Text style={[styles.columnHeader, { flex: 1, textAlign: 'center' }]}>Expense</Text>
          <Text style={[styles.columnHeader, { flex: 1.2, textAlign: 'right' }]}>Profit</Text>
        </View>

        <FlatList
          data={expenseData}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 100 }}
        />
      </View>

      <View style={styles.footer}>
        <View style={styles.totalBox}>
          <Text style={styles.totalLabel}>Total Expense</Text>
          <Text style={styles.totalValueExp}>P{expenseData.reduce((sum, item) => sum + toNumber(item.expense), 0).toLocaleString()}</Text>
        </View>
        <View style={[styles.totalBox, { borderLeftWidth: 1, borderLeftColor: '#eee' }]}>
          <Text style={styles.totalLabel}>Total Profit</Text>
          <Text style={styles.totalValuePro}>P{expenseData.reduce((sum, item) => sum + toNumber(item.profit), 0).toLocaleString()}</Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f4f4' },
  header: {
    backgroundColor: '#0f6915', flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 15,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 10 : 50,
  },
  headerTitle: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  content: { flex: 1, padding: 15 },
  tableHeader: {
    flexDirection: 'row', backgroundColor: '#E6912C',
    paddingVertical: 12, paddingHorizontal: 15, borderRadius: 10, marginBottom: 10,
  },
  columnHeader: { fontSize: 11, fontWeight: 'bold', color: '#FFF' },
  tableRow: {
    flexDirection: 'row', padding: 15, borderBottomWidth: 1, borderColor: '#eee',
    backgroundColor: '#FFF', alignItems: 'center', marginBottom: 5, borderRadius: 8
  },
  cellDate: { fontSize: 9, color: '#999' },
  inputSource: { fontSize: 14, fontWeight: 'bold', color: '#333', paddingVertical: 2 },
  labelSmall: { fontSize: 8, color: '#aaa', marginBottom: 2 },
  editContainer: { flexDirection: 'row', alignItems: 'center' },
  currency: { fontSize: 12, fontWeight: 'bold', color: '#d32f2f', marginRight: 2 },
  inputExpense: { fontSize: 14, fontWeight: '600', color: '#d32f2f', minWidth: 50, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  inputProfit: { fontSize: 14, fontWeight: 'bold', color: '#0f6915', minWidth: 60, textAlign: 'right', borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  footer: {
    position: 'absolute', bottom: 0, width: '100%', backgroundColor: '#FFF',
    flexDirection: 'row', paddingVertical: 20, borderTopLeftRadius: 20, borderTopRightRadius: 20,
    elevation: 20, shadowColor: '#000', shadowOpacity: 0.2
  },
  totalBox: { flex: 1, alignItems: 'center' },
  totalLabel: { fontSize: 10, color: '#666', fontWeight: 'bold' },
  totalValueExp: { fontSize: 16, fontWeight: 'bold', color: '#d32f2f' },
  totalValuePro: { fontSize: 16, fontWeight: 'bold', color: '#0f6915' },
  backButton: { padding: 5 }
});

export default AttractionExpenses;

