package com.kalaabr.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** درخواست ثبت‌نام کاربر جدید */
public record RegisterRequest(
        @NotBlank(message = "نام کاربری الزامی است")
        @Size(min = 3, max = 50, message = "نام کاربری باید بین ۳ تا ۵۰ کاراکتر باشد")
        String username,

        @NotBlank(message = "ایمیل الزامی است")
        @Email(message = "ایمیل معتبر نیست")
        String email,

        @NotBlank(message = "رمز عبور الزامی است")
        @Size(min = 8, message = "رمز عبور باید حداقل ۸ کاراکتر باشد")
        String password
) {
}
