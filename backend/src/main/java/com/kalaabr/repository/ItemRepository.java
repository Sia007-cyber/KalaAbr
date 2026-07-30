package com.kalaabr.repository;

import com.kalaabr.entity.Item;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ItemRepository extends JpaRepository<Item, Long> {
    List<Item> findByWarehouseId(Long warehouseId);
    List<Item> findByCategoryId(Long categoryId);

    /** جمع موجودی واقعی فعلی همه کالاهای یک انبار — برای چک ظرفیت */
    @org.springframework.data.jpa.repository.Query(
        "SELECT COALESCE(SUM(i.quantityOnHand), 0) FROM Item i WHERE i.warehouse.id = :warehouseId")
    Integer sumQuantityOnHandByWarehouse(@org.springframework.data.repository.query.Param("warehouseId") Long warehouseId);
}
