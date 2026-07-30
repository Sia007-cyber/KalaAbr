package com.kalaabr.exception;

import java.math.BigDecimal;

public class InsufficientCashException extends BusinessRuleException {
    public InsufficientCashException(BigDecimal required, BigDecimal available) {
        super("موجودی نقدی کافی نیست. مورد نیاز: %s، موجود: %s".formatted(required, available));
    }
}
