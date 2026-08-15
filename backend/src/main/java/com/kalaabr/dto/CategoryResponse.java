package com.kalaabr.dto;

import java.util.List;

/** نمای دسته‌بندی برای پاسخ API؛ children فقط هنگام درخواست‌های درختی پر می‌شوند */
public record CategoryResponse(
        Long id,
        String name,
        Long parentId,
        List<CategoryResponse> children
) {
}