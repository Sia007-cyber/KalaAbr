-- مقداردهی اولیه موجودی نقدی شرکت
-- V1 مقدار ۰ را درج کرده؛ این مایگریشن همان رکورد singleton را به موجودی
-- قابل قبول برای شروع کار (خرید/فروش از سمت frontend) می‌رساند.
-- idempotent است: اگر رکوردی نبود می‌سازد، وگرنه همان را به‌روز می‌کند.
INSERT INTO cash_account (id, balance) VALUES (1, 100000000)
ON CONFLICT (id) DO UPDATE SET balance = 100000000;
