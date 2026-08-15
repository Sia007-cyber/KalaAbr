package com.kalaabr.service;

import com.kalaabr.dto.CashAccountMapper;
import com.kalaabr.dto.CashAccountResponse;
import com.kalaabr.exception.ResourceNotFoundException;
import com.kalaabr.repository.CashAccountRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class CashAccountServiceImpl implements CashAccountService {

    private final CashAccountRepository cashAccountRepository;

    @Override
    @Transactional(readOnly = true)
    public CashAccountResponse getAccount() {
        return cashAccountRepository.findTopByOrderByIdAsc()
                .map(CashAccountMapper::toResponse)
                .orElseThrow(() -> new ResourceNotFoundException("حساب نقدی", 1L));
    }
}