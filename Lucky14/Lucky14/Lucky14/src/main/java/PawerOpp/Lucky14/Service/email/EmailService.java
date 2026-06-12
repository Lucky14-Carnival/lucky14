package PawerOpp.Lucky14.Service.email;

import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class EmailService implements IEmail{

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);

    private final ObjectProvider<JavaMailSender> mailSenderProvider;
    @Value("${MAIL_FROM:${spring.mail.username:}}")
    private String mailFrom;

    @Override
    @Async
    public void sendOtp(String toEmail, String otp) {
        JavaMailSender mailSender = mailSenderProvider.getIfAvailable();
        if (mailSender == null) {
            throw new IllegalStateException("Mail server is not configured. Set spring.mail.* properties first.");
        }

        try {
            SimpleMailMessage message = new SimpleMailMessage();
            if (mailFrom != null && !mailFrom.isBlank()) {
                message.setFrom(mailFrom);
            }
            message.setTo(toEmail);
            message.setSubject("OTP Verification");
            message.setText("Your OTP is: " + otp + " (valid for 5 minutes)");

            mailSender.send(message);
        } catch (Exception ex) {
            log.warn("Failed to send OTP email to {}: {}", toEmail, ex.getMessage());
        }
    }
}
