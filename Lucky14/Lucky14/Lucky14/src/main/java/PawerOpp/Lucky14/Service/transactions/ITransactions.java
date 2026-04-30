package PawerOpp.Lucky14.Service.transactions;

import PawerOpp.Lucky14.dto.transaction.TransactionRequest;
import PawerOpp.Lucky14.dto.transaction.TransactionResponse;
import PawerOpp.Lucky14.model.Transaction;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public interface ITransactions {

    TransactionResponse create(TransactionRequest request);
    TransactionResponse getById(Long id, Long branchId);
    List<TransactionResponse> getAll(Long branchId, LocalDate date, TransactionRequest.TransactionType type);
    TransactionResponse update(Long id, Long branchId, TransactionRequest request);
    void delete(Long id, Long branchId);
    void validateTransactionRequest(TransactionRequest request);
    BigDecimal parseAmount(Transaction transaction);
    TransactionResponse toResponse(Transaction transaction);

}
