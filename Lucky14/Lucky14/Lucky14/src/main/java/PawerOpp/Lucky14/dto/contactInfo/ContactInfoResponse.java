package PawerOpp.Lucky14.dto.contactInfo;

import PawerOpp.Lucky14.model.ContactInfo;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ContactInfoResponse {

    private Long id;
    private Long userId;
    private ContactInfo.ContactType type;
    private String value;

}
