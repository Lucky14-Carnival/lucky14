package PawerOpp.Lucky14.Service.otp;

import PawerOpp.Lucky14.model.OtpVerification;
import PawerOpp.Lucky14.model.Users;
import PawerOpp.Lucky14.repository.OtpRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class OtpServiceTest {

    @Mock
    private OtpRepository otpRepository;

    @InjectMocks
    private OtpService otpService;

    @Test
    void validateOtpRejectsWrongCode() {
        Users user = new Users();
        user.setId(1L);
        user.setUsername("Allen");

        when(otpRepository.findByUsersAndOtpCodeAndPurposeAndIsUsedFalse(
                eq(user),
                eq("9999"),
                eq(OtpVerification.Purpose.change_password)
        )).thenReturn(Optional.empty());

        ResponseStatusException ex = assertThrows(
                ResponseStatusException.class,
                () -> otpService.validateOtp(user, "9999")
        );

        assertTrue(ex.getStatusCode().equals(HttpStatus.UNAUTHORIZED));
        verify(otpRepository, never()).saveAndFlush(any());
    }

    @Test
    void validateOtpMarksValidOtpAsUsed() {
        Users user = new Users();
        user.setId(1L);
        user.setUsername("Allen");

        OtpVerification otp = new OtpVerification();
        otp.setId(7L);
        otp.setUsers(user);
        otp.setOtpCode("1234");
        otp.setPurpose(OtpVerification.Purpose.change_password);
        otp.setExpiryTime(LocalDateTime.now().plusMinutes(2));
        otp.setUsed(false);

        when(otpRepository.findByUsersAndOtpCodeAndPurposeAndIsUsedFalse(
                eq(user),
                eq("1234"),
                eq(OtpVerification.Purpose.change_password)
        )).thenReturn(Optional.of(otp));

        otpService.validateOtp(user, "1234");

        assertTrue(otp.isUsed());
        verify(otpRepository).saveAndFlush(otp);
    }
}
