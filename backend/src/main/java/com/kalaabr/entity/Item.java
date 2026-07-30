package com.kalaabr.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "item")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Item {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "category_id", nullable = false)
    private Category category;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "warehouse_id", nullable = false)
    private Warehouse warehouse;

    /**
     * موجودی واقعی فعلی — فقط زمانی تغییر می‌کند که یک مجوز CONFIRMED شود.
     * موجودی رزروشده (برای فروش) و incoming (برای خرید) اینجا ذخیره نمی‌شوند؛
     * این دو مقدار همیشه از روی مجوزهای ISSUED به‌صورت دینامیک محاسبه می‌شوند
     * (نگاه کن به PermitLineRepository / سرویس گزارش‌گیری در فاز بعد).
     */
    @Column(nullable = false)
    private Integer quantityOnHand = 0;

    @Column(nullable = false)
    private String unitOfMeasure;
}
