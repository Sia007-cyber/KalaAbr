package com.kalaabr;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

/**
 * تست اسموک بارگذاری کانتکست اسپرینگ.
 * کانتینر Postgres از {@link AbstractIntegrationTest} (الگوی تک‌نمونه‌ای مشترک)
 * ارث می‌بره؛ Flyway مایگریشن‌ها روی همان کانتینر واحد اجرا می‌شن. اینطوری هیچ
 * کلاس اینتگریشن دیگه‌ای کانتینر جدا با پورت تصادفی خودش نمی‌سازه.
 */
@SpringBootTest
class KalaAbrApplicationTests extends AbstractIntegrationTest {

	@Test
	void contextLoads() {
	}

}
