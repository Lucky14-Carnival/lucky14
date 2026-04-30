package PawerOpp.Lucky14.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "branches")
@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
public class Branch {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "province")
    private String province;

    @Column(name = "municipality")
    private String municipality;

    @Column(name = "barangay")
    private String barangay;

    @Column(name = "landmark")
    private String landmark;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "is_active")
    private boolean active = true;

    @OneToMany(mappedBy = "branch")
    private List<Users> users;

}
