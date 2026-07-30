package com.kalaabr.dto;

import com.kalaabr.entity.Permit;
import com.kalaabr.entity.PermitLine;

import java.util.List;

public final class PermitMapper {

    private PermitMapper() {
    }

    public static PermitResponse toResponse(Permit permit) {
        List<PermitLineResponse> lines = permit.getLines().stream()
                .map(PermitMapper::toLineResponse)
                .toList();

        return new PermitResponse(
                permit.getId(),
                permit.getPermitType(),
                permit.getStatus(),
                permit.getWarehouse().getId(),
                permit.getWarehouse().getName(),
                permit.getTotalAmount(),
                permit.getCreatedAt(),
                permit.getConfirmedAt(),
                lines
        );
    }

    public static PermitLineResponse toLineResponse(PermitLine line) {
        return new PermitLineResponse(
                line.getId(),
                line.getItem().getId(),
                line.getItem().getName(),
                line.getQuantity(),
                line.getUnitPrice()
        );
    }
}
