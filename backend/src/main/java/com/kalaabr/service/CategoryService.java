package com.kalaabr.service;

import com.kalaabr.dto.CategoryRequest;
import com.kalaabr.dto.CategoryResponse;

import java.util.List;

public interface CategoryService {

    /** درخت کامل دسته‌بندی‌ها از ریشه‌ها */
    List<CategoryResponse> getTree();

    /** لیست مسطح همه دسته‌بندی‌ها */
    List<CategoryResponse> findAll();

    CategoryResponse getById(Long id);

    CategoryResponse create(CategoryRequest request);

    CategoryResponse update(Long id, CategoryRequest request);

    void delete(Long id);
}