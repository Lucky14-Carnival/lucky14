package PawerOpp.Lucky14.Service.otp;

import PawerOpp.Lucky14.model.OtpVerification;
import PawerOpp.Lucky14.model.Users;
import PawerOpp.Lucky14.repository.OtpRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Optional;

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
    public boolean validateOtp(Users users, String code) {

        Optional<OtpVerification> otpOpt =
                otpRepository.findByUsersAndOtpCodeAndIsUsedFalse(users, code);

        if (otpOpt.isEmpty()) return false;

        OtpVerification otp = otpOpt.get();

        if (otp.getExpiryTime().isBefore(LocalDateTime.now())) {
            return false;
        }

        otp.setUsed(true);
        otpRepository.save(otp);

        return true;
    }
}
