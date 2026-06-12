package PawerOpp.Lucky14.Service.email;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;

@Service
@RequiredArgsConstructor
public class EmailService implements IEmail {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);
    private static final String DEFAULT_BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";

    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(5))
            .build();

    @Value("${BREVO_API_KEY:${MAIL_PASSWORD:}}")
    private String brevoApiKey;

    @Value("${BREVO_API_URL:" + DEFAULT_BREVO_API_URL + "}")
    private String brevoApiUrl;

    @Value("${MAIL_FROM:${MAIL_USERNAME:lucky14carnival@gmail.com}}")
    private String mailFrom;

    @PostConstruct
    void logMailerMode() {
        log.info("MAILER MODE ACTIVE: Brevo API via HttpClient");
    }

    @Override
    @Async
    public void sendOtp(String toEmail, String otp) {
        if (brevoApiKey == null || brevoApiKey.isBlank()) {
            throw new IllegalStateException("Brevo API key is not configured. Set BREVO_API_KEY or MAIL_PASSWORD first.");
        }

        String payload = buildPayload(toEmail, otp);

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(brevoApiUrl))
                .timeout(Duration.ofSeconds(10))
                .header("api-key", brevoApiKey.trim())
                .header("accept", "application/json")
                .header("content-type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(payload))
                .build();

        try {
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            int status = response.statusCode();
            if (status < 200 || status >= 300) {
                throw new IllegalStateException("Brevo API returned " + status + ": " + response.body());
            }
        } catch (Exception ex) {
            log.warn("Failed to send OTP email to {}: {}", toEmail, ex.getMessage());
            throw new IllegalStateException("Failed to send OTP email via Brevo API", ex);
        }
    }

    private String buildPayload(String toEmail, String otp) {
        String from = (mailFrom == null || mailFrom.isBlank())
                ? "lucky14carnival@gmail.com"
                : mailFrom.trim();
        String subject = "OTP Verification";
        String text = "Your OTP is: " + otp + " (valid for 5 minutes)";

        return """
                {
                  "sender": {
                    "name": "Lucky14",
                    "email": "%s"
                  },
                  "to": [
                    {
                      "email": "%s"
                    }
                  ],
                  "subject": "%s",
                  "textContent": "%s"
                }
                """.formatted(
                jsonEscape(from),
                jsonEscape(toEmail),
                jsonEscape(subject),
                jsonEscape(text)
        );
    }

    private String jsonEscape(String value) {
        if (value == null) {
            return "";
        }
        return value
                .replace("\\", "\\\\")
                .replace("\"", "\\\"");
    }
}
