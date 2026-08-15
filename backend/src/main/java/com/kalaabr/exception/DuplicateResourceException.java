package com.kalaabr.exception;

/** یک شناسه موجود با همان مقدار یکتا درخواست شده است */
public class DuplicateResourceException extends ConflictException {
    public DuplicateResourceException(String message) {
        super(message);
    }
}