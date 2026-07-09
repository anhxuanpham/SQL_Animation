import type { Lesson } from "./types";

/**
 * Advanced track: CTE, window functions, index, transactions, plus
 * conceptual lessons (view, execution order, normalization, performance,
 * SQL injection). Lessons whose queries are hard to animate reliably use
 * visualization type "none" — they still execute live and show before/after.
 */
export const ADVANCED_LESSONS: Lesson[] = [
  {
    id: "index",
    title: "Index — chỉ mục tăng tốc",
    level: "advanced",
    category: "Hiệu năng",
    summary: "So sánh full table scan với index lookup.",
    description:
      "Index giống mục lục của cuốn sách: giúp DBMS nhảy thẳng tới dòng cần tìm thay vì đọc cả bảng.",
    theory: [
      "Không có index, để tìm `WHERE name = 'An Nguyen'` DBMS phải quét **từng dòng** (full table scan).",
      "Có index trên cột `name`, DBMS dùng cấu trúc đã sắp xếp (B-Tree) để tìm nhanh hơn nhiều.",
      "## Tạo index",
      "`CREATE INDEX idx_emp_name ON employees(name);`",
      "## Đánh đổi",
      "- Index tăng tốc **đọc** nhưng làm chậm **ghi** (INSERT/UPDATE) và tốn dung lượng.",
      "- Chỉ nên đánh index cho cột hay dùng trong WHERE/JOIN/ORDER BY.",
      "> Animation: bên trái là full scan (con trỏ chạy qua từng dòng), bên phải là index lookup (nhảy thẳng tới dòng đích).",
    ],
    keyTerms: [
      { term: "Index", definition: "Cấu trúc dữ liệu giúp tìm dòng nhanh hơn." },
      { term: "Full table scan", definition: "Quét toàn bộ bảng để tìm dòng." },
      { term: "B-Tree", definition: "Cây cân bằng dùng để lưu index đã sắp xếp." },
    ],
    tables: ["employees"],
    initialQuery: "SELECT * FROM employees WHERE name = 'Minh Hoang';",
    visualization: { type: "index" },
    steps: [
      { clause: "SELECT", title: "Full table scan", description: "Không có index: con trỏ đọc lần lượt từng dòng đến khi tìm thấy." },
      { clause: "SELECT", title: "Index lookup", description: "Có index trên name: nhảy nhanh tới đúng dòng, bỏ qua phần lớn bảng." },
    ],
    exercises: [
      {
        id: "idx-1",
        prompt: "Tạo index tên idx_users_city trên cột city của bảng users.",
        solutionQuery: "CREATE INDEX idx_users_city ON users(city);",
        verifyQuery:
          "SELECT name FROM sqlite_master WHERE type = 'index' AND name = 'idx_users_city';",
        hint: "CREATE INDEX idx_users_city ON users(city);",
      },
    ],
    estimatedMinutes: 10,
  },
  {
    id: "transaction",
    title: "Transaction — COMMIT / ROLLBACK",
    level: "advanced",
    category: "Toàn vẹn dữ liệu",
    summary: "Nhóm nhiều lệnh thành một đơn vị 'tất cả hoặc không gì cả'.",
    description:
      "Transaction đảm bảo một nhóm thao tác hoặc thành công trọn vẹn (COMMIT) hoặc bị hủy hoàn toàn (ROLLBACK).",
    theory: [
      "Cú pháp: `BEGIN; ... ; COMMIT;` hoặc `ROLLBACK;` để hủy.",
      "## ACID",
      "- **Atomicity**: tất cả hoặc không gì cả.",
      "- **Consistency**: dữ liệu luôn hợp lệ trước và sau.",
      "- **Isolation**: các transaction không giẫm chân nhau.",
      "- **Durability**: đã COMMIT là bền vững.",
      "## Ví dụ chuyển tiền",
      "Trừ tài khoản A và cộng cho B phải cùng thành công. Nếu một bước lỗi, ROLLBACK để không mất tiền.",
      "> Animation: các thay đổi hiển thị ở trạng thái 'tạm'; COMMIT làm chúng bền vững (xanh), ROLLBACK khôi phục về ban đầu.",
    ],
    keyTerms: [
      { term: "Transaction", definition: "Nhóm thao tác thực thi như một đơn vị." },
      { term: "COMMIT", definition: "Lưu vĩnh viễn các thay đổi của transaction." },
      { term: "ROLLBACK", definition: "Hủy toàn bộ thay đổi của transaction." },
      { term: "ACID", definition: "Bốn tính chất đảm bảo transaction đáng tin cậy." },
    ],
    tables: ["employees"],
    initialQuery:
      "BEGIN;\nUPDATE employees SET salary = salary + 500 WHERE department = 'Sales';\nROLLBACK;",
    visualization: { type: "transaction" },
    steps: [
      { clause: "BEGIN", title: "Mở transaction", description: "Bắt đầu ghi nhận các thay đổi ở trạng thái tạm." },
      { clause: "UPDATE", title: "Thay đổi tạm thời", description: "Tăng lương phòng Sales — chưa được lưu vĩnh viễn." },
      { clause: "ROLLBACK", title: "Hủy thay đổi", description: "Mọi thay đổi bị hoàn tác; dữ liệu trở về như cũ." },
    ],
    exercises: [
      {
        id: "tx-1",
        prompt:
          "Viết transaction: BEGIN, tăng total tất cả orders thêm 10, rồi COMMIT.",
        solutionQuery:
          "BEGIN; UPDATE orders SET total = total + 10; COMMIT;",
        verifyQuery: "SELECT id, total FROM orders ORDER BY id;",
        hint: "BEGIN; UPDATE orders SET total = total + 10; COMMIT;",
      },
    ],
    estimatedMinutes: 11,
  },
  {
    id: "cte",
    title: "CTE — WITH ... AS",
    level: "advanced",
    category: "Truy vấn nâng cao",
    summary: "Đặt tên cho truy vấn con để câu lệnh dễ đọc, tái sử dụng.",
    description:
      "CTE (Common Table Expression) là bảng tạm có tên, khai báo bằng WITH, giúp chia truy vấn phức tạp thành các bước rõ ràng.",
    theory: [
      "Cú pháp: `WITH ten_cte AS ( SELECT ... ) SELECT ... FROM ten_cte;`",
      "CTE giống subquery nhưng có tên và đặt ở đầu, đọc từ trên xuống rất tự nhiên.",
      "Có thể khai báo nhiều CTE, cách nhau bởi dấu phẩy.",
      "> Ví dụ: tạo CTE `senior` gồm nhân viên lương > 1800, rồi đếm theo phòng ban.",
    ],
    keyTerms: [
      { term: "CTE", definition: "Bảng tạm có tên khai báo bằng WITH." },
      { term: "WITH", definition: "Từ khóa mở đầu một CTE." },
    ],
    tables: ["employees"],
    initialQuery:
      "WITH senior AS (\n  SELECT * FROM employees WHERE salary > 1800\n)\nSELECT department, COUNT(*) AS so_luong\nFROM senior\nGROUP BY department;",
    visualization: { type: "cte" },
    steps: [
      { clause: "WITH", title: "Materialize CTE senior", description: "Chạy SELECT bên trong WITH → bảng tạm senior (lương > 1800)." },
      { clause: "FROM", title: "Truy vấn ngoài đọc CTE", description: "FROM senior dùng bảng tạm như bảng thật." },
      { clause: "SELECT", title: "Gom và đếm", description: "GROUP BY department trên CTE, đếm số senior mỗi phòng." },
    ],
    exercises: [
      {
        id: "cte-1",
        prompt:
          "Dùng CTE tên big_orders (các đơn total > 100), rồi đếm số dòng (COUNT(*)).",
        solutionQuery:
          "WITH big_orders AS (SELECT * FROM orders WHERE total > 100) SELECT COUNT(*) FROM big_orders;",
        hint: "WITH big_orders AS (SELECT * FROM orders WHERE total > 100) SELECT COUNT(*) FROM big_orders;",
        orderInsensitive: true,
      },
      {
        id: "cte-2",
        prompt:
          "CTE young (users age < 25), SELECT name, city FROM young ORDER BY name.",
        solutionQuery:
          "WITH young AS (SELECT * FROM users WHERE age < 25) SELECT name, city FROM young ORDER BY name;",
        hint: "WITH young AS (SELECT * FROM users WHERE age < 25) ...",
      },
    ],
    estimatedMinutes: 10,
  },
  {
    id: "window-row-number",
    title: "Window function — ROW_NUMBER",
    level: "advanced",
    category: "Truy vấn nâng cao",
    summary: "Đánh số / xếp hạng trong từng nhóm mà không gộp dòng.",
    description:
      "Window function tính toán trên một 'cửa sổ' các dòng liên quan nhưng vẫn giữ nguyên từng dòng — khác với GROUP BY.",
    theory: [
      "Cú pháp: `ROW_NUMBER() OVER (PARTITION BY cột ORDER BY cột2)`.",
      "- `PARTITION BY`: chia thành các nhóm (giống GROUP BY nhưng không gộp dòng).",
      "- `ORDER BY` trong OVER: thứ tự đánh số bên trong mỗi nhóm.",
      "## Ứng dụng",
      "Lấy 'người lương cao nhất mỗi phòng ban', đánh hạng, so với dòng trước/sau (LAG/LEAD)...",
      "> Kết quả giữ nguyên số dòng, thêm cột thứ hạng `rn` cho mỗi phòng ban.",
    ],
    keyTerms: [
      { term: "Window function", definition: "Hàm tính trên tập dòng liên quan mà không gộp dòng." },
      { term: "PARTITION BY", definition: "Chia dữ liệu thành nhóm cho window function." },
      { term: "ROW_NUMBER", definition: "Đánh số thứ tự 1,2,3... trong mỗi partition." },
    ],
    tables: ["employees"],
    initialQuery:
      "SELECT name, department, salary,\n  ROW_NUMBER() OVER (PARTITION BY department ORDER BY salary DESC) AS rn\nFROM employees;",
    visualization: { type: "window" },
    steps: [
      { clause: "FROM", title: "Nạp employees", description: "Toàn bộ nhân viên vào cửa sổ xử lý." },
      { clause: "OVER", title: "PARTITION BY department", description: "Chia theo phòng ban — mỗi nhóm một màu." },
      { clause: "OVER", title: "ROW_NUMBER theo salary DESC", description: "Trong mỗi phòng, người lương cao nhất nhận rn = 1." },
      { clause: "SELECT", title: "Kết quả xếp hạng", description: "Giữ nguyên từng dòng, thêm cột rn." },
    ],
    exercises: [
      {
        id: "win-1",
        prompt:
          "Đánh ROW_NUMBER cho users theo city (PARTITION BY city) sắp theo age giảm dần, cột tên rn. Trả về name, city, rn.",
        solutionQuery:
          "SELECT name, city, ROW_NUMBER() OVER (PARTITION BY city ORDER BY age DESC) AS rn FROM users;",
        hint: "ROW_NUMBER() OVER (PARTITION BY city ORDER BY age DESC) AS rn.",
        orderInsensitive: true,
      },
      {
        id: "win-2",
        prompt:
          "Chỉ lấy người có rn = 1 mỗi department (lương cao nhất). Dùng subquery hoặc CTE bọc ROW_NUMBER.",
        solutionQuery:
          "WITH ranked AS (SELECT name, department, salary, ROW_NUMBER() OVER (PARTITION BY department ORDER BY salary DESC) AS rn FROM employees) SELECT name, department, salary FROM ranked WHERE rn = 1;",
        hint: "CTE với ROW_NUMBER rồi WHERE rn = 1.",
        orderInsensitive: true,
      },
    ],
    estimatedMinutes: 12,
  },
  {
    id: "view",
    title: "View — bảng ảo",
    level: "advanced",
    category: "Truy vấn nâng cao",
    summary: "Lưu một truy vấn dưới dạng bảng ảo tái sử dụng được.",
    description:
      "View là một truy vấn được đặt tên và lưu lại; mỗi lần SELECT từ view, truy vấn bên dưới được chạy lại.",
    theory: [
      "Cú pháp: `CREATE VIEW ten_view AS SELECT ...;` rồi dùng như bảng: `SELECT * FROM ten_view;`",
      "## Lợi ích",
      "- Ẩn độ phức tạp: người dùng chỉ cần SELECT từ view.",
      "- Tái sử dụng logic ở nhiều nơi.",
      "- Kiểm soát truy cập: chỉ lộ một phần dữ liệu.",
      "View **không lưu dữ liệu** riêng, nó chỉ lưu câu truy vấn.",
    ],
    keyTerms: [
      { term: "View", definition: "Bảng ảo được định nghĩa bởi một truy vấn lưu sẵn." },
    ],
    tables: ["employees"],
    initialQuery:
      "CREATE VIEW eng_team AS\n  SELECT name, salary FROM employees WHERE department = 'Engineering';\nSELECT * FROM eng_team;",
    visualization: { type: "none" },
    exercises: [
      {
        id: "view-1",
        prompt:
          "Tạo view adults gồm name, age của users có age >= 18, rồi SELECT * từ view (sắp theo age).",
        solutionQuery:
          "CREATE VIEW adults AS SELECT name, age FROM users WHERE age >= 18; SELECT * FROM adults ORDER BY age;",
        hint: "CREATE VIEW adults AS SELECT ...; sau đó SELECT * FROM adults ORDER BY age;",
      },
    ],
    estimatedMinutes: 9,
  },
  {
    id: "query-execution-order",
    title: "Thứ tự thực thi câu lệnh",
    level: "advanced",
    category: "Hiểu sâu",
    summary: "SQL viết theo một thứ tự nhưng chạy theo thứ tự khác.",
    description:
      "Hiểu thứ tự DBMS thực thi giúp bạn lý giải vì sao alias trong SELECT không dùng được ở WHERE, và HAVING khác WHERE.",
    theory: [
      "Bạn **viết**: SELECT → FROM → WHERE → GROUP BY → HAVING → ORDER BY → LIMIT.",
      "Nhưng DBMS **chạy** theo thứ tự logic:",
      "- 1. `FROM` / `JOIN` — xác định nguồn dữ liệu.",
      "- 2. `WHERE` — lọc dòng.",
      "- 3. `GROUP BY` — gom nhóm.",
      "- 4. `HAVING` — lọc nhóm.",
      "- 5. `SELECT` — chọn/ tính cột (alias sinh ra ở đây).",
      "- 6. `ORDER BY` — sắp xếp.",
      "- 7. `LIMIT` — cắt số dòng.",
      "> Vì SELECT chạy sau WHERE, bạn không thể dùng alias đặt trong SELECT ở mệnh đề WHERE.",
    ],
    keyTerms: [
      { term: "Logical order", definition: "Thứ tự DBMS xử lý các mệnh đề, khác thứ tự viết." },
    ],
    tables: ["employees"],
    initialQuery:
      "SELECT department, COUNT(*) AS n\nFROM employees\nWHERE salary > 1400\nGROUP BY department\nHAVING COUNT(*) >= 2\nORDER BY n DESC;",
    visualization: { type: "none" },
    exercises: [
      {
        id: "qeo-1",
        prompt:
          "Lấy city và COUNT(*) AS n từ users, chỉ người age >= 18, gom theo city, chỉ nhóm có n >= 2, sắp n giảm dần.",
        solutionQuery:
          "SELECT city, COUNT(*) AS n FROM users WHERE age >= 18 GROUP BY city HAVING COUNT(*) >= 2 ORDER BY n DESC;",
        hint: "Ghép đủ WHERE, GROUP BY, HAVING, ORDER BY theo đúng thứ tự viết.",
      },
    ],
    estimatedMinutes: 9,
  },
  {
    id: "normalization",
    title: "Chuẩn hóa (Normalization)",
    level: "advanced",
    category: "Hiểu sâu",
    summary: "Tổ chức bảng để giảm trùng lặp và bất thường dữ liệu.",
    description:
      "Chuẩn hóa là quá trình tách dữ liệu thành các bảng liên kết để tránh lặp và mâu thuẫn.",
    theory: [
      "## Vấn đề khi không chuẩn hóa",
      "Nếu lưu tên phòng ban trực tiếp trong mỗi dòng users, đổi tên phòng ban sẽ phải sửa nhiều dòng — dễ sai lệch.",
      "## Các dạng chuẩn (tóm tắt)",
      "- **1NF**: mỗi ô một giá trị nguyên tử, không lặp nhóm.",
      "- **2NF**: 1NF + mọi cột phụ thuộc toàn bộ khóa chính.",
      "- **3NF**: 2NF + không phụ thuộc bắc cầu (cột không khóa không phụ thuộc cột không khóa khác).",
      "Vì vậy ta tách `departments` riêng và chỉ lưu `department_id` trong `users` — đúng tinh thần 3NF.",
      "> Đánh đổi: chuẩn hóa giảm trùng lặp nhưng cần JOIN khi đọc; đôi khi ta 'phi chuẩn hóa' để tăng tốc.",
    ],
    keyTerms: [
      { term: "Normalization", definition: "Tổ chức lại bảng để giảm trùng lặp." },
      { term: "3NF", definition: "Dạng chuẩn 3: loại bỏ phụ thuộc bắc cầu." },
    ],
    tables: ["users", "departments"],
    initialQuery:
      "SELECT u.name, d.name AS department\nFROM users u\nJOIN departments d ON u.department_id = d.id;",
    visualization: { type: "join" },
    steps: [
      { clause: "FROM", title: "Hai bảng tách biệt", description: "users chỉ giữ department_id, tên phòng ban nằm ở departments." },
      { clause: "JOIN", title: "Ghép khi cần", description: "Dùng JOIN để lấy tên phòng ban — dữ liệu không bị lặp." },
      { clause: "SELECT", title: "Kết quả hợp nhất", description: "Người đọc thấy đầy đủ thông tin dù dữ liệu được lưu tách." },
    ],
    exercises: [
      {
        id: "norm-1",
        prompt: "Ghép users (alias u) và departments (alias d) lấy u.name và d.name AS department.",
        solutionQuery:
          "SELECT u.name, d.name AS department FROM users u JOIN departments d ON u.department_id = d.id;",
        hint: "Dùng alias u và d, JOIN theo u.department_id = d.id.",
        orderInsensitive: true,
      },
    ],
    estimatedMinutes: 10,
  },
  {
    id: "performance-basics",
    title: "Hiệu năng truy vấn — cơ bản",
    level: "advanced",
    category: "Hiệu năng",
    summary: "Mẹo nền tảng để truy vấn nhanh hơn.",
    description:
      "Vài nguyên tắc đơn giản giúp truy vấn chạy nhanh và tiết kiệm tài nguyên.",
    theory: [
      "- Chỉ SELECT cột cần dùng, tránh `SELECT *` khi không cần.",
      "- Đánh **index** cho cột dùng trong WHERE / JOIN / ORDER BY.",
      "- Lọc sớm bằng WHERE để giảm số dòng phải xử lý.",
      "- Cẩn thận với JOIN nhiều bảng lớn; đảm bảo điều kiện ON có index.",
      "## EXPLAIN QUERY PLAN",
      "SQLite hỗ trợ `EXPLAIN QUERY PLAN SELECT ...;` để xem DBMS dự định quét bảng hay dùng index.",
      "> Chạy thử câu lệnh bên phải để xem kế hoạch thực thi của một truy vấn.",
    ],
    keyTerms: [
      { term: "EXPLAIN QUERY PLAN", definition: "Xem cách DBMS dự định thực thi truy vấn." },
      { term: "Selectivity", definition: "Mức độ điều kiện lọc bớt nhiều dòng — càng cao càng tốt cho index." },
    ],
    tables: ["employees"],
    initialQuery:
      "EXPLAIN QUERY PLAN\nSELECT * FROM employees WHERE department = 'Engineering';",
    visualization: { type: "none" },
    exercises: [
      {
        id: "perf-1",
        prompt: "Xem kế hoạch thực thi (EXPLAIN QUERY PLAN) cho SELECT * FROM users WHERE city = 'Hanoi'.",
        solutionQuery:
          "EXPLAIN QUERY PLAN SELECT * FROM users WHERE city = 'Hanoi';",
        hint: "Đặt EXPLAIN QUERY PLAN trước câu SELECT.",
        orderInsensitive: true,
      },
    ],
    estimatedMinutes: 8,
  },
  {
    id: "sql-injection",
    title: "SQL Injection — an toàn cơ bản",
    level: "advanced",
    category: "An toàn",
    summary: "Vì sao ghép chuỗi vào câu lệnh là nguy hiểm, và cách phòng tránh.",
    description:
      "SQL Injection xảy ra khi dữ liệu người dùng bị ghép trực tiếp vào câu lệnh SQL, cho phép kẻ tấn công đổi ý nghĩa truy vấn.",
    theory: [
      "## Cách lỗ hổng xuất hiện",
      "Giả sử code ghép chuỗi: `\"SELECT * FROM users WHERE name = '\" + input + \"'\"`.",
      "Nếu người dùng nhập `' OR '1'='1`, câu lệnh trở thành `... WHERE name = '' OR '1'='1'` — trả về **toàn bộ** bảng.",
      "Tệ hơn, nhập `'; DROP TABLE users; --` có thể phá dữ liệu.",
      "## Cách phòng tránh",
      "- **Prepared statements / tham số hóa**: `WHERE name = ?` và truyền giá trị riêng. DBMS không bao giờ hiểu dữ liệu là mã lệnh.",
      "- Kiểm tra & giới hạn đầu vào, dùng ORM đúng cách.",
      "- Nguyên tắc tối thiểu quyền: tài khoản app không nên có quyền DROP.",
      "> Bên phải là ví dụ **an toàn** minh họa: khi coi `' OR '1'='1` là *dữ liệu* (một cái tên), truy vấn trả về 0 dòng thay vì lộ dữ liệu.",
    ],
    keyTerms: [
      { term: "SQL Injection", definition: "Tấn công chèn mã SQL qua dữ liệu đầu vào." },
      { term: "Prepared statement", definition: "Câu lệnh tham số hóa tách mã khỏi dữ liệu." },
    ],
    tables: ["users"],
    initialQuery:
      "-- An toàn: chuỗi tấn công được coi là DỮ LIỆU, không phải mã lệnh\nSELECT * FROM users WHERE name = ''' OR ''1''=''1';",
    visualization: { type: "none" },
    exercises: [
      {
        id: "inj-1",
        prompt:
          "Viết truy vấn an toàn tìm user có name đúng bằng chuỗi (dùng nháy): tìm 'An Nguyen'.",
        solutionQuery: "SELECT * FROM users WHERE name = 'An Nguyen';",
        hint: "Luôn đặt giá trị chuỗi trong dấu nháy đơn và không ghép chuỗi động.",
        orderInsensitive: true,
      },
    ],
    estimatedMinutes: 10,
  },
];
