package com.kalaabr;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

/**
 * تست اسموک بارگذاری کانتکست اسپرینگ.
 * دیگه به Postgres محلی وابسته نیست: با Testcontainers یک کانتینر Postgres
 * موقت بالا میاد، Flyway مایگریشن‌ها (db/migration) رو خودکار روش اجرا
 * می‌کنه و کانتکست اسپرینگ باهاش لود می‌شه. کافیه Docker روی سیستم در دسترس باشه.
 */
@Testcontainers
@SpringBootTest
class KalaAbrApplicationTests {

	@Container
	static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine")
			.withDatabaseName("kalaabr")
			.withUsername("kalaabr")
			.withPassword("kalaabr");

	@DynamicPropertySource
	static void overrideDatasourceProperties(DynamicPropertyRegistry registry) {
		registry.add("spring.datasource.url", postgres::getJdbcUrl);
		registry.add("spring.datasource.username", postgres::getUsername);
		registry.add("spring.datasource.password", postgres::getPassword);
	}

	@Test
	void contextLoads() {
	}

}
