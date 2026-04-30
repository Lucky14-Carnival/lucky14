package PawerOpp.Lucky14.dto.transaction;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TransactionResponse {

    private Long id;
    private Long branchId;
    private Long userId;
    private Long attractionId;
    private String attractionName;
    private TransactionRequest.TransactionType type;
    private BigDecimal amount;
    private boolean hasReceipt;
    private boolean approved;
    private String remarks;
    private LocalDateTime transactionDate;

}
