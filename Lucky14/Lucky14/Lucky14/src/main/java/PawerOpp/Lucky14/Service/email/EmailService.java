package PawerOpp.Lucky14.Service.email;

import lombok.RequiredArgsConstructor;
import jakarta.annotation.PostConstruct;
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

    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(5))
            .build();

    @Value("${MAILTRAP_API_TOKEN:${MAIL_PASSWORD:}}")
    private String mailtrapApiToken;

    @Value("${MAILTRAP_API_URL:https://send.api.mailtrap.io/api/send}")
    private String mailtrapApiUrl;

    @Value("${MAIL_FROM:${MAIL_USERNAME:lucky14carnival@gmail.com}}")
    private String mailFrom;

    @PostConstruct
    void logMailerMode() {
        log.info("MAILER MODE ACTIVE: Mailtrap API via HttpClient");
    }

    @Override
    @Async
    public void sendOtp(String toEmail, String otp) {
        if (mailtrapApiToken == null || mailtrapApiToken.isBlank()) {
            throw new IllegalStateException("Mailtrap API token is not configured. Set MAIL_PASSWORD or MAILTRAP_API_TOKEN first.");
        }

        String payload = buildPayload(toEmail, otp);

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(mailtrapApiUrl))
                .timeout(Duration.ofSeconds(10))
                .header("Authorization", "Bearer " + mailtrapApiToken.trim())
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(payload))
                .build();

        try {
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            int status = response.statusCode();
            if (status < 200 || status >= 300) {
                throw new IllegalStateException("Mailtrap API returned " + status + ": " + response.body());
            }
        } catch (Exception ex) {
            log.warn("Failed to send OTP email to {}: {}", toEmail, ex.getMessage());
            throw new IllegalStateException("Failed to send OTP email via Mailtrap API", ex);
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
                  "from": {
                    "email": "%s"
                  },
                  "to": [
                    {
                      "email": "%s"
                    }
                  ],
                  "subject": "%s",
                  "text": "%s"
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
