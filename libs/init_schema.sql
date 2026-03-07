-- Users table
create table if not exists users (
    id uuid primary key default gen_random_uuid(),
    username text unique not null,
    password text not null,
    name text,
    role text not null default 'cashier',
    created_at timestamp default now()
);

-- Investments table
create table if not exists investments (
    id uuid primary key default gen_random_uuid(),
    amount numeric not null,
    description text,
    added_by text,
    added_at timestamp default now()
);

-- Expenses table
create table if not exists expenses (
    id uuid primary key default gen_random_uuid(),
    amount numeric not null,
    description text,
    added_by text,
    added_at timestamp default now()
);

-- Inventory table
create table if not exists inventory (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    cost_price numeric not null,
    sale_price numeric,
    no_of_units int not null,
    added_by text,
    added_at timestamp default now()
);

-- Orders table
create table if not exists orders (
    id uuid primary key default gen_random_uuid(),
    name text,
    added_by text,
    added_at timestamp default now(),
    paymentMethod text,
    discount text,
    discount_description text
);

-- Order Items table
create table if not exists order_items (
    id uuid primary key default gen_random_uuid(),
    order_id uuid references orders(id) on delete cascade,
    cost_price numeric,
    sale_price numeric,
    quantity int not null,
    added_at timestamp default now(),
    name text
);
