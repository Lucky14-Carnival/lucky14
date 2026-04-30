package PawerOpp.Lucky14.repository;

import PawerOpp.Lucky14.model.Users;
import org.hibernate.usertype.UserType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UsersRepository extends JpaRepository<Users, Long> {

    Optional<Users> findByUsername(String username);
    List<Users> findAllByBranch_Id(Long branchId);
    boolean existsByBranch_Id(Long branchId);
    void deleteAllByBranch_Id(Long branchId);

}
