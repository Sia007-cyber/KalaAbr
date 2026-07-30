package com.kalaabr.repository;

import com.kalaabr.entity.CashAccount;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CashAccountRepository extends JpaRepository<CashAccount, Long> {
    // چون فعلاً یک رکورد singleton داریم، همیشه قدیمی‌ترین (اولین) رکورد گرفته می‌شود.
    java.util.Optional<CashAccount> findTopByOrderByIdAsc();
}
