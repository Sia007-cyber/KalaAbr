package com.kalaabr.exception;

public class ResourceNotFoundException extends BusinessRuleException {
    public ResourceNotFoundException(String entityName, Long id) {
        super("%s با شناسه %d یافت نشد".formatted(entityName, id));
    }
}
