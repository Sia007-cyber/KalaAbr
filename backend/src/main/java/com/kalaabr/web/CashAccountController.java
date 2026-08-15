package com.kalaabr.web;

import com.kalaabr.dto.CashAccountResponse;
import com.kalaabr.service.CashAccountService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "حساب نقدی", description = "مشاهده موجودی نقدی شرکت (تک‌رکورد singleton)")
@RestController
@RequestMapping("/api/cash-account")
@RequiredArgsConstructor
public class CashAccountController {

    private final CashAccountService cashAccountService;

    @GetMapping
    @Operation(summary = "مشاهده موجودی نقدی فعلی")
    public CashAccountResponse getAccount() {
        return cashAccountService.getAccount();
    }
}