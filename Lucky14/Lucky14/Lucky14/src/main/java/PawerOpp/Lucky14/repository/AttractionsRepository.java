package PawerOpp.Lucky14.repository;

import PawerOpp.Lucky14.model.Attraction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AttractionsRepository extends JpaRepository<Attraction, Long> {
    List<Attraction> findAllByBranch_Id(Long branchId);
    boolean existsByBranch_Id(Long branchId);
    void deleteAllByBranch_Id(Long branchId);
}
