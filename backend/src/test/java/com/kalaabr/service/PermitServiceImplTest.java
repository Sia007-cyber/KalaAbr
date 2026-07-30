package com.kalaabr.service;

import com.kalaabr.dto.IssuePermitRequest;
import com.kalaabr.dto.PermitLineRequest;
import com.kalaabr.dto.PermitResponse;
import com.kalaabr.entity.*;
import com.kalaabr.exception.InsufficientCapacityException;
import com.kalaabr.exception.InsufficientCashException;
import com.kalaabr.exception.InsufficientStockException;
import com.kalaabr.exception.InvalidPermitStateException;
import com.kalaabr.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.*;

/**
 * تست‌های یونیت لایه سرویس مجوزها.
 * همه ریپازیتوری‌ها mock می‌شوند — هدف این تست‌ها بررسی قواعد کسب‌وکار است، نه دیتابیس واقعی.
 * تست‌های یکپارچگی با Testcontainers/Postgres در فاز بعد اضافه می‌شود.
 */
@ExtendWith(MockitoExtension.class)
class PermitServiceImplTest {

    @Mock private PermitRepository permitRepository;
    @Mock private PermitLineRepository permitLineRepository;
    @Mock private ItemRepository itemRepository;
    @Mock private WarehouseRepository warehouseRepository;
    @Mock private CashAccountRepository cashAccountRepository;

    @InjectMocks
    private PermitServiceImpl permitService;

    private Warehouse warehouse;
    private Item item;
    private CashAccount cashAccount;

    @BeforeEach
    void setUp() {
        warehouse = new Warehouse();
        warehouse.setId(1L);
        warehouse.setName("انبار مرکزی");
        warehouse.setCapacity(1000);

        Category category = new Category();
        category.setId(1L);
        category.setName("لوازم خانگی");

        item = new Item();
        item.setId(1L);
        item.setName("یخچال");
        item.setCategory(category);
        item.setWarehouse(warehouse);
        item.setQuantityOnHand(50);
        item.setUnitOfMeasure("عدد");

        cashAccount = new CashAccount();
        cashAccount.setId(1L);
        cashAccount.setBalance(BigDecimal.valueOf(1_000_000));

        // save همیشه همان ورودی را برمی‌گرداند (شبیه‌سازی رفتار JPA بدون دیتابیس واقعی)
        lenient().when(permitRepository.save(any(Permit.class))).thenAnswer(inv -> inv.getArgument(0));
        lenient().when(itemRepository.save(any(Item.class))).thenAnswer(inv -> inv.getArgument(0));
        lenient().when(cashAccountRepository.save(any(CashAccount.class))).thenAnswer(inv -> inv.getArgument(0));
    }

    private IssuePermitRequest requestFor(int quantity, BigDecimal unitPrice) {
        return new IssuePermitRequest(warehouse.getId(), List.of(
                new PermitLineRequest(item.getId(), quantity, unitPrice)
        ));
    }

    // -------------------------------------------------------- صدور مجوز خرید

    @Nested
    class IssuePurchasePermit {

        @BeforeEach
        void stubCommon() {
            when(warehouseRepository.findById(warehouse.getId())).thenReturn(Optional.of(warehouse));
            when(itemRepository.findById(item.getId())).thenReturn(Optional.of(item));
            when(itemRepository.sumQuantityOnHandByWarehouse(warehouse.getId())).thenReturn(50);
            when(permitLineRepository.sumIncomingQuantityByWarehouse(warehouse.getId())).thenReturn(0);
        }

