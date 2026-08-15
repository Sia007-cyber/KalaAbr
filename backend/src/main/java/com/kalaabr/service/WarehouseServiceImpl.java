package com.kalaabr.service;

import com.kalaabr.dto.WarehouseMapper;
import com.kalaabr.dto.WarehouseRequest;
import com.kalaabr.dto.WarehouseResponse;
import com.kalaabr.entity.Warehouse;
import com.kalaabr.exception.BusinessRuleException;
import com.kalaabr.exception.DuplicateResourceException;
import com.kalaabr.exception.ResourceNotFoundException;
import com.kalaabr.repository.ItemRepository;
import com.kalaabr.repository.PermitRepository;
import com.kalaabr.repository.WarehouseRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class WarehouseServiceImpl implements WarehouseService {

    private final WarehouseRepository warehouseRepository;
    private final ItemRepository itemRepository;
    private final PermitRepository permitRepository;

    @Override
    @Transactional(readOnly = true)
    public List<WarehouseResponse> findAll() {
        return warehouseRepository.findAll().stream()
                .map(WarehouseMapper::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public WarehouseResponse getById(Long id) {
        return WarehouseMapper.toResponse(getWarehouseOrThrow(id));
    }

    @Override
    @Transactional
    public WarehouseResponse create(WarehouseRequest request) {
        assertUniqueName(request.name(), null);

        Warehouse warehouse = new Warehouse();
        warehouse.setName(request.name());
        warehouse.setAddress(request.address());
        warehouse.setCapacity(request.capacity());
        return WarehouseMapper.toResponse(warehouseRepository.save(warehouse));
    }

    @Override
    @Transactional
    public WarehouseResponse update(Long id, WarehouseRequest request) {
        Warehouse warehouse = getWarehouseOrThrow(id);
        assertUniqueName(request.name(), id);

        warehouse.setName(request.name());
        warehouse.setAddress(request.address());
        warehouse.setCapacity(request.capacity());
        return WarehouseMapper.toResponse(warehouseRepository.save(warehouse));
    }

    @Override
    @Transactional
    public void delete(Long id) {
        Warehouse warehouse = getWarehouseOrThrow(id);

        boolean hasItems = itemRepository.existsByWarehouseId(id);
        boolean hasPermits = permitRepository.existsByWarehouseId(id);
        if (hasItems || hasPermits) {
            throw new BusinessRuleException(
                    "انبار «%s» دارای کالا یا مجوز است و قابل حذف نیست".formatted(warehouse.getName()));
        }

        try {
            warehouseRepository.delete(warehouse);
        } catch (DataIntegrityViolationException e) {
            throw new BusinessRuleException(
                    "انبار «%s» دارای داده وابسته است و قابل حذف نیست".formatted(warehouse.getName()));
        }
    }

    private Warehouse getWarehouseOrThrow(Long id) {
        return warehouseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("انبار", id));
    }

    private void assertUniqueName(String name, Long selfId) {
        warehouseRepository.findByName(name)
                .filter(existing -> !existing.getId().equals(selfId))
                .ifPresent(existing -> {
                    throw new DuplicateResourceException("انباری با نام «%s» از قبل وجود دارد".formatted(name));
                });
    }
}