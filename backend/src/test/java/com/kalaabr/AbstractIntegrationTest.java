package com.kalaabr;

import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;
import org.testcontainers.containers.PostgreSQLContainer;

import java.math.BigDecimal;
import java.util.LinkedHashMap;
import java.util.Map;

import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * پایهٔ تست‌های یکپارچگی: کانتینر Postgres + MockMvc احرازشده.
 * <p>
 * از {@code MockMvcBuilders.defaultRequest(...)} برای چسباندن هدر
 * {@code Authorization} به همهٔ درخواست‌ها استفاده می‌شود، بنابراین کارهای
 * کنترلرهای داخلی بدون تغییر هدر هر درخواست کاربرِ واردشده را می‌سازند.
 * {@code unauthMockMvc} برای مسیرهای عمومی (/api/auth/**) و ادعای 401 است.
 * <p>
 * کانتینر با الگوی «تک‌نمونه‌ای» فقط یک بار برای کل JVM تست، به‌صورت دستی در
 * static block بالا می‌آید (نه با {@code @Container} که طول عمر را per-class
 * می‌کند) و هرگز به‌صورت صریح متوقف نمی‌شود — Ryuk هنگام خروج JVM خودش پاکش
 * می‌کند. چون همهٔ کلاس‌های اینتگریشن از همین کلاس ارث می‌برند، هر کلاس کانتینر
 * جداگانهٔ خودش را نمی‌سازد و مشکل «پورت نامطابق» (هر کلاس پورت تصادفی خودش را
 * می‌گرفت) از بین می‌رود.
 */
@SpringBootTest
abstract class AbstractIntegrationTest {

    static final PostgreSQLContainer<?> POSTGRES;

    static {
        POSTGRES = new PostgreSQLContainer<>("postgres:16-alpine")
                .withDatabaseName("kalaabr")
                .withUsername("kalaabr")
                .withPassword("kalaabr");
        POSTGRES.start(); // یک بار برای کل JVM — Ryuk موقع خروج پاکش می‌کند
    }

    protected static final String TEST_USERNAME = "testuser";
    protected static final String TEST_EMAIL = "test@kalaabr.test";
    protected static final String TEST_PASSWORD = "password123";

    @DynamicPropertySource
    static void overrideDatasource(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", POSTGRES::getJdbcUrl);
        registry.add("spring.datasource.username", POSTGRES::getUsername);
        registry.add("spring.datasource.password", POSTGRES::getPassword);
    }

    @Autowired
    protected WebApplicationContext webApplicationContext;

    @Autowired
    protected ObjectMapper objectMapper;

    @Autowired
    protected JdbcTemplate jdbcTemplate;

    /** MockMvc احرازشده — همهٔ درخواست‌ها حامل Bearer token هستند. */
    protected MockMvc mockMvc;

    /** MockMvc بدون احراز — برای /api/auth/** و بررسی 401. */
    protected MockMvc unauthMockMvc;

    protected String authToken;

    @BeforeEach
    void setUp() throws Exception {
        unauthMockMvc = MockMvcBuilders.webAppContextSetup(webApplicationContext)
                .apply(springSecurity())
                .build();
        cleanDatabase();
        ensureAuthenticated();
        mockMvc = MockMvcBuilders.webAppContextSetup(webApplicationContext)
                .apply(springSecurity())
                .defaultRequest(get("/**").header(HttpHeaders.AUTHORIZATION, "Bearer " + authToken))
                .build();
    }

    protected void cleanDatabase() {
        // users عمداً truncate نمی‌شود تا کاربر تستی بین تست‌ها بماند.
        jdbcTemplate.execute(
                "TRUNCATE TABLE permit_line, permit, item, category, warehouse RESTART IDENTITY CASCADE");
        jdbcTemplate.execute("UPDATE cash_account SET balance = 0");
    }

    /** کاربر تستی را ثبت می‌کند (یا در صورت وجود قبلاً، فقط وارد می‌شود) و توکن را می‌گیرد. */
    private void ensureAuthenticated() throws Exception {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("username", TEST_USERNAME);
        body.put("email", TEST_EMAIL);
        body.put("password", TEST_PASSWORD);

        MvcResult result = unauthMockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andReturn();

        int status = result.getResponse().getStatus();
        if (status == 409) { // قبلاً ثبت شده → فقط وارد شو
            result = unauthMockMvc.perform(post("/api/auth/login")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(body)))
                    .andReturn();
        }

        JsonNode json = objectMapper.readTree(result.getResponse().getContentAsString());
        authToken = json.get("token").asString();
    }

    // ------------------------------------------------------------ ابزار کمکی

    protected String jsonOf(Map<String, Object> map) throws Exception {
        return objectMapper.writeValueAsString(map);
    }

    protected void setCash(BigDecimal balance) {
        jdbcTemplate.update("UPDATE cash_account SET balance = ?", balance);
    }

    protected JsonNode postJson(String url, String body) throws Exception {
        MvcResult result = mockMvc.perform(post(url).contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isCreated())
                .andReturn();
        return objectMapper.readTree(result.getResponse().getContentAsString());
    }

    protected long postId(String url, String body) throws Exception {
        return postJson(url, body).get("id").asLong();
    }

    protected long createWarehouse(String name, int capacity) throws Exception {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("name", name);
        body.put("capacity", capacity);
        return postId("/api/warehouses", jsonOf(body));
    }

    protected long createCategory(String name, Long parentId) throws Exception {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("name", name);
        if (parentId != null) {
            body.put("parentId", parentId);
        }
        return postId("/api/categories", jsonOf(body));
    }

    protected long createItem(String name, long categoryId, long warehouseId, int onHand) throws Exception {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("name", name);
        body.put("categoryId", categoryId);
        body.put("warehouseId", warehouseId);
        body.put("unitOfMeasure", "عدد");
        body.put("quantityOnHand", onHand);
        return postId("/api/items", jsonOf(body));
    }

    protected JsonNode issuePermit(String url, long warehouseId, long itemId, int quantity, String unitPrice)
            throws Exception {
        Map<String, Object> line = new LinkedHashMap<>();
        line.put("itemId", itemId);
        line.put("quantity", quantity);
        line.put("unitPrice", new BigDecimal(unitPrice));

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("warehouseId", warehouseId);
        body.put("lines", java.util.List.of(line));
        return postJson(url, jsonOf(body));
    }

    protected JsonNode getJson(String url) throws Exception {
        MvcResult result = mockMvc.perform(get(url)).andExpect(status().isOk()).andReturn();
        return objectMapper.readTree(result.getResponse().getContentAsString());
    }
}