        @Test
        void success_withdrawsCashAndReturnsIssuedPermit() {
            when(cashAccountRepository.findTopByOrderByIdAsc()).thenReturn(Optional.of(cashAccount));

            PermitResponse response = permitService.issuePurchasePermit(requestFor(10, BigDecimal.valueOf(100)));

            assertThat(response.status()).isEqualTo(PermitStatus.ISSUED);
            assertThat(response.permitType()).isEqualTo(PermitType.PURCHASE);
            assertThat(response.totalAmount()).isEqualByComparingTo("1000");
            // ۱۰ عدد در قیمت ۱۰۰ = ۱۰۰۰ باید از حساب نقدی کم شود
            assertThat(cashAccount.getBalance()).isEqualByComparingTo("999000");
            verify(cashAccountRepository).save(cashAccount);
        }

        @Test
        void insufficientCash_throwsAndDoesNotWithdraw() {
            cashAccount.setBalance(BigDecimal.valueOf(500));
            when(cashAccountRepository.findTopByOrderByIdAsc()).thenReturn(Optional.of(cashAccount));

            assertThatThrownBy(() -> permitService.issuePurchasePermit(requestFor(10, BigDecimal.valueOf(100))))
                    .isInstanceOf(InsufficientCashException.class);

            // موجودی نباید تغییر کرده باشد
            assertThat(cashAccount.getBalance()).isEqualByComparingTo("500");
            verify(cashAccountRepository, never()).save(any());
            verify(permitRepository, never()).save(any());
        }

        @Test
        void insufficientCapacity_throwsBeforeCheckingCash() {
            // ظرفیت انبار ۱۰۰۰، موجودی فعلی ۵۰، ۹۶۰ واحد incoming از قبل رزرو شده -> فقط ۱۰ جا باقی مانده
            when(permitLineRepository.sumIncomingQuantityByWarehouse(warehouse.getId())).thenReturn(960);

            assertThatThrownBy(() -> permitService.issuePurchasePermit(requestFor(50, BigDecimal.valueOf(100))))
                    .isInstanceOf(InsufficientCapacityException.class);

            verify(cashAccountRepository, never()).findTopByOrderByIdAsc();
            verify(permitRepository, never()).save(any());
        }
    }

    @Test
    void confirmPurchasePermit_increasesQuantityOnHand() {
        Permit permit = buildIssuedPermit(PermitType.PURCHASE, 20, BigDecimal.valueOf(50));
        when(permitRepository.findById(permit.getId())).thenReturn(Optional.of(permit));

        PermitResponse response = permitService.confirmPurchasePermit(permit.getId());

        assertThat(response.status()).isEqualTo(PermitStatus.CONFIRMED);
        assertThat(item.getQuantityOnHand()).isEqualTo(70); // 50 اولیه + 20
        verify(itemRepository).save(item);
    }

    @Test
    void confirmPurchasePermit_alreadyConfirmed_throws() {
        Permit permit = buildIssuedPermit(PermitType.PURCHASE, 20, BigDecimal.valueOf(50));
        permit.setStatus(PermitStatus.CONFIRMED);
        when(permitRepository.findById(permit.getId())).thenReturn(Optional.of(permit));

        assertThatThrownBy(() -> permitService.confirmPurchasePermit(permit.getId()))
                .isInstanceOf(InvalidPermitStateException.class);
        assertThat(item.getQuantityOnHand()).isEqualTo(50); // بدون تغییر
    }

    // -------------------------------------------------------- صدور مجوز فروش

    @Test
    void issueSalePermit_success_noCashEffect() {
        when(warehouseRepository.findById(warehouse.getId())).thenReturn(Optional.of(warehouse));
        when(itemRepository.findById(item.getId())).thenReturn(Optional.of(item));
        when(permitLineRepository.sumReservedQuantity(item.getId())).thenReturn(0);

        PermitResponse response = permitService.issueSalePermit(requestFor(10, BigDecimal.valueOf(150)));

        assertThat(response.status()).isEqualTo(PermitStatus.ISSUED);
        assertThat(response.permitType()).isEqualTo(PermitType.SALE);
        verifyNoInteractions(cashAccountRepository); // در زمان صدور فروش هیچ اثر نقدی‌ای نباید باشد
    }

    @Test
    void issueSalePermit_insufficientStock_accountsForAlreadyReserved() {
        when(warehouseRepository.findById(warehouse.getId())).thenReturn(Optional.of(warehouse));
        when(itemRepository.findById(item.getId())).thenReturn(Optional.of(item));
        // موجودی واقعی ۵۰، ولی ۴۵ تا از قبل در مجوزهای فروش دیگر رزرو شده -> فقط ۵ تا آزاد است
        when(permitLineRepository.sumReservedQuantity(item.getId())).thenReturn(45);

        assertThatThrownBy(() -> permitService.issueSalePermit(requestFor(10, BigDecimal.valueOf(150))))
                .isInstanceOf(InsufficientStockException.class);
    }

    @Test
    void confirmSalePermit_decreasesQuantityAndDepositsCash() {
        Permit permit = buildIssuedPermit(PermitType.SALE, 15, BigDecimal.valueOf(200));
        when(permitRepository.findById(permit.getId())).thenReturn(Optional.of(permit));
        when(cashAccountRepository.findTopByOrderByIdAsc()).thenReturn(Optional.of(cashAccount));

        PermitResponse response = permitService.confirmSalePermit(permit.getId());

        assertThat(response.status()).isEqualTo(PermitStatus.CONFIRMED);
        assertThat(item.getQuantityOnHand()).isEqualTo(35); // 50 - 15
        assertThat(cashAccount.getBalance()).isEqualByComparingTo("1003000"); // 1_000_000 + (15*200)
    }

    // -------------------------------------------------------------- لغو مجوز

    @Test
    void cancelPermit_purchase_refundsCash() {
        Permit permit = buildIssuedPermit(PermitType.PURCHASE, 10, BigDecimal.valueOf(100));
        when(permitRepository.findById(permit.getId())).thenReturn(Optional.of(permit));
        when(cashAccountRepository.findTopByOrderByIdAsc()).thenReturn(Optional.of(cashAccount));

        PermitResponse response = permitService.cancelPermit(permit.getId());

        assertThat(response.status()).isEqualTo(PermitStatus.CANCELLED);
        assertThat(cashAccount.getBalance()).isEqualByComparingTo("1001000"); // 1_000_000 + 1000 برگشتی
    }

    @Test
    void cancelPermit_sale_hasNoCashEffect() {
        Permit permit = buildIssuedPermit(PermitType.SALE, 10, BigDecimal.valueOf(100));
        when(permitRepository.findById(permit.getId())).thenReturn(Optional.of(permit));

        PermitResponse response = permitService.cancelPermit(permit.getId());

        assertThat(response.status()).isEqualTo(PermitStatus.CANCELLED);
        verifyNoInteractions(cashAccountRepository);
    }

    @Test
    void cancelPermit_nonIssuedPermit_throws() {
        Permit permit = buildIssuedPermit(PermitType.PURCHASE, 10, BigDecimal.valueOf(100));
        permit.setStatus(PermitStatus.CANCELLED);
        when(permitRepository.findById(permit.getId())).thenReturn(Optional.of(permit));

        assertThatThrownBy(() -> permitService.cancelPermit(permit.getId()))
                .isInstanceOf(InvalidPermitStateException.class);
    }

    // ------------------------------------------------------------------ کمکی

    private Permit buildIssuedPermit(PermitType type, int quantity, BigDecimal unitPrice) {
        Permit permit = new Permit();
        permit.setId(99L);
        permit.setPermitType(type);
        permit.setStatus(PermitStatus.ISSUED);
        permit.setWarehouse(warehouse);
        permit.setTotalAmount(unitPrice.multiply(BigDecimal.valueOf(quantity)));

        PermitLine line = new PermitLine();
        line.setId(1L);
        line.setItem(item);
        line.setQuantity(quantity);
        line.setUnitPrice(unitPrice);
        permit.addLine(line);

        return permit;
    }
}
