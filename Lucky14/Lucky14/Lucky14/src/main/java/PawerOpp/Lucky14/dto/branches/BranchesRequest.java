package PawerOpp.Lucky14.dto.branches;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BranchesRequest {

    @NotBlank(message = "province is required")
    private String province;

    @NotBlank(message = "municipality is required")
    private String municipality;

    @NotBlank(message = "barangay is required")
    private String barangay;

    private String landmark;
    @Builder.Default
    private Boolean active = true;

}
