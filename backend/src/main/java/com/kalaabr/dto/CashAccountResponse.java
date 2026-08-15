package com.kalaabr.dto;

/** نمای حساب نقدی شرکت (تک‌رکورد singleton) */
public record CashAccountResponse(
        Long id,
        java.math.BigDecimal balance
) {
}