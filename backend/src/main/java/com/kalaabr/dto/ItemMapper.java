package com.kalaabr.dto;

import com.kalaabr.entity.Item;

/** نقشه‌برداری Item → ItemResponse با محاسبه زنده موجودی رزروشده و incoming */
public final class ItemMapper {

    private ItemMapper() {
    }

    public static ItemResponse toResponse(
            Item item,
            Integer incomingStock,
            Integer reservedStock) {

        int onHand = item.getQuantityOnHand() == null ? 0 : item.getQuantityOnHand();
        int incoming = incomingStock == null ? 0 : incomingStock;
        int reserved = reservedStock == null ? 0 : reservedStock;

        return new ItemResponse(
                item.getId(),
                item.getName(),
                item.getCategory() == null ? null : item.getCategory().getId(),
                item.getCategory() == null ? null : item.getCategory().getName(),
                item.getWarehouse() == null ? null : item.getWarehouse().getId(),
                item.getWarehouse() == null ? null : item.getWarehouse().getName(),
                onHand,
                incoming,
                reserved,
                onHand - reserved,
                item.getUnitOfMeasure()
        );
    }
}