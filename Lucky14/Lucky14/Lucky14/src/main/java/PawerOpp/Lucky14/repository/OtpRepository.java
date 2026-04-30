package PawerOpp.Lucky14.repository;

import PawerOpp.Lucky14.model.OtpVerification;
import PawerOpp.Lucky14.model.Users;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface OtpRepository extends JpaRepository<OtpVerification, Long> {

    Optional<OtpVerification> findByUsersAndOtpCodeAndIsUsedFalse(Users users, String otpCode);
    void deleteAllByUsers_Id(Long userId);
    void deleteAllByUsers_Branch_Id(Long branchId);

}
