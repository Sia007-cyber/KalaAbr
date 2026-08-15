package com.kalaabr.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;

/** درخواست ایجاد یا ویرایش انبار */
public record WarehouseRequest(
        @NotBlank(message = "نام انبار الزامی است")
        String name,

        String address,

        @NotNull(message = "ظرفیت انبار الزامی است")
        @PositiveOrZero(message = "ظرفیت انبار باید صفر یا عددی مثبت باشد")
        Integer capacity
) {
}