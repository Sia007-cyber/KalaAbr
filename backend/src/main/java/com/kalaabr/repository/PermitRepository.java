package com.kalaabr.repository;

import com.kalaabr.entity.Permit;
import com.kalaabr.entity.PermitStatus;
import com.kalaabr.entity.PermitType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PermitRepository extends JpaRepository<Permit, Long> {
    List<Permit> findByStatus(PermitStatus status);
    List<Permit> findByPermitTypeAndStatus(PermitType permitType, PermitStatus status);
}
