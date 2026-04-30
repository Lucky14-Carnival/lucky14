package PawerOpp.Lucky14.Service.transactions;

import PawerOpp.Lucky14.dto.transaction.TransactionRequest;
import PawerOpp.Lucky14.dto.transaction.TransactionResponse;
import PawerOpp.Lucky14.model.Attraction;
import PawerOpp.Lucky14.model.Report;
import PawerOpp.Lucky14.model.Transaction;
import PawerOpp.Lucky14.model.Users;
import PawerOpp.Lucky14.repository.AttractionsRepository;
import PawerOpp.Lucky14.repository.ReportsRepository;
import PawerOpp.Lucky14.repository.TransactionRepository;
import PawerOpp.Lucky14.repository.UsersRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import static javax.management.Query.value;

@Service
@RequiredArgsConstructor
public class TransactionService implements ITransactions{

    private final TransactionRepository transactionRepository;
    private final UsersRepository usersRepository;
    private final AttractionsRepository attractionsRepository;
    private final ReportsRepository reportsRepository;

    @Override
    public TransactionResponse create(TransactionRequest request) {
        validateTransactionRequest(request);

        Users user = usersRepository.findById(request.getUserId())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        Attraction attraction = attractionsRepository.findById(request.getAttractionId())
                .orElseThrow(() -> new IllegalArgumentException("Attraction not found"));

        if (user.getBranch() == null || !user.getBranch().getId().equals(request.getBranchId())) {
            throw new IllegalArgumentException("User is not assigned to the provided branch.");
        }
        if (attraction.getBranch() == null || !attraction.getBranch().getId().equals(request.getBranchId())) {
            throw new IllegalArgumentException("Attraction is not assigned to the provided branch.");
        }

        Transaction transaction = new Transaction();
        applyRequest(transaction, request, user, attraction);
        ensureReportWindowEditable(request.getBranchId(), transaction.getDate());
        Transaction saved = transactionRepository.save(transaction);
        applyO1TotalsOnCreate(saved);
        return toResponse(saved);
    }

