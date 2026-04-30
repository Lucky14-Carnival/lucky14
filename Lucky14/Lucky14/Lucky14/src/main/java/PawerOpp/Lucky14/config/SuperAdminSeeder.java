package PawerOpp.Lucky14.config;

import PawerOpp.Lucky14.model.ContactInfo;
import PawerOpp.Lucky14.model.Enums.Roles;
import PawerOpp.Lucky14.model.Users;
import PawerOpp.Lucky14.repository.ContactInfoRepository;
import PawerOpp.Lucky14.repository.UsersRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@RequiredArgsConstructor
public class SuperAdminSeeder implements CommandLineRunner {

    private static final String SUPER_ADMIN_USERNAME = "Allen";
    private static final String SUPER_ADMIN_PASSWORD = "Allen@Lucky14";
    private static final String SUPER_ADMIN_EMAIL = "lucky14carnival@gmail.com";
    private static final String SUPER_ADMIN_PHONE = "09388052521";

    private final UsersRepository usersRepository;
    private final ContactInfoRepository contactInfoRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(String... args) {
        Users user = usersRepository.findByUsername(SUPER_ADMIN_USERNAME).orElseGet(Users::new);

        user.setUsername(SUPER_ADMIN_USERNAME);
        user.setRole(Roles.SUPER_ADMIN);
        user.setActive(true);
        user.setBranch(null);

        if (user.getPassword() == null || !passwordEncoder.matches(SUPER_ADMIN_PASSWORD, user.getPassword())) {
            user.setPassword(passwordEncoder.encode(SUPER_ADMIN_PASSWORD));
        }

        Users savedUser = usersRepository.save(user);
        upsertContact(savedUser, ContactInfo.ContactType.email, SUPER_ADMIN_EMAIL);
        upsertContact(savedUser, ContactInfo.ContactType.phone, SUPER_ADMIN_PHONE);
    }

    private void upsertContact(Users user, ContactInfo.ContactType type, String value) {
        ContactInfo contact = contactInfoRepository.findByUsersAndType(user, type).orElseGet(ContactInfo::new);
        contact.setUsers(user);
        contact.setType(type);
        contact.setValue(value);
        contactInfoRepository.save(contact);
    }
}
