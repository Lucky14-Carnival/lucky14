import React, { useEffect, useState } from 'react';
import {
  StyleSheet, View, Text, FlatList, SafeAreaView, TouchableOpacity,
  Platform, StatusBar, TextInput, Alert
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getBudgetItems, saveBudgetItems } from '../../services/adminApi';
import { useCallback } from 'react';

const toNumber = (value) => {
  const parsed = Number.parseFloat(String(value ?? '').replace(/,/g, '').trim());
  return Number.isFinite(parsed) ? parsed : 0;
};

const BudgetTracking = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [budgetItems, setBudgetItems] = useState([]);

  const loadItems = useCallback(async () => {
    try {
      const data = await getBudgetItems({ branchId: params.branchId });
      setBudgetItems(data);
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
    setBudgetItems((prev) => prev.map((item) => (item.id === id ? { ...item, [field]: value } : item)));
  };

  const addNewBudget = () => {
    const newEntry = {
      id: Date.now().toString(),
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      category: '',
      allocated: '0',
      spent: '0',
      _branchId: Number(params.branchId),
    };
    setBudgetItems((prev) => [newEntry, ...prev]);
  };

  const syncToDashboard = () => {
    const totalAllocated = budgetItems.reduce((sum, item) => sum + toNumber(item.allocated), 0);

    Alert.alert(
      'Sync Budget Data',
      `Budget: PHP ${totalAllocated.toLocaleString()}\n\nDo you want to sync this to the Dashboard?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Edit More', onPress: () => null },
        {
          text: 'Confirm & Sync',
          onPress: async () => {
            try {
              await saveBudgetItems(budgetItems);
              await loadItems();
              Alert.alert('Synced', 'Budget data has been updated.');
            } catch (error) {
              Alert.alert('Save Failed', error.message);
            }
          }
        }
      ],
      { cancelable: true }
    );
  };

  const renderItem = ({ item }) => {
    return (
      <View style={styles.tableRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.cellDate}>{item.date}</Text>
          <TextInput
            style={styles.inputCategory}
            value={item.category}
            placeholder="Enter Category"
            onChangeText={(txt) => handleUpdate(item.id, 'category', txt)}
          />
        </View>

        <View style={{ flex: 1, alignItems: 'flex-end' }}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Budget: P</Text>
            <TextInput
              style={styles.inputNumeric}
              value={item.allocated.toString()}
              keyboardType="numeric"
              onChangeText={(txt) => handleUpdate(item.id, 'allocated', txt)}
            />
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Budget Tracking</Text>
        <TouchableOpacity onPress={syncToDashboard}>
          <MaterialCommunityIcons name="content-save-check" size={26} color="#FFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={styles.tableHeader}>
          <Text style={[styles.columnHeader, { flex: 1 }]}>Category Details</Text>
          <Text style={[styles.columnHeader, { flex: 1, textAlign: 'right' }]}>Budget</Text>
        </View>

        <FlatList
          data={budgetItems}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 160 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={<Text style={styles.emptyText}>No budget records found.</Text>}
        />
      </View>

      <View style={styles.footer}>
        <View style={styles.footerRow}>
          <Text style={styles.footerLabel}>Total Budget:</Text>
          <Text style={styles.footerValue}>P{budgetItems.reduce((s, i) => s + toNumber(i.allocated), 0).toLocaleString()}</Text>
        </View>
        <Text style={styles.syncNotice}>Click the save icon in the top right to sync.</Text>
      </View>

      <TouchableOpacity style={styles.fab} onPress={addNewBudget}>
        <MaterialCommunityIcons name="plus" size={28} color="#FFF" />
      </TouchableOpacity>
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
  backButton: { padding: 5 },
  content: { flex: 1, padding: 15 },
  tableHeader: {
    flexDirection: 'row', backgroundColor: '#E6912C',
    paddingVertical: 12, paddingHorizontal: 15, borderRadius: 10, marginBottom: 10,
  },
  columnHeader: { fontSize: 13, fontWeight: 'bold', color: '#FFF' },
  tableRow: {
    flexDirection: 'row', padding: 15, backgroundColor: '#FFF',
    borderRadius: 12, marginBottom: 10, elevation: 2, alignItems: 'center'
  },
  cellDate: { fontSize: 10, color: '#999' },
  inputCategory: { fontSize: 15, fontWeight: 'bold', color: '#333', paddingVertical: 0 },
  inputGroup: { flexDirection: 'row', alignItems: 'center', marginBottom: 2 },
  inputLabel: { fontSize: 11, color: '#888' },
  inputNumeric: { fontSize: 13, fontWeight: 'bold', color: '#444', borderBottomWidth: 1, borderBottomColor: '#eee', minWidth: 60, textAlign: 'right', padding: 0 },
  footer: {
    backgroundColor: '#FFF', padding: 15, borderTopLeftRadius: 20, borderTopRightRadius: 20,
    position: 'absolute', bottom: 0, width: '100%', elevation: 20, shadowColor: '#000', shadowOpacity: 0.2
  },
  footerRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  footerLabel: { fontWeight: 'bold', color: '#666', fontSize: 12 },
  footerValue: { fontWeight: 'bold', color: '#0f6915', fontSize: 14 },
  syncNotice: { textAlign: 'center', fontSize: 10, color: '#999', marginTop: 8, fontStyle: 'italic' },
  fab: {
    position: 'absolute', right: 20, bottom: 110, backgroundColor: '#2196F3',
    width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', elevation: 5,
  },
  emptyText: { textAlign: 'center', marginTop: 50, color: '#999' }
});

export default BudgetTracking;
