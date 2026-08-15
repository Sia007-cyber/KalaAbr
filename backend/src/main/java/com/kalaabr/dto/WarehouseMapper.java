package com.kalaabr.dto;

import com.kalaabr.entity.Warehouse;

public final class WarehouseMapper {

    private WarehouseMapper() {
    }

    public static WarehouseResponse toResponse(Warehouse warehouse) {
        return new WarehouseResponse(
                warehouse.getId(),
                warehouse.getName(),
                warehouse.getAddress(),
                warehouse.getCapacity()
        );
    }
}