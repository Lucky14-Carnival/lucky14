package PawerOpp.Lucky14.config;

import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.core.env.Environment;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class SuperAdminSeeder {

    private static final Logger log = LoggerFactory.getLogger(SuperAdminSeeder.class);

    private static final String USERNAME = "Allen";
    private static final String PASSWORD = "Allen@Lucky14";
    private static final String EMAIL = "lucky14carnival@gmail.com";
    private static final String PHONE = "09388052521";

    private final JdbcTemplate jdbcTemplate;
    private final PasswordEncoder passwordEncoder;
    private final Environment environment;

    @EventListener(ApplicationReadyEvent.class)
    public void onApplicationReady() {
        Thread seederThread = new Thread(this::seedUntilSuccessful, "super-admin-seeder");
        seederThread.setDaemon(true);
        seederThread.start();
    }

    private void seedUntilSuccessful() {
        int attempt = 1;

        while (true) {
            try {
                log.info("Seeding super admin account if needed (attempt {})", attempt);
                log.info("Active DB_URL: {}", environment.getProperty("DB_URL", ""));
                seedOnce();
                log.info("Super admin seed completed for username={}", USERNAME);
                return;
            } catch (Exception ex) {
                log.warn("Super admin seed attempt {} failed: {}", attempt, ex.getMessage());
                attempt++;

                try {
                    Thread.sleep(10000L);
                } catch (InterruptedException interruptedException) {
                    Thread.currentThread().interrupt();
                    return;
                }
            }
        }
    }

    private void seedOnce() {
        Integer userCount = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM users WHERE username = ?",
                Integer.class,
                USERNAME
        );

        if (userCount == null || userCount == 0) {
            String encodedPassword = passwordEncoder.encode(PASSWORD);
            jdbcTemplate.update(
                    "INSERT INTO users (username, password, role, is_active, branch_id) VALUES (?, ?, ?, ?, NULL)",
                    USERNAME,
                    encodedPassword,
                    "SUPER_ADMIN",
                    1
            );
        }

        Long userId = jdbcTemplate.queryForObject(
                "SELECT id FROM users WHERE username = ? LIMIT 1",
                Long.class,
                USERNAME
        );

        if (userId == null) {
            throw new IllegalStateException("Super admin user could not be found after seed attempt");
        }

        ensureContactInfo(userId, "email", EMAIL);
        ensureContactInfo(userId, "phone", PHONE);
    }

    private void ensureContactInfo(Long userId, String type, String value) {
        Integer contactCount = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM contact_info WHERE user_id = ? AND type = ?",
                Integer.class,
                userId,
                type
        );

        if (contactCount == null || contactCount == 0) {
            jdbcTemplate.update(
                    "INSERT INTO contact_info (user_id, type, value) VALUES (?, ?, ?)",
                    userId,
                    type,
                    value
            );
        }
    }
}
