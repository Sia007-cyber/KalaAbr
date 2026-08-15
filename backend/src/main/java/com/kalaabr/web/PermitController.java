package com.kalaabr.web;

import com.kalaabr.dto.IssuePermitRequest;
import com.kalaabr.dto.PermitResponse;
import com.kalaabr.service.PermitService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * مجوزهای خرید و فروش.
 * <p>
 * چرخه حیات: صدور (issue) → تأیید (confirm) → پایان، یا صدور → لغو (cancel).
 * هر دو نوع مجوز با بدنه یکسان IssuePermitRequest کار می‌کنند؛ نوع در آدرس مشخص می‌شود.
 */
@Tag(name = "مجوزها", description = "صدور، تأیید، لغو و مشاهده مجوزهای خرید و فروش")
@RestController
@RequestMapping("/api/permits")
@RequiredArgsConstructor
public class PermitController {

    private final PermitService permitService;

    @GetMapping
    @Operation(summary = "لیست همه مجوزها")
    public List<PermitResponse> findAll() {
        return permitService.findAll();
    }

    @GetMapping("/{id}")
    @Operation(summary = "مشاهده یک مجوز با ردیف‌هایش")
    public PermitResponse getById(@PathVariable Long id) {
        return permitService.getById(id);
    }

    @PostMapping("/purchases")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "صدور مجوز خرید (برداشت فوری وجه، چک ظرفیت انبار)")
    public PermitResponse issuePurchase(@Valid @RequestBody IssuePermitRequest request) {
        return permitService.issuePurchasePermit(request);
    }

    @PostMapping("/purchases/{id}/confirm")
    @Operation(summary = "تأیید مجوز خرید (اعمال موجودی واقعی)")
    public PermitResponse confirmPurchase(@PathVariable Long id) {
        return permitService.confirmPurchasePermit(id);
    }

    @PostMapping("/sales")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "صدور مجوز فروش (چک موجودی قابل‌فروش)")
    public PermitResponse issueSale(@Valid @RequestBody IssuePermitRequest request) {
        return permitService.issueSalePermit(request);
    }

    @PostMapping("/sales/{id}/confirm")
    @Operation(summary = "تأیید مجوز فروش (کاهش موجودی، واریز وجه)")
    public PermitResponse confirmSale(@PathVariable Long id) {
        return permitService.confirmSalePermit(id);
    }

    @PostMapping("/{id}/cancel")
    @Operation(summary = "لغو مجوز ISSUED — اگر خرید بود وجه برداشت‌شده برمی‌گردد")
    public PermitResponse cancel(@PathVariable Long id) {
        return permitService.cancelPermit(id);
    }
}