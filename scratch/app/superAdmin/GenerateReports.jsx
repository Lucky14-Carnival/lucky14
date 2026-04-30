import React, { useCallback, useMemo, useState } from 'react';
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
import { getGeneratedReports } from '../../services/adminApi';

const SORT_OPTIONS = [
  { key: 'date', label: 'Date' },
  { key: 'revenue', label: 'Revenue' },
  { key: 'profit', label: 'Profit' },
];

const normalize = (value) => String(value || '').toLowerCase();

const GenerateReports = () => {
  const router = useRouter();
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState('date');
  const [ascending, setAscending] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      setItems(await getGeneratedReports());
    } catch (error) {
      Alert.alert('Reports Error', error.message);
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
    const query = normalize(search);
    return [...items]
      .filter((item) =>
        !query ||
        [
          item.id,
          item.branchId,
          item.branchName,
          item.date,
          item.revenue,
          item.expenses,
          item.budget,
          item.borrowings,
          item.profit,
          item.netAfterBudget,
          item.finalized ? 'finalized' : 'draft',
        ]
          .some((value) => normalize(value).includes(query))
      )
      .sort((left, right) => {
        if (sortKey === 'date') {
          const leftTime = new Date(left.date || 0).getTime();
          const rightTime = new Date(right.date || 0).getTime();
          return ascending ? leftTime - rightTime : rightTime - leftTime;
        }

        return ascending ? Number(left[sortKey]) - Number(right[sortKey]) : Number(right[sortKey]) - Number(left[sortKey]);
      });
  }, [ascending, items, search, sortKey]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#FFF" />
        </TouchableOpacity>
        <View style={styles.headerTextWrap}>
          <Text style={styles.headerTitle}>Generate Reports</Text>
          <Text style={styles.headerSubtitle}>Review finalized branch performance</Text>
        </View>
        <TouchableOpacity style={styles.iconButton} onPress={() => setAscending((value) => !value)}>
          <MaterialCommunityIcons name={ascending ? 'sort-ascending' : 'sort-descending'} size={24} color="#FFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={styles.searchBox}>
          <MaterialCommunityIcons name="magnify" size={20} color="#666" />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search by branch, date, revenue, status"
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
            ListEmptyComponent={<Text style={styles.emptyText}>No reports matched your search.</Text>}
            renderItem={({ item }) => (
              <View style={styles.card}>
                <View style={styles.rowBetween}>
                  <Text style={styles.cardTitle}>{item.branchName || `Branch #${item.branchId || '-'}`}</Text>
                  <View style={[styles.pill, item.finalized ? styles.pillSuccess : styles.pillDraft]}>
                    <Text style={styles.pillText}>{item.finalized ? 'Finalized' : 'Draft'}</Text>
                  </View>
                </View>
                <Text style={styles.branchMeta}>{`Branch ID: ${item.branchId || '-'}`}</Text>
                <Text style={styles.dateText}>{item.date ? new Date(item.date).toLocaleDateString('en-PH') : 'No report date'}</Text>

                <View style={styles.metricsRow}>
                  <View style={styles.metricBox}>
                    <Text style={styles.metricLabel}>Revenue</Text>
                    <Text style={styles.metricValue}>{`P ${item.revenue.toLocaleString()}`}</Text>
                  </View>
                  <View style={styles.metricBox}>
                    <Text style={styles.metricLabel}>Expenses</Text>
                    <Text style={styles.metricValue}>{`P ${item.expenses.toLocaleString()}`}</Text>
                  </View>
                </View>

                <View style={styles.metricsRow}>
                  <View style={styles.metricBox}>
                    <Text style={styles.metricLabel}>Borrowings</Text>
                    <Text style={styles.metricValue}>{`P ${item.borrowings.toLocaleString()}`}</Text>
                  </View>
                  <View style={styles.metricBox}>
                    <Text style={styles.metricLabel}>Budget</Text>
                    <Text style={styles.metricValue}>{`P ${item.budget.toLocaleString()}`}</Text>
                  </View>
                </View>

                <View style={styles.metricsRow}>
                  <View style={styles.metricBox}>
                    <Text style={styles.metricLabel}>Profit</Text>
                    <Text style={styles.metricValue}>{`P ${item.profit.toLocaleString()}`}</Text>
                  </View>
                  <View style={styles.metricBox}>
                    <Text style={styles.metricLabel}>Net After Budget</Text>
                    <Text style={styles.metricValue}>{`P ${item.netAfterBudget.toLocaleString()}`}</Text>
                  </View>
                </View>
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
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#183A1D' },
  branchMeta: { marginTop: 4, color: '#7A7A7A', fontSize: 12 },
  dateText: { marginTop: 8, color: '#666' },
  pill: { minWidth: 78, height: 30, borderRadius: 15, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 10 },
  pillSuccess: { backgroundColor: '#2E7D32' },
  pillDraft: { backgroundColor: '#E6912C' },
  pillText: { color: '#FFF', fontWeight: '700', fontSize: 12 },
  metricsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
  metricBox: { width: '48%', backgroundColor: '#F7F7F7', borderRadius: 12, padding: 12 },
  metricLabel: { color: '#666', fontSize: 12 },
  metricValue: { marginTop: 4, color: '#12551b', fontWeight: '800' },
  emptyText: { textAlign: 'center', color: '#666', marginTop: 36 },
});

export default GenerateReports;
