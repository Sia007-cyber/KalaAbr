package com.kalaabr.exception;

public class InsufficientCapacityException extends BusinessRuleException {
    public InsufficientCapacityException(int required, int available) {
        super("ظرفیت انبار کافی نیست. مورد نیاز: %d، ظرفیت باقی‌مانده: %d".formatted(required, available));
    }
}
