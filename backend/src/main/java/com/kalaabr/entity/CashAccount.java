package com.kalaabr.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

/**
 * حساب نقدی شرکت.
 * منطق: برداشت در زمان صدور مجوز خرید (تعهد خرید)،
 *        واریز در زمان تأیید مجوز فروش (تحقق فروش).
 * فعلاً یک رکورد singleton (تک‌انباری). اگر بعداً چند انبار/شعبه مستقل
 * نیاز به حساب جدا داشتند، می‌شود به هر Warehouse یک CashAccount وصل کرد.
 */
@Entity
@Table(name = "cash_account")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class CashAccount {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, precision = 19, scale = 4)
    private BigDecimal balance;
}