    @Override
    public TransactionResponse getById(Long id, Long branchId) {

        Transaction transaction = branchId == null
                ? transactionRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("Transaction not found"))
                : transactionRepository.findByIdAndUsers_Branch_Id(id, branchId)
                .orElseThrow(() -> new IllegalArgumentException("Transaction not found"));
        return toResponse(transaction);

    }

    @Override
    public List<TransactionResponse> getAll(Long branchId, LocalDate date, TransactionRequest.TransactionType type) {

        List<Transaction> transactions;

        if (branchId != null && date != null) {
            LocalDateTime start = date.atStartOfDay();
            LocalDateTime end = date.plusDays(1).atStartOfDay();
            transactions = transactionRepository.findAllByUsers_Branch_IdAndDateBetween(branchId, start, end);
            if (type != null) {
                transactions = transactions.stream()
                        .filter(transaction -> normalizeType(transaction.getType()) == type)
                        .toList();
            }
        } else if (branchId != null && type != null) {
            transactions = transactionRepository.findAllByUsers_Branch_Id(branchId).stream()
                    .filter(transaction -> normalizeType(transaction.getType()) == type)
                    .toList();
        } else if (branchId != null) {
            transactions = transactionRepository.findAllByUsers_Branch_Id(branchId);
        } else if (type != null) {
            transactions = transactionRepository.findAll().stream()
                    .filter(transaction -> normalizeType(transaction.getType()) == type)
                    .toList();
        } else {
            transactions = transactionRepository.findAll();
        }

        return transactions.stream().map(this::toResponse).toList();

    }

    @Override
    public TransactionResponse update(Long id, Long branchId, TransactionRequest request) {

        validateTransactionRequest(request);
        Transaction transaction = getByIdEntity(id, branchId);
        TransactionRequest.TransactionType previousType = normalizeType(transaction.getType());
        BigDecimal previousAmount = value(transaction.getAmount());
        LocalDateTime previousDate = transaction.getDate();
        Long previousBranchId = transaction.getUsers() == null || transaction.getUsers().getBranch() == null
                ? null : transaction.getUsers().getBranch().getId();

        Users user = usersRepository.findById(request.getUserId())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        Attraction attraction = attractionsRepository.findById(request.getAttractionId())
                .orElseThrow(() -> new IllegalArgumentException("Attraction not found"));
        if (user.getBranch() == null || !user.getBranch().getId().equals(request.getBranchId())) {
            throw new IllegalArgumentException("User is not assigned to the provided branch.");
        }
        if (attraction.getBranch() == null || !attraction.getBranch().getId().equals(request.getBranchId())) {
            throw new IllegalArgumentException("Attraction is not assigned to the provided branch.");
        }

        applyRequest(transaction, request, user, attraction);
        ensureReportWindowEditable(previousBranchId, previousDate);
        ensureReportWindowEditable(request.getBranchId(), transaction.getDate());
        Transaction saved = transactionRepository.save(transaction);
        applyO1TotalsOnUpdate(previousType, previousAmount, previousDate, previousBranchId, saved);
        return toResponse(saved);

    }

    @Override
    public void delete(Long id, Long branchId) {

        Transaction transaction = getByIdEntity(id, branchId);
        Long transactionBranchId = transaction.getUsers() == null || transaction.getUsers().getBranch() == null
                ? null : transaction.getUsers().getBranch().getId();
        ensureReportWindowEditable(transactionBranchId, transaction.getDate());
        applyO1TotalsOnDelete(transaction);
        transactionRepository.delete(transaction);

    }

    @Override
    public void validateTransactionRequest(TransactionRequest request) {

        if (request.getType() == TransactionRequest.TransactionType.EXPENSE && Boolean.FALSE.equals(request.getHasReceipt())) {
            throw new IllegalArgumentException("Expenses must include a receipt for audit compliance.");
        }

    }

    @Override
    public BigDecimal parseAmount(Transaction transaction) {

        if (transaction == null || transaction.getAmount() == null) {
            return BigDecimal.ZERO;
        }
        return transaction.getAmount();

    }

    @Override
    public TransactionResponse toResponse(Transaction transaction) {

        Attraction attraction = transaction.getAttraction();
        Long branchId = transaction.getUsers() != null && transaction.getUsers().getBranch() != null
                ? transaction.getUsers().getBranch().getId()
                : null;
        Long userId = transaction.getUsers() == null ? null : transaction.getUsers().getId();
        TransactionRequest.TransactionType type = normalizeType(transaction.getType());

        return TransactionResponse.builder()
                .id(transaction.getId())
                .branchId(branchId)
                .userId(userId)
                .attractionId(attraction == null ? null : attraction.getId())
                .attractionName(attraction == null ? null : attraction.getName())
                .type(type)
                .amount(parseAmount(transaction))
                .hasReceipt(Boolean.TRUE.equals(transaction.getHasReceipt()))
                .approved(Boolean.TRUE.equals(transaction.getApproved()))
                .remarks(transaction.getRemarks())
                .transactionDate(transaction.getDate())
                .build();

    }

    private TransactionRequest.TransactionType normalizeType(String rawType) {
        if (rawType == null || rawType.isBlank()) {
            return TransactionRequest.TransactionType.EXPENSE;
        }

        String upperType = rawType.trim().toUpperCase();
        if (upperType.equals("BORROW") || upperType.equals("BORROWED")) {
            return TransactionRequest.TransactionType.BORROWED_FUND;
        }
        return TransactionRequest.TransactionType.valueOf(upperType);
    }

    private void applyRequest(Transaction transaction, TransactionRequest request, Users user, Attraction attraction) {
        transaction.setUsers(user);
        transaction.setAttraction(attraction);
        transaction.setType(request.getType().name());
        transaction.setAmount(request.getAmount());
        transaction.setHasReceipt(Boolean.TRUE.equals(request.getHasReceipt()));
        transaction.setApproved(Boolean.TRUE.equals(request.getApproved()));
        transaction.setRemarks(normalizeText(request.getRemarks()));
        transaction.setDate(request.getTransactionDate() == null ? LocalDateTime.now() : request.getTransactionDate());
    }

    private Transaction getByIdEntity(Long id, Long branchId) {
        if (branchId == null) {
            return transactionRepository.findById(id)
                    .orElseThrow(() -> new IllegalArgumentException("Transaction not found"));
        }
        return transactionRepository.findByIdAndUsers_Branch_Id(id, branchId)
                .orElseThrow(() -> new IllegalArgumentException("Transaction not found"));
    }

    private void ensureReportWindowEditable(Long branchId, LocalDateTime transactionDate) {
        if (branchId == null || transactionDate == null) {
            return;
        }

        reportsRepository.findByBranch_IdAndDate(branchId, transactionDate.toLocalDate())
                .filter(Report::isFinalized)
                .ifPresent(report -> {
                    throw new IllegalArgumentException("This report day is already finalized and can no longer be changed.");
                });
    }

    private void applyO1TotalsOnCreate(Transaction transaction) {
        Long branchId = transaction.getUsers() == null || transaction.getUsers().getBranch() == null
                ? null : transaction.getUsers().getBranch().getId();
        if (branchId == null || transaction.getDate() == null) {
            return;
        }

        reportsRepository.findFirstByBranch_IdAndDateAndFinalizedFalse(branchId, transaction.getDate().toLocalDate())
                .ifPresent(report -> {
                    adjustReport(report, normalizeType(transaction.getType()), value(transaction.getAmount()));
                    reportsRepository.save(report);
                });
    }

    private void applyO1TotalsOnUpdate(
            TransactionRequest.TransactionType oldType,
            BigDecimal oldAmount,
            LocalDateTime oldDate,
            Long oldBranchId,
            Transaction afterUpdate
    ) {
        if (oldDate == null || afterUpdate.getDate() == null) {
            return;
        }
        Long newBranchId = afterUpdate.getUsers() == null || afterUpdate.getUsers().getBranch() == null
                ? null : afterUpdate.getUsers().getBranch().getId();
        if (oldBranchId == null || newBranchId == null) {
            return;
        }

        reportsRepository.findFirstByBranch_IdAndDateAndFinalizedFalse(oldBranchId, oldDate.toLocalDate())
                .ifPresent(report -> {
                    adjustReport(report, oldType, oldAmount.negate());
                    reportsRepository.save(report);
                });

        reportsRepository.findFirstByBranch_IdAndDateAndFinalizedFalse(newBranchId, afterUpdate.getDate().toLocalDate())
                .ifPresent(report -> {
                    adjustReport(report, normalizeType(afterUpdate.getType()), value(afterUpdate.getAmount()));
                    reportsRepository.save(report);
                });
    }

    private void applyO1TotalsOnDelete(Transaction transaction) {
        if (transaction.getDate() == null) {
            return;
        }
        Long branchId = transaction.getUsers() == null || transaction.getUsers().getBranch() == null
                ? null : transaction.getUsers().getBranch().getId();
        if (branchId == null) {
            return;
        }

        reportsRepository.findFirstByBranch_IdAndDateAndFinalizedFalse(branchId, transaction.getDate().toLocalDate())
                .ifPresent(report -> {
                    adjustReport(report, normalizeType(transaction.getType()), value(transaction.getAmount()).negate());
                    reportsRepository.save(report);
                });
    }

    private void adjustReport(Report report, TransactionRequest.TransactionType type, BigDecimal delta) {
        if (type == TransactionRequest.TransactionType.EXPENSE) {
            report.setTotalExpenses(value(report.getTotalExpenses()).add(delta));
        } else if (type == TransactionRequest.TransactionType.BORROWED_FUND) {
            report.setTotalBorrowedFunds(value(report.getTotalBorrowedFunds()).add(delta));
        } else if (type == TransactionRequest.TransactionType.REVENUE) {
            report.setTotalRevenue(value(report.getTotalRevenue()).add(delta));
        }
        report.setProfit(value(report.getTotalRevenue()).subtract(value(report.getTotalExpenses())));
        report.setGeneratedAt(LocalDateTime.now());
    }

    private BigDecimal value(BigDecimal amount) {
        return amount == null ? BigDecimal.ZERO : amount;
    }

    private String normalizeText(String value) {
        if (value == null) {
            return null;
        }
        return value.trim().replaceAll("\\s{2,}", " ");
    }

}
