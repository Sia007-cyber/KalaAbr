package com.kalaabr.service;

import com.kalaabr.dto.ItemRequest;
import com.kalaabr.dto.ItemResponse;

import java.util.List;

public interface ItemService {

    List<ItemResponse> findAll();

    List<ItemResponse> findByWarehouseId(Long warehouseId);

    List<ItemResponse> findByCategoryId(Long categoryId);

    ItemResponse getById(Long id);

    ItemResponse create(ItemRequest request);

    ItemResponse update(Long id, ItemRequest request);

    void delete(Long id);
}