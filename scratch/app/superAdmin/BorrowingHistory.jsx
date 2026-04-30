import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getSuperAdminBorrowingHistory } from '../../services/adminApi';
import { useCallback } from 'react';

const SORT_OPTIONS = [
  { key: 'date', label: 'Date' },
  { key: 'amount', label: 'Amount' },
  { key: 'branchId', label: 'Branch' },
];

const normalize = (value) => String(value || '').toLowerCase();

const BorrowingHistory = () => {
  const router = useRouter();
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState('date');
  const [ascending, setAscending] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      setItems(await getSuperAdminBorrowingHistory());
    } catch (error) {
      Alert.alert('Borrowing History Error', error.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
      const intervalId = setInterval(() => {
        loadData();
      }, 12000);

      return () => clearInterval(intervalId);
    }, [loadData])
  );

  const filteredItems = useMemo(() => {
    const query = normalize(search).trim();
    return [...items]
      .filter((item) =>
        !query ||
        [item.remarks, item.branchId, item.branchName, item.userId, item.userName, item.attractionId, item.attractionName, item.amount, item.date, item.approved ? 'approved' : 'pending']
          .some((value) => normalize(value).includes(query))
      )
      .sort((left, right) => {
        if (sortKey === 'date') {
          const leftTime = new Date(left.date || 0).getTime();
          const rightTime = new Date(right.date || 0).getTime();
          return ascending ? leftTime - rightTime : rightTime - leftTime;
        }

        if (sortKey === 'amount' || sortKey === 'branchId') {
          return ascending ? Number(left[sortKey]) - Number(right[sortKey]) : Number(right[sortKey]) - Number(left[sortKey]);
        }

        return 0;
      });
  }, [ascending, items, search, sortKey]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#FFF" />
        </TouchableOpacity>
        <View style={styles.headerTextWrap}>
          <Text style={styles.headerTitle}>Borrowing History</Text>
          <Text style={styles.headerSubtitle}>Track branch borrowing transactions</Text>
        </View>
        <TouchableOpacity style={styles.iconButton} onPress={() => setAscending((value) => !value)}>
          <MaterialCommunityIcons name={ascending ? 'sort-calendar-ascending' : 'sort-calendar-descending'} size={22} color="#FFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={styles.searchBox}>
          <MaterialCommunityIcons name="magnify" size={20} color="#666" />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search branch, user, attraction, amount, status"
            style={styles.searchInput}
          />
        </View>

        <View style={styles.filters}>
          {SORT_OPTIONS.map((option) => (
            <TouchableOpacity
              key={option.key}
              style={[styles.filterChip, sortKey === option.key && styles.filterChipActive]}
              onPress={() => setSortKey(option.key)}
            >
              <Text style={[styles.filterText, sortKey === option.key && styles.filterTextActive]}>{option.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {isLoading ? (
          <ActivityIndicator size="large" color="#12551b" style={styles.loader} />
        ) : (
          <FlatList
            data={filteredItems}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={<Text style={styles.emptyText}>No borrowing records matched your search.</Text>}
            renderItem={({ item }) => (
              <View style={styles.card}>
                <View style={styles.rowBetween}>
                  <Text style={styles.amount}>{`P ${item.amount.toLocaleString()}`}</Text>
                  <Text style={styles.dateText}>{item.date ? new Date(item.date).toLocaleDateString('en-PH') : 'No date'}</Text>
                </View>
                <Text style={styles.cardLine}>{item.branchName || `Branch #${item.branchId || '-'}`}</Text>
                <Text style={styles.cardLine}>{item.userName || `User #${item.userId || '-'}`}</Text>
                <Text style={styles.cardLine}>{item.attractionName || `Attraction #${item.attractionId || '-'}`}</Text>
                <Text style={styles.remarks}>{item.remarks || 'No remarks recorded.'}</Text>
                <Text style={[styles.approvalText, item.approved ? styles.approvedText : styles.pendingText]}>
                  {item.approved ? 'Approved' : 'Pending'}
                </Text>
              </View>
            )}
          />
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#12551b' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 34, paddingBottom: 36 },
  headerTextWrap: { flex: 1, alignItems: 'center', paddingHorizontal: 8 },
  headerTitle: { color: '#FFF', fontSize: 22, fontWeight: '700' },
  headerSubtitle: { color: 'rgba(255,255,255,0.85)', fontSize: 12, marginTop: 2 },
  iconButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.12)', justifyContent: 'center', alignItems: 'center' },
  content: { flex: 1, backgroundColor: '#F8F8F8', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 20 },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 14, paddingHorizontal: 14, height: 52 },
  searchInput: { flex: 1, marginLeft: 10, color: '#222' },
  filters: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 14, marginBottom: 14 },
  filterChip: { paddingHorizontal: 14, height: 36, borderRadius: 18, backgroundColor: '#E6E6E6', justifyContent: 'center', marginRight: 10, marginBottom: 10 },
  filterChipActive: { backgroundColor: '#12551b' },
  filterText: { color: '#12551b', fontWeight: '600' },
  filterTextActive: { color: '#FFF' },
  loader: { marginTop: 40 },
  listContent: { paddingBottom: 30 },
  card: { backgroundColor: '#FFF', borderRadius: 16, padding: 16, marginBottom: 12 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  amount: { fontSize: 20, fontWeight: '800', color: '#12551b' },
  dateText: { color: '#666', fontWeight: '600' },
  cardLine: { marginTop: 8, color: '#444' },
  remarks: { marginTop: 10, color: '#183A1D', fontWeight: '600' },
  approvalText: { marginTop: 10, fontWeight: '700' },
  approvedText: { color: '#2E7D32' },
  pendingText: { color: '#C62828' },
  emptyText: { textAlign: 'center', color: '#666', marginTop: 36 },
});

export default BorrowingHistory;
