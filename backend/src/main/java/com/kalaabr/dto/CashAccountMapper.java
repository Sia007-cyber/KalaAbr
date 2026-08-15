package com.kalaabr.dto;

import com.kalaabr.entity.CashAccount;

public final class CashAccountMapper {

    private CashAccountMapper() {
    }

    public static CashAccountResponse toResponse(CashAccount account) {
        return new CashAccountResponse(account.getId(), account.getBalance());
    }
}