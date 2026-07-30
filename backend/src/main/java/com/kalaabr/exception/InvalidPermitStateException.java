package com.kalaabr.exception;

import com.kalaabr.entity.PermitStatus;

public class InvalidPermitStateException extends BusinessRuleException {
    public InvalidPermitStateException(Long permitId, PermitStatus currentStatus, String attemptedAction) {
        super("مجوز #%d در وضعیت %s است و نمی‌توان عملیات «%s» را روی آن انجام داد"
                .formatted(permitId, currentStatus, attemptedAction));
    }
}
