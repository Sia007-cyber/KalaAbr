package com.kalaabr.exception;

public class InsufficientStockException extends BusinessRuleException {
    public InsufficientStockException(String itemName, int requested, int available) {
        super("موجودی کافی برای «%s» نیست. درخواستی: %d، موجود قابل فروش: %d"
                .formatted(itemName, requested, available));
    }
}
