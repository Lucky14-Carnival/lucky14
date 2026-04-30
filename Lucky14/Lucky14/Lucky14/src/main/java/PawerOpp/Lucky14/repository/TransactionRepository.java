package PawerOpp.Lucky14.repository;

import PawerOpp.Lucky14.model.Transaction;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface TransactionRepository extends JpaRepository<Transaction, Long> {

    List<Transaction> findAllByUsers_Branch_Id(Long branchId);
    List<Transaction> findAllByUsers_Branch_IdAndDateBetween(Long branchId, LocalDateTime startDate, LocalDateTime endDate);
    List<Transaction> findAllByUsers_Branch_IdAndType(Long branchId, String type);
    Optional<Transaction> findByIdAndUsers_Branch_Id(Long id, Long branchId);
    boolean existsByUsers_Id(Long userId);
    boolean existsByUsers_Branch_Id(Long branchId);
    void deleteAllByUsers_Id(Long userId);
    void deleteAllByUsers_Branch_Id(Long branchId);
    void deleteAllByUsers_Branch_IdAndDateBetween(Long branchId, LocalDateTime startDate, LocalDateTime endDate);
    void deleteAllByAttraction_Branch_Id(Long branchId);

}
