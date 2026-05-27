package PawerOpp.Lucky14.config;

import PawerOpp.Lucky14.model.ContactInfo;
import PawerOpp.Lucky14.model.Enums.Roles;
import PawerOpp.Lucky14.model.Users;
import PawerOpp.Lucky14.repository.ContactInfoRepository;
import PawerOpp.Lucky14.repository.UsersRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.core.env.Environment;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.concurrent.TimeUnit;

@Slf4j
@Component
@RequiredArgsConstructor
public class SuperAdminSeeder {

    private static final String SUPER_ADMIN_USERNAME = "Allen";
    private static final String SUPER_ADMIN_PASSWORD = "Allen@Lucky14";
    private static final String SUPER_ADMIN_EMAIL = "lucky14carnival@gmail.com";
    private static final String SUPER_ADMIN_PHONE = "09388052521";

    private final UsersRepository usersRepository;
    private final ContactInfoRepository contactInfoRepository;
    private final PasswordEncoder passwordEncoder;
    private final Environment environment;

    @EventListener(ApplicationReadyEvent.class)
    public void seedSuperAdmin() {
        Thread seederThread = new Thread(this::seedWithRetry, "super-admin-seeder");
        seederThread.setDaemon(true);
        seederThread.start();
    }

    private void seedWithRetry() {
        int attempts = 0;

        while (true) {
            try {
                log.info("Seeding super admin account if needed (attempt {})", attempts + 1);
                log.info("Active DB_URL: {}", maskDatabaseUrl(environment.getProperty("DB_URL")));
                seedOnce();
                log.info("Super admin seed completed for username={}", SUPER_ADMIN_USERNAME);
                return;
            } catch (Exception ex) {
                attempts++;
                log.warn("Super admin seed attempt {} failed: {}", attempts, ex.getMessage());

                try {
                    TimeUnit.SECONDS.sleep(10);
                } catch (InterruptedException interruptedException) {
                    Thread.currentThread().interrupt();
                    log.warn("Super admin seed retry sleep interrupted");
                    return;
                }
            }
        }
    }

    private void seedOnce() {
        Users user = usersRepository.findByUsername(SUPER_ADMIN_USERNAME)
                .orElseGet(Users::new);

        user.setUsername(SUPER_ADMIN_USERNAME);
        user.setRole(Roles.SUPER_ADMIN);
        user.setActive(true);
        user.setBranch(null);

        if (user.getPassword() == null || !passwordEncoder.matches(SUPER_ADMIN_PASSWORD, user.getPassword())) {
            user.setPassword(passwordEncoder.encode(SUPER_ADMIN_PASSWORD));
        }

        Users savedUser = usersRepository.saveAndFlush(user);
        upsertContact(savedUser, ContactInfo.ContactType.email, SUPER_ADMIN_EMAIL);
        upsertContact(savedUser, ContactInfo.ContactType.phone, SUPER_ADMIN_PHONE);
    }

    private void upsertContact(Users user, ContactInfo.ContactType type, String value) {
        ContactInfo contact = contactInfoRepository.findByUsersAndType(user, type)
                .orElseGet(ContactInfo::new);
        contact.setUsers(user);
        contact.setType(type);
        contact.setValue(value);
        contactInfoRepository.saveAndFlush(contact);
    }

    private String maskDatabaseUrl(String databaseUrl) {
        if (databaseUrl == null || databaseUrl.isBlank()) {
            return "<empty>";
        }

        int atIndex = databaseUrl.indexOf('@');
        if (atIndex < 0) {
            return databaseUrl;
        }

        int schemeEnd = databaseUrl.indexOf("://");
        if (schemeEnd < 0 || schemeEnd + 3 >= atIndex) {
            return databaseUrl;
        }

        return databaseUrl.substring(0, schemeEnd + 3) + "***:***@" + databaseUrl.substring(atIndex + 1);
    }
}
