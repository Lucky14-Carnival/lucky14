package PawerOpp.Lucky14.dto.branches;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BranchesResponse {

    private Long id;
    private String province;
    private String municipality;
    private String barangay;
    private String landmark;
    private boolean active;

}

