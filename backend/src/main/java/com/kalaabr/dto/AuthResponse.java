package com.kalaabr.dto;

/** پاسخ ورود و ثبت‌نام: توکن JWT به همراه اطلاعات کاربر */
public record AuthResponse(
        String token,
        UserResponse user
) {
}
