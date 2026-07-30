-- انبارها
CREATE TABLE warehouse (
    id       BIGSERIAL PRIMARY KEY,
    name     VARCHAR(255) NOT NULL UNIQUE,
    address  VARCHAR(500),
    capacity INTEGER      NOT NULL CHECK (capacity >= 0)
);

-- دسته‌بندی کالا (درخت خودارجاع)
CREATE TABLE category (
    id        BIGSERIAL PRIMARY KEY,
    name      VARCHAR(255) NOT NULL,
    parent_id BIGINT REFERENCES category (id)
);

CREATE INDEX idx_category_parent_id ON category (parent_id);

-- کالاها
CREATE TABLE item (
    id                BIGSERIAL PRIMARY KEY,
    name              VARCHAR(255) NOT NULL,
    category_id       BIGINT       NOT NULL REFERENCES category (id),
    warehouse_id      BIGINT       NOT NULL REFERENCES warehouse (id),
    quantity_on_hand  INTEGER      NOT NULL DEFAULT 0 CHECK (quantity_on_hand >= 0),
    unit_of_measure   VARCHAR(50)  NOT NULL
);

CREATE INDEX idx_item_warehouse_id ON item (warehouse_id);
CREATE INDEX idx_item_category_id ON item (category_id);

-- حساب نقدی شرکت (تک‌رکورد singleton)
CREATE TABLE cash_account (
    id      BIGSERIAL PRIMARY KEY,
    balance NUMERIC(19, 4) NOT NULL
);

-- سطر اولیه حساب نقدی، برای شروع کار سیستم
INSERT INTO cash_account (balance) VALUES (0);

-- مجوز (سرفصل) خرید یا فروش
CREATE TABLE permit (
    id           BIGSERIAL PRIMARY KEY,
    permit_type  VARCHAR(20)    NOT NULL CHECK (permit_type IN ('PURCHASE', 'SALE')),
    status       VARCHAR(20)    NOT NULL DEFAULT 'ISSUED' CHECK (status IN ('ISSUED', 'CONFIRMED', 'CANCELLED')),
    warehouse_id BIGINT         NOT NULL REFERENCES warehouse (id),
    total_amount NUMERIC(19, 4) NOT NULL,
    created_at   TIMESTAMP      NOT NULL DEFAULT now(),
    confirmed_at TIMESTAMP
);

CREATE INDEX idx_permit_status ON permit (status);
CREATE INDEX idx_permit_type_status ON permit (permit_type, status);
CREATE INDEX idx_permit_warehouse_id ON permit (warehouse_id);

-- ردیف‌های مجوز (هر مجوز می‌تواند شامل چند کالا باشد)
CREATE TABLE permit_line (
    id         BIGSERIAL PRIMARY KEY,
    permit_id  BIGINT         NOT NULL REFERENCES permit (id) ON DELETE CASCADE,
    item_id    BIGINT         NOT NULL REFERENCES item (id),
    quantity   INTEGER        NOT NULL CHECK (quantity > 0),
    unit_price NUMERIC(19, 4) NOT NULL CHECK (unit_price >= 0)
);

CREATE INDEX idx_permit_line_permit_id ON permit_line (permit_id);
CREATE INDEX idx_permit_line_item_id ON permit_line (item_id);
