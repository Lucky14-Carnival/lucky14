package PawerOpp.Lucky14.controller;

import PawerOpp.Lucky14.Service.email.EmailService;
import PawerOpp.Lucky14.Service.otp.OtpService;
import PawerOpp.Lucky14.Service.sms.SmsService;
import PawerOpp.Lucky14.dto.users.UsersResponse;
import PawerOpp.Lucky14.model.ContactInfo;
import PawerOpp.Lucky14.model.OtpVerification;
import PawerOpp.Lucky14.model.Users;
import PawerOpp.Lucky14.repository.ContactInfoRepository;
import PawerOpp.Lucky14.repository.UsersRepository;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UsersRepository userRepository;
    private final ContactInfoRepository contactInfoRepository;
    private final OtpService otpService;
    private final EmailService emailService;
    private final SmsService smsService;
    private final PasswordEncoder passwordEncoder;

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest request) {
        Users user = userRepository.findByUsername(request.username().trim())
                .orElseThrow(() -> new IllegalArgumentException("Invalid username or password"));

        if (!user.isActive()) {
            throw new IllegalStateException("User account is inactive.");
        }

        if (!passwordEncoder.matches(request.password(), user.getPassword())) {
            throw new IllegalArgumentException("Invalid username or password");
        }

        String email = contactInfoRepository.findByUsersAndType(user, ContactInfo.ContactType.email)
                .map(ContactInfo::getValue)
                .orElse(null);
        String phone = contactInfoRepository.findByUsersAndType(user, ContactInfo.ContactType.phone)
                .map(ContactInfo::getValue)
                .orElse(null);

        UsersResponse userResponse = UsersResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .role(user.getRole())
                .branchId(user.getBranch() == null ? null : user.getBranch().getId())
                .active(user.isActive())
                .email(email)
                .phone(phone)
                .build();

        return ResponseEntity.ok(Map.of(
                "message", "Login successful",
                "user", userResponse
        ));
    }

    @PostMapping("/request-otp")
    public ResponseEntity<?> requestOtp(
            @RequestParam String username
    ) {

        Users user = userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        ContactInfo contactInfo = contactInfoRepository.findByUsersAndType(user, ContactInfo.ContactType.email)
                .orElseThrow(() -> new IllegalArgumentException("No email contact info found for this user"));
        String email = contactInfo.getValue().trim();

        OtpVerification otp = otpService.createOtp(user);
        emailService.sendOtp(email, otp.getOtpCode());


        return ResponseEntity.ok("OTP sent to your registered email.");
    }

    @PostMapping("/request-otp-sms")
    public ResponseEntity<?> requestOtpSms(
            @RequestParam String username,
            @RequestParam String phone
    ) {
        Users user = userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        ContactInfo contactInfo = contactInfoRepository.findByUsersAndType(user, ContactInfo.ContactType.phone)
                .orElseThrow(() -> new IllegalArgumentException("No phone contact info found for this user"));

        String normalizedInputPhone = normalizePhone(phone);
        String normalizedAccountPhone = normalizePhone(contactInfo.getValue());
        if (!normalizedAccountPhone.equals(normalizedInputPhone)) {
            throw new IllegalArgumentException("Provided phone does not match the account phone.");
        }

        OtpVerification otp = otpService.createOtp(user);
        smsService.sendOtp(normalizedAccountPhone, otp.getOtpCode());
        return ResponseEntity.ok("OTP sent via SMS to " + normalizedAccountPhone);
    }

    @PostMapping("/change-password")
    public ResponseEntity<?> changePassword(
            @RequestParam String username,
            @RequestParam String otp,
            @RequestParam @Size(min = 8, max = 120, message = "newPassword must be 8-120 characters") String newPassword) {

        Users user = userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        boolean valid = otpService.validateOtp(user, otp);

        if (!valid) {
            return ResponseEntity.badRequest().body("Invalid or expired OTP");
        }

        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        return ResponseEntity.ok("Password changed successfully");
    }

    private String normalizePhone(String phone) {
        if (phone == null || phone.trim().isEmpty()) {
            return "";
        }
        String cleaned = phone.replaceAll("[^0-9+]", "");

        // +639XXXXXXXXX
        if (cleaned.matches("^\\+639\\d{9}$")) {
            return cleaned;
        }
        // 639XXXXXXXXX
        if (cleaned.matches("^639\\d{9}$")) {
            return "+" + cleaned;
        }
        // 09XXXXXXXXX
        if (cleaned.matches("^09\\d{9}$")) {
            return "+63" + cleaned.substring(1);
        }
        // 9XXXXXXXXX
        if (cleaned.matches("^9\\d{9}$")) {
            return "+63" + cleaned;
        }

        throw new IllegalArgumentException("Invalid phone format. Use 09XXXXXXXXX or +639XXXXXXXXX.");
    }

    public record LoginRequest(
            @NotBlank(message = "username is required") String username,
            @NotBlank(message = "password is required") String password
    ) {
    }

}
