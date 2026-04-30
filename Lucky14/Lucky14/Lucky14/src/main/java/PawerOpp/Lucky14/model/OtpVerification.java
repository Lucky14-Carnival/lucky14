package PawerOpp.Lucky14.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "otp_verification")
@Getter
@Setter
public class OtpVerification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "otp_code")
    private String otpCode;

    @Enumerated(EnumType.STRING)
    private Purpose purpose;

    @Column(name = "expiry_time")
    private LocalDateTime expiryTime;

    @Column(name = "is_used")
    private boolean isUsed = false;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

    public enum Purpose {
        password_reset,
        change_password
    }

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private Users users;

}
