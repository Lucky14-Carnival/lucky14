package PawerOpp.Lucky14.dto.reports;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReportsResponse {

    private Long id;
    private Long branchId;
    private LocalDate reportDate;
    private BigDecimal totalExpenses;
    private BigDecimal totalBorrowedFunds;
    private BigDecimal totalRevenue;
    private BigDecimal profit;
    private boolean finalized;
    private LocalDateTime generatedAt;

}
