package com.kalaabr.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;

import java.math.BigDecimal;

/** یک ردیف کالا در درخواست صدور مجوز (خرید یا فروش) */
public record PermitLineRequest(
        @NotNull Long itemId,
        @NotNull @Positive Integer quantity,
        @NotNull @PositiveOrZero BigDecimal unitPrice
) {
}
