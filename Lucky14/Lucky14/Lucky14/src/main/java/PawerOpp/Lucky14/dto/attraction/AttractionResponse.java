package PawerOpp.Lucky14.dto.attraction;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AttractionResponse {

    private Long id;
    private Long branchId;
    private String name;
    private BigDecimal budget;
    private BigDecimal spentBudget;
    private boolean active;

}

