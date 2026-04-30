import React, { useEffect, useState } from 'react';
import {
  StyleSheet, View, Text, FlatList, SafeAreaView, TouchableOpacity,
  TextInput, Alert, ScrollView
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { deleteHistoryLog, getHistoryLogs } from '../../services/adminApi';

const HistoryLog = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [activeFilter, setActiveFilter] = useState('Daily');
  const [searchQuery, setSearchQuery] = useState('');
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    const loadLogs = async () => {
      try {
        const data = await getHistoryLogs({ branchId: params.branchId });
        setLogs(data);
      } catch (error) {
        Alert.alert('Load Failed', error.message);
      }
    };

    loadLogs();
  }, [params]);

  const deleteLog = (id) => {
    Alert.alert('Delete Record', 'Are you sure?', [
      { text: 'Cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteHistoryLog(id);
            setLogs((prev) => prev.filter((item) => item.id !== id));
          } catch (error) {
            Alert.alert('Delete Failed', error.message);
          }
        }
      }
    ]);
  };

  const renderLog = ({ item }) => (
    <View style={styles.logCard}>
      <View style={styles.logHeader}>
        <Text style={styles.logType}>{item.type}</Text>
        <Text style={styles.logDate}>{item.date}</Text>
      </View>
      <Text style={styles.logDetail}>{item.detail}</Text>
      <View style={styles.divider} />
      <View style={styles.metricsRow}>
        <View><Text style={styles.mLabel}>GROSS</Text><Text style={styles.mVal}>P{item.metrics.gross.toLocaleString()}</Text></View>
        <View><Text style={styles.mLabel}>EXPENSES</Text><Text style={[styles.mVal, { color: '#d32f2f' }]}>P{item.metrics.expenses.toLocaleString()}</Text></View>
        <View><Text style={styles.mLabel}>NET</Text><Text style={[styles.mVal, { color: '#0f6915' }]}>P{item.metrics.net.toLocaleString()}</Text></View>
      </View>
      <View style={styles.logFooter}>
        <Text style={styles.adminText}>Admin: {item.user}</Text>
        <TouchableOpacity onPress={() => deleteLog(item.id)}>
          <MaterialCommunityIcons name="delete-outline" size={20} color="#e74c3c" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Transaction History</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.filterSection}>
        <TextInput
          placeholder="Search records..."
          style={styles.search}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 10 }}>
          {['Daily', 'Weekly', 'Monthly', 'Yearly'].map((tab) => (
            <TouchableOpacity key={tab} onPress={() => setActiveFilter(tab)} style={[styles.tab, activeFilter === tab && styles.activeTab]}>
              <Text style={[styles.tabText, activeFilter === tab && styles.activeTabText]}>{tab}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={logs.filter((item) => item.detail.toLowerCase().includes(searchQuery.toLowerCase()))}
        renderItem={renderLog}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 15 }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f2f5' },
  header: { backgroundColor: '#0f6915', padding: 20, paddingTop: 50, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  filterSection: { backgroundColor: '#FFF', padding: 15, elevation: 3 },
  search: { backgroundColor: '#f0f2f5', padding: 10, borderRadius: 10 },
  tab: { paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20, marginRight: 10, backgroundColor: '#f0f2f5' },
  activeTab: { backgroundColor: '#0f6915' },
  tabText: { fontSize: 12, fontWeight: 'bold', color: '#666' },
  activeTabText: { color: '#FFF' },
  logCard: { backgroundColor: '#FFF', padding: 15, borderRadius: 15, marginBottom: 15, elevation: 2 },
  logHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  logType: { fontSize: 9, fontWeight: 'bold', color: '#0f6915', backgroundColor: '#e8f5e9', padding: 4, borderRadius: 5 },
  logDate: { fontSize: 10, color: '#999' },
  logDetail: { fontWeight: 'bold', fontSize: 14, marginVertical: 8 },
  divider: { height: 1, backgroundColor: '#f0f0f0', marginVertical: 5 },
  metricsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  mLabel: { fontSize: 8, color: '#999' },
  mVal: { fontSize: 13, fontWeight: 'bold' },
  logFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 15 },
  adminText: { fontSize: 10, color: '#999', fontStyle: 'italic' }
});

export default HistoryLog;
