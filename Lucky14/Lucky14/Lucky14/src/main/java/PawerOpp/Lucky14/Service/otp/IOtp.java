package PawerOpp.Lucky14.Service.otp;

import PawerOpp.Lucky14.model.OtpVerification;
import PawerOpp.Lucky14.model.Users;

public interface IOtp {

    OtpVerification createOtp(Users users);
    boolean validateOtp(Users users, String code);

}
