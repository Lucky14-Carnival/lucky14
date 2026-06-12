package PawerOpp.Lucky14.config;

import org.junit.jupiter.api.Test;
import org.springframework.mail.javamail.JavaMailSenderImpl;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertInstanceOf;

class MailConfigTest {

    @Test
    void javaMailSenderStripsWhitespaceFromPassword() {
        MailConfig mailConfig = new MailConfig();

        JavaMailSenderImpl sender = assertInstanceOf(JavaMailSenderImpl.class,
                mailConfig.javaMailSender(
                        "smtp.gmail.com",
                        587,
                        "lucky14carnival@gmail.com ",
                        "ilgu ffqq xesa qfxw",
                        true,
                        true,
                        true,
                        5000,
                        5000,
                        5000
                ));

        assertEquals("lucky14carnival@gmail.com", sender.getUsername());
        assertEquals("ilguffqqxesaqfxw", sender.getPassword());
    }
}
