package PawerOpp.Lucky14.Service.reports;

import PawerOpp.Lucky14.dto.reports.ReportsRequest;
import PawerOpp.Lucky14.dto.reports.ReportsResponse;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

public interface IReports {

    ReportsResponse generateDailyReport(ReportsRequest request, Long generatedByUserId);
    ReportsResponse getById(Long reportId);
    List<ReportsResponse> getAll(Long branchId, LocalDate from, LocalDate to);
    ReportsResponse finalizeReport(Long reportId, Long finalizedByUserId);
    Map<String, Double> generateMonthlyConsolidatedReport(LocalDate from, LocalDate to);
    Map<String, Double> generateReports(Long branchId);

}
