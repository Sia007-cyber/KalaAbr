package com.kalaabr.service;

import com.kalaabr.dto.IssuePermitRequest;
import com.kalaabr.dto.PermitLineRequest;
import com.kalaabr.dto.PermitMapper;
import com.kalaabr.dto.PermitResponse;
import com.kalaabr.entity.*;
import com.kalaabr.exception.*;
import com.kalaabr.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * پیاده‌سازی منطق کسب‌وکار مجوزها.
 * <p>
 * قواعد اصلی (منتقل‌شده از نسخه دسکتاپ):
 * - incoming_stock و موجودی رزروشده هیچ‌وقت ذخیره نمی‌شوند؛ همیشه از روی
 *   PermitLine های وضعیت ISSUED محاسبه می‌شوند.
 * - نقدینگی: برداشت در زمان صدور مجوز خرید (تعهد)، واریز در زمان تأیید مجوز فروش (تحقق).
 * - هر عملیات atomically انجام می‌شود (@Transactional) — یا کامل انجام می‌شود یا هیچ اثری نمی‌گذارد.
 */
@Service
@RequiredArgsConstructor
public class PermitServiceImpl implements PermitService {

    private final PermitRepository permitRepository;
    private final PermitLineRepository permitLineRepository;
    private final ItemRepository itemRepository;
    private final WarehouseRepository warehouseRepository;
    private final CashAccountRepository cashAccountRepository;

    // ---------------------------------------------------------------- خرید

    @Override
    @Transactional
    public PermitResponse issuePurchasePermit(IssuePermitRequest request) {
        Warehouse warehouse = getWarehouseOrThrow(request.warehouseId());

        Permit permit = new Permit();
        permit.setPermitType(PermitType.PURCHASE);
        permit.setStatus(PermitStatus.ISSUED);
        permit.setWarehouse(warehouse);

        BigDecimal total = BigDecimal.ZERO;
        int totalNewQuantity = 0;

        for (PermitLineRequest lineReq : request.lines()) {
            Item item = getItemOrThrow(lineReq.itemId());
            if (!item.getWarehouse().getId().equals(warehouse.getId())) {
                throw new BusinessRuleException(
                        "کالای «%s» متعلق به این انبار نیست".formatted(item.getName()));
            }

            PermitLine line = new PermitLine();
            line.setItem(item);
            line.setQuantity(lineReq.quantity());
            line.setUnitPrice(lineReq.unitPrice());
            permit.addLine(line);

            total = total.add(lineReq.unitPrice().multiply(BigDecimal.valueOf(lineReq.quantity())));
            totalNewQuantity += lineReq.quantity();
        }
        permit.setTotalAmount(total);

        // چک ۱: ظرفیت انبار — موجودی فعلی + incoming موجود + این مجوز جدید نباید از ظرفیت بیشتر شود
        int currentOnHand = itemRepository.sumQuantityOnHandByWarehouse(warehouse.getId());
        int currentIncoming = permitLineRepository.sumIncomingQuantityByWarehouse(warehouse.getId());
        int projectedTotal = currentOnHand + currentIncoming + totalNewQuantity;
        if (projectedTotal > warehouse.getCapacity()) {
            int remainingCapacity = warehouse.getCapacity() - currentOnHand - currentIncoming;
            throw new InsufficientCapacityException(totalNewQuantity, Math.max(remainingCapacity, 0));
        }

        // چک ۲: نقدینگی کافی
        CashAccount cash = getCashAccount();
        if (cash.getBalance().compareTo(total) < 0) {
            throw new InsufficientCashException(total, cash.getBalance());
        }

        // برداشت فوری وجه (تعهد خرید)
        cash.setBalance(cash.getBalance().subtract(total));
        cashAccountRepository.save(cash);

        Permit saved = permitRepository.save(permit);
        return PermitMapper.toResponse(saved);
    }

    @Override
    @Transactional
    public PermitResponse confirmPurchasePermit(Long permitId) {
        Permit permit = getPermitOrThrow(permitId);
        requireType(permit, PermitType.PURCHASE);
        requireStatus(permit, PermitStatus.ISSUED, "تأیید مجوز خرید");

        for (PermitLine line : permit.getLines()) {
            Item item = line.getItem();
            item.setQuantityOnHand(item.getQuantityOnHand() + line.getQuantity());
            itemRepository.save(item);
        }

        permit.setStatus(PermitStatus.CONFIRMED);
        permit.setConfirmedAt(LocalDateTime.now());
        Permit saved = permitRepository.save(permit);
        return PermitMapper.toResponse(saved);
    }

    // ---------------------------------------------------------------- فروش

