package com.kalaabr.web;

import com.kalaabr.dto.CategoryRequest;
import com.kalaabr.dto.CategoryResponse;
import com.kalaabr.service.CategoryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "دسته‌بندی‌ها", description = "مدیریت درخت دسته‌بندی کالاها (ساختار خودارجاع)")
@RestController
@RequestMapping("/api/categories")
@RequiredArgsConstructor
public class CategoryController {

    private final CategoryService categoryService;

    @GetMapping
    @Operation(summary = "درخت کامل دسته‌بندی‌ها از ریشه‌ها")
    public List<CategoryResponse> getTree() {
        return categoryService.getTree();
    }

    @GetMapping("/flat")
    @Operation(summary = "لیست مسطح همه دسته‌بندی‌ها")
    public List<CategoryResponse> getFlatList() {
        return categoryService.findAll();
    }

    @GetMapping("/{id}")
    @Operation(summary = "مشاهده یک دسته با زیردسته‌هایش")
    public CategoryResponse getById(@PathVariable Long id) {
        return categoryService.getById(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "ایجاد دسته‌بندی")
    public CategoryResponse create(@Valid @RequestBody CategoryRequest request) {
        return categoryService.create(request);
    }

    @PutMapping("/{id}")
    @Operation(summary = "به‌روزرسانی دسته‌بندی")
    public CategoryResponse update(@PathVariable Long id, @Valid @RequestBody CategoryRequest request) {
        return categoryService.update(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "حذف دسته‌بندی")
    public void delete(@PathVariable Long id) {
        categoryService.delete(id);
    }
}