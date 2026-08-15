package com.kalaabr.service;

import com.kalaabr.dto.CashAccountResponse;

public interface CashAccountService {

    /** حساب نقدی singleton شرکت */
    CashAccountResponse getAccount();
}