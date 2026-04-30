import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { getAdminReportById, getDashboardSummary, getLatestAdminReport } from '../../services/adminApi';

const ReportTable = ({ title, icon, color, labels, amount, detail }) => (
  <View style={styles.tableCard}>
    <View style={[styles.tableHeader, { backgroundColor: color }]}>
      <MaterialCommunityIcons name={icon} size={20} color="#FFF" />
      <Text style={styles.tableTitle}>{title}</Text>
    </View>

    <View style={styles.rowLabelContainer}>
      <Text style={styles.columnHeader}>{labels[0]}</Text>
      <Text style={styles.columnHeader}>{labels[1]}</Text>
    </View>

    <View style={styles.rowValueContainer}>
      <View style={[styles.cellBox, styles.amountCell]}>
        <Text style={styles.cellValue}>{amount}</Text>
      </View>
      <View style={[styles.cellBox, styles.detailsCell]}>
        <Text style={styles.cellValue}>{detail}</Text>
      </View>
    </View>
  </View>
);

const FinalizedReport = () => {
  const params = useLocalSearchParams();
  const router = useRouter();
  const [report, setReport] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadReport = async () => {
      try {
        setIsLoading(true);
        const data = params.reportId
          ? await getAdminReportById(params.reportId)
          : await getLatestAdminReport({ branchId: params.branchId });
        if (!data || !data.finalized) {
          const summary = await getDashboardSummary({ branchId: params.branchId });
          setReport({
            id: data?.id ?? summary.reportId ?? null,
            branchId: data?.branchId ?? params.branchId ?? null,
            date: summary.reportDate || data?.date || "",
            revenue: summary.todayRevenue ?? data?.revenue ?? 0,
            expenses: summary.totalExpenses ?? data?.expenses ?? 0,
            borrowings: summary.pendingFunds ?? data?.borrowings ?? 0,
            profit: (summary.todayRevenue ?? data?.revenue ?? 0) - (summary.totalExpenses ?? data?.expenses ?? 0),
            finalized: Boolean(data?.finalized),
            generatedAt: data?.generatedAt || "",
          });
          return;
        }

        setReport(data);
      } catch (error) {
        Alert.alert('Report Error', error.message);
      } finally {
        setIsLoading(false);
      }
    };

    loadReport();
  }, [params.branchId, params.reportId]);

  const netPosition = (report?.profit || 0).toLocaleString();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialCommunityIcons name="chevron-left" size={30} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Report Table</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollPadding}>
        {isLoading ? (
          <ActivityIndicator size="large" color="#0f6915" style={styles.loader} />
        ) : !report ? (
          <Text style={styles.emptyText}>No report available for this branch yet.</Text>
        ) : (
          <>
            <View style={styles.metaCard}>
              <Text style={styles.metaText}>{`Branch #${report.branchId || '-'}`}</Text>
              <Text style={styles.metaText}>
                {report.date ? new Date(report.date).toLocaleDateString('en-PH') : 'No report date'}
              </Text>
              <Text style={[styles.metaText, report.finalized ? styles.finalizedText : styles.draftText]}>
                {report.finalized ? 'Finalized' : 'Draft'}
              </Text>
            </View>

            {!report.finalized ? (
              <View style={styles.editActions}>
                <TouchableOpacity style={[styles.editButton, styles.revenueButton]} onPress={() => router.push({ pathname: '../admin/RecordRevenue', params })}>
                  <Text style={styles.editButtonText}>Edit Revenue</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.editButton, styles.expenseButton]} onPress={() => router.push({ pathname: '../admin/AttractionExpenses', params })}>
                  <Text style={styles.editButtonText}>Edit Expenses</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.editButton, styles.borrowButton]} onPress={() => router.push({ pathname: '../admin/BorrowedFund', params })}>
                  <Text style={styles.editButtonText}>Edit Borrowed Funds</Text>
                </TouchableOpacity>
              </View>
            ) : null}

            <ReportTable
              title="Revenue Table"
              icon="cash-register"
              color="#2e7d32"
              labels={['Total Amount (P)', 'Shift Notes']}
              amount={`P ${report.revenue.toLocaleString()}`}
              detail="Daily sales total"
            />
            <ReportTable
              title="Expenses Table"
              icon="ferris-wheel"
              color="#d32f2f"
              labels={['Total Cost (P)', 'Description']}
              amount={`P ${report.expenses.toLocaleString()}`}
              detail="Recorded branch expenses"
            />
            <ReportTable
              title="Borrowed Table"
              icon="hand-coin"
              color="#1976d2"
              labels={['Loan Amount (P)', 'Source']}
              amount={`P ${report.borrowings.toLocaleString()}`}
              detail="Borrowed fund total"
            />
          </>
        )}

        <View style={styles.summaryTable}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Net Cash Position:</Text>
            <Text style={styles.summaryValue}>{`P ${netPosition}`}</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f2f5' },
  header: {
    backgroundColor: '#0f6915',
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 50 : 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  headerSpacer: { width: 30 },
  scrollPadding: { padding: 15, paddingBottom: 50 },
  loader: { marginTop: 40 },
  emptyText: { textAlign: 'center', color: '#666', marginVertical: 24 },
  metaCard: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  metaText: { color: '#333', fontWeight: '600', marginTop: 4 },
  finalizedText: { color: '#2e7d32' },
  draftText: { color: '#e6a23c' },
  editActions: { marginBottom: 16 },
  editButton: { borderRadius: 10, paddingVertical: 10, paddingHorizontal: 14, marginBottom: 10 },
  revenueButton: { backgroundColor: '#2e7d32' },
  expenseButton: { backgroundColor: '#d32f2f' },
  borrowButton: { backgroundColor: '#1976d2' },
  editButtonText: { color: '#FFF', fontWeight: '700', textAlign: 'center' },
  tableCard: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    marginBottom: 20,
    elevation: 3,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  tableHeader: { flexDirection: 'row', alignItems: 'center', padding: 10 },
  tableTitle: { color: '#FFF', fontWeight: 'bold', marginLeft: 8, fontSize: 14 },
  rowLabelContainer: {
    flexDirection: 'row',
    backgroundColor: '#f8f9fa',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  columnHeader: { flex: 1, fontSize: 12, fontWeight: 'bold', color: '#666', textAlign: 'center' },
  rowValueContainer: { flexDirection: 'row', padding: 10 },
  cellBox: {
    flex: 1,
    padding: 12,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    marginHorizontal: 4,
    justifyContent: 'center',
  },
  cellValue: { fontSize: 14, color: '#333' },
  amountCell: { flex: 0.4 },
  detailsCell: { flex: 0.6 },
  summaryTable: {
    backgroundColor: '#333',
    padding: 20,
    borderRadius: 8,
    marginVertical: 10,
  },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  summaryLabel: { color: '#bbb', fontSize: 14 },
  summaryValue: { color: '#FFF', fontSize: 22, fontWeight: 'bold' },
});

export default FinalizedReport;
