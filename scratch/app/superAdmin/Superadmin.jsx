import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator, StyleSheet, View, Text, TouchableOpacity, SafeAreaView,
  FlatList, ScrollView, Alert, Platform
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getSuperAdminOverview } from '../../services/adminApi';

const COLORS = {
  royalGreen: '#12551b',
  forestGreen: '#0f6915',
  gold: '#E6912C',
  deepOrange: '#E6912C',
  white: '#FFFFFF',
  cardBg: 'rgba(255, 255, 255, 0.1)',
};

const EMPTY_TOTALS = {
  revenue: 0,
  borrow: 0,
  net: 0,
};

const formatMoney = (value) => `P${(Number(value) || 0).toLocaleString()}`;

const SuperAdminDashboard = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [currentDate, setCurrentDate] = useState('');
  const [branches, setBranches] = useState([]);
  const [totals, setTotals] = useState(EMPTY_TOTALS);
  const [ownerName, setOwnerName] = useState(params.name || '');
  const [isLoadingOverview, setIsLoadingOverview] = useState(true);

  const loadOverview = useCallback(async () => {
    try {
      setIsLoadingOverview(true);
      const overview = await getSuperAdminOverview();
      setBranches(Array.isArray(overview.branches) ? overview.branches : []);
      setTotals({
        revenue: overview.totals?.revenue || 0,
        borrow: overview.totals?.borrow || 0,
        net: overview.totals?.net || 0,
      });
      if (overview.ownerName) {
        setOwnerName(overview.ownerName);
      }
    } catch (error) {
      Alert.alert('Overview Error', error.message);
    } finally {
      setIsLoadingOverview(false);
    }
  }, []);

  useEffect(() => {
    const today = new Date();
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    setCurrentDate(today.toLocaleDateString('en-PH', options));
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadOverview();
      const intervalId = setInterval(() => {
        loadOverview();
      }, 15000);

      return () => {
        clearInterval(intervalId);
      };
    }, [loadOverview])
  );

  const handleProfilePress = () => {
    router.push({
      pathname: '/ProfileScreen',
      params: {
        userId: params.userId,
        name: ownerName,
        role: params.role || '',
        email: params.email,
        contact: params.contact,
        branchId: params.branchId,
        active: params.active,
        canEdit: true,
      }
    });
  };

  const handleAction = (actionName) => {
    const routes = {
      'Branch Accounts': '/superAdmin/BranchAccounts',
      'Borrowing History': '/superAdmin/BorrowingHistory',
      'Generate Reports': '/superAdmin/GenerateReports',
      'View Profiles': '/superAdmin/ViewProfiles',
      'Create Account': '/SignUpform',
    };

    const pathname = routes[actionName];

    if (!pathname) {
      Alert.alert('Unavailable', 'This action is not wired yet.');
      return;
    }

    router.push({
      pathname,
      params: actionName === 'Create Account'
        ? {
            creatorRole: params.role,
            creatorUserId: params.userId,
            creatorBranchId: params.branchId,
            creatorName: ownerName,
          }
        : params,
    });
  };

  const renderSummaryCard = (title, icon, value, isNegative = false) => (
    <View style={styles.summaryCard}>
      <View style={styles.summaryHeader}>
        <MaterialCommunityIcons name={icon} size={20} color={COLORS.gold} />
        <Text style={styles.summaryTitle}>{title}</Text>
      </View>
      <Text style={[styles.summaryValue, isNegative && { color: '#ef5350' }]}>
        {formatMoney(value)}
      </Text>
      <Text style={styles.summaryMonth}>{currentDate || 'No reporting date yet'}</Text>
    </View>
  );

  const renderBranchItem = ({ item }) => (
    <View style={styles.branchCard}>
      <View style={styles.branchInfo}>
        <Text style={styles.branchName}>{item.name || 'Unnamed Branch'}</Text>
        <Text style={[styles.branchStatus, item.status === 'Active' ? { color: '#66bb6a' } : { color: '#ef5350' }]}>
          {item.status || 'Unknown'}
        </Text>
      </View>
      <View style={styles.branchPerf}>
        <Text style={styles.perfLabel}>Performance</Text>
        <Text style={styles.perfValue}>{`${item.perf || 0}%`}</Text>
      </View>
      <View style={styles.branchRev}>
        <Text style={styles.revLabel}>Revenue</Text>
        <Text style={styles.revValue}>{formatMoney(item.revenue)}</Text>
      </View>
      <TouchableOpacity style={styles.viewBranchBtn} onPress={() => handleAction('Branch Accounts')}>
        <MaterialCommunityIcons name="chevron-right" size={24} color={COLORS.white} />
      </TouchableOpacity>
    </View>
  );

  const quickActions = [
    { title: 'Create Account', icon: 'account-plus' },
    { title: 'Branch Accounts', icon: 'office-building' },
    { title: 'Borrowing History', icon: 'history' },
    { title: 'Generate Reports', icon: 'file-document-outline' },
    { title: 'View Profiles', icon: 'account-supervisor-circle' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Super Admin Dashboard</Text>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={handleProfilePress}>
            <MaterialCommunityIcons name="account-circle-outline" size={50} color={COLORS.gold} />
          </TouchableOpacity>
          <View style={styles.headerTextContainer}>
            <Text style={styles.ownerName}>{ownerName || 'Super Admin'}</Text>
            <View style={styles.dateBadge}>
              <MaterialCommunityIcons name="calendar-multiselect" size={14} color={COLORS.gold} />
              <Text style={styles.dateText}>{currentDate}</Text>
            </View>
          </View>
          <View style={styles.headerSpacer} />
        </View>
      </View>

      <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {isLoadingOverview ? (
            <View style={styles.loadingCard}>
              <ActivityIndicator size="large" color={COLORS.royalGreen} />
              <Text style={styles.loadingTitle}>Loading super admin dashboard...</Text>
              <Text style={styles.loadingText}>We are fetching branch and report data.</Text>
            </View>
          ) : null}

          <Text style={styles.sectionLabel}>Financial Overview</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.summaryGrid}>
            {renderSummaryCard('Total Revenue', 'bank-transfer-in', totals.revenue)}
            {renderSummaryCard('Total Borrowings', 'hand-coin', totals.borrow, true)}
            {renderSummaryCard('Net Profit', 'scale-balance', totals.net)}
          </ScrollView>

          <View style={styles.divider} />

          <View style={styles.branchSectionHeader}>
            <Text style={styles.sectionLabel}>Branch Performance</Text>
            <TouchableOpacity style={styles.viewAllBtn} onPress={() => handleAction('Branch Accounts')}>
              <Text style={styles.viewAllText}>View All</Text>
              <MaterialCommunityIcons name="arrow-right" size={16} color={COLORS.gold} />
            </TouchableOpacity>
          </View>

          <FlatList
            data={branches}
            renderItem={renderBranchItem}
            keyExtractor={(item, index) => item.id?.toString() || `branch-${index}`}
            scrollEnabled={false}
            style={styles.branchList}
            ListEmptyComponent={<Text style={styles.emptyText}>No branch data available from the API.</Text>}
          />

          <View style={styles.divider} />

          <Text style={styles.sectionLabel}>Quick Management Tools</Text>
          <View style={styles.actionGrid}>
            {quickActions.map((action) => (
              <TouchableOpacity key={action.title} style={styles.actionCard} onPress={() => handleAction(action.title)}>
                <MaterialCommunityIcons name={action.icon} size={30} color={COLORS.gold} />
                <Text style={styles.actionText}>{action.title}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.integrityAlert}>
            <MaterialCommunityIcons name="alert-octagon" size={20} color={COLORS.deepOrange} />
            <Text style={styles.integrityText}>
              Finalized reports should come from the audit API and stay read-only after approval.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.royalGreen },
  header: { paddingTop: Platform.OS === 'android' ? 34 : 30, paddingHorizontal: 25, paddingBottom: 30 },
  headerTitle: { color: COLORS.white, fontSize: 24, fontWeight: '800', marginBottom: 12 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTextContainer: { flex: 1, marginLeft: 15 },
  ownerName: { fontSize: 20, fontWeight: 'bold', color: COLORS.white },
  dateBadge: { flexDirection: 'row', alignItems: 'center', marginTop: 3 },
  dateText: { color: COLORS.gold, fontSize: 13, fontWeight: '500', marginLeft: 6 },
  headerSpacer: { width: 38 },
  content: { flexGrow: 1, backgroundColor: COLORS.white, borderTopLeftRadius: 50, borderTopRightRadius: 50, paddingHorizontal: 25, paddingTop: 30, paddingBottom: 40 },
  sectionLabel: { fontSize: 17, fontWeight: 'bold', color: COLORS.royalGreen, marginBottom: 15 },
  summaryGrid: { marginBottom: 10, flexDirection: 'row' },
  summaryCard: { backgroundColor: COLORS.royalGreen, borderRadius: 20, padding: 18, width: 180, marginRight: 15, elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 3 },
  summaryHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  summaryTitle: { fontSize: 14, fontWeight: '600', color: COLORS.white, marginLeft: 8 },
  summaryValue: { fontSize: 22, fontWeight: '900', color: COLORS.gold },
  summaryMonth: { fontSize: 11, color: COLORS.white, opacity: 0.7, marginTop: 4, fontWeight: '500' },
  branchSectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  viewAllBtn: { flexDirection: 'row', alignItems: 'center' },
  viewAllText: { fontSize: 13, color: COLORS.gold, fontWeight: '600', marginRight: 5 },
  branchList: { marginBottom: 10 },
  branchCard: { backgroundColor: COLORS.cardBg, borderRadius: 15, padding: 15, marginBottom: 10, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#eee' },
  branchInfo: { flex: 2 },
  branchName: { fontSize: 16, fontWeight: 'bold', color: COLORS.royalGreen },
  branchStatus: { fontSize: 12, fontWeight: '600' },
  branchPerf: { flex: 1, alignItems: 'center' },
  perfLabel: { fontSize: 10, color: '#777' },
  perfValue: { fontSize: 14, fontWeight: 'bold', color: COLORS.forestGreen },
  branchRev: { flex: 2, alignItems: 'flex-end' },
  revLabel: { fontSize: 10, color: '#777' },
  revValue: { fontSize: 15, fontWeight: '900', color: '#333' },
  viewBranchBtn: { marginLeft: 10, backgroundColor: COLORS.forestGreen, borderRadius: 15, padding: 5 },
  divider: { height: 1, backgroundColor: '#eee', marginVertical: 20 },
  actionGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginTop: 8, marginBottom: 28 },
  actionCard: { backgroundColor: COLORS.forestGreen, borderRadius: 20, width: '48%', height: 132, justifyContent: 'center', alignItems: 'center', marginBottom: 18, elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.15, shadowRadius: 3 },
  actionText: { color: COLORS.white, fontSize: 14, fontWeight: '600', marginTop: 10, textAlign: 'center' },
  loadingCard: { backgroundColor: '#F5F8F5', borderRadius: 20, padding: 18, alignItems: 'center', marginBottom: 18, borderWidth: 1, borderColor: '#E3EDE4' },
  loadingTitle: { marginTop: 12, color: COLORS.royalGreen, fontSize: 15, fontWeight: '700' },
  loadingText: { marginTop: 4, color: '#666', fontSize: 12 },
  integrityAlert: { flexDirection: 'row', backgroundColor: '#fff3e0', padding: 15, borderRadius: 15, alignItems: 'center', borderWidth: 1.5, borderColor: COLORS.deepOrange, borderStyle: 'dashed' },
  integrityText: { flex: 1, fontSize: 12, color: COLORS.royalGreen, marginLeft: 10, fontWeight: '500', fontStyle: 'italic', lineHeight: 17 },
  emptyText: { color: '#666', fontSize: 13, paddingVertical: 12 },
});

export default SuperAdminDashboard;
