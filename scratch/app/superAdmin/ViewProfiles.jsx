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
import { getSuperAdminProfiles, setSuperAdminProfileStatus } from '../../services/adminApi';

const SORT_OPTIONS = [
  { key: 'name', label: 'Name' },
  { key: 'role', label: 'Role' },
  { key: 'branchId', label: 'Branch' },
];

const normalize = (value) => String(value || '').toLowerCase();

const ViewProfiles = () => {
  const router = useRouter();
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState('name');
  const [ascending, setAscending] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      setItems(await getSuperAdminProfiles());
    } catch (error) {
      Alert.alert('Profiles Error', error.message);
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
        [item.name, item.role, item.roleLabel, item.email, item.phone, item.branchId, item.branchName]
          .some((value) => normalize(value).includes(query))
      )
      .sort((left, right) => {
        if (sortKey === 'branchId') {
          return ascending ? Number(left.branchId) - Number(right.branchId) : Number(right.branchId) - Number(left.branchId);
        }

        return ascending
          ? normalize(left[sortKey]).localeCompare(normalize(right[sortKey]))
          : normalize(right[sortKey]).localeCompare(normalize(left[sortKey]));
      });
  }, [ascending, items, search, sortKey]);

  const openProfile = (item) => {
    router.push({
      pathname: '/ProfileScreen',
      params: {
        userId: item.id,
        name: item.name,
        role: item.role,
        email: item.email,
        contact: item.phone,
        viewOnly: 'true',
        viewerContext: 'superadmin',
      },
    });
  };

  const applyProfileAction = async (item, action) => {
    try {
      await setSuperAdminProfileStatus(item.id, action);
      await loadData();
      Alert.alert('Success', action === 'delete' ? 'User deleted successfully.' : 'User set to inactive successfully.');
    } catch (error) {
      Alert.alert(action === 'delete' ? 'Delete Failed' : 'Inactive Failed', error.message);
    }
  };

  const handleProfileAction = (item) => {
    Alert.alert(
      'Profile Action',
      `Choose what to do with ${item.name}.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Inactive',
          onPress: () => applyProfileAction(item, 'inactive'),
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => applyProfileAction(item, 'delete'),
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#FFF" />
        </TouchableOpacity>
        <View style={styles.headerTextWrap}>
          <Text style={styles.headerTitle}>View Profiles</Text>
          <Text style={styles.headerSubtitle}>Review and manage user accounts</Text>
        </View>
        <TouchableOpacity style={styles.iconButton} onPress={() => setAscending((value) => !value)}>
          <MaterialCommunityIcons name={ascending ? 'sort-alphabetical-ascending' : 'sort-alphabetical-descending'} size={22} color="#FFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={styles.searchBox}>
          <MaterialCommunityIcons name="magnify" size={20} color="#666" />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search name, role, branch, email, phone"
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
            ListEmptyComponent={<Text style={styles.emptyText}>No profiles matched your search.</Text>}
            renderItem={({ item }) => (
              <View style={styles.card}>
                <View style={styles.avatar}>
                  <MaterialCommunityIcons name="account" size={28} color="#12551b" />
                </View>
                <TouchableOpacity style={styles.cardContent} onPress={() => openProfile(item)} activeOpacity={0.8}>
                  <View style={styles.contentTop}>
                    <View style={styles.mainContent}>
                      <Text style={styles.cardTitle}>{item.name || 'Unnamed User'}</Text>
                      <Text style={styles.subtitle}>
                        {(item.roleLabel || item.role || 'No role')} | {item.branchName || `Branch #${item.branchId || '-'}`}
                      </Text>
                      <Text style={styles.infoText}>{item.email || 'No email'}</Text>
                      <Text style={styles.infoText}>{item.phone || 'No phone number'}</Text>
                    </View>
                    <View style={styles.sideColumn}>
                      <Text style={[styles.status, item.active ? styles.statusActive : styles.statusInactive]}>
                        {item.active ? 'Active' : 'Inactive'}
                      </Text>
                      <TouchableOpacity style={styles.deleteButton} onPress={() => handleProfileAction(item)}>
                        <Text style={styles.deleteButtonText}>Action</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </TouchableOpacity>
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
  card: { backgroundColor: '#FFF', borderRadius: 16, padding: 14, marginBottom: 12, flexDirection: 'row' },
  avatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: '#EAF4EC', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  cardContent: { flex: 1 },
  contentTop: { flexDirection: 'row', justifyContent: 'space-between' },
  mainContent: { flex: 1, paddingRight: 12 },
  sideColumn: { alignItems: 'center', minWidth: 84 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#183A1D' },
  status: { fontWeight: '700', fontSize: 12 },
  statusActive: { color: '#2E7D32' },
  statusInactive: { color: '#C62828' },
  subtitle: { marginTop: 4, color: '#666', fontWeight: '600' },
  infoText: { marginTop: 6, color: '#444' },
  deleteButton: { marginTop: 10, backgroundColor: '#C62828', minWidth: 74, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 12 },
  deleteButtonText: { color: '#FFF', fontWeight: '700', fontSize: 12 },
  emptyText: { textAlign: 'center', color: '#666', marginTop: 36 },
});

export default ViewProfiles;
