package PawerOpp.Lucky14.Service.reports;

import PawerOpp.Lucky14.dto.reports.ReportsRequest;
import PawerOpp.Lucky14.dto.reports.ReportsResponse;
import PawerOpp.Lucky14.dto.transaction.TransactionRequest;
import PawerOpp.Lucky14.model.Branch;
import PawerOpp.Lucky14.model.Enums.Roles;
import PawerOpp.Lucky14.model.Report;
import PawerOpp.Lucky14.model.Transaction;
import PawerOpp.Lucky14.model.Users;
import PawerOpp.Lucky14.repository.BranchRepository;
import PawerOpp.Lucky14.repository.ReportsRepository;
import PawerOpp.Lucky14.repository.TransactionRepository;
import PawerOpp.Lucky14.repository.UsersRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static javax.management.Query.value;

@Service
@RequiredArgsConstructor
public class ReportsService implements IReports{

    private final ReportsRepository reportsRepository;
    private final TransactionRepository transactionRepository;
    private final BranchRepository branchRepository;
    private final UsersRepository usersRepository;


    @Override
    public ReportsResponse generateDailyReport(ReportsRequest request, Long generatedByUserId) {

        Branch branch = branchRepository.findById(request.getBranchId())
                .orElseThrow(() -> new IllegalArgumentException("Branch not found"));
        Users user = usersRepository.findById(generatedByUserId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        validateReportAccess(user, branch.getId());

        Map<String, BigDecimal> totals = computeDailyTotals(request.getBranchId(), request.getReportDate());
        Report report = resolveEditableReport(request.getBranchId(), request.getReportDate());

        report.setBranch(branch);
        report.setUsers(user);
        report.setDate(request.getReportDate());
        report.setTotalExpenses(totals.get("expenses"));
        report.setTotalBorrowedFunds(totals.get("borrowed"));
        report.setTotalRevenue(totals.get("revenue"));
        report.setProfit(totals.get("profit"));
        report.setFinalized(Boolean.TRUE.equals(request.getFinalizeReport()));
        report.setGeneratedAt(LocalDateTime.now());

        return toResponse(reportsRepository.save(report));

    }

    @Override
    public ReportsResponse getById(Long reportId) {

        Report report = reportsRepository.findById(reportId)
                .orElseThrow(() -> new IllegalArgumentException("Report not found"));
        return toResponse(report);

    }

    @Override
    public List<ReportsResponse> getAll(Long branchId, LocalDate from, LocalDate to) {

        if (branchId != null && from != null && to != null) {
            return reportsRepository.findAllByBranch_IdAndDateBetween(branchId, from, to)
                    .stream()
                    .map(this::toResponse)
                    .toList();
        }

        if (branchId != null) {
            return reportsRepository.findAll().stream()
                    .filter(report -> report.getBranch() != null && branchId.equals(report.getBranch().getId()))
                    .map(this::toResponse)
                    .toList();
        }

        return reportsRepository.findAll().stream().map(this::toResponse).toList();

    }

    @Override
    @Transactional
    public ReportsResponse finalizeReport(Long reportId, Long finalizedByUserId) {

        Users user = usersRepository.findById(finalizedByUserId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        Report report = reportsRepository.findById(reportId)
                .orElseThrow(() -> new IllegalArgumentException("Report not found"));
        Long branchId = report.getBranch() == null ? null : report.getBranch().getId();
        validateReportAccess(user, branchId);

        if (branchId == null || report.getDate() == null) {
            throw new IllegalArgumentException("Report is missing branch or date.");
        }

        Map<String, BigDecimal> totals = computeDailyTotals(branchId, report.getDate());
        report.setUsers(user);
        report.setTotalExpenses(totals.get("expenses"));
        report.setTotalBorrowedFunds(totals.get("borrowed"));
        report.setTotalRevenue(totals.get("revenue"));
        report.setProfit(totals.get("profit"));
        report.setFinalized(true);
        report.setGeneratedAt(LocalDateTime.now());
        return toResponse(reportsRepository.save(report));

    }

    @Override
    public Map<String, Double> generateMonthlyConsolidatedReport(LocalDate from, LocalDate to) {

        BigDecimal totalExpenses = BigDecimal.ZERO;
        BigDecimal totalBorrowed = BigDecimal.ZERO;
        BigDecimal totalRevenue = BigDecimal.ZERO;
        BigDecimal totalProfit = BigDecimal.ZERO;

        List<Report> reports = reportsRepository.findAll().stream()
                .filter(report -> report.getDate() != null
                        && report.isFinalized()
                        && !report.getDate().isBefore(from)
                        && !report.getDate().isAfter(to))
                .toList();

        for (Report report : reports) {
            totalExpenses = totalExpenses.add(value(report.getTotalExpenses()));
            totalBorrowed = totalBorrowed.add(value(report.getTotalBorrowedFunds()));
            totalRevenue = totalRevenue.add(value(report.getTotalRevenue()));
            totalProfit = totalProfit.add(value(report.getProfit()));
        }

        Map<String, Double> consolidated = new HashMap<>();
        consolidated.put("totalExpenses", totalExpenses.doubleValue());
        consolidated.put("totalBorrowedFunds", totalBorrowed.doubleValue());
        consolidated.put("totalRevenue", totalRevenue.doubleValue());
        consolidated.put("totalProfit", totalProfit.doubleValue());
        return consolidated;

    }

    @Override
    public Map<String, Double> generateReports(Long branchId) {

        LocalDate today = LocalDate.now();
        Map<String, BigDecimal> totals = computeDailyTotals(branchId, today);

        Map<String, Double> reportData = new HashMap<>();
        reportData.put("totalExpenses", totals.get("expenses").doubleValue());
        reportData.put("totalBorrowedFunds", totals.get("borrowed").doubleValue());
        reportData.put("totalRevenue", totals.get("revenue").doubleValue());
        reportData.put("profit", totals.get("profit").doubleValue());
        return reportData;
    }

    private Report resolveEditableReport(Long branchId, LocalDate reportDate) {
        return reportsRepository.findFirstByBranch_IdAndDateAndFinalizedFalse(branchId, reportDate)
                .or(() -> reportsRepository.findByBranch_IdAndDate(branchId, reportDate)
                        .filter(report -> !report.isFinalized()))
                .orElseGet(Report::new);
    }

    private void validateReportAccess(Users user, Long branchId) {
        if (user.getRole() != Roles.ADMIN && user.getRole() != Roles.SUPER_ADMIN) {
            throw new IllegalArgumentException("Only admins can generate or finalize reports.");
        }

        if (user.getRole() == Roles.ADMIN) {
            Long userBranchId = user.getBranch() == null ? null : user.getBranch().getId();
            if (branchId == null || userBranchId == null || !userBranchId.equals(branchId)) {
                throw new IllegalArgumentException("Admin cannot manage reports outside the assigned branch.");
            }
        }
    }

    private Map<String, BigDecimal> computeDailyTotals(Long branchId, LocalDate reportDate) {
        LocalDateTime start = reportDate.atStartOfDay();
        LocalDateTime end = reportDate.plusDays(1).atStartOfDay();
        List<Transaction> dailyTransactions = transactionRepository
                .findAllByUsers_Branch_IdAndDateBetween(branchId, start, end);

        BigDecimal totalExpenses = BigDecimal.ZERO;
        BigDecimal totalBorrowed = BigDecimal.ZERO;
        BigDecimal totalRevenue = BigDecimal.ZERO;

        for (Transaction transaction : dailyTransactions) {
            BigDecimal amount = value(transaction.getAmount());
            String normalizedType = normalizeType(transaction.getType());

            if (normalizedType.equals(TransactionRequest.TransactionType.EXPENSE.name())) {
                totalExpenses = totalExpenses.add(amount);
            } else if (normalizedType.equals(TransactionRequest.TransactionType.BORROWED_FUND.name())) {
                totalBorrowed = totalBorrowed.add(amount);
            } else if (normalizedType.equals(TransactionRequest.TransactionType.REVENUE.name())) {
                totalRevenue = totalRevenue.add(amount);
            }
        }

        BigDecimal profit = totalRevenue.subtract(totalExpenses);

        Map<String, BigDecimal> totals = new HashMap<>();
        totals.put("expenses", totalExpenses);
        totals.put("borrowed", totalBorrowed);
        totals.put("revenue", totalRevenue);
        totals.put("profit", profit);
        return totals;

    }

    private String normalizeType(String type) {
        if (type == null) {
            return "";
        }
        String normalized = type.trim().toUpperCase();
        if (normalized.equals("BORROW") || normalized.equals("BORROWED")) {
            return TransactionRequest.TransactionType.BORROWED_FUND.name();
        }
        return normalized;
    }

    private BigDecimal value(BigDecimal amount) {
        return amount == null ? BigDecimal.ZERO : amount;
    }

    private ReportsResponse toResponse(Report report) {
        return ReportsResponse.builder()
                .id(report.getId())
                .branchId(report.getBranch() == null ? null : report.getBranch().getId())
                .reportDate(report.getDate())
                .totalExpenses(value(report.getTotalExpenses()))
                .totalBorrowedFunds(value(report.getTotalBorrowedFunds()))
                .totalRevenue(value(report.getTotalRevenue()))
                .profit(value(report.getProfit()))
                .finalized(report.isFinalized())
                .generatedAt(report.getGeneratedAt())
                .build();
    }

}
