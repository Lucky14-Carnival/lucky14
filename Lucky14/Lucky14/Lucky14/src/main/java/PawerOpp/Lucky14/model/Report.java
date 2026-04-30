package PawerOpp.Lucky14.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "reports", indexes = {
        @Index(name = "idx_reports_branch_date", columnList = "branch_id,date")
})
@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
public class Report {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "date")
    private LocalDate date;

    @ManyToOne
    @JoinColumn(name = "branch_id")
    private Branch branch;

    @Column(name = "total_expenses", nullable = false)
    private BigDecimal totalExpenses = BigDecimal.ZERO;

    @Column(name = "total_borrowed_funds", nullable = false)
    private BigDecimal totalBorrowedFunds = BigDecimal.ZERO;

    @Column(name = "total_revenue", nullable = false)
    private BigDecimal totalRevenue = BigDecimal.ZERO;

    @Column(name = "profit", nullable = false)
    private BigDecimal profit = BigDecimal.ZERO;

    @Column(name = "is_finalized", nullable = false)
    private boolean finalized = false;

    @Column(name = "generated_at")
    private LocalDateTime generatedAt;

    @ManyToOne
    @JoinColumn(name = "user_id")
    private Users users;

}
