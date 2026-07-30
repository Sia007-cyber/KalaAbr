package com.kalaabr.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "warehouse")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Warehouse {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String name;

    private String address;

    /**
     * ظرفیت کل انبار (بر حسب واحد شمارشی که در سطح آیتم‌ها استفاده می‌شود).
     * برای چک ظرفیت هنگام صدور مجوز خرید استفاده می‌شود.
     */
    @Column(nullable = false)
    private Integer capacity;
}
