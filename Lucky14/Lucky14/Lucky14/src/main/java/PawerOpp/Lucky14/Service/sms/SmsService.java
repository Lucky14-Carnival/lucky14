package PawerOpp.Lucky14.Service.sms;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

@Service
@RequiredArgsConstructor
public class SmsService implements ISms {

    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${sms.semaphore.api-key:}")
    private String apiKey;

    @Value("${sms.semaphore.sender-name:Lucky14}")
    private String senderName;

    @Value("${sms.semaphore.endpoint:https://semaphore.co/api/v4/messages}")
    private String endpoint;

    @Override
    public void sendOtp(String toPhone, String otp) {
        String resolvedApiKey = firstNonBlank(apiKey, System.getenv("SEMAPHORE_API_KEY"));
        String resolvedSenderName = firstNonBlank(senderName, System.getenv("SEMAPHORE_SENDER_NAME"));
        String resolvedEndpoint = firstNonBlank(endpoint, System.getenv("SEMAPHORE_ENDPOINT"));

        if (isBlank(resolvedApiKey)) {
            throw new IllegalStateException("SMS server is not configured. Set sms.semaphore.api-key.");
        }

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

        MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
        form.add("apikey", resolvedApiKey.trim());
        form.add("number", toPhone.trim());
        form.add("message", "Your OTP is: " + otp + " (valid for 5 minutes)");
        if (!isBlank(resolvedSenderName)) {
            form.add("sendername", resolvedSenderName.trim());
        }

        HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(form, headers);
        try {
            ResponseEntity<String> response = restTemplate.postForEntity(resolvedEndpoint, request, String.class);
            if (!response.getStatusCode().is2xxSuccessful()) {
                throw new IllegalStateException("Failed to send OTP via SMS.");
            }
        } catch (HttpClientErrorException ex) {
            if (ex.getStatusCode().value() == 401) {
                throw new IllegalStateException("Semaphore authentication failed. Check API key.");
            }
            if (ex.getStatusCode().value() == 400) {
                throw new IllegalArgumentException("Invalid phone or SMS request. Use +639XXXXXXXXX and verify account messaging restrictions.");
            }
            throw new IllegalStateException("Failed to send OTP via Semaphore: " + ex.getStatusCode().value());
        }
    }

    private boolean isBlank(String value) {
        return value == null || value.trim().isEmpty();
    }

    private String firstNonBlank(String primary, String fallback) {
        return isBlank(primary) ? fallback : primary;
    }
}
