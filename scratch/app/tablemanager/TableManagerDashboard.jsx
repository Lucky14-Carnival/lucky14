import React, { useState, useEffect } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  StyleSheet, View, Text, TextInput, TouchableOpacity,
  SafeAreaView, KeyboardAvoidingView, Platform, ScrollView, Alert, StatusBar
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { submitTableManagerReport } from '../../services/adminApi';

const TableManagerDashboard = () => {
  const router = useRouter();
  const params = useLocalSearchParams();

  const [currentDate, setCurrentDate] = useState('');
  const [userRole, setUserRole] = useState(params.role || '');
  const [tableLabel, setTableLabel] = useState(params.tableLabel || '');
  const [revenue, setRevenue] = useState('');
  const [amount, setAmount] = useState('');
  const [reportType, setReportType] = useState('Expense');
  const [budgetAmount, setBudgetAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const today = new Date();
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    setCurrentDate(today.toLocaleDateString('en-PH', options));
  }, []);

  const handleProfilePress = () => {
    router.push({
      pathname: '/ProfileScreen',
      params: {
        userId: params.userId,
        name: params.name,
        email: params.email,
        role: params.role,
        contact: params.contact,
        branchId: params.branchId,
        active: params.active,
      }
    });
  };

  const handleReportSubmit = async () => {
    const hasData = revenue.trim() !== '' || amount.trim() !== '' || budgetAmount.trim() !== '';

    if (!hasData) {
      Alert.alert('Empty Report', 'Please fill up at least one section before submitting.');
      return;
    }

    try {
      setIsSubmitting(true);
      await submitTableManagerReport({
        branchId: params.branchId,
        userId: params.userId,
        tableLabel,
        revenue,
        amount,
        reportType,
        budgetAmount,
      });
      Alert.alert('Success', 'Your transaction entries have been submitted to the server.');
      setRevenue('');
      setAmount('');
      setBudgetAmount('');
    } catch (error) {
      Alert.alert('Submit Failed', error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerSection}>
        <View style={styles.headerTop}>
          <TouchableOpacity
            style={styles.profileRow}
            onPress={handleProfilePress}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <MaterialCommunityIcons name="account-circle" size={55} color="#FFF" />
            <View style={styles.profileTextContainer}>
              <Text style={styles.userRoleText}>{userRole || 'Table Manager'}</Text>
              <View style={styles.dateBadge}>
                <MaterialCommunityIcons name="calendar-clock" size={12} color="#FFF" />
                <Text style={styles.dateText}>{currentDate}</Text>
              </View>
              <Text style={styles.viewProfileSmall}>Tap to view profile</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} bounces={false} showsVerticalScrollIndicator={false}>
          <View style={styles.formContainer}>
            <Text style={styles.sectionLabel}>Shift Table Monitoring</Text>
            <View style={styles.performanceCard}>
              <View style={styles.cardHeader}>
                <MaterialCommunityIcons name="pencil-outline" size={18} color="#0f6915" />
                <TextInput
                  style={styles.tableNameInput}
                  value={tableLabel}
                  onChangeText={setTableLabel}
                  placeholder="Table label"
                />
              </View>
              <Text style={styles.miniLabel}>Input Revenue (Optional)</Text>
              <View style={styles.revenueRow}>
                <Text style={styles.pesoSign}>P</Text>
                <TextInput
                  style={styles.revenueInput}
                  placeholder="0.00"
                  keyboardType="numeric"
                  value={revenue}
                  onChangeText={setRevenue}
                />
              </View>
            </View>

            <Text style={styles.sectionLabel}>Budget Tracking</Text>
            <View style={styles.performanceCard}>
              <Text style={styles.miniLabel}>Budget Limit</Text>
              <View style={styles.revenueRow}>
                <Text style={styles.pesoSign}>P</Text>
                <TextInput
                  style={styles.revenueInput}
                  placeholder="0.00"
                  keyboardType="numeric"
                  value={budgetAmount}
                  onChangeText={setBudgetAmount}
                />
              </View>
            </View>

            <Text style={styles.sectionLabel}>Financial Reporting</Text>
            <View style={styles.toggleWrapper}>
              {['Expense', 'Borrowing'].map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[styles.toggleBtn, reportType === type && styles.toggleActive]}
                  onPress={() => setReportType(type)}
                >
                  <Text style={[styles.toggleText, reportType === type && styles.toggleTextActive]}>{type}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.inputWrapper}>
              <Text style={styles.currencyPrefix}>P</Text>
              <TextInput
                style={styles.input}
                placeholder="Amount"
                value={amount}
                onChangeText={setAmount}
                keyboardType="numeric"
              />
            </View>

            <TouchableOpacity style={styles.reportButton} onPress={handleReportSubmit} disabled={isSubmitting}>
              <Text style={styles.reportButtonText}>{isSubmitting ? 'Submitting...' : 'Submit Report'}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f6915' },
  headerSection: {
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 15 : 20,
    paddingHorizontal: 25,
    paddingBottom: 25
  },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  profileRow: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  profileTextContainer: { marginLeft: 12 },
  userRoleText: { fontSize: 18, fontWeight: 'bold', color: '#FFF' },
  viewProfileSmall: { fontSize: 10, color: '#FFF', opacity: 0.7, marginTop: 2 },
  dateBadge: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  dateText: { color: '#FFF', fontSize: 11, fontWeight: '500', marginLeft: 4, opacity: 0.9 },

  formContainer: {
    flexGrow: 1,
    backgroundColor: '#E6912C',
    borderTopLeftRadius: 50,
    borderTopRightRadius: 50,
    paddingHorizontal: 30,
    paddingTop: 30,
    paddingBottom: 40
  },
  sectionLabel: { fontSize: 17, fontWeight: 'bold', color: '#333', marginBottom: 12 },
  performanceCard: { backgroundColor: 'rgba(255, 255, 255, 0.95)', borderRadius: 20, padding: 18, marginBottom: 20, elevation: 4 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, borderBottomWidth: 1, borderBottomColor: '#eee', paddingBottom: 5 },
  tableNameInput: { fontSize: 18, fontWeight: '800', marginLeft: 10, color: '#0f6915', flex: 1 },
  miniLabel: { fontSize: 12, color: '#777', marginBottom: 8, fontWeight: '500' },
  revenueRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 15, borderWidth: 1.5, borderColor: '#107b49' },
  pesoSign: { fontSize: 20, fontWeight: 'bold', color: '#0f6915', marginRight: 5 },
  revenueInput: { flex: 1, height: 48, fontSize: 22, color: '#000', fontWeight: 'bold' },

  toggleWrapper: { flexDirection: 'row', backgroundColor: 'rgba(255, 255, 255, 0.3)', borderRadius: 25, marginBottom: 15, padding: 5 },
  toggleBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 20 },
  toggleActive: { backgroundColor: '#107b49' },
  toggleText: { color: '#12551b', fontWeight: '600' },
  toggleTextActive: { color: '#FFF' },

  inputWrapper: { flexDirection: 'row', backgroundColor: 'rgba(255, 255, 255, 0.3)', borderRadius: 20, height: 55, marginBottom: 15, alignItems: 'center', paddingHorizontal: 20 },
  textArea: { height: 80, alignItems: 'flex-start', paddingTop: 12 },
  currencyPrefix: { color: '#12551b', fontWeight: 'bold', marginRight: 5 },
  input: { flex: 1, fontSize: 16, color: '#000' },

  reportButton: { backgroundColor: '#107b49', borderRadius: 25, height: 55, justifyContent: 'center', alignItems: 'center', marginTop: 10, elevation: 5 },
  reportButtonText: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold' },
});

export default TableManagerDashboard;
