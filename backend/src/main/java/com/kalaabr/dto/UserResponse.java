package com.kalaabr.dto;

import com.kalaabr.entity.Role;

import java.time.LocalDateTime;

/** نمای کاربر برای پاسخ API */
public record UserResponse(
        Long id,
        String username,
        String email,
        Role role,
        LocalDateTime createdAt
) {
}
