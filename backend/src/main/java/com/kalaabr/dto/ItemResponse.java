package com.kalaabr.dto;

/**
 * نمای کالا برای پاسخ API.
 * <p>
 * موجودی رزروشده و incoming هرگز در دیتابیس ذخیره نمی‌شوند؛ این دو مقدار
 * همیشه هنگام ساخت پاسخ، از روی مجوزهای ISSUED به‌صورت زنده محاسبه می‌شوند.
 */
public record ItemResponse(
        Long id,
        String name,
        Long categoryId,
        String categoryName,
        Long warehouseId,
        String warehouseName,
        Integer quantityOnHand,
        Integer incomingStock,
        Integer reservedStock,
        Integer availableStock,
        String unitOfMeasure
) {
}