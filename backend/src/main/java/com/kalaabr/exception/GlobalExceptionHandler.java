package com.kalaabr.exception;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

import jakarta.servlet.http.HttpServletRequest;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * تبدیل استثناها به پاسخ‌های HTTP استاندارد با بدنه JSON یکسان:
 * { timestamp, status, error, message, path } + فیلدهای اضافه برای خطاهای اعتبارسنجی.
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    private static final DateTimeFormatter FORMATTER = DateTimeFormatter.ISO_LOCAL_DATE_TIME;

    // ------------------------------------------------------------ خطاهای اعتبارسنجی

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorBody> handleValidation(MethodArgumentNotValidException ex, HttpServletRequest request) {
        Map<String, String> fieldErrors = new LinkedHashMap<>();
        for (FieldError fe : ex.getBindingResult().getFieldErrors()) {
            fieldErrors.putIfAbsent(fe.getField(), fe.getDefaultMessage());
        }

        ErrorBody body = base(HttpStatus.BAD_REQUEST, request)
                .putValue("fieldErrors", fieldErrors);
        return ResponseEntity.badRequest().body(body);
    }

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<ErrorBody> handleTypeMismatch(MethodArgumentTypeMismatchException ex, HttpServletRequest request) {
        ErrorBody body = base(HttpStatus.BAD_REQUEST, request)
                .putValue("detail", "نوع پارامتر «%s» نامعتبر است".formatted(ex.getName()));
        return ResponseEntity.badRequest().body(body);
    }

    @ExceptionHandler(MissingServletRequestParameterException.class)
    public ResponseEntity<ErrorBody> handleMissingParam(MissingServletRequestParameterException ex, HttpServletRequest request) {
        ErrorBody body = base(HttpStatus.BAD_REQUEST, request)
                .putValue("detail", "پارامتر «%s» الزامی است".formatted(ex.getParameterName()));
        return ResponseEntity.badRequest().body(body);
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ErrorBody> handleUnreadable(HttpMessageNotReadableException ex, HttpServletRequest request) {
        ErrorBody body = base(HttpStatus.BAD_REQUEST, request)
                .putValue("detail", "بدنه درخواست نامعتبر است (JSON خوانا نیست)");
        return ResponseEntity.badRequest().body(body);
    }

    // ------------------------------------------------------------ منطق کسب‌وکار

    @ExceptionHandler(DuplicateResourceException.class)
    public ResponseEntity<ErrorBody> handleDuplicate(DuplicateResourceException ex, HttpServletRequest request) {
        return ResponseEntity.status(HttpStatus.CONFLICT).body(base(HttpStatus.CONFLICT, request).message(ex.getMessage()));
    }

    @ExceptionHandler(ConflictException.class)
    public ResponseEntity<ErrorBody> handleConflict(ConflictException ex, HttpServletRequest request) {
        return ResponseEntity.status(HttpStatus.CONFLICT).body(base(HttpStatus.CONFLICT, request).message(ex.getMessage()));
    }

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ErrorBody> handleNotFound(ResourceNotFoundException ex, HttpServletRequest request) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(base(HttpStatus.NOT_FOUND, request).message(ex.getMessage()));
    }

    @ExceptionHandler(BusinessRuleException.class)
    public ResponseEntity<ErrorBody> handleBusiness(BusinessRuleException ex, HttpServletRequest request) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(base(HttpStatus.BAD_REQUEST, request).message(ex.getMessage()));
    }

    // ------------------------------------------------------------ وزن داده

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ErrorBody> handleDataIntegrity(DataIntegrityViolationException ex, HttpServletRequest request) {
        log.warn("Data integrity violation: {}", ex.getMessage());
        ErrorBody body = base(HttpStatus.CONFLICT, request)
                .message("محدودیت یکتایی یا ارجاع داده رعایت نشده است");
        if (ex.getMostSpecificCause() != null) {
            body.putValue("detail", ex.getMostSpecificCause().getMessage());
        }
        return ResponseEntity.status(HttpStatus.CONFLICT).body(body);
    }

    @ExceptionHandler(NoResourceFoundException.class)
    public ResponseEntity<ErrorBody> handleNoResource(NoResourceFoundException ex, HttpServletRequest request) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(base(HttpStatus.NOT_FOUND, request));
    }

    // ------------------------------------------------------------ دسته عمومی

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorBody> handleGeneric(Exception ex, HttpServletRequest request) {
        log.error("Unhandled exception at {}", request.getRequestURI(), ex);
        ErrorBody body = base(HttpStatus.INTERNAL_SERVER_ERROR, request)
                .message("خطای داخلی سرور");
        if (log.isDebugEnabled() && ex.getMessage() != null) {
            body.putValue("detail", ex.getMessage());
        }
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(body);
    }

    // ------------------------------------------------------------ بدنه خطا

    private ErrorBody base(HttpStatus status, HttpServletRequest request) {
        ErrorBody body = new ErrorBody();
        body.put("timestamp", LocalDateTime.now().format(FORMATTER));
        body.put("status", status.value());
        body.put("error", status.getReasonPhrase());
        body.put("message", "");
        body.put("path", request.getRequestURI());
        return body;
    }

    /**
     * بدنه خطا — یک LinkedHashMap است تا Jackson آن را به‌صورت مسطح (flat) سریالایز کند؛
     * یعنی دقیقاً { timestamp, status, error, message, path, ... } بدون هیچ wrapper اضافه.
     */
    public static final class ErrorBody extends LinkedHashMap<String, Object> {

        ErrorBody message(String message) {
            put("message", message);
            return this;
        }

        ErrorBody putValue(String key, Object val) {
            put(key, val);
            return this;
        }
    }
}