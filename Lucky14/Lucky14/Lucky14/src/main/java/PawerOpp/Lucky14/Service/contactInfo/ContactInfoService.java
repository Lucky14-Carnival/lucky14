package PawerOpp.Lucky14.Service.contactInfo;

import PawerOpp.Lucky14.dto.contactInfo.ContactInfoRequest;
import PawerOpp.Lucky14.dto.contactInfo.ContactInfoResponse;
import PawerOpp.Lucky14.model.ContactInfo;
import PawerOpp.Lucky14.model.Users;
import PawerOpp.Lucky14.repository.ContactInfoRepository;
import PawerOpp.Lucky14.repository.UsersRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ContactInfoService implements IContactInfo{

    private final ContactInfoRepository contactInfoRepository;
    private final UsersRepository usersRepository;

    @Override
    public ContactInfoResponse create(ContactInfoRequest request) {
        Users user = usersRepository.findById(request.getUserId())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        ContactInfo contactInfo = new ContactInfo();
        contactInfo.setUsers(user);
        contactInfo.setType(request.getType());
        contactInfo.setValue(request.getValue());
        return toResponse(contactInfoRepository.save(contactInfo));
    }

    @Override
    public ContactInfoResponse getById(Long id) {
        ContactInfo contactInfo = contactInfoRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Contact info not found"));
        return toResponse(contactInfo);
    }

    @Override
    public List<ContactInfoResponse> getAll() {
        return contactInfoRepository.findAll().stream().map(this::toResponse).toList();
    }

    @Override
    public List<ContactInfoResponse> getByUserId(Long userId) {
        return contactInfoRepository.findAllByUsers_Id(userId).stream().map(this::toResponse).toList();
    }

    @Override
    public ContactInfoResponse update(Long id, ContactInfoRequest request) {
        ContactInfo contactInfo = contactInfoRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Contact info not found"));
        Users user = usersRepository.findById(request.getUserId())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        contactInfo.setUsers(user);
        contactInfo.setType(request.getType());
        contactInfo.setValue(request.getValue());
        return toResponse(contactInfoRepository.save(contactInfo));
    }

    @Override
    public void delete(Long id) {
        if (!contactInfoRepository.existsById(id)) {
            throw new IllegalArgumentException("Contact info not found");
        }
        contactInfoRepository.deleteById(id);
    }

    private ContactInfoResponse toResponse(ContactInfo contactInfo) {
        return ContactInfoResponse.builder()
                .id(contactInfo.getId())
                .userId(contactInfo.getUsers() == null ? null : contactInfo.getUsers().getId())
                .type(contactInfo.getType())
                .value(contactInfo.getValue())
                .build();
    }

}
