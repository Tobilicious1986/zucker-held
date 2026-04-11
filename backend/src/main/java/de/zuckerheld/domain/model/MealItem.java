package de.zuckerheld.domain.model;

import jakarta.persistence.*;

@Entity
@Table(name = "meal_items")
public class MealItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "entry_id", nullable = false)
    private Entry entry;

    private String name;
    @Column(name = "amount_g")
    private Integer amountG;  // Menge in Gramm
    private Integer kh;       // Kohlenhydrate dieser Portion in g

    // ── Getter/Setter ──────────────────────────────────────────────────────

    public Long getId() { return id; }

    public Entry getEntry() { return entry; }
    public void setEntry(Entry entry) { this.entry = entry; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public Integer getAmountG() { return amountG; }
    public void setAmountG(Integer amountG) { this.amountG = amountG; }

    public Integer getKh() { return kh; }
    public void setKh(Integer kh) { this.kh = kh; }
}
