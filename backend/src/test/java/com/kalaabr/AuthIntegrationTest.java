package com.kalaabr;

import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

import java.util.LinkedHashMap;
import java.util.Map;

import static org.hamcrest.Matchers.containsString;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * تست‌های احراز هویت: ثبت‌نام، ورود و محافظت از مسیرهای داخلی.
 * {@code unauthMockMvc} بدون توکن است؛ {@code mockMvc} حامل Bearer توکن کاربر تستی است.
 */
class AuthIntegrationTest extends AbstractIntegrationTest {

    @Nested
    class RegisterTests {

        @Test
        void registerNewUser_returns201WithToken() throws Exception {
            Map<String, Object> body = new LinkedHashMap<>();
            body.put("username", "ali");
            body.put("email", "ali@kalaabr.test");
            body.put("password", "secret123");

            unauthMockMvc.perform(post("/api/auth/register")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(jsonOf(body)))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.token").isNotEmpty())
                    .andExpect(jsonPath("$.user.username").value("ali"))
                    .andExpect(jsonPath("$.user.email").value("ali@kalaabr.test"))
                    .andExpect(jsonPath("$.user.role").value("USER"));
        }

        @Test
        void duplicateUsername_returnsConflict() throws Exception {
            Map<String, Object> body = new LinkedHashMap<>();
            body.put("username", TEST_USERNAME); // کاربر تستی از قبل در AbstractIntegrationTest ثبت شده
            body.put("email", "other@kalaabr.test");
            body.put("password", "secret123");

            unauthMockMvc.perform(post("/api/auth/register")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(jsonOf(body)))
                    .andExpect(status().isConflict())
                    .andExpect(jsonPath("$.message", containsString("از قبل وجود دارد")));
        }

        @Test
        void duplicateEmail_returnsConflict() throws Exception {
            Map<String, Object> body = new LinkedHashMap<>();
            body.put("username", "otheruser");
            body.put("email", TEST_EMAIL); // ایمیل کاربر تستی از قبل ثبت شده
            body.put("password", "secret123");

            unauthMockMvc.perform(post("/api/auth/register")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(jsonOf(body)))
                    .andExpect(status().isConflict())
                    .andExpect(jsonPath("$.message", containsString("از قبل ثبت شده")));
        }

        @Test
        void validationFailures_returnFieldErrors() throws Exception {
            Map<String, Object> body = new LinkedHashMap<>();
            body.put("username", "ab");        // خیلی کوتاه
            body.put("email", "not-an-email");
            body.put("password", "short");     // کمتر از ۸ کاراکتر

            unauthMockMvc.perform(post("/api/auth/register")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(jsonOf(body)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.fieldErrors.username").exists())
                    .andExpect(jsonPath("$.fieldErrors.email").exists())
                    .andExpect(jsonPath("$.fieldErrors.password").exists());
        }
    }

    @Nested
    class LoginTests {

        @Test
        void loginWithUsername_returns200AndToken() throws Exception {
            Map<String, Object> body = new LinkedHashMap<>();
            body.put("username", TEST_USERNAME);
            body.put("password", TEST_PASSWORD);

            unauthMockMvc.perform(post("/api/auth/login")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(jsonOf(body)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.token").exists())
                    .andExpect(jsonPath("$.user.username").value(TEST_USERNAME));
        }

        @Test
        void loginWithEmail_returns200AndToken() throws Exception {
            Map<String, Object> body = new LinkedHashMap<>();
            body.put("email", TEST_EMAIL);
            body.put("password", TEST_PASSWORD);

            unauthMockMvc.perform(post("/api/auth/login")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(jsonOf(body)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.token").exists())
                    .andExpect(jsonPath("$.user.email").value(TEST_EMAIL));
        }

        @Test
        void wrongPassword_returns401() throws Exception {
            Map<String, Object> body = new LinkedHashMap<>();
            body.put("username", TEST_USERNAME);
            body.put("password", "wrong-password");

            unauthMockMvc.perform(post("/api/auth/login")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(jsonOf(body)))
                    .andExpect(status().isUnauthorized())
                    .andExpect(jsonPath("$.message", containsString("نادرست است")));
        }

        @Test
        void unknownUser_returns401() throws Exception {
            Map<String, Object> body = new LinkedHashMap<>();
            body.put("username", "ghost");
            body.put("password", "whatever123");

            unauthMockMvc.perform(post("/api/auth/login")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(jsonOf(body)))
                    .andExpect(status().isUnauthorized())
                    .andExpect(jsonPath("$.message", containsString("نادرست است")));
        }
    }

    @Nested
    class ProtectionTests {

        @Test
        void unauthenticatedRequest_is401() throws Exception {
            unauthMockMvc.perform(get("/api/warehouses"))
                    .andExpect(status().isUnauthorized())
                    .andExpect(jsonPath("$.path").value("/api/warehouses"));
        }

        @Test
        void authenticatedRequest_is200() throws Exception {
            mockMvc.perform(get("/api/warehouses"))
                    .andExpect(status().isOk());
        }
    }
}