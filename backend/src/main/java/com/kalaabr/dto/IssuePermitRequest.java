package com.kalaabr.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.util.List;

/** درخواست صدور مجوز خرید یا فروش (نوع مجوز از طریق endpoint مشخص می‌شود، نه این DTO) */
public record IssuePermitRequest(
        @NotNull Long warehouseId,
        @NotEmpty @Valid List<PermitLineRequest> lines
) {
}
