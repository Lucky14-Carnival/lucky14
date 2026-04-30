package PawerOpp.Lucky14.Service.users;

import PawerOpp.Lucky14.dto.users.UsersRequest;
import PawerOpp.Lucky14.dto.users.UsersResponse;
import PawerOpp.Lucky14.model.Enums.Roles;
import PawerOpp.Lucky14.model.Users;

import java.util.List;

public interface IUsers {

    UsersResponse create(UsersRequest request, Long createdByUserId);
    UsersResponse getById(Long id);
    List<UsersResponse> getAll(Long branchId);
    UsersResponse update(Long id, UsersRequest request);
    void deactivate(Long id);
    void delete(Long id);
    Users getEntity(Long id);
    boolean canAccessBranch(Roles role, Long actorBranchId, Long targetBranchId);
    void validateRoleAssignment(UsersRequest request);
    UsersResponse toResponse(Users user);

}
