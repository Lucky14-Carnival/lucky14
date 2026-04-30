import React, { useCallback, useEffect, useState } from 'react';
import {
  StyleSheet, View, Text, TouchableOpacity,
  ScrollView, SafeAreaView, Alert, Platform, StatusBar
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { finalizeDashboardReport, getDashboardSummary } from '../../services/adminApi';

const formatLocalDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const AdminDashboard = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [currentDate, setCurrentDate] = useState('');
  const [todayRevenue, setTodayRevenue] = useState(0);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [pendingFunds, setPendingFunds] = useState(0);
  const [budgetAllocated, setBudgetAllocated] = useState(0);
  const [isFinalized, setIsFinalized] = useState(false);
  const [branchName, setBranchName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [reportId, setReportId] = useState(null);
  const [reportDate, setReportDate] = useState('');

  const userRole = params.role || 'Administrator';

  useEffect(() => {
    const today = new Date();
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    setCurrentDate(today.toLocaleDateString('en-PH', options));
  }, []);

  const loadSummary = useCallback(async () => {
    try {
      setIsLoading(true);
      const summary = await getDashboardSummary({ branchId: params.branchId });
      setReportId(summary.reportId || null);
      setTodayRevenue(summary.todayRevenue || 0);
      setTotalExpenses(summary.totalExpenses || 0);
      setPendingFunds(summary.pendingFunds || 0);
      setBudgetAllocated(summary.budgetAllocated || 0);
      setIsFinalized(Boolean(summary.isFinalized));
      setBranchName(summary.branchName || '');
      setReportDate(summary.reportDate || '');
    } catch (error) {
      Alert.alert('Dashboard Error', error.message);
    } finally {
      setIsLoading(false);
    }
  }, [params.branchId]);

  useFocusEffect(
    useCallback(() => {
      loadSummary();
    }, [loadSummary])
  );

  const finalizeNightlyReport = () => {
    Alert.alert(
      'Finalize Report',
      "Are you sure? This will lock today's data and record it in the History Log.",
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Finalize',
          onPress: async () => {
            try {
              await finalizeDashboardReport({
                reportId,
                branchId: params.branchId,
                userId: params.userId,
                date: reportDate || formatLocalDate(new Date()),
                user: params.name || '',
              });
              await loadSummary();
              Alert.alert('Success', 'Report finalized and saved to the database for superadmin review.');
            } catch (error) {
              Alert.alert('Finalize Failed', error.message);
            }
          }
        }
      ]
    );
  };

  const handleAction = (actionName) => {
    if (isFinalized && !['View Reports', 'History'].includes(actionName)) {
      Alert.alert('Access Denied', 'Finalized reports cannot be modified.');
      return;
    }

    switch (actionName) {
      case 'History':
        router.push({ pathname: '../admin/HistoryLog', params });
        break;
      case 'Revenue':
        router.push({ pathname: '../admin/RecordRevenue', params });
        break;
      case 'Budget Tracking':
        router.push({ pathname: '../admin/BudgetTracking', params });
        break;
      case 'Attraction Expenses':
        router.push({ pathname: '../admin/AttractionExpenses', params });
        break;
      case 'Borrowed Funds':
        router.push({ pathname: '../admin/BorrowedFund', params });
        break;
      case 'View Reports':
        router.push({
          pathname: '../admin/FinalizedReport',
          params: {
            ...params,
            reportId,
          },
        });
        break;
      case 'Create Account':
        router.push({
          pathname: '/SignUpform',
          params: {
            creatorRole: params.role,
            creatorUserId: params.userId,
            creatorBranchId: params.branchId,
            creatorName: params.name,
          },
        });
        break;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.profileRow}>
            <TouchableOpacity style={styles.profileCircle} onPress={() => router.push({ pathname: '/ProfileScreen', params: { ...params, active: true } })}>
              <MaterialCommunityIcons name="account" size={30} color="#0f6915" />
            </TouchableOpacity>
            <View style={styles.welcomeContainer}>
              <Text style={styles.welcomeText}>Hi, {params.name || 'User'}</Text>
              <Text style={styles.userRoleText}>{userRole}</Text>
            </View>
            <TouchableOpacity style={styles.historyIconCircle} onPress={() => handleAction('History')}>
              <MaterialCommunityIcons name="history" size={20} color="#0f6915" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.headerRight}>
          <View style={styles.branchBadge}>
            <MaterialCommunityIcons name="map-marker" size={14} color="#FFF" />
          <Text style={styles.branchText}>{branchName || 'No branch'}</Text>
          </View>
          <View style={styles.dateContainer}>
            <MaterialCommunityIcons name="calendar-clock" size={12} color="#FFF" />
            <Text style={styles.dateText}>{currentDate}</Text>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Today's Revenue</Text>
            <Text style={[styles.statValue, { color: '#0f6915' }]}>
              {isLoading ? 'Loading...' : `P ${todayRevenue.toLocaleString()}`}
            </Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Total Expenses</Text>
            <Text style={[styles.statValue, { color: '#d32f2f' }]}>
              {isLoading ? 'Loading...' : `P ${totalExpenses.toLocaleString()}`}
            </Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Financial Operations</Text>
        <View style={styles.grid}>
          <MenuButton title="Record Revenue" icon="cash-register" color="#0f6915" onPress={() => handleAction('Revenue')} />
          <MenuButton title="Budget Tracking" icon="wallet" color="#E6912C" onPress={() => handleAction('Budget Tracking')} />
          <MenuButton title="Attraction Expenses" icon="ferris-wheel" color="#E6912C" onPress={() => handleAction('Attraction Expenses')} />
          <MenuButton title="Borrowed Funds" icon="hand-coin" color="#0f6915" onPress={() => handleAction('Borrowed Funds')} />
          <MenuButton title="Create Account" icon="account-plus" color="#E6912C" onPress={() => handleAction('Create Account')} />
        </View>

        <Text style={styles.sectionTitle}>Reports Management</Text>
        <View style={styles.reportCard}>
          <View style={styles.reportInfo}>
            <MaterialCommunityIcons name="file-chart" size={40} color="#0f6915" />
            <View style={{ marginLeft: 15 }}>
              <Text style={styles.reportTitle}>Report Table</Text>
              <Text style={styles.reportStatus}>
                Status:{' '}
                {isFinalized ? (
                  <Text style={{ color: 'red', fontWeight: 'bold' }}>FINALIZED</Text>
                ) : (
                  <Text style={{ color: 'green', fontWeight: 'bold' }}>EDITABLE</Text>
                )}
              </Text>
            </View>
          </View>
          <View style={styles.reportActions}>
            <TouchableOpacity style={[styles.actionBtn, styles.viewBtn]} onPress={() => handleAction('View Reports')}>
              <Text style={styles.btnText}>View Summary</Text>
            </TouchableOpacity>
            {!isFinalized && (
              <TouchableOpacity style={[styles.actionBtn, styles.finalizeBtn]} onPress={finalizeNightlyReport}>
                <Text style={styles.btnText}>Finalize</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={styles.bottomSummary}>
          <Text style={styles.bottomSummaryLabel}>Pending Funds</Text>
          <Text style={styles.bottomSummaryValue}>P {pendingFunds.toLocaleString()}</Text>
          <Text style={styles.bottomSummaryLabel}>Budget Allocated</Text>
          <Text style={styles.bottomSummaryValue}>P {budgetAllocated.toLocaleString()}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const MenuButton = ({ title, icon, color, onPress }) => (
  <TouchableOpacity style={styles.menuBtn} activeOpacity={0.7} onPress={onPress}>
    <View style={[styles.iconCircle, { backgroundColor: color }]}>
      <MaterialCommunityIcons name={icon} size={30} color="#FFF" />
    </View>
    <Text style={styles.menuBtnText}>{title}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f4f4' },
  header: { backgroundColor: '#0f6915', paddingHorizontal: 20, paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 20 : 50, paddingBottom: 25, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomLeftRadius: 30, borderBottomRightRadius: 30, elevation: 5 },
  headerLeft: { flex: 1.5 },
  profileRow: { flexDirection: 'row', alignItems: 'center' },
  profileCircle: { backgroundColor: '#FFF', padding: 8, borderRadius: 25 },
  welcomeContainer: { marginLeft: 10 },
  welcomeText: { fontSize: 16, fontWeight: 'bold', color: '#FFF' },
  userRoleText: { fontSize: 12, color: '#ffcc80', fontWeight: '600' },
  historyIconCircle: { backgroundColor: '#ffcc80', width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginLeft: 15, elevation: 3 },
  headerRight: { alignItems: 'flex-end' },
  branchBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.2)', paddingVertical: 4, paddingHorizontal: 10, borderRadius: 12, marginBottom: 4 },
  branchText: { color: '#FFF', fontSize: 13, marginLeft: 5, fontWeight: 'bold' },
  dateContainer: { flexDirection: 'row', alignItems: 'center', paddingRight: 5 },
  dateText: { color: '#FFF', fontSize: 11, fontWeight: '500', marginLeft: 4, opacity: 0.9 },
  scrollContainer: { padding: 20 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 25 },
  statBox: { width: '48%', padding: 15, borderRadius: 15, elevation: 3, backgroundColor: '#FFF' },
  statLabel: { fontSize: 12, color: '#666', fontWeight: 'bold' },
  statValue: { fontSize: 16, fontWeight: 'bold', marginTop: 5 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 15, marginTop: 10 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  menuBtn: { width: '48%', backgroundColor: '#FFF', padding: 20, borderRadius: 20, alignItems: 'center', marginBottom: 15, elevation: 2 },
  iconCircle: { width: 55, height: 55, borderRadius: 27.5, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  menuBtnText: { fontWeight: '600', color: '#333', fontSize: 12, textAlign: 'center' },
  reportCard: { backgroundColor: '#FFF', padding: 20, borderRadius: 20, elevation: 2 },
  reportInfo: { flexDirection: 'row', alignItems: 'center' },
  reportTitle: { fontSize: 16, fontWeight: 'bold' },
  reportStatus: { fontSize: 13, color: '#666', marginTop: 2 },
  reportActions: { flexDirection: 'row', marginTop: 15, justifyContent: 'flex-end' },
  actionBtn: { paddingVertical: 8, paddingHorizontal: 20, borderRadius: 10, marginLeft: 10 },
  viewBtn: { backgroundColor: '#E6912C' },
  finalizeBtn: { backgroundColor: '#0f6915' },
  btnText: { color: '#FFF', fontWeight: 'bold', fontSize: 12 },
  bottomSummary: { marginTop: 20, backgroundColor: '#FFF', borderRadius: 20, padding: 20, elevation: 2 },
  bottomSummaryLabel: { fontSize: 12, color: '#666', fontWeight: 'bold' },
  bottomSummaryValue: { fontSize: 18, color: '#0f6915', fontWeight: 'bold', marginBottom: 12 },
});

export default AdminDashboard;
