package com.kalaabr.service;

import com.kalaabr.dto.WarehouseRequest;
import com.kalaabr.dto.WarehouseResponse;

import java.util.List;

public interface WarehouseService {

    List<WarehouseResponse> findAll();

    WarehouseResponse getById(Long id);

    WarehouseResponse create(WarehouseRequest request);

    WarehouseResponse update(Long id, WarehouseRequest request);

    void delete(Long id);
}