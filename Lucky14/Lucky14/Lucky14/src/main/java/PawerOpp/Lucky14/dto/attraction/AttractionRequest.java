package PawerOpp.Lucky14.dto.attraction;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AttractionRequest {

    @NotNull(message = "branchId is required")
    private Long branchId;

    @NotBlank(message = "name is required")
    private String name;

    @NotNull(message = "budget is required")
    @DecimalMin(value = "0.00", inclusive = true, message = "budget must not be negative")
    private BigDecimal budget;

    @Builder.Default
    @DecimalMin(value = "0.00", inclusive = true, message = "spentBudget must not be negative")
    private BigDecimal spentBudget = BigDecimal.ZERO;

    @Builder.Default
    private Boolean active = true;

}
