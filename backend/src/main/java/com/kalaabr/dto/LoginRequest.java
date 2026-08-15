package com.kalaabr.dto;

import jakarta.validation.constraints.NotBlank;

/**
 * درخواست ورود. ورود با نام کاربری (ترجیحی) یا ایمیل انجام می‌شود؛
 * سرویس ابتدا username را جستجو می‌کند و اگر پیدا نشد به سراغ email می‌رود.
 */
public record LoginRequest(
        String username,
        String email,

        @NotBlank(message = "رمز عبور الزامی است")
        String password
) {
}
