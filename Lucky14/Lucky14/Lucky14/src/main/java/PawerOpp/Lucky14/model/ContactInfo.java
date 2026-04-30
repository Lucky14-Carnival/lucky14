package PawerOpp.Lucky14.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "contact_info")
@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
public class ContactInfo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "user_id")
    private Users users;

    @Enumerated(EnumType.STRING)
    private ContactType type;

    private String value;

    public enum ContactType {
        phone,
        email
    }

}
