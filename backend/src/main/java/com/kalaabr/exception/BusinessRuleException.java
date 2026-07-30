package com.kalaabr.exception;

/** پایه مشترک همه خطاهای منطق کسب‌وکار — برای مدیریت یکپارچه در GlobalExceptionHandler (فاز ۴) */
public class BusinessRuleException extends RuntimeException {
    public BusinessRuleException(String message) {
        super(message);
    }
}
