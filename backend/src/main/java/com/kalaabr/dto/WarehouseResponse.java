package com.kalaabr.dto;

/** نمای انبار برای پاسخ API */
public record WarehouseResponse(
        Long id,
        String name,
        String address,
        Integer capacity
) {
}