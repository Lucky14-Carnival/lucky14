package PawerOpp.Lucky14.Service.users;

import PawerOpp.Lucky14.dto.users.UsersRequest;
import PawerOpp.Lucky14.dto.users.UsersResponse;
import PawerOpp.Lucky14.model.Branch;
import PawerOpp.Lucky14.model.ContactInfo;
import PawerOpp.Lucky14.model.Enums.Roles;
import PawerOpp.Lucky14.model.Users;
import PawerOpp.Lucky14.repository.BranchRepository;
import PawerOpp.Lucky14.repository.ContactInfoRepository;
import PawerOpp.Lucky14.repository.OtpRepository;
import PawerOpp.Lucky14.repository.ReportsRepository;
import PawerOpp.Lucky14.repository.TransactionRepository;
import PawerOpp.Lucky14.repository.UsersRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UserService implements IUsers{

    private final UsersRepository usersRepository;
    private final BranchRepository branchRepository;
    private final ContactInfoRepository contactInfoRepository;
    private final PasswordEncoder passwordEncoder;
    private final OtpRepository otpRepository;
    private final TransactionRepository transactionRepository;
    private final ReportsRepository reportsRepository;

    @Override
    public UsersResponse create(UsersRequest request, Long createdByUserId) {
        UsersRequest normalizedRequest = normalizeCreateRequest(request, createdByUserId);
        validateRoleAssignment(normalizedRequest);
        validatePassword(normalizedRequest.getPassword(), true);

        Users user = new Users();
        applyUserRequest(user, normalizedRequest);
        Users saved = usersRepository.save(user);
        syncContactInfo(saved, normalizedRequest);
        return toResponse(saved);
    }

    @Override
    public UsersResponse getById(Long id) {
        return toResponse(getEntity(id));
    }

    @Override
    public List<UsersResponse> getAll(Long branchId) {
        if (branchId == null) {
            return usersRepository.findAll().stream().map(this::toResponse).toList();
        }
        return usersRepository.findAllByBranch_Id(branchId).stream().map(this::toResponse).toList();
    }

    @Override
    public UsersResponse update(Long id, UsersRequest request) {
        validateRoleAssignment(request);
        validatePassword(request.getPassword(), false);
        Users user = getEntity(id);
        applyUserRequest(user, request);
        Users saved = usersRepository.save(user);
        syncContactInfo(saved, request);
        return toResponse(saved);
    }

    @Override
    public void deactivate(Long id) {
        Users user = getEntity(id);
        user.setActive(false);
        usersRepository.save(user);
    }

    @Override
    @Transactional
    public void delete(Long id) {
        Users user = getEntity(id);
        transactionRepository.deleteAllByUsers_Id(id);
        reportsRepository.deleteAllByUsers_Id(id);
        contactInfoRepository.deleteAllByUsers_Id(id);
        otpRepository.deleteAllByUsers_Id(id);
        usersRepository.delete(user);
    }

    @Override
    public Users getEntity(Long id) {
        return usersRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("User not found"));
    }

    @Override
    public boolean canAccessBranch(Roles role, Long actorBranchId, Long targetBranchId) {
        if (role == Roles.SUPER_ADMIN) {
            return true;
        }

        if (role == Roles.ADMIN) {
            return actorBranchId != null && actorBranchId.equals(targetBranchId);
        }

        return false;
    }

    @Override
    public void validateRoleAssignment(UsersRequest request) {
        boolean hasExistingBranches = branchRepository.count() > 0;

        if ((request.getRole() == Roles.USER || request.getRole() == Roles.ADMIN)
                && request.getBranchId() == null
                && hasExistingBranches) {
            throw new IllegalArgumentException("Admin and table manager accounts must be assigned to a branch.");
        }
    }

    private UsersRequest normalizeCreateRequest(UsersRequest request, Long createdByUserId) {
        if (createdByUserId == null) {
            return request;
        }

        Users creator = getEntity(createdByUserId);
        Long creatorBranchId = creator.getBranch() == null ? null : creator.getBranch().getId();

        if (creator.getRole() == Roles.ADMIN) {
            if (request.getRole() != Roles.USER) {
                throw new IllegalArgumentException("Admins can only create table manager accounts.");
            }
            if (creatorBranchId == null) {
                throw new IllegalArgumentException("Admin account must be assigned to a branch before creating users.");
            }

            request.setBranchId(creatorBranchId);
            return request;
        }

        if (creator.getRole() == Roles.SUPER_ADMIN) {
            boolean requiresBranch = branchRepository.count() > 0
                    && (request.getRole() == Roles.USER || request.getRole() == Roles.ADMIN);
            if (requiresBranch && request.getBranchId() == null) {
                throw new IllegalArgumentException("Super admin must assign a branch to the new admin or table manager.");
            }
        }

        return request;
    }

    @Override
    public UsersResponse toResponse(Users user) {
        Long branchId = user.getBranch() == null ? null : user.getBranch().getId();
        String email = null;
        String phone = null;

        for (ContactInfo contactInfo : contactInfoRepository.findAllByUsers_Id(user.getId())) {
            if (contactInfo.getType() == ContactInfo.ContactType.email) {
                email = contactInfo.getValue();
            } else if (contactInfo.getType() == ContactInfo.ContactType.phone) {
                phone = contactInfo.getValue();
            }
        }

        return UsersResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .role(user.getRole())
                .branchId(branchId)
                .branch(toBranchInfo(user.getBranch()))
                .active(user.isActive())
                .email(email)
                .phone(phone)
                .build();
    }

    private void applyUserRequest(Users user, UsersRequest request) {
        user.setUsername(request.getUsername());
        if (StringUtils.hasText(request.getPassword())) {
            user.setPassword(passwordEncoder.encode(request.getPassword()));
        }
        user.setRole(request.getRole());
        user.setActive(Boolean.TRUE.equals(request.getActive()));

        if (request.getBranchId() == null) {
            user.setBranch(null);
            // Admins without a branch are automatically deactivated.
            if (request.getRole() == Roles.ADMIN) {
                user.setActive(false);
            }
            return;
        }

        Branch branch = branchRepository.findById(request.getBranchId())
                .orElseThrow(() -> new IllegalArgumentException("Branch not found"));
        user.setBranch(branch);
    }

    private UsersResponse.BranchInfo toBranchInfo(Branch branch) {
        if (branch == null) {
            return null;
        }

        return UsersResponse.BranchInfo.builder()
                .id(branch.getId())
                .province(branch.getProvince())
                .municipality(branch.getMunicipality())
                .barangay(branch.getBarangay())
                .landmark(branch.getLandmark())
                .active(branch.isActive())
                .build();
    }

    private void syncContactInfo(Users user, UsersRequest request) {
        upsertContactInfo(user, ContactInfo.ContactType.email, request.getEmail());
        upsertContactInfo(user, ContactInfo.ContactType.phone, request.getPhone());
    }

    private void upsertContactInfo(Users user, ContactInfo.ContactType type, String value) {
        if (!StringUtils.hasText(value)) {
            return;
        }

        ContactInfo contactInfo = contactInfoRepository.findByUsersAndType(user, type)
                .orElseGet(() -> {
                    ContactInfo created = new ContactInfo();
                    created.setUsers(user);
                    created.setType(type);
                    return created;
                });
        contactInfo.setValue(value.trim());
        contactInfoRepository.save(contactInfo);
    }

    private void validatePassword(String password, boolean required) {
        if (!StringUtils.hasText(password)) {
            if (required) {
                throw new IllegalArgumentException("Password is required.");
            }
            return;
        }

        if (password.trim().length() < 8) {
            throw new IllegalArgumentException("Password must be at least 8 characters.");
        }
    }

}
