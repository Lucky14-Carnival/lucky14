package PawerOpp.Lucky14.Service.otp;

import PawerOpp.Lucky14.model.OtpVerification;
import PawerOpp.Lucky14.model.Users;

public interface IOtp {

    OtpVerification createOtp(Users users);
    boolean isOtpValid(Users users, String code);
    boolean validateOtp(Users users, String code);

}
