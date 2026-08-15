package com.kalaabr.service;

import com.kalaabr.dto.CategoryMapper;
import com.kalaabr.dto.CategoryRequest;
import com.kalaabr.dto.CategoryResponse;
import com.kalaabr.entity.Category;
import com.kalaabr.exception.BusinessRuleException;
import com.kalaabr.exception.ResourceNotFoundException;
import com.kalaabr.repository.CategoryRepository;
import com.kalaabr.repository.ItemRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CategoryServiceImpl implements CategoryService {

    private final CategoryRepository categoryRepository;
    private final ItemRepository itemRepository;

    @Override
    @Transactional(readOnly = true)
    public List<CategoryResponse> getTree() {
        return categoryRepository.findByParentIsNull().stream()
                .map(CategoryMapper::toTree)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<CategoryResponse> findAll() {
        return categoryRepository.findAll().stream()
                .map(CategoryMapper::toFlat)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public CategoryResponse getById(Long id) {
        return CategoryMapper.toTree(getCategoryOrThrow(id));
    }

    @Override
    @Transactional
    public CategoryResponse create(CategoryRequest request) {
        Category category = new Category();
        category.setName(request.name());
        category.setParent(resolveParent(request.parentId()));
        return CategoryMapper.toTree(categoryRepository.save(category));
    }

    @Override
    @Transactional
    public CategoryResponse update(Long id, CategoryRequest request) {
        Category category = getCategoryOrThrow(id);

        if (request.parentId() != null && request.parentId().equals(id)) {
            throw new BusinessRuleException("یک دسته‌بندی نمی‌تواند والد خودش باشد");
        }

        category.setName(request.name());
        category.setParent(resolveParent(request.parentId()));
        return CategoryMapper.toTree(categoryRepository.save(category));
    }

    @Override
    @Transactional
    public void delete(Long id) {
        Category category = getCategoryOrThrow(id);

        boolean hasChildren = category.getChildren() != null && !category.getChildren().isEmpty();
        boolean hasItems = itemRepository.existsByCategoryId(id);
        if (hasItems) {
            throw new BusinessRuleException(
                    "دسته‌بندی «%s» دارای کالا است و قابل حذف نیست".formatted(category.getName()));
        }
        if (hasChildren) {
            throw new BusinessRuleException(
                    "دسته‌بندی «%s» دارای زیردسته است و قابل حذف نیست".formatted(category.getName()));
        }

        categoryRepository.delete(category);
    }

    private Category getCategoryOrThrow(Long id) {
        return categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("دسته‌بندی", id));
    }

    private Category resolveParent(Long parentId) {
        if (parentId == null) {
            return null;
        }
        return getCategoryOrThrow(parentId);
    }
}