package com.kalaabr;

import tools.jackson.databind.JsonNode;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MvcResult;

import java.math.BigDecimal;
import java.util.LinkedHashMap;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.containsString;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * تست‌های یکپارچگی لایه REST با دیتابیس واقعی Postgres (Testcontainers).
 * <p>
 * کل چرخه: انبار/دسته/کالا → صدور/تأیید/لغو مجوز → حساب نقدی — همه از طریق HTTP
 * به‌صورت زنده تست می‌شوند. موجودی رزروشده و incoming هرگز در دیتابیس ذخیره
 * نمی‌شوند و فقط در پاسخ کالا به‌صورت دینامیک ظاهر می‌شوند.
 * <p>
 * راه‌اندازی کانتینر و هدر احراز هویت در {@link AbstractIntegrationTest} است؛
 * تکتک درخواست‌ها از طریق {@code mockMvc} احرازشده اجرا می‌شوند.
 */
class RestApiIntegrationTest extends AbstractIntegrationTest {

    // ================================================================== انبارها

    @Nested
    class WarehouseTests {

        @Test
        void createGetUpdateListAndDelete() throws Exception {
            long id = createWarehouse("انبار مرکزی", 1000);

            JsonNode fetched = getJson("/api/warehouses/" + id);
            assertThat(fetched.get("name").asString()).isEqualTo("انبار مرکزی");
            assertThat(fetched.get("capacity").asInt()).isEqualTo(1000);

            // لیست
            mockMvc.perform(get("/api/warehouses"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.length()").value(1));

            // به‌روزرسانی
            Map<String, Object> update = new LinkedHashMap<>();
            update.put("name", "انبار شرق");
            update.put("address", "تهران");
            update.put("capacity", 2000);
            mockMvc.perform(put("/api/warehouses/" + id).contentType(MediaType.APPLICATION_JSON)
                    .content(jsonOf(update)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.name").value("انبار شرق"));

            // حذف
            mockMvc.perform(delete("/api/warehouses/" + id)).andExpect(status().isNoContent());
            mockMvc.perform(get("/api/warehouses/" + id)).andExpect(status().isNotFound());
        }

        @Test
        void duplicateName_returnsConflict() throws Exception {
            createWarehouse("انبار مشترک", 500);

            Map<String, Object> duplicate = new LinkedHashMap<>();
            duplicate.put("name", "انبار مشترک");
            duplicate.put("capacity", 100);
            mockMvc.perform(post("/api/warehouses").contentType(MediaType.APPLICATION_JSON)
                    .content(jsonOf(duplicate)))
                    .andExpect(status().isConflict())
                    .andExpect(jsonPath("$.message", containsString("از قبل وجود دارد")));
        }

        @Test
        void validationFailures_returnFieldErrors() throws Exception {
            // نام خالی
            Map<String, Object> noName = new LinkedHashMap<>();
            noName.put("name", "");
            noName.put("capacity", 100);
            mockMvc.perform(post("/api/warehouses").contentType(MediaType.APPLICATION_JSON)
                    .content(jsonOf(noName)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.fieldErrors.name").exists());

            // ظرفیت منفی
            Map<String, Object> negative = new LinkedHashMap<>();
            negative.put("name", "انبار منفی");
            negative.put("capacity", -5);
            mockMvc.perform(post("/api/warehouses").contentType(MediaType.APPLICATION_JSON)
                    .content(jsonOf(negative)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.fieldErrors.capacity").exists());

            // ظرفیت غایب
            Map<String, Object> missing = new LinkedHashMap<>();
            missing.put("name", "انبار ناقص");
            mockMvc.perform(post("/api/warehouses").contentType(MediaType.APPLICATION_JSON)
                    .content(jsonOf(missing)))
                    .andExpect(status().isBadRequest());
        }

        @Test
        void notFound_returns404() throws Exception {
            mockMvc.perform(get("/api/warehouses/9999"))
                    .andExpect(status().isNotFound())
                    .andExpect(jsonPath("$.message", containsString("یافت نشد")));
            mockMvc.perform(put("/api/warehouses/9999").contentType(MediaType.APPLICATION_JSON)
                    .content(jsonOf(Map.of("name", "x", "capacity", 10))))
                    .andExpect(status().isNotFound());
        }

        @Test
        void deleteWarehouseWithItems_isRejected() throws Exception {
            long warehouseId = createWarehouse("پر مخالف", 100);
            long categoryId = createCategory("لوازم", null);
            createItem("یخچال", categoryId, warehouseId, 10);

            mockMvc.perform(delete("/api/warehouses/" + warehouseId))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.message", containsString("قابل حذف نیست")));
        }
    }

    // ============================================================ دسته‌بندی‌ها

    @Nested
    class CategoryTests {

        @Test
        void createTreeAndFlatList() throws Exception {
            long root = createCategory("الکترونیک", null);
            createCategory("موبایل", root);

            // درخت: ریشه با فرزند
            mockMvc.perform(get("/api/categories"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$[0].name").value("الکترونیک"))
                    .andExpect(jsonPath("$[0].children[0].name").value("موبایل"))
                    .andExpect(jsonPath("$[0].children[0].parentId").value(root));

            // لیست مسطح
            mockMvc.perform(get("/api/categories/flat"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.length()").value(2));
        }

        @Test
        void canMakeChildOfChild() throws Exception {
            long root = createCategory("کالای دیجیتال", null);
            long sub = createCategory("لپ‌تاپ", root);
            long grand = createCategory("گیمینگ", sub);

            mockMvc.perform(get("/api/categories/" + root))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.children[0].children[0].id").value(grand));
        }

        @Test
        void selfParent_isRejected() throws Exception {
            long root = createCategory("تنها", null);

            Map<String, Object> update = new LinkedHashMap<>();
            update.put("name", "تنها");
            update.put("parentId", root);
            mockMvc.perform(put("/api/categories/" + root).contentType(MediaType.APPLICATION_JSON)
                    .content(jsonOf(update)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.message", containsString("والد خودش")));
        }

        @Test
        void validationFailure_missingName() throws Exception {
            mockMvc.perform(post("/api/categories").contentType(MediaType.APPLICATION_JSON)
                    .content("{}"))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.fieldErrors.name").exists());
        }

        @Test
        void notFound_returns404() throws Exception {
            mockMvc.perform(get("/api/categories/9999")).andExpect(status().isNotFound());
        }

        @Test
        void deleteWithChildren_isRejected() throws Exception {
            long root = createCategory("والد", null);
            createCategory("فرزند", root);

            mockMvc.perform(delete("/api/categories/" + root))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.message", containsString("زیردسته")));
        }

        @Test
        void deleteWithItems_isRejected() throws Exception {
            long warehouseId = createWarehouse("انبار تست", 100);
            long categoryId = createCategory("دارای کالا", null);
            createItem("کالای A", categoryId, warehouseId, 5);

            mockMvc.perform(delete("/api/categories/" + categoryId))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.message", containsString("کالا")));
        }

        @Test
        void deleteLeaf_succeeds() throws Exception {
            long leaf = createCategory("برگ", null);
            mockMvc.perform(delete("/api/categories/" + leaf)).andExpect(status().isNoContent());
        }
    }

    // ================================================================ کالاها

    @Nested
    class ItemTests {

        @Test
        void createAndGet_itemShowsZeroDynamicStock() throws Exception {
            long warehouseId = createWarehouse("انبار مرکزی", 1000);
            long categoryId = createCategory("لوازم خانگی", null);
            long itemId = createItem("یخچال", categoryId, warehouseId, 10);

            JsonNode item = getJson("/api/items/" + itemId);
            assertThat(item.get("quantityOnHand").asInt()).isEqualTo(10);
            assertThat(item.get("incomingStock").asInt()).isZero();
            assertThat(item.get("reservedStock").asInt()).isZero();
            assertThat(item.get("availableStock").asInt()).isEqualTo(10);
            assertThat(item.get("warehouseId").asLong()).isEqualTo(warehouseId);
        }

        @Test
        void updateChangesName() throws Exception {
            long warehouseId = createWarehouse("انبار مرکزی", 1000);
            long categoryId = createCategory("لوازم خانگی", null);
            long itemId = createItem("یخچال", categoryId, warehouseId, 10);

            Map<String, Object> update = new LinkedHashMap<>();
            update.put("name", "ساید بای ساید");
            update.put("categoryId", categoryId);
            update.put("warehouseId", warehouseId);
            update.put("unitOfMeasure", "دستگاه");
            mockMvc.perform(put("/api/items/" + itemId).contentType(MediaType.APPLICATION_JSON)
                    .content(jsonOf(update)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.name").value("ساید بای ساید"));
        }

        @Test
        void validationFailures_returnFieldErrors() throws Exception {
            mockMvc.perform(post("/api/items").contentType(MediaType.APPLICATION_JSON).content("{}"))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.fieldErrors.name").exists())
                    .andExpect(jsonPath("$.fieldErrors.categoryId").exists())
                    .andExpect(jsonPath("$.fieldErrors.warehouseId").exists())
                    .andExpect(jsonPath("$.fieldErrors.unitOfMeasure").exists());
        }

        @Test
        void notFoundAndReferencedFk() throws Exception {
            long warehouseId = createWarehouse("انبار مرکزی", 1000);
            long categoryId = createCategory("لوازم خانگی", null);
            createItem("یخچال", categoryId, warehouseId, 10);

            mockMvc.perform(get("/api/items/9999")).andExpect(status().isNotFound());

            // دسته‌بندی یا انبار ناموجود برای ایجاد کالا → 404
            Map<String, Object> bad = new LinkedHashMap<>();
            bad.put("name", "بد");
            bad.put("categoryId", 9999);
            bad.put("warehouseId", warehouseId);
            bad.put("unitOfMeasure", "عدد");
            mockMvc.perform(post("/api/items").contentType(MediaType.APPLICATION_JSON).content(jsonOf(bad)))
                    .andExpect(status().isNotFound());
        }

        @Test
        void filterByWarehouse() throws Exception {
            long wh1 = createWarehouse("انبار ۱", 500);
            long wh2 = createWarehouse("انبار ۲", 500);
            long cat = createCategory("کالای عمومی", null);
            createItem("آ", cat, wh1, 1);
            createItem("ب", cat, wh2, 2);

            mockMvc.perform(get("/api/items").param("warehouseId", String.valueOf(wh2)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.length()").value(1))
                    .andExpect(jsonPath("$[0].name").value("ب"));

            mockMvc.perform(get("/api/items"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.length()").value(2));
        }

        @Test
        void deleteItem_succeedsThen404() throws Exception {
            long warehouseId = createWarehouse("انبار مرکزی", 1000);
            long categoryId = createCategory("لوازم خانگی", null);
            long itemId = createItem("یخچال", categoryId, warehouseId, 10);

            mockMvc.perform(delete("/api/items/" + itemId)).andExpect(status().isNoContent());
            mockMvc.perform(get("/api/items/" + itemId)).andExpect(status().isNotFound());
        }

        /**
         * هسته مرکزی سامانه: incoming و reserved هیچ‌وقت ذخیره نمی‌شوند؛
         * فقط از روی مجوزهای ISSUED به‌صورت زنده محاسبه و در پاسخ ظاهر می‌شوند.
         */
        @Test
        void computedStocksAlwaysReflectOnlyIssuedPermits() throws Exception {
            setCash(new BigDecimal("10000"));
            long warehouseId = createWarehouse("انبار مرکزی", 1000);
            long categoryId = createCategory("لوازم خانگی", null);
            long itemId = createItem("یخچال", categoryId, warehouseId, 10);

            // صدور مجوز خرید ۵ واحد → incoming=5، موجودی واقعی دست‌نخورده
            long purchaseId = issuePermit("/api/permits/purchases", warehouseId, itemId, 5, "100").get("id").asLong();
            JsonNode afterPurchase = getJson("/api/items/" + itemId);
            assertThat(afterPurchase.get("incomingStock").asInt()).isEqualTo(5);
            assertThat(afterPurchase.get("quantityOnHand").asInt()).isEqualTo(10);

            // صدور مجوز فروش ۳ واحد → reserved=3، available=7
            long saleId = issuePermit("/api/permits/sales", warehouseId, itemId, 3, "150").get("id").asLong();
            JsonNode afterSale = getJson("/api/items/" + itemId);
            assertThat(afterSale.get("reservedStock").asInt()).isEqualTo(3);
            assertThat(afterSale.get("availableStock").asInt()).isEqualTo(7);

            // تأیید مجوز خرید → incoming=0، موجودی واقعی ۱۵
            mockMvc.perform(post("/api/permits/purchases/" + purchaseId + "/confirm"))
                    .andExpect(status().isOk());
            JsonNode confirmedPurchase = getJson("/api/items/" + itemId);
            assertThat(confirmedPurchase.get("quantityOnHand").asInt()).isEqualTo(15);
            assertThat(confirmedPurchase.get("incomingStock").asInt()).isZero();

            // تأیید مجوز فروش → reserved=0، موجودی واقعی ۱۲
            mockMvc.perform(post("/api/permits/sales/" + saleId + "/confirm")).andExpect(status().isOk());
            JsonNode confirmedSale = getJson("/api/items/" + itemId);
            assertThat(confirmedSale.get("quantityOnHand").asInt()).isEqualTo(12);
            assertThat(confirmedSale.get("reservedStock").asInt()).isZero();
        }
    }

    // ================================================================ مجوزها

    @Nested
    class PermitTests {

        @Test
        void issuePurchase_deductsCashImmediately() throws Exception {
            setCash(new BigDecimal("1000"));
            long warehouseId = createWarehouse("انبار مرکزی", 100);
            long categoryId = createCategory("غذایی", null);
            long itemId = createItem("برنج", categoryId, warehouseId, 10);

            JsonNode permit = issuePermit("/api/permits/purchases", warehouseId, itemId, 5, "100");

            assertThat(permit.get("status").asString()).isEqualTo("ISSUED");
            assertThat(permit.get("permitType").asString()).isEqualTo("PURCHASE");
            assertThat(permit.get("totalAmount").decimalValue()).isEqualByComparingTo("500");
            assertThat(permit.get("lines").get(0).get("itemName").asString()).isEqualTo("برنج");

            // وجه در لحظه صدور برداشت شده
            JsonNode cash = getJson("/api/cash-account");
            assertThat(cash.get("balance").decimalValue()).isEqualByComparingTo("500");

            // لیست مجوزها یکی است
            mockMvc.perform(get("/api/permits"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.length()").value(1));
        }

        @Test
        void issuePurchase_insufficientCash_isRejectedAndNothingPersisted() throws Exception {
            setCash(new BigDecimal("100"));
            long warehouseId = createWarehouse("انبار مرکزی", 100);
            long categoryId = createCategory("غذایی", null);
            long itemId = createItem("برنج", categoryId, warehouseId, 10);

            Map<String, Object> line = new LinkedHashMap<>();
            line.put("itemId", itemId);
            line.put("quantity", 5);
            line.put("unitPrice", new BigDecimal("100"));
            Map<String, Object> body = new LinkedHashMap<>();
            body.put("warehouseId", warehouseId);
            body.put("lines", java.util.List.of(line));

            MvcResult result = mockMvc.perform(post("/api/permits/purchases")
                    .contentType(MediaType.APPLICATION_JSON).content(jsonOf(body)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.message", containsString("موجودی نقدی کافی نیست")))
                    .andReturn();

            // وجه کم‌نشده
            assertThat(objectMapper.readTree(result.getResponse().getContentAsString()).get("message"))
                    .isNotNull();
            assertThat(getJson("/api/cash-account").get("balance").decimalValue()).isEqualByComparingTo("100");
            // هیچ مجوزی ساخته نشده
            MvcResult list = mockMvc.perform(get("/api/permits")).andExpect(status().isOk()).andReturn();
            assertThat(objectMapper.readTree(list.getResponse().getContentAsString()).size()).isZero();
        }

        @Test
        void issuePurchase_insufficientCapacity_isRejected() throws Exception {
            setCash(new BigDecimal("10000"));
            // ظرفیت انبار ۱۰، موجودی فعلی کالاها ۸ → فقط ۲ جای باقی
            long warehouseId = createWarehouse("انبار کوچک", 10);
            long categoryId = createCategory("غذایی", null);
            createItem("برنج", categoryId, warehouseId, 8);

            Map<String, Object> line = new LinkedHashMap<>();
            line.put("itemId", 1L);
            line.put("quantity", 5);
            line.put("unitPrice", new BigDecimal("100"));
            Map<String, Object> body = new LinkedHashMap<>();
            body.put("warehouseId", warehouseId);
            body.put("lines", java.util.List.of(line));

            mockMvc.perform(post("/api/permits/purchases")
                    .contentType(MediaType.APPLICATION_JSON).content(jsonOf(body)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.message", containsString("ظرفیت انبار کافی نیست")));
        }

        @Test
        void issueSale_noCashEffectAndAccountsForReserved() throws Exception {
            setCash(new BigDecimal("1000"));
            long warehouseId = createWarehouse("انبار مرکزی", 100);
            long categoryId = createCategory("لوازم خانگی", null);
            long itemId = createItem("یخچال", categoryId, warehouseId, 10);

            // صدور مجوز فروش ۳ → موفق، بدون تغییر نقدینگی
            JsonNode sale = issuePermit("/api/permits/sales", warehouseId, itemId, 3, "150");
            assertThat(sale.get("permitType").asString()).isEqualTo("SALE");
            assertThat(getJson("/api/cash-account").get("balance").decimalValue()).isEqualByComparingTo("1000");

            // ۳ واحد رزرو شده → فقط ۷ واحد آزاد؛ درخواست ۸ واحد ناموفق
            Map<String, Object> line = new LinkedHashMap<>();
            line.put("itemId", itemId);
            line.put("quantity", 8);
            line.put("unitPrice", new BigDecimal("150"));
            Map<String, Object> body = new LinkedHashMap<>();
            body.put("warehouseId", warehouseId);
            body.put("lines", java.util.List.of(line));
            mockMvc.perform(post("/api/permits/sales")
                    .contentType(MediaType.APPLICATION_JSON).content(jsonOf(body)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.message", containsString("موجودی کافی")));
        }

        @Test
        void confirmSale_depositsCashAndDecreasesStock() throws Exception {
            setCash(new BigDecimal("1000"));
            long warehouseId = createWarehouse("انبار مرکزی", 100);
            long categoryId = createCategory("لوازم خانگی", null);
            long itemId = createItem("یخچال", categoryId, warehouseId, 10);
            long saleId = issuePermit("/api/permits/sales", warehouseId, itemId, 3, "200").get("id").asLong();

            mockMvc.perform(post("/api/permits/sales/" + saleId + "/confirm"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.status").value("CONFIRMED"));

            assertThat(getJson("/api/cash-account").get("balance").decimalValue()).isEqualByComparingTo("1600");
            assertThat(getJson("/api/items/" + itemId).get("quantityOnHand").asInt()).isEqualTo(7);
        }

        @Test
        void confirmTwice_isRejected() throws Exception {
            setCash(new BigDecimal("1000"));
            long warehouseId = createWarehouse("انبار مرکزی", 100);
            long categoryId = createCategory("غذایی", null);
            long itemId = createItem("برنج", categoryId, warehouseId, 10);
            long purchaseId = issuePermit("/api/permits/purchases", warehouseId, itemId, 2, "100").get("id").asLong();

            mockMvc.perform(post("/api/permits/purchases/" + purchaseId + "/confirm")).andExpect(status().isOk());
            mockMvc.perform(post("/api/permits/purchases/" + purchaseId + "/confirm"))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.message", containsString("وضعیت")));
        }

        @Test
        void cancelPurchase_refundsCash() throws Exception {
            setCash(new BigDecimal("1000"));
            long warehouseId = createWarehouse("انبار مرکزی", 100);
            long categoryId = createCategory("غذایی", null);
            long itemId = createItem("برنج", categoryId, warehouseId, 10);
            long purchaseId = issuePermit("/api/permits/purchases", warehouseId, itemId, 5, "100").get("id").asLong();

            mockMvc.perform(post("/api/permits/" + purchaseId + "/cancel"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.status").value("CANCELLED"));

            assertThat(getJson("/api/cash-account").get("balance").decimalValue()).isEqualByComparingTo("1000");
        }

        @Test
        void cancelSale_hasNoCashEffect() throws Exception {
            setCash(new BigDecimal("1000"));
            long warehouseId = createWarehouse("انبار مرکزی", 100);
            long categoryId = createCategory("لوازم خانگی", null);
            long itemId = createItem("یخچال", categoryId, warehouseId, 10);
            long saleId = issuePermit("/api/permits/sales", warehouseId, itemId, 3, "200").get("id").asLong();

            mockMvc.perform(post("/api/permits/" + saleId + "/cancel")).andExpect(status().isOk());
            assertThat(getJson("/api/cash-account").get("balance").decimalValue()).isEqualByComparingTo("1000");
        }

        @Test
        void cancelConfirmedPermit_isRejected() throws Exception {
            setCash(new BigDecimal("1000"));
            long warehouseId = createWarehouse("انبار مرکزی", 100);
            long categoryId = createCategory("غذایی", null);
            long itemId = createItem("برنج", categoryId, warehouseId, 10);
            long purchaseId = issuePermit("/api/permits/purchases", warehouseId, itemId, 2, "100").get("id").asLong();

            mockMvc.perform(post("/api/permits/purchases/" + purchaseId + "/confirm")).andExpect(status().isOk());
            mockMvc.perform(post("/api/permits/" + purchaseId + "/cancel"))
                    .andExpect(status().isBadRequest());
        }

        @Test
        void itemFromAnotherWarehouse_isRejected() throws Exception {
            setCash(new BigDecimal("10000"));
            long wh1 = createWarehouse("انبار ۱", 1000);
            long wh2 = createWarehouse("انبار ۲", 1000);
            long cat = createCategory("عمومی", null);
            long itemId = createItem("کالای انبار ۱", cat, wh1, 10);

            Map<String, Object> line = new LinkedHashMap<>();
            line.put("itemId", itemId);
            line.put("quantity", 1);
            line.put("unitPrice", new BigDecimal("10"));
            Map<String, Object> body = new LinkedHashMap<>();
            body.put("warehouseId", wh2);
            body.put("lines", java.util.List.of(line));

            mockMvc.perform(post("/api/permits/purchases")
                    .contentType(MediaType.APPLICATION_JSON).content(jsonOf(body)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.message", containsString("متعلق به این انبار")));
        }

        @Test
        void validationFailure_badRequestBody() throws Exception {
            // ردیف‌های خالی
            Map<String, Object> emptyLines = new LinkedHashMap<>();
            emptyLines.put("warehouseId", 1L);
            emptyLines.put("lines", java.util.List.of());
            mockMvc.perform(post("/api/permits/purchases")
                    .contentType(MediaType.APPLICATION_JSON).content(jsonOf(emptyLines)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.fieldErrors.lines").exists());

            // مقدار منفی
            Map<String, Object> line = new LinkedHashMap<>();
            line.put("itemId", 1L);
            line.put("quantity", -2);
            line.put("unitPrice", new BigDecimal("10"));
            Map<String, Object> body = new LinkedHashMap<>();
            body.put("warehouseId", 1L);
            body.put("lines", java.util.List.of(line));
            mockMvc.perform(post("/api/permits/purchases")
                    .contentType(MediaType.APPLICATION_JSON).content(jsonOf(body)))
                    .andExpect(status().isBadRequest());
        }

        @Test
        void notFound_returns404() throws Exception {
            mockMvc.perform(get("/api/permits/9999")).andExpect(status().isNotFound());
            mockMvc.perform(post("/api/permits/9999/cancel")).andExpect(status().isNotFound());
            mockMvc.perform(post("/api/permits/purchases/9999/confirm")).andExpect(status().isNotFound());
        }
    }

    // ============================================================== حساب نقدی

    @Nested
    class CashAccountTests {

        @Test
        void returnsBalanceFromSeedAndAfterUpdate() throws Exception {
            // پس از این تست‌ها cleanDatabase موجودی را ۰ می‌کند؛ این تست با موجودی
            // seed شده توسط V2 (100,000,000) و سپس یک مقدار دستی کار می‌کند.
            setCash(new BigDecimal("100000000"));

            mockMvc.perform(get("/api/cash-account"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.balance").value(100000000));

            setCash(new BigDecimal("7777.5"));
            mockMvc.perform(get("/api/cash-account"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.balance").value(7777.5));
        }
    }

    // ============================================================ OpenAPI/Swagger

    @Nested
    class OpenApiTests {

        @Test
        void apiDocsExposeAllControllers() throws Exception {
            mockMvc.perform(get("/v3/api-docs"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.paths.['/api/warehouses']").exists())
                    .andExpect(jsonPath("$.paths.['/api/categories']").exists())
                    .andExpect(jsonPath("$.paths.['/api/items']").exists())
                    .andExpect(jsonPath("$.paths.['/api/permits/purchases']").exists())
                    .andExpect(jsonPath("$.paths.['/api/permits/sales']").exists())
                    .andExpect(jsonPath("$.paths.['/api/cash-account']").exists())
                    .andExpect(jsonPath("$.paths.['/api/auth/register']").exists())
                    .andExpect(jsonPath("$.paths.['/api/auth/login']").exists());
        }

        @Test
        void swaggerUiIsServed() throws Exception {
            // با MockMvc، /swagger-ui.html به /swagger-ui/index.html ریدایرکت می‌شود
            mockMvc.perform(get("/swagger-ui.html"))
                    .andExpect(status().is3xxRedirection())
                    .andExpect(redirectedUrl("/swagger-ui/index.html"));
        }
    }

    // ==================================================================== CORS

    @Nested
    class CorsTests {

        @Test
        void allowedOrigin_preflightSucceeds() throws Exception {
            mockMvc.perform(options("/api/warehouses")
                            .header("Origin", "http://localhost:5173")
                            .header("Access-Control-Request-Method", "POST")
                            .header("Access-Control-Request-Headers", "Content-Type, Authorization"))
                    .andExpect(status().isOk())
                    .andExpect(header().string("Access-Control-Allow-Origin", "http://localhost:5173"))
                    .andExpect(header().string("Access-Control-Allow-Methods", containsString("POST")))
                    .andExpect(header().string("Access-Control-Allow-Methods", containsString("GET")))
                    .andExpect(header().string("Access-Control-Allow-Headers", containsString("Content-Type")))
                    .andExpect(header().string("Access-Control-Allow-Headers", containsString("Authorization")));
        }

        @Test
        void allowedOrigin_simpleGetReturnsCorsHeader() throws Exception {
            mockMvc.perform(get("/api/warehouses")
                            .header("Origin", "http://127.0.0.1:5173"))
                    .andExpect(status().isOk())
                    .andExpect(header().string("Access-Control-Allow-Origin", "http://127.0.0.1:5173"));
        }

        @Test
        void disallowedOrigin_isRejected() throws Exception {
            // وقتی origin در لیست مجاز نیست، Spring درخواست را 403 می‌کند
            mockMvc.perform(get("/api/warehouses")
                            .header("Origin", "http://evil.example.com"))
                    .andExpect(status().isForbidden());
        }

        @Test
        void corsIsScopedToApiPaths() throws Exception {
            // خارج از /api/** نباید CORS فعال باشد
            mockMvc.perform(get("/v3/api-docs")
                            .header("Origin", "http://localhost:5173"))
                    .andExpect(status().isOk())
                    .andExpect(header().doesNotExist("Access-Control-Allow-Origin"));
        }
    }
}
