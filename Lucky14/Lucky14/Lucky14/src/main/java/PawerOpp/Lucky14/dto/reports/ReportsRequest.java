package PawerOpp.Lucky14.dto.reports;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReportsRequest {

    @NotNull(message = "branchId is required")
    private Long branchId;

    @NotNull(message = "reportDate is required")
    private LocalDate reportDate;

    @Builder.Default
    private Boolean finalizeReport = false;

}
