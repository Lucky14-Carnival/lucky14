package PawerOpp.Lucky14.dto.transaction;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
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
public class TransactionRequest {

    @NotNull(message = "branchId is required")
    private Long branchId;

    @NotNull(message = "userId is required")
    private Long userId;

    @NotNull(message = "attractionId is required")
    private Long attractionId;

    @NotNull(message = "type is required")
    private TransactionType type;

    @NotNull(message = "amount is required")
    @DecimalMin(value = "0.01", message = "amount must be greater than zero")
    private BigDecimal amount;

    @NotNull(message = "hasReceipt is required for audit compliance")
    private Boolean hasReceipt;

    private Boolean approved;

    @Size(max = 255, message = "remarks must not exceed 255 characters")
    private String remarks;

    private LocalDateTime transactionDate;

    public enum TransactionType {
        EXPENSE, BORROWED_FUND, REVENUE
    }

}
