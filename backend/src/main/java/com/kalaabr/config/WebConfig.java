package com.kalaabr.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * تنظیمات CORS برای API — فقط مسیرهای /api/** را باز می‌کند، نه کل اپلیکیشن.
 * <p>
 * لیست دامنه‌های مجاز از پراپرتی {@code app.cors.allowed-origins} خوانده می‌شود و
 * به‌صورت پیش‌فرض شامل Vite dev server است. برای اضافه کردن origin ها یا
 * دامنه‌های production کافی است همان پراپرتی را در application.yml تغییر دهید.
 * وقتی auth/token اضافه شد، هدر Authorization همین‌جا مجاز است.
 */
@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Value("${app.cors.allowed-origins:http://localhost:5173,http://127.0.0.1:5173}")
    private String[] allowedOrigins;

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
                .allowedOrigins(allowedOrigins)
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                .allowedHeaders("Content-Type", "Authorization", "Accept")
                .maxAge(3600);
    }
}