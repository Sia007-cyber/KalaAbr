package com.kalaabr.dto;

import com.kalaabr.entity.PermitStatus;
import com.kalaabr.entity.PermitType;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record PermitResponse(
        Long id,
        PermitType permitType,
        PermitStatus status,
        Long warehouseId,
        String warehouseName,
        BigDecimal totalAmount,
        LocalDateTime createdAt,
        LocalDateTime confirmedAt,
        List<PermitLineResponse> lines
) {
}
