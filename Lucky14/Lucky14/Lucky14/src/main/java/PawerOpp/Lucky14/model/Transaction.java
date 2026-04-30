package PawerOpp.Lucky14.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "transactions", indexes = {
        @Index(name = "idx_transactions_branch_date", columnList = "date"),
        @Index(name = "idx_transactions_type", columnList = "type")
})
@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
public class Transaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "type")
    private String type;

    @Column(name = "amount")
    private BigDecimal amount;

    @Column(name = "date")
    private LocalDateTime date;

    @Column(name = "has_receipt")
    private Boolean hasReceipt = false;

    @Column(name = "approved")
    private Boolean approved = false;

    @Column(name = "remarks")
    private String remarks;

    @ManyToOne
    @JoinColumn(name = "attraction_id")
    private Attraction attraction;

    @ManyToOne
    @JoinColumn(name = "user_id")
    private Users users;

}
