package PawerOpp.Lucky14.dto.users;

import PawerOpp.Lucky14.model.Enums.Roles;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UsersResponse {

    private Long id;
    private String username;
    private Roles role;
    private Long branchId;
    private BranchInfo branch;
    private boolean active;
    private String email;
    private String phone;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class BranchInfo {
        private Long id;
        private String province;
        private String municipality;
        private String barangay;
        private String landmark;
        private boolean active;
    }

}
