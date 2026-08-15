package com.kalaabr.web;

import com.kalaabr.dto.ItemRequest;
import com.kalaabr.dto.ItemResponse;
import com.kalaabr.service.ItemService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * کالاها.
 * <p>
 * توجه: فیلدهای incomingStock و reservedStock در پاسخ «هرگز» ذخیره نمی‌شوند؛
 * همیشه هنگام ساخت پاسخ از روی مجوزهای ISSUED به‌صورت زنده محاسبه می‌شوند.
 */
@Tag(name = "کالاها", description = "مدیریت کالاها (CRUD) — موجودی رزرو/incoming همیشه زنده محاسبه می‌شود")
@RestController
@RequestMapping("/api/items")
@RequiredArgsConstructor
public class ItemController {

    private final ItemService itemService;

    @GetMapping
    @Operation(summary = "لیست همه کالاها")
    public List<ItemResponse> findAll(
            @RequestParam(required = false) Long warehouseId,
            @RequestParam(required = false) Long categoryId) {

        if (warehouseId != null) {
            return itemService.findByWarehouseId(warehouseId);
        }
        if (categoryId != null) {
            return itemService.findByCategoryId(categoryId);
        }
        return itemService.findAll();
    }

    @GetMapping("/{id}")
    @Operation(summary = "مشاهده یک کالا")
    public ItemResponse getById(@PathVariable Long id) {
        return itemService.getById(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "ایجاد کالا")
    public ItemResponse create(@Valid @RequestBody ItemRequest request) {
        return itemService.create(request);
    }

    @PutMapping("/{id}")
    @Operation(summary = "به‌روزرسانی کالا")
    public ItemResponse update(@PathVariable Long id, @Valid @RequestBody ItemRequest request) {
        return itemService.update(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "حذف کالا")
    public void delete(@PathVariable Long id) {
        itemService.delete(id);
    }
}