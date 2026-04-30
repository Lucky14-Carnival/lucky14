package PawerOpp.Lucky14.repository;

import PawerOpp.Lucky14.model.ContactInfo;
import PawerOpp.Lucky14.model.Users;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ContactInfoRepository extends JpaRepository<ContactInfo, Long> {

    Optional<ContactInfo> findByUsersAndType(Users users, ContactInfo.ContactType type);
    List<ContactInfo> findAllByUsers_Id(Long userId);
    void deleteAllByUsers_Id(Long userId);
    void deleteAllByUsers_Branch_Id(Long branchId);

}
