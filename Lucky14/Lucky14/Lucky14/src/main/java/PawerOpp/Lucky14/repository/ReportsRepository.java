package PawerOpp.Lucky14.repository;

import PawerOpp.Lucky14.model.Report;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface ReportsRepository extends JpaRepository<Report, Long> {

    Optional<Report> findByBranch_IdAndDate(Long branchId, LocalDate date);
    Optional<Report> findFirstByBranch_IdAndDateAndFinalizedFalse(Long branchId, LocalDate date);
    Optional<Report> findFirstByBranch_IdAndDateAndFinalizedTrue(Long branchId, LocalDate date);
    List<Report> findAllByBranch_IdAndDateBetween(Long branchId, LocalDate from, LocalDate to);
    boolean existsByUsers_Id(Long userId);
    boolean existsByBranch_Id(Long branchId);
    void deleteAllByUsers_Id(Long userId);
    void deleteAllByBranch_Id(Long branchId);

}
