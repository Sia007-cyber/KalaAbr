package com.kalaabr.service;

import com.kalaabr.dto.IssuePermitRequest;
import com.kalaabr.dto.PermitResponse;

public interface PermitService {

    /** صدور مجوز خرید: چک نقدینگی و ظرفیت، برداشت فوری وجه، وضعیت ISSUED */
    PermitResponse issuePurchasePermit(IssuePermitRequest request);

    /** تأیید مجوز خرید: اعمال موجودی واقعی */
    PermitResponse confirmPurchasePermit(Long permitId);

    /** صدور مجوز فروش: چک موجودی قابل‌فروش (واقعی منهای رزروشده)، بدون اثر نقدی */
    PermitResponse issueSalePermit(IssuePermitRequest request);

    /** تأیید مجوز فروش: کاهش موجودی واقعی، واریز وجه */
    PermitResponse confirmSalePermit(Long permitId);

    /** لغو یک مجوز ISSUED؛ اگر خرید بود وجه برداشت‌شده برمی‌گردد */
    PermitResponse cancelPermit(Long permitId);

    PermitResponse getById(Long permitId);

    /** لیست همه مجوزها (به ترتیب ثبت) */
    java.util.List<PermitResponse> findAll();
}
