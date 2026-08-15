package com.kalaabr.dto;

import com.kalaabr.entity.Category;

import java.util.ArrayList;
import java.util.List;

public final class CategoryMapper {

    private CategoryMapper() {
    }

    /**
     * نمای مسطح با parentId — برای لیست‌های ساده.
     * children عمداً null نگه داشته می‌شود تا JSON حجیم نشود.
     */
    public static CategoryResponse toFlat(Category category) {
        return new CategoryResponse(
                category.getId(),
                category.getName(),
                category.getParent() == null ? null : category.getParent().getId(),
                null
        );
    }

    /** نمای درختی — children به‌صورت بازگشتی ساخته می‌شوند */
    public static CategoryResponse toTree(Category category) {
        List<CategoryResponse> children = new ArrayList<>();
        if (category.getChildren() != null) {
            for (Category child : category.getChildren()) {
                children.add(toTree(child));
            }
        }
        return new CategoryResponse(
                category.getId(),
                category.getName(),
                category.getParent() == null ? null : category.getParent().getId(),
                children
        );
    }
}