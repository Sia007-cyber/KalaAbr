package com.kalaabr.service;

import com.kalaabr.dto.ItemMapper;
import com.kalaabr.dto.ItemRequest;
import com.kalaabr.dto.ItemResponse;
import com.kalaabr.entity.Category;
import com.kalaabr.entity.Item;
import com.kalaabr.entity.Warehouse;
import com.kalaabr.exception.ResourceNotFoundException;
import com.kalaabr.repository.CategoryRepository;
import com.kalaabr.repository.ItemRepository;
import com.kalaabr.repository.PermitLineRepository;
import com.kalaabr.repository.WarehouseRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * سرویس کالاها.
 * <p>
 * نکته مهم: موجودی رزروشده (reserved) و incoming اینجا ذخیره نمی‌شوند.
 * هر بار که یک ItemResponse ساخته می‌شود، این دو مقدار از روی مجوزهای ISSUED
 * به‌صورت زنده محاسبه می‌شوند (پرس‌وجوهای PermitLineRepository).
 */
@Service
@RequiredArgsConstructor
public class ItemServiceImpl implements ItemService {

    private final ItemRepository itemRepository;
    private final CategoryRepository categoryRepository;
    private final WarehouseRepository warehouseRepository;
    private final PermitLineRepository permitLineRepository;

    @Override
    @Transactional(readOnly = true)
    public List<ItemResponse> findAll() {
        return itemRepository.findAll().stream()
                .map(this::toResponseWithLiveStock)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<ItemResponse> findByWarehouseId(Long warehouseId) {
        return itemRepository.findByWarehouseId(warehouseId).stream()
                .map(this::toResponseWithLiveStock)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<ItemResponse> findByCategoryId(Long categoryId) {
        return itemRepository.findByCategoryId(categoryId).stream()
                .map(this::toResponseWithLiveStock)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public ItemResponse getById(Long id) {
        return toResponseWithLiveStock(getItemOrThrow(id));
    }

    @Override
    @Transactional
    public ItemResponse create(ItemRequest request) {
        Item item = new Item();
        applyRequest(item, request);
        return toResponseWithLiveStock(itemRepository.save(item));
    }

    @Override
    @Transactional
    public ItemResponse update(Long id, ItemRequest request) {
        Item item = getItemOrThrow(id);
        applyRequest(item, request);
        return toResponseWithLiveStock(itemRepository.save(item));
    }

    @Override
    @Transactional
    public void delete(Long id) {
        Item item = getItemOrThrow(id);
        itemRepository.delete(item);
    }

    private Item getItemOrThrow(Long id) {
        return itemRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("کالا", id));
    }

    private void applyRequest(Item item, ItemRequest request) {
        Category category = categoryRepository.findById(request.categoryId())
                .orElseThrow(() -> new ResourceNotFoundException("دسته‌بندی", request.categoryId()));
        Warehouse warehouse = warehouseRepository.findById(request.warehouseId())
                .orElseThrow(() -> new ResourceNotFoundException("انبار", request.warehouseId()));

        item.setName(request.name());
        item.setCategory(category);
        item.setWarehouse(warehouse);
        item.setUnitOfMeasure(request.unitOfMeasure());
        if (item.getId() == null && request.quantityOnHand() != null) {
            // موجودی اولیه فقط هنگام ایجاد قابل تنظیم است؛ بعد از آن از مجوزها کنترل می‌شود
            item.setQuantityOnHand(request.quantityOnHand());
        }
    }

    /**
     * ساخت پاسخ با محاسبه زنده موجودی رزروشده و incoming از روی مجوزهای ISSUED.
     * این مقادیر هرگز از دیتابیس خوانده/نوشته نمی‌شوند؛ فقط در همین لحظه محاسبه می‌شوند.
     */
    private ItemResponse toResponseWithLiveStock(Item item) {
        Integer incoming = permitLineRepository.sumIncomingQuantity(item.getId());
        Integer reserved = permitLineRepository.sumReservedQuantity(item.getId());
        return ItemMapper.toResponse(item, incoming, reserved);
    }
}