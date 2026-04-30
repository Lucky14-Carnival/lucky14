package PawerOpp.Lucky14.dto.users;

import PawerOpp.Lucky14.model.Enums.Roles;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UsersRequest {

    @NotBlank(message = "username is required")
    @Size(max = 80, message = "username must not exceed 80 characters")
    private String username;

    @Size(max = 120, message = "password must not exceed 120 characters")
    private String password;

    @NotNull(message = "role is required")
    private Roles role;

    private Long branchId;

    @Builder.Default
    private Boolean active = true;

    @Email(message = "email must be a valid email address")
    @Size(max = 120, message = "email must not exceed 120 characters")
    private String email;

    @Size(max = 30, message = "phone must not exceed 30 characters")
    private String phone;

}
