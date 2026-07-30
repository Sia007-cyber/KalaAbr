package com.kalaabr.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "permit")
@Getter
@Setter
@NoArgsConstructor
public class Permit {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private PermitType permitType;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private PermitStatus status = PermitStatus.ISSUED;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "warehouse_id", nullable = false)
    private Warehouse warehouse;

    @OneToMany(mappedBy = "permit", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<PermitLine> lines = new ArrayList<>();

    @Column(nullable = false, precision = 19, scale = 4)
    private BigDecimal totalAmount;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    private LocalDateTime confirmedAt;

    /** helper برای اضافه کردن ردیف و برقراری ارتباط دوطرفه */
    public void addLine(PermitLine line) {
        lines.add(line);
        line.setPermit(this);
    }
}
