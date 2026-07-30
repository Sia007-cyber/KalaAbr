package com.kalaabr.dto;

import java.math.BigDecimal;

public record PermitLineResponse(
        Long id,
        Long itemId,
        String itemName,
        Integer quantity,
        BigDecimal unitPrice
) {
}
