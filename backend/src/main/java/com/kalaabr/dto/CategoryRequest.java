package com.kalaabr.dto;

import jakarta.validation.constraints.NotBlank;

/** درخواست ایجاد یا ویرایش دسته‌بندی کالا (parentId اختیاری — null یعنی ریشه) */
public record CategoryRequest(
        @NotBlank(message = "نام دسته‌بندی الزامی است")
        String name,

        Long parentId
) {
}