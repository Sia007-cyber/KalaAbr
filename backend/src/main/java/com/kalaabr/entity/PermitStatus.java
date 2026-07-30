package com.kalaabr.entity;

/**
 * وضعیت مجوز:
 * ISSUED    = صادر شده، هنوز تأیید (اجرای فیزیکی) نشده.
 *             موجودی رزروشده/incoming از روی مجوزهای این وضعیت محاسبه می‌شود.
 * CONFIRMED = تأیید شده و روی موجودی واقعی اعمال شده.
 * CANCELLED = لغو شده، هیچ اثری روی موجودی و نقدینگی ندارد.
 */
public enum PermitStatus {
    ISSUED,
    CONFIRMED,
    CANCELLED
}
