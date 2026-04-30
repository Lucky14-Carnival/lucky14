package PawerOpp.Lucky14.Service.contactInfo;

import PawerOpp.Lucky14.dto.contactInfo.ContactInfoRequest;
import PawerOpp.Lucky14.dto.contactInfo.ContactInfoResponse;

import java.util.List;

public interface IContactInfo {

    ContactInfoResponse create(ContactInfoRequest request);
    ContactInfoResponse getById(Long id);
    List<ContactInfoResponse> getAll();
    List<ContactInfoResponse> getByUserId(Long userId);
    ContactInfoResponse update(Long id, ContactInfoRequest request);
    void delete(Long id);

}
