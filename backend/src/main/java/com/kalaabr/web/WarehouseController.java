package com.kalaabr.web;

import com.kalaabr.dto.WarehouseRequest;
import com.kalaabr.dto.WarehouseResponse;
import com.kalaabr.service.WarehouseService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "انبارها", description = "مدیریت انبارها (CRUD)")
@RestController
@RequestMapping("/api/warehouses")
@RequiredArgsConstructor
public class WarehouseController {

    private final WarehouseService warehouseService;

    @GetMapping
    @Operation(summary = "لیست همه انبارها")
    public List<WarehouseResponse> findAll() {
        return warehouseService.findAll();
    }

    @GetMapping("/{id}")
    @Operation(summary = "مشاهده یک انبار")
    public WarehouseResponse getById(@PathVariable Long id) {
        return warehouseService.getById(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "ایجاد انبار")
    public WarehouseResponse create(@Valid @RequestBody WarehouseRequest request) {
        return warehouseService.create(request);
    }

    @PutMapping("/{id}")
    @Operation(summary = "به‌روزرسانی انبار")
    public WarehouseResponse update(@PathVariable Long id, @Valid @RequestBody WarehouseRequest request) {
        return warehouseService.update(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "حذف انبار")
    public void delete(@PathVariable Long id) {
        warehouseService.delete(id);
    }
}