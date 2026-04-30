import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import {
  createBranchAccount,
  getBranchAccounts,
  setBranchAccountStatus,
  updateBranchAccount,
} from '../../services/adminApi';
import { useFocusEffect } from '@react-navigation/native';

const SORT_OPTIONS = [
  { key: 'name', label: 'Name' },
  { key: 'status', label: 'Status' },
  { key: 'managerCount', label: 'Users' },
];

const EMPTY_FORM = {
  province: '',
  municipality: '',
  barangay: '',
  landmark: '',
};

const normalize = (value) => String(value || '').toLowerCase();

const BranchAccounts = () => {
  const router = useRouter();
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState('name');
  const [ascending, setAscending] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingBranch, setEditingBranch] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      setItems(await getBranchAccounts());
    } catch (error) {
      Alert.alert('Branch Accounts Error', error.message);
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
        [item.name, item.status, item.email, item.phone, item.province, item.municipality, item.barangay, item.landmark]
          .some((value) => normalize(value).includes(query))
      )
      .sort((left, right) => {
        const leftValue = left[sortKey];
        const rightValue = right[sortKey];

        if (typeof leftValue === 'number' || typeof rightValue === 'number') {
          return ascending ? Number(leftValue) - Number(rightValue) : Number(rightValue) - Number(leftValue);
        }

        return ascending
          ? normalize(leftValue).localeCompare(normalize(rightValue))
          : normalize(rightValue).localeCompare(normalize(leftValue));
      });
  }, [ascending, items, search, sortKey]);

  const openAddModal = () => {
    setEditingBranch(null);
    setForm(EMPTY_FORM);
    setModalVisible(true);
  };

  const openEditModal = (branch) => {
    setEditingBranch(branch);
    setForm({
      province: branch.province || '',
      municipality: branch.municipality || '',
      barangay: branch.barangay || '',
      landmark: branch.landmark || '',
    });
    setModalVisible(true);
  };

  const closeModal = () => {
    if (isSaving) {
      return;
    }

    setModalVisible(false);
    setEditingBranch(null);
    setForm(EMPTY_FORM);
  };

  const updateFormField = (key, value) => {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const handleSaveBranch = async () => {
    if (!form.province.trim() || !form.municipality.trim() || !form.barangay.trim()) {
      Alert.alert('Missing Fields', 'Province, municipality, and barangay are required.');
      return;
    }

    try {
      setIsSaving(true);
      const payload = {
        province: form.province.trim(),
        municipality: form.municipality.trim(),
        barangay: form.barangay.trim(),
        landmark: form.landmark.trim(),
        active: editingBranch?.active ?? true,
      };

      if (editingBranch) {
        await updateBranchAccount(editingBranch.id, payload);
      } else {
        await createBranchAccount(payload);
      }

      closeModal();
      await loadData();
      Alert.alert('Success', editingBranch ? 'Branch updated successfully.' : 'Branch added successfully.');
    } catch (error) {
      Alert.alert(editingBranch ? 'Update Failed' : 'Add Failed', error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const applyBranchAction = async (branch, action) => {
    try {
      await setBranchAccountStatus(branch.id, action);
      await loadData();
      Alert.alert('Success', action === 'delete' ? 'Branch deleted successfully.' : 'Branch set to inactive successfully.');
    } catch (error) {
      Alert.alert(action === 'delete' ? 'Delete Failed' : 'Inactive Failed', error.message);
    }
  };

  const handleBranchAction = (branch) => {
    Alert.alert(
      'Branch Action',
      `Choose what to do with ${branch.name}.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Inactive',
          onPress: () => applyBranchAction(branch, 'inactive'),
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => applyBranchAction(branch, 'delete'),
        }
      ]
    );
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.titleBlock}>
          <Text style={styles.cardTitle}>{item.name}</Text>
          <Text style={[styles.status, item.status === 'Active' ? styles.statusActive : styles.statusInactive]}>
            {item.status}
          </Text>
        </View>
        <View style={styles.sideActions}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{item.activeUsers}/{item.managerCount}</Text>
          </View>
          <TouchableOpacity style={[styles.actionButton, styles.editButton]} onPress={() => openEditModal(item)}>
            <Text style={styles.actionButtonText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionButton, styles.deleteButton]} onPress={() => handleBranchAction(item)}>
            <Text style={styles.actionButtonText}>Action</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.row}>
        <MaterialCommunityIcons name="map-marker-outline" size={18} color="#12551b" />
        <Text style={styles.rowText}>{item.landmark || 'No landmark set'}</Text>
      </View>
      <View style={styles.row}>
        <MaterialCommunityIcons name="account-group-outline" size={18} color="#12551b" />
        <Text style={styles.rowText}>{item.managerCount} branch users</Text>
      </View>
      <View style={styles.row}>
        <MaterialCommunityIcons name="email-outline" size={18} color="#12551b" />
        <Text style={styles.rowText}>{item.email || 'No branch email'}</Text>
      </View>
      <View style={styles.row}>
        <MaterialCommunityIcons name="phone-outline" size={18} color="#12551b" />
        <Text style={styles.rowText}>{item.phone || 'No branch phone'}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#FFF" />
        </TouchableOpacity>
        <View style={styles.headerTextWrap}>
          <Text style={styles.headerTitle}>Branch Accounts</Text>
          <Text style={styles.headerSubtitle}>Manage branches and account coverage</Text>
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
            placeholder="Search branch, status, email, phone"
            style={styles.searchInput}
          />
        </View>

        <View style={styles.addBranchRow}>
          <TouchableOpacity style={styles.addCircle} onPress={openAddModal} activeOpacity={0.8}>
            <MaterialCommunityIcons name="plus" size={30} color="#FFF" />
          </TouchableOpacity>
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
            renderItem={renderItem}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={<Text style={styles.emptyText}>No branch accounts matched your search.</Text>}
            contentContainerStyle={styles.listContent}
          />
        )}
      </View>

      <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={closeModal}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{editingBranch ? 'Edit Branch Account' : 'Add Branch Account'}</Text>

            <TextInput
              value={form.province}
              onChangeText={(value) => updateFormField('province', value)}
              placeholder="Province"
              style={styles.modalInput}
            />
            <TextInput
              value={form.municipality}
              onChangeText={(value) => updateFormField('municipality', value)}
              placeholder="Municipality"
              style={styles.modalInput}
            />
            <TextInput
              value={form.barangay}
              onChangeText={(value) => updateFormField('barangay', value)}
              placeholder="Barangay"
              style={styles.modalInput}
            />
            <TextInput
              value={form.landmark}
              onChangeText={(value) => updateFormField('landmark', value)}
              placeholder="Landmark"
              style={styles.modalInput}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.modalButton, styles.cancelButton]} onPress={closeModal} disabled={isSaving}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, styles.saveButton]} onPress={handleSaveBranch} disabled={isSaving}>
                <Text style={styles.saveButtonText}>{isSaving ? 'Saving...' : 'Save'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  addBranchRow: { alignItems: 'center', marginTop: 18, marginBottom: 6 },
  addCircle: { width: 68, height: 68, borderRadius: 34, backgroundColor: '#E6912C', justifyContent: 'center', alignItems: 'center', elevation: 4 },
  filters: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 14, marginBottom: 14 },
  filterChip: { paddingHorizontal: 14, height: 36, borderRadius: 18, backgroundColor: '#E6E6E6', justifyContent: 'center', marginRight: 10, marginBottom: 10 },
  filterChipActive: { backgroundColor: '#12551b' },
  filterText: { color: '#12551b', fontWeight: '600' },
  filterTextActive: { color: '#FFF' },
  loader: { marginTop: 40 },
  listContent: { paddingBottom: 30 },
  card: { backgroundColor: '#FFF', borderRadius: 16, padding: 16, marginBottom: 12 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 },
  titleBlock: { flex: 1, paddingRight: 12 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#183A1D' },
  status: { marginTop: 4, fontWeight: '600' },
  statusActive: { color: '#2E7D32' },
  statusInactive: { color: '#C62828' },
  sideActions: { alignItems: 'center' },
  badge: { minWidth: 56, height: 32, borderRadius: 16, backgroundColor: '#E6912C', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 10 },
  badgeText: { color: '#FFF', fontWeight: '700' },
  actionButton: { marginTop: 8, minWidth: 70, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 12 },
  editButton: { backgroundColor: '#12551b' },
  deleteButton: { backgroundColor: '#C62828' },
  actionButtonText: { color: '#FFF', fontWeight: '700', fontSize: 12 },
  row: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  rowText: { marginLeft: 10, color: '#444', flex: 1 },
  emptyText: { textAlign: 'center', color: '#666', marginTop: 36 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', padding: 24 },
  modalCard: { backgroundColor: '#FFF', borderRadius: 20, padding: 20 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#183A1D', marginBottom: 14 },
  modalInput: { backgroundColor: '#F3F3F3', borderRadius: 12, paddingHorizontal: 14, height: 48, marginBottom: 12, color: '#222' },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 4 },
  modalButton: { minWidth: 96, height: 42, borderRadius: 21, justifyContent: 'center', alignItems: 'center', marginLeft: 10, paddingHorizontal: 14 },
  cancelButton: { backgroundColor: '#E6E6E6' },
  saveButton: { backgroundColor: '#12551b' },
  cancelButtonText: { color: '#444', fontWeight: '700' },
  saveButtonText: { color: '#FFF', fontWeight: '700' },
});

export default BranchAccounts;
