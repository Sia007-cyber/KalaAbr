package com.kalaabr.repository;

import com.kalaabr.entity.PermitLine;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface PermitLineRepository extends JpaRepository<PermitLine, Long> {

    /**
     * جمع مقدار در مجوزهای خرید (PURCHASE) با وضعیت ISSUED برای یک کالا.
     * معادل incoming_stock در نسخه دسکتاپ — همیشه دینامیک محاسبه می‌شود،
     * هرگز به‌صورت ستون جداگانه ذخیره نمی‌شود.
     */
    @Query("""
        SELECT COALESCE(SUM(pl.quantity), 0)
        FROM PermitLine pl
        WHERE pl.item.id = :itemId
          AND pl.permit.permitType = com.kalaabr.entity.PermitType.PURCHASE
          AND pl.permit.status = com.kalaabr.entity.PermitStatus.ISSUED
        """)
    Integer sumIncomingQuantity(@Param("itemId") Long itemId);

    /**
     * جمع مقدار در مجوزهای فروش (SALE) با وضعیت ISSUED برای یک کالا.
     * معادل موجودی رزروشده — دینامیک محاسبه می‌شود.
     */
    @Query("""
        SELECT COALESCE(SUM(pl.quantity), 0)
        FROM PermitLine pl
        WHERE pl.item.id = :itemId
          AND pl.permit.permitType = com.kalaabr.entity.PermitType.SALE
          AND pl.permit.status = com.kalaabr.entity.PermitStatus.ISSUED
        """)
    Integer sumReservedQuantity(@Param("itemId") Long itemId);

    /**
     * جمع کل مقدار incoming (مجوزهای خرید ISSUED) برای همه کالاهای یک انبار.
     * برای چک ظرفیت انبار هنگام صدور یک مجوز خرید جدید استفاده می‌شود.
     */
    @Query("""
        SELECT COALESCE(SUM(pl.quantity), 0)
        FROM PermitLine pl
        WHERE pl.item.warehouse.id = :warehouseId
          AND pl.permit.permitType = com.kalaabr.entity.PermitType.PURCHASE
          AND pl.permit.status = com.kalaabr.entity.PermitStatus.ISSUED
        """)
    Integer sumIncomingQuantityByWarehouse(@Param("warehouseId") Long warehouseId);
}
