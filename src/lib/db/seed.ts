/**
 * Seed database definition.
 *
 * The same four tables power every lesson and visualizer:
 *   users, orders, departments, employees.
 *
 * `SEED_SQL` is executed against a fresh sql.js database on load and whenever
 * the learner clicks "Reset sample database". `TABLE_SCHEMAS` is UI metadata
 * used by the static table previews and visualizers (column order, labels).
 */

export interface ColumnSchema {
  name: string;
  type: "INTEGER" | "TEXT" | "REAL" | "DATE";
  /** Short human explanation shown in tooltips. */
  note?: string;
  primaryKey?: boolean;
  foreignKey?: string;
}

export interface TableSchema {
  name: string;
  description: string;
  columns: ColumnSchema[];
}

export const TABLE_SCHEMAS: Record<string, TableSchema> = {
  departments: {
    name: "departments",
    description: "Danh sách phòng ban trong công ty.",
    columns: [
      { name: "id", type: "INTEGER", primaryKey: true, note: "Khóa chính" },
      { name: "name", type: "TEXT", note: "Tên phòng ban" },
    ],
  },
  users: {
    name: "users",
    description: "Người dùng của hệ thống.",
    columns: [
      { name: "id", type: "INTEGER", primaryKey: true, note: "Khóa chính" },
      { name: "name", type: "TEXT", note: "Họ tên" },
      { name: "age", type: "INTEGER", note: "Tuổi" },
      { name: "city", type: "TEXT", note: "Thành phố" },
      {
        name: "department_id",
        type: "INTEGER",
        foreignKey: "departments.id",
        note: "Trỏ tới departments.id",
      },
    ],
  },
  orders: {
    name: "orders",
    description: "Đơn hàng do người dùng tạo.",
    columns: [
      { name: "id", type: "INTEGER", primaryKey: true, note: "Khóa chính" },
      {
        name: "user_id",
        type: "INTEGER",
        foreignKey: "users.id",
        note: "Trỏ tới users.id",
      },
      { name: "product", type: "TEXT", note: "Tên sản phẩm" },
      { name: "total", type: "REAL", note: "Giá trị đơn (USD)" },
      { name: "created_at", type: "DATE", note: "Ngày tạo đơn" },
    ],
  },
  employees: {
    name: "employees",
    description: "Nhân viên và mức lương theo phòng ban.",
    columns: [
      { name: "id", type: "INTEGER", primaryKey: true, note: "Khóa chính" },
      { name: "name", type: "TEXT", note: "Họ tên" },
      { name: "department", type: "TEXT", note: "Tên phòng ban" },
      { name: "salary", type: "INTEGER", note: "Lương tháng (USD)" },
      { name: "joined_at", type: "DATE", note: "Ngày vào làm" },
    ],
  },
};

export const SEED_SQL = /* sql */ `
PRAGMA foreign_keys = ON;

DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS departments;
DROP TABLE IF EXISTS employees;

CREATE TABLE departments (
  id   INTEGER PRIMARY KEY,
  name TEXT NOT NULL
);

CREATE TABLE users (
  id            INTEGER PRIMARY KEY,
  name          TEXT NOT NULL,
  age           INTEGER NOT NULL,
  city          TEXT NOT NULL,
  department_id INTEGER REFERENCES departments(id)
);

CREATE TABLE orders (
  id         INTEGER PRIMARY KEY,
  user_id    INTEGER NOT NULL REFERENCES users(id),
  product    TEXT NOT NULL,
  total      REAL NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE employees (
  id         INTEGER PRIMARY KEY,
  name       TEXT NOT NULL,
  department TEXT NOT NULL,
  salary     INTEGER NOT NULL,
  joined_at  TEXT NOT NULL
);

INSERT INTO departments (id, name) VALUES
  (1, 'Engineering'),
  (2, 'Sales'),
  (3, 'Marketing'),
  (4, 'Finance'),
  (5, 'Human Resources');

INSERT INTO users (id, name, age, city, department_id) VALUES
  (1, 'An Nguyen',      28, 'Hanoi',        1),
  (2, 'Binh Tran',      17, 'Da Nang',      3),
  (3, 'Chi Le',         34, 'Ho Chi Minh',  2),
  (4, 'Dung Pham',      45, 'Hanoi',        4),
  (5, 'Giang Vo',       22, 'Can Tho',      1),
  (6, 'Hoa Dang',       16, 'Hue',          NULL),
  (7, 'Khanh Bui',      31, 'Ho Chi Minh',  2),
  (8, 'Linh Do',        26, 'Da Nang',      3),
  (9, 'Minh Hoang',     52, 'Hanoi',        4),
  (10, 'Nam Vu',        19, 'Ho Chi Minh',  1);

INSERT INTO orders (id, user_id, product, total, created_at) VALUES
  (1,  1, 'Keyboard',      89.90,  '2024-01-05'),
  (2,  1, 'Monitor',       229.00, '2024-01-18'),
  (3,  3, 'Laptop Stand',  45.50,  '2024-02-02'),
  (4,  3, 'USB-C Hub',     59.99,  '2024-02-14'),
  (5,  4, 'Office Chair',  349.00, '2024-02-20'),
  (6,  5, 'Mouse',         25.00,  '2024-03-01'),
  (7,  7, 'Webcam',        79.00,  '2024-03-11'),
  (8,  7, 'Headset',       120.00, '2024-03-15'),
  (9,  8, 'Notebook',      12.00,  '2024-03-22'),
  (10, 9, 'Standing Desk', 499.00, '2024-04-02'),
  (11, 1, 'Desk Lamp',     32.50,  '2024-04-10'),
  (12, 10,'Mouse Pad',     9.90,   '2024-04-19');

INSERT INTO employees (id, name, department, salary, joined_at) VALUES
  (1,  'An Nguyen',   'Engineering', 2200, '2021-03-15'),
  (2,  'Chi Le',      'Sales',       1500, '2020-07-01'),
  (3,  'Dung Pham',   'Finance',     1800, '2019-11-20'),
  (4,  'Giang Vo',    'Engineering', 1600, '2022-01-10'),
  (5,  'Khanh Bui',   'Sales',       1550, '2021-09-05'),
  (6,  'Linh Do',     'Marketing',   1400, '2022-06-18'),
  (7,  'Minh Hoang',  'Finance',     2500, '2018-04-25'),
  (8,  'Nam Vu',      'Engineering', 1300, '2023-02-01'),
  (9,  'Phuong Ly',   'Marketing',   1450, '2021-12-12'),
  (10, 'Quan Ho',     'Engineering', 2000, '2020-08-30'),
  (11, 'Trang Ngo',   'Sales',       1700, '2019-05-14'),
  (12, 'Uyen Cao',    'Marketing',   1350, '2023-07-07');
`;
