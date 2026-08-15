package com.kalaabr.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.util.List;

/** درخواست صدور مجوز خرید یا فروش (نوع مجوز از طریق endpoint مشخص می‌شود، نه این DTO) */
public record IssuePermitRequest(
        @NotNull(message = "شناسه انبار الزامی است")
        Long warehouseId,

        @NotEmpty(message = "حداقل یک ردیف کالا لازم است")
        @Valid
        List<PermitLineRequest> lines
) {
}