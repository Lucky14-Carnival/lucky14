package PawerOpp.Lucky14.dto.contactInfo;

import PawerOpp.Lucky14.model.ContactInfo;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ContactInfoRequest {

    @NotNull(message = "userId is required")
    private Long userId;

    @NotNull(message = "type is required")
    private ContactInfo.ContactType type;

    @NotBlank(message = "value is required")
    private String value;

}