    @Override
    @Transactional
    public PermitResponse issueSalePermit(IssuePermitRequest request) {
        Warehouse warehouse = getWarehouseOrThrow(request.warehouseId());

        Permit permit = new Permit();
        permit.setPermitType(PermitType.SALE);
        permit.setStatus(PermitStatus.ISSUED);
        permit.setWarehouse(warehouse);

        BigDecimal total = BigDecimal.ZERO;

        for (PermitLineRequest lineReq : request.lines()) {
            Item item = getItemOrThrow(lineReq.itemId());
            if (!item.getWarehouse().getId().equals(warehouse.getId())) {
                throw new BusinessRuleException(
                        "کالای «%s» متعلق به این انبار نیست".formatted(item.getName()));
            }

            // چک موجودی قابل‌فروش = موجودی واقعی - موجودی از قبل رزروشده در مجوزهای فروش ISSUED دیگر
            int alreadyReserved = permitLineRepository.sumReservedQuantity(item.getId());
            int available = item.getQuantityOnHand() - alreadyReserved;
            if (lineReq.quantity() > available) {
                throw new InsufficientStockException(item.getName(), lineReq.quantity(), available);
            }

            PermitLine line = new PermitLine();
            line.setItem(item);
            line.setQuantity(lineReq.quantity());
            line.setUnitPrice(lineReq.unitPrice());
            permit.addLine(line);

            total = total.add(lineReq.unitPrice().multiply(BigDecimal.valueOf(lineReq.quantity())));
        }
        permit.setTotalAmount(total);

        // بدون اثر نقدی در این مرحله — واریز فقط هنگام تأیید انجام می‌شود
        Permit saved = permitRepository.save(permit);
        return PermitMapper.toResponse(saved);
    }

    @Override
    @Transactional
    public PermitResponse confirmSalePermit(Long permitId) {
        Permit permit = getPermitOrThrow(permitId);
        requireType(permit, PermitType.SALE);
        requireStatus(permit, PermitStatus.ISSUED, "تأیید مجوز فروش");

        for (PermitLine line : permit.getLines()) {
            Item item = line.getItem();
            if (item.getQuantityOnHand() < line.getQuantity()) {
                // اتفاق نباید بیفتد چون در زمان صدور چک شده، ولی به‌عنوان محافظ نهایی نگه داشته می‌شود
                throw new InsufficientStockException(item.getName(), line.getQuantity(), item.getQuantityOnHand());
            }
            item.setQuantityOnHand(item.getQuantityOnHand() - line.getQuantity());
            itemRepository.save(item);
        }

        CashAccount cash = getCashAccount();
        cash.setBalance(cash.getBalance().add(permit.getTotalAmount()));
        cashAccountRepository.save(cash);

        permit.setStatus(PermitStatus.CONFIRMED);
        permit.setConfirmedAt(LocalDateTime.now());
        Permit saved = permitRepository.save(permit);
        return PermitMapper.toResponse(saved);
    }

    // ---------------------------------------------------------------- لغو

    @Override
    @Transactional
    public PermitResponse cancelPermit(Long permitId) {
        Permit permit = getPermitOrThrow(permitId);
        requireStatus(permit, PermitStatus.ISSUED, "لغو مجوز");

        if (permit.getPermitType() == PermitType.PURCHASE) {
            // وجهی که در زمان صدور برداشت شده بود، برمی‌گردد
            CashAccount cash = getCashAccount();
            cash.setBalance(cash.getBalance().add(permit.getTotalAmount()));
            cashAccountRepository.save(cash);
        }
        // برای مجوز فروش لغوشده هیچ اثر نقدی‌ای برای برگرداندن وجود ندارد چون چیزی واریز نشده بود

        permit.setStatus(PermitStatus.CANCELLED);
        Permit saved = permitRepository.save(permit);
        return PermitMapper.toResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public PermitResponse getById(Long permitId) {
        return PermitMapper.toResponse(getPermitOrThrow(permitId));
    }

    @Override
    @Transactional(readOnly = true)
    public List<PermitResponse> findAll() {
        return permitRepository.findAll().stream()
                .map(PermitMapper::toResponse)
                .toList();
    }

    // ------------------------------------------------------------ کمکی‌ها

    private Warehouse getWarehouseOrThrow(Long id) {
        return warehouseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("انبار", id));
    }

    private Item getItemOrThrow(Long id) {
        return itemRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("کالا", id));
    }

    private Permit getPermitOrThrow(Long id) {
        return permitRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("مجوز", id));
    }

    private CashAccount getCashAccount() {
        return cashAccountRepository.findTopByOrderByIdAsc()
                .orElseThrow(() -> new IllegalStateException("حساب نقدی شرکت مقداردهی اولیه نشده است"));
    }

    private void requireStatus(Permit permit, PermitStatus expected, String action) {
        if (permit.getStatus() != expected) {
            throw new InvalidPermitStateException(permit.getId(), permit.getStatus(), action);
        }
    }

    private void requireType(Permit permit, PermitType expected) {
        if (permit.getPermitType() != expected) {
            throw new BusinessRuleException(
                    "مجوز #%d از نوع %s است، عملیات درخواستی برای نوع %s معتبر است"
                            .formatted(permit.getId(), permit.getPermitType(), expected));
        }
    }
}
