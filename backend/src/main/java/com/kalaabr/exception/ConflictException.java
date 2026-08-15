package com.kalaabr.exception;

/** وقتی درخواست مخرب/ناسازگار است (مثلاً حذف داده خودارجاعی) */
public class ConflictException extends BusinessRuleException {
    public ConflictException(String message) {
        super(message);
    }
}