package PawerOpp.Lucky14.Service.otp;

import PawerOpp.Lucky14.model.OtpVerification;
import PawerOpp.Lucky14.model.Users;
import PawerOpp.Lucky14.repository.OtpRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.security.SecureRandom;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class OtpService implements IOtp{

    private static final SecureRandom SECURE_RANDOM = new SecureRandom();
    private static final int OTP_LENGTH = 4;
    private static final int OTP_BOUND = (int) Math.pow(10, OTP_LENGTH);
    private static final int OTP_MIN = OTP_BOUND / 10;
    private final OtpRepository otpRepository;

    @Override
    public OtpVerification createOtp(Users users) {
        String code = String.format("%0" + OTP_LENGTH + "d", SECURE_RANDOM.nextInt(OTP_BOUND - OTP_MIN) + OTP_MIN);

        OtpVerification otp = new OtpVerification();
        otp.setUsers(users);
        otp.setOtpCode(code);
        otp.setPurpose(OtpVerification.Purpose.change_password);
        otp.setExpiryTime(LocalDateTime.now().plusMinutes(5));
        otp.setUsed(false);

        return otpRepository.save(otp);
    }

    @Override
    @Transactional
    public void validateOtp(Users users, String code) {
        if (code == null || code.trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid or expired OTP");
        }

        OtpVerification otp = otpRepository
                .findByUsersAndOtpCodeAndPurposeAndIsUsedFalse(users, code.trim(), OtpVerification.Purpose.change_password)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid or expired OTP"));

        if (otp.getExpiryTime() == null || otp.getExpiryTime().isBefore(LocalDateTime.now())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid or expired OTP");
        }

        otp.setUsed(true);
        otpRepository.saveAndFlush(otp);
    }
}
