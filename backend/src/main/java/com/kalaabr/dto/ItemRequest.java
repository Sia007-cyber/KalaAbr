package com.kalaabr.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;

/** درخواست ایجاد یا ویرایش کالا */
public record ItemRequest(
        @NotBlank(message = "نام کالا الزامی است")
        String name,

        @NotNull(message = "دسته‌بندی کالا الزامی است")
        Long categoryId,

        @NotNull(message = "انبار کالا الزامی است")
        Long warehouseId,

        @NotNull(message = "واحد شمارش الزامی است")
        @NotBlank(message = "واحد شمارش الزامی است")
        String unitOfMeasure,

        @PositiveOrZero(message = "موجودی اولیه باید صفر یا عددی مثبت باشد")
        Integer quantityOnHand
) {
}