import type { Lesson } from "./types";

/**
 * Beginner track: from "what is a database" up to LIMIT.
 * Theory strings support a tiny markdown subset rendered by <Theory/>:
 *   "## heading", "- bullet", "> callout", `inline code`, **bold**.
 */
export const BASIC_LESSONS: Lesson[] = [
  {
    id: "what-is-database",
    title: "Database là gì?",
    level: "beginner",
    category: "Nền tảng",
    summary: "Hiểu database, DBMS và vì sao ta dùng SQL.",
    description:
      "Trước khi viết câu lệnh đầu tiên, hãy hình dung database là gì và SQL đóng vai trò gì.",
    theory: [
      "**Database (cơ sở dữ liệu)** là nơi lưu trữ dữ liệu một cách có tổ chức để máy tính có thể tìm kiếm, thêm, sửa, xóa nhanh chóng.",
      "Bạn có thể tưởng tượng database như một tủ hồ sơ khổng lồ: mỗi ngăn kéo là một **bảng (table)**, mỗi tờ giấy là một **dòng (row)**.",
      "## DBMS",
      "Phần mềm quản lý database gọi là **DBMS** (Database Management System). Ví dụ: SQLite, PostgreSQL, MySQL, SQL Server.",
      "Trang web này chạy **SQLite ngay trong trình duyệt** của bạn bằng WebAssembly, nên mọi câu lệnh đều thực thi thật, không phải giả lập.",
      "## SQL",
      "**SQL** (Structured Query Language) là ngôn ngữ để ra lệnh cho DBMS. Bạn mô tả *muốn gì*, DBMS lo *làm thế nào*.",
      "> Mẹo: hãy chạy thử câu lệnh bên phải để xem toàn bộ bảng `users`.",
    ],
    keyTerms: [
      { term: "Database", definition: "Tập hợp dữ liệu có tổ chức, lưu trong các bảng." },
      { term: "DBMS", definition: "Phần mềm quản lý và truy vấn database." },
      { term: "SQL", definition: "Ngôn ngữ truy vấn có cấu trúc để làm việc với database." },
    ],
    tables: ["users"],
    initialQuery: "SELECT * FROM users;",
    visualization: { type: "none" },
    exercises: [
      {
        id: "wd-1",
        prompt: "Xem toàn bộ dữ liệu trong bảng departments.",
        solutionQuery: "SELECT * FROM departments;",
        hint: "Dùng SELECT * FROM tên_bảng;",
        orderInsensitive: true,
        successMessage: "Bạn đã đọc được dữ liệu đầu tiên từ database!",
      },
    ],
    estimatedMinutes: 5,
  },
  {
    id: "tables-rows-columns",
    title: "Table, row, column",
    level: "beginner",
    category: "Nền tảng",
    summary: "Cấu trúc dữ liệu: bảng, dòng, cột, khóa chính và khóa ngoại.",
    description:
      "Mọi dữ liệu quan hệ đều nằm trong các bảng. Hãy nắm chắc ba khái niệm bảng, dòng, cột.",
    theory: [
      "Một **table (bảng)** gồm nhiều **column (cột)** và nhiều **row (dòng)**.",
      "- **Column**: mô tả một thuộc tính, ví dụ `name`, `age`. Mỗi cột có một kiểu dữ liệu (số, chuỗi, ngày...).",
      "- **Row**: một bản ghi cụ thể, ví dụ một người dùng.",
      "## Khóa chính (Primary Key)",
      "Cột `id` thường là **khóa chính**: giá trị duy nhất cho mỗi dòng, giúp phân biệt các dòng với nhau.",
      "## Khóa ngoại (Foreign Key)",
      "Cột `department_id` trong bảng `users` là **khóa ngoại**, trỏ tới `departments.id`. Đây là cách các bảng liên kết với nhau.",
      "> Quan sát: mỗi `users.department_id` khớp với một `departments.id`. Ta sẽ dùng mối liên kết này khi học JOIN.",
    ],
    keyTerms: [
      { term: "Row", definition: "Một bản ghi (một dòng) trong bảng." },
      { term: "Column", definition: "Một thuộc tính của bảng, có kiểu dữ liệu cố định." },
      { term: "Primary Key", definition: "Cột định danh duy nhất cho mỗi dòng." },
      { term: "Foreign Key", definition: "Cột trỏ tới khóa chính của bảng khác để liên kết dữ liệu." },
    ],
    tables: ["users", "departments"],
    initialQuery: "SELECT id, name, department_id FROM users;",
    visualization: { type: "none" },
    exercises: [
      {
        id: "trc-1",
        prompt: "Lấy cột id và name của tất cả phòng ban.",
        solutionQuery: "SELECT id, name FROM departments;",
        hint: "Liệt kê tên cột cách nhau bởi dấu phẩy sau SELECT.",
        orderInsensitive: true,
      },
    ],
    estimatedMinutes: 6,
  },
  {
    id: "select-basics",
    title: "SELECT cơ bản",
    level: "beginner",
    category: "Truy vấn dữ liệu",
    summary: "Đọc toàn bộ dữ liệu từ một bảng với SELECT *.",
    description:
      "SELECT là câu lệnh dùng nhiều nhất trong SQL: nó đọc dữ liệu ra khỏi bảng.",
    theory: [
      "Cấu trúc tối giản: `SELECT <cột> FROM <bảng>;`",
      "Dấu `*` nghĩa là **tất cả các cột**.",
      "## Thứ tự xử lý",
      "Dù bạn viết `SELECT` trước, DBMS thực chất xử lý `FROM` trước để biết lấy dữ liệu từ đâu, rồi mới chọn cột.",
      "- `FROM users` → nạp bảng users.",
      "- `SELECT *` → trả về mọi cột.",
      "> Bấm nút Play trong khu vực Animation để xem dữ liệu được nạp từ bảng ra vùng kết quả.",
    ],
    keyTerms: [
      { term: "SELECT", definition: "Chọn và trả về dữ liệu từ bảng." },
      { term: "FROM", definition: "Chỉ định bảng nguồn để lấy dữ liệu." },
    ],
    tables: ["users"],
    initialQuery: "SELECT * FROM users;",
    visualization: { type: "select" },
    steps: [
      { clause: "FROM", title: "Nạp bảng", description: "DBMS mở bảng users và đọc toàn bộ các dòng vào vùng xử lý." },
      { clause: "SELECT", title: "Chọn cột", description: "Vì dùng *, tất cả các cột đều được giữ lại cho kết quả." },
    ],
    exercises: [
      {
        id: "sb-1",
        prompt: "Đọc toàn bộ dữ liệu bảng orders.",
        solutionQuery: "SELECT * FROM orders;",
        hint: "SELECT * FROM orders;",
        orderInsensitive: true,
      },
    ],
    estimatedMinutes: 5,
  },
  {
    id: "select-columns",
    title: "SELECT cột cụ thể",
    level: "beginner",
    category: "Truy vấn dữ liệu",
    summary: "Chỉ lấy những cột bạn cần và đặt tên hiển thị bằng AS.",
    description:
      "Thay vì lấy tất cả, hãy chọn đúng cột cần thiết để kết quả gọn gàng và nhanh hơn.",
    theory: [
      "Liệt kê tên cột sau `SELECT`, cách nhau bằng dấu phẩy: `SELECT name, age FROM users;`",
      "## Đổi tên cột với AS",
      "Dùng `AS` để đặt tên hiển thị: `SELECT name AS ho_ten FROM users;`",
      "- Lấy ít cột hơn → dữ liệu trả về nhỏ hơn, dễ đọc hơn.",
      "> Trong animation, các cột không được chọn sẽ mờ đi, chỉ giữ lại cột name và age.",
    ],
    keyTerms: [
      { term: "AS", definition: "Đặt bí danh (alias) cho cột hoặc bảng." },
      { term: "Projection", definition: "Việc chọn ra tập cột con để trả về." },
    ],
    tables: ["users"],
    initialQuery: "SELECT name, age FROM users;",
    visualization: { type: "select" },
    steps: [
      { clause: "FROM", title: "Nạp bảng", description: "Nạp toàn bộ bảng users." },
      { clause: "SELECT", title: "Giữ cột name, age", description: "Chỉ hai cột được chọn; các cột id, city, department_id mờ đi." },
    ],
    exercises: [
      {
        id: "sc-1",
        prompt: "Lấy tên sản phẩm (product) và giá trị (total) từ bảng orders.",
        solutionQuery: "SELECT product, total FROM orders;",
        hint: "SELECT product, total FROM orders;",
        orderInsensitive: true,
      },
      {
        id: "sc-2",
        prompt: "Lấy cột name của users và đặt bí danh là full_name.",
        solutionQuery: "SELECT name AS full_name FROM users;",
        hint: "Dùng từ khóa AS sau tên cột.",
        orderInsensitive: true,
      },
    ],
    estimatedMinutes: 6,
  },
  {
    id: "where-basics",
    title: "WHERE — lọc dòng",
    level: "beginner",
    category: "Truy vấn dữ liệu",
    summary: "Chỉ giữ lại các dòng thỏa điều kiện.",
    description:
      "WHERE giúp bạn lọc dữ liệu: chỉ những dòng đúng điều kiện mới đi tiếp vào kết quả.",
    theory: [
      "Cú pháp: `SELECT ... FROM ... WHERE <điều kiện>;`",
      "## Toán tử so sánh",
      "- `=` bằng, `<>` hoặc `!=` khác",
      "- `>`, `>=`, `<`, `<=` so sánh lớn/nhỏ",
      "Ví dụ `WHERE age >= 18` chỉ giữ người từ 18 tuổi trở lên.",
      "## DBMS xử lý thế nào",
      "Sau khi `FROM` nạp bảng, `WHERE` duyệt từng dòng và kiểm tra điều kiện. Dòng không thỏa sẽ bị loại.",
      "> Trong animation, dòng bị loại sẽ chuyển đỏ và mờ dần; dòng thỏa điều kiện sáng lên.",
    ],
    keyTerms: [
      { term: "WHERE", definition: "Mệnh đề lọc các dòng theo điều kiện." },
      { term: "Predicate", definition: "Biểu thức điều kiện trả về đúng/sai cho mỗi dòng." },
    ],
    tables: ["users"],
    initialQuery: "SELECT name, age\nFROM users\nWHERE age >= 18;",
    visualization: { type: "select" },
    steps: [
      { clause: "FROM", title: "Nạp bảng users", description: "Toàn bộ 10 người dùng được đưa vào vùng xử lý." },
      { clause: "WHERE", title: "Lọc age >= 18", description: "Duyệt từng dòng: ai dưới 18 (Binh 17, Hoa 16) bị loại." },
      { clause: "SELECT", title: "Chọn name, age", description: "Trả về hai cột cho các dòng còn lại." },
    ],
    exercises: [
      {
        id: "wb-1",
        prompt: "Lấy name, city của những người sống ở 'Hanoi'.",
        solutionQuery: "SELECT name, city FROM users WHERE city = 'Hanoi';",
        hint: "Chuỗi phải đặt trong dấu nháy đơn: 'Hanoi'.",
        orderInsensitive: true,
      },
      {
        id: "wb-2",
        prompt: "Lấy các đơn hàng có total lớn hơn 100.",
        solutionQuery: "SELECT * FROM orders WHERE total > 100;",
        hint: "WHERE total > 100",
        orderInsensitive: true,
      },
    ],
    estimatedMinutes: 8,
  },
  {
    id: "and-or",
    title: "AND / OR — kết hợp điều kiện",
    level: "beginner",
    category: "Truy vấn dữ liệu",
    summary: "Ghép nhiều điều kiện với AND, OR và NOT.",
    description:
      "Kết hợp nhiều điều kiện để lọc chính xác hơn bằng AND, OR, NOT và IN/BETWEEN.",
    theory: [
      "- `AND`: cả hai điều kiện phải đúng.",
      "- `OR`: chỉ cần một điều kiện đúng.",
      "- `NOT`: phủ định điều kiện.",
      "## Ưu tiên",
      "`AND` được xét trước `OR`. Dùng dấu ngoặc `( )` để nhóm rõ ràng khi cần.",
      "## IN và BETWEEN",
      "- `city IN ('Hanoi', 'Hue')` tương đương nhiều OR.",
      "- `age BETWEEN 18 AND 30` tương đương `age >= 18 AND age <= 30`.",
      "> Ví dụ: người từ 18 tuổi **và** sống ở Ho Chi Minh.",
    ],
    keyTerms: [
      { term: "AND", definition: "Đúng khi tất cả điều kiện con đều đúng." },
      { term: "OR", definition: "Đúng khi ít nhất một điều kiện con đúng." },
      { term: "IN", definition: "Kiểm tra giá trị thuộc một danh sách." },
    ],
    tables: ["users"],
    initialQuery:
      "SELECT name, age, city\nFROM users\nWHERE age >= 18 AND city = 'Ho Chi Minh';",
    visualization: { type: "select" },
    steps: [
      { clause: "FROM", title: "Nạp bảng users", description: "Đưa toàn bộ người dùng vào xử lý." },
      { clause: "WHERE", title: "age >= 18 AND city = 'Ho Chi Minh'", description: "Chỉ giữ dòng thỏa CẢ hai điều kiện." },
      { clause: "SELECT", title: "Chọn name, age, city", description: "Trả về các cột yêu cầu." },
    ],
    exercises: [
      {
        id: "ao-1",
        prompt: "Lấy người sống ở 'Hanoi' HOẶC 'Da Nang'.",
        solutionQuery:
          "SELECT name, city FROM users WHERE city = 'Hanoi' OR city = 'Da Nang';",
        hint: "Dùng OR giữa hai điều kiện city.",
        orderInsensitive: true,
      },
      {
        id: "ao-2",
        prompt: "Lấy người có tuổi từ 20 đến 40 (bao gồm hai đầu).",
        solutionQuery: "SELECT name, age FROM users WHERE age BETWEEN 20 AND 40;",
        hint: "Dùng BETWEEN 20 AND 40.",
        orderInsensitive: true,
      },
    ],
    estimatedMinutes: 8,
  },
  {
    id: "order-by",
    title: "ORDER BY — sắp xếp",
    level: "beginner",
    category: "Truy vấn dữ liệu",
    summary: "Sắp xếp kết quả tăng dần (ASC) hoặc giảm dần (DESC).",
    description:
      "ORDER BY sắp xếp các dòng kết quả theo một hay nhiều cột.",
    theory: [
      "Cú pháp: `... ORDER BY <cột> [ASC|DESC];`",
      "- `ASC` tăng dần (mặc định).",
      "- `DESC` giảm dần.",
      "Có thể sắp theo nhiều cột: `ORDER BY city ASC, age DESC`.",
      "## Vị trí xử lý",
      "ORDER BY chạy **sau** khi đã lọc (WHERE) và chọn cột (SELECT), gần cuối cùng trong pipeline.",
      "> Trong animation, các dòng sẽ trượt đổi vị trí để đạt thứ tự age giảm dần.",
    ],
    keyTerms: [
      { term: "ORDER BY", definition: "Sắp xếp các dòng kết quả theo cột." },
      { term: "ASC / DESC", definition: "Tăng dần / giảm dần." },
    ],
    tables: ["users"],
    initialQuery:
      "SELECT name, age\nFROM users\nWHERE age >= 18\nORDER BY age DESC;",
    visualization: { type: "select" },
    steps: [
      { clause: "FROM", title: "Nạp bảng users", description: "Đưa toàn bộ người dùng vào xử lý." },
      { clause: "WHERE", title: "Lọc age >= 18", description: "Loại bỏ người dưới 18 tuổi." },
      { clause: "SELECT", title: "Chọn name, age", description: "Giữ hai cột cần hiển thị." },
      { clause: "ORDER BY", title: "Sắp xếp age giảm dần", description: "Các dòng di chuyển vị trí để lớn nhất lên đầu." },
    ],
    exercises: [
      {
        id: "ob-1",
        prompt: "Lấy name, age của mọi người, sắp xếp theo age tăng dần.",
        solutionQuery: "SELECT name, age FROM users ORDER BY age ASC;",
        hint: "ORDER BY age ASC (hoặc bỏ ASC vì là mặc định).",
      },
      {
        id: "ob-2",
        prompt: "Lấy đơn hàng sắp theo total giảm dần.",
        solutionQuery: "SELECT product, total FROM orders ORDER BY total DESC;",
        hint: "ORDER BY total DESC",
      },
    ],
    estimatedMinutes: 7,
  },
  {
    id: "limit",
    title: "LIMIT — giới hạn số dòng",
    level: "beginner",
    category: "Truy vấn dữ liệu",
    summary: "Lấy N dòng đầu tiên, thường kết hợp ORDER BY để lấy top N.",
    description:
      "LIMIT giới hạn số dòng trả về — rất hữu ích để lấy top N hoặc phân trang.",
    theory: [
      "Cú pháp: `... LIMIT <số dòng>;`",
      "Kết hợp với ORDER BY để lấy 'top N': `ORDER BY total DESC LIMIT 3`.",
      "## OFFSET",
      "`LIMIT 5 OFFSET 10` bỏ qua 10 dòng đầu rồi lấy 5 dòng — nền tảng của phân trang.",
      "> LIMIT là bước gần như cuối cùng: cắt bớt sau khi đã sắp xếp.",
    ],
    keyTerms: [
      { term: "LIMIT", definition: "Giới hạn số dòng trả về." },
      { term: "OFFSET", definition: "Bỏ qua N dòng đầu trước khi lấy." },
    ],
    tables: ["users"],
    initialQuery:
      "SELECT name, age\nFROM users\nORDER BY age DESC\nLIMIT 3;",
    visualization: { type: "select" },
    steps: [
      { clause: "FROM", title: "Nạp bảng users", description: "Đưa toàn bộ người dùng vào xử lý." },
      { clause: "SELECT", title: "Chọn name, age", description: "Giữ hai cột." },
      { clause: "ORDER BY", title: "Sắp xếp age giảm dần", description: "Người lớn tuổi nhất lên đầu." },
      { clause: "LIMIT", title: "Lấy 3 dòng đầu", description: "Chỉ giữ 3 dòng trên cùng, phần còn lại bị cắt." },
    ],
    exercises: [
      {
        id: "lm-1",
        prompt: "Lấy 5 đơn hàng có total cao nhất (product, total).",
        solutionQuery:
          "SELECT product, total FROM orders ORDER BY total DESC LIMIT 5;",
        hint: "Kết hợp ORDER BY total DESC với LIMIT 5.",
      },
      {
        id: "lm-2",
        prompt: "Lấy 3 user trẻ nhất (name, age) — age tăng dần, LIMIT 3.",
        solutionQuery:
          "SELECT name, age FROM users ORDER BY age ASC LIMIT 3;",
        hint: "ORDER BY age LIMIT 3",
      },
    ],
    estimatedMinutes: 6,
  },
  {
    id: "distinct",
    title: "DISTINCT — loại trùng",
    level: "beginner",
    category: "Truy vấn dữ liệu",
    summary: "Loại bỏ các dòng trùng lặp trong kết quả.",
    description:
      "DISTINCT giữ lại mỗi giá trị (hoặc tổ hợp cột) duy nhất một lần.",
    theory: [
      "Cú pháp: `SELECT DISTINCT city FROM users;`",
      "Áp dụng trên **toàn bộ** danh sách cột sau SELECT — hai cột trùng cả cặp mới bị gộp.",
      "> Animation: các dòng trùng mờ/gạch sau bước DISTINCT.",
    ],
    keyTerms: [
      { term: "DISTINCT", definition: "Loại bỏ dòng kết quả trùng nhau." },
    ],
    tables: ["users"],
    initialQuery: "SELECT DISTINCT city FROM users;",
    visualization: { type: "select" },
    steps: [
      { clause: "FROM", title: "Nạp users", description: "Toàn bộ người dùng." },
      { clause: "SELECT", title: "Chọn cột city", description: "Giữ cột city (có thể trùng)." },
      { clause: "SELECT", title: "DISTINCT", description: "Mỗi thành phố chỉ còn một dòng." },
    ],
    exercises: [
      {
        id: "ds-1",
        prompt: "Lấy danh sách city không trùng từ users.",
        solutionQuery: "SELECT DISTINCT city FROM users;",
        hint: "SELECT DISTINCT city FROM users;",
        orderInsensitive: true,
      },
      {
        id: "ds-2",
        prompt: "Lấy các department khác nhau từ employees.",
        solutionQuery: "SELECT DISTINCT department FROM employees;",
        hint: "SELECT DISTINCT department FROM employees;",
        orderInsensitive: true,
      },
    ],
    estimatedMinutes: 6,
  },
  {
    id: "null-like",
    title: "NULL, IS NULL & LIKE",
    level: "beginner",
    category: "Lọc dữ liệu",
    summary: "Xử lý giá trị thiếu và tìm chuỗi theo mẫu.",
    description:
      "NULL nghĩa là 'không có giá trị'. So sánh NULL dùng IS NULL / IS NOT NULL. LIKE tìm theo mẫu % và _.",
    theory: [
      "`WHERE department_id IS NULL` — user chưa gán phòng ban.",
      "`=` với NULL luôn cho unknown; đừng viết `= NULL`.",
      "`LIKE 'H%'` — chuỗi bắt đầu bằng H. `%` = nhiều ký tự, `_` = một ký tự.",
      "> Hoa Dang có department_id NULL — dùng để luyện IS NULL.",
    ],
    keyTerms: [
      { term: "NULL", definition: "Giá trị thiếu / chưa biết." },
      { term: "IS NULL", definition: "Kiểm tra cột không có giá trị." },
      { term: "LIKE", definition: "So khớp chuỗi theo mẫu." },
    ],
    tables: ["users"],
    initialQuery:
      "SELECT name, city, department_id\nFROM users\nWHERE department_id IS NULL;",
    visualization: { type: "select" },
    steps: [
      { clause: "FROM", title: "Nạp users", description: "Đọc mọi người dùng." },
      { clause: "WHERE", title: "IS NULL", description: "Giữ dòng có department_id là NULL." },
      { clause: "SELECT", title: "Chọn cột", description: "name, city, department_id." },
    ],
    exercises: [
      {
        id: "nl-1",
        prompt: "Lấy name, city của users có department_id IS NULL.",
        solutionQuery:
          "SELECT name, city FROM users WHERE department_id IS NULL;",
        hint: "WHERE department_id IS NULL",
        orderInsensitive: true,
      },
      {
        id: "nl-2",
        prompt: "Lấy name, city users có city LIKE '%Minh%' (chứa Minh).",
        solutionQuery:
          "SELECT name, city FROM users WHERE city LIKE '%Minh%';",
        hint: "LIKE '%Minh%'",
        orderInsensitive: true,
      },
      {
        id: "nl-3",
        prompt: "Lấy users có department_id IS NOT NULL và age >= 30 (name, age).",
        solutionQuery:
          "SELECT name, age FROM users WHERE department_id IS NOT NULL AND age >= 30;",
        hint: "IS NOT NULL AND age >= 30",
        orderInsensitive: true,
      },
    ],
    estimatedMinutes: 8,
  },
  {
    id: "union",
    title: "UNION — gộp kết quả",
    level: "beginner",
    category: "Truy vấn dữ liệu",
    summary: "Gộp hai SELECT thành một danh sách (loại trùng hoặc giữ hết).",
    description:
      "UNION gộp kết quả hai truy vấn cùng số cột. UNION loại trùng; UNION ALL giữ tất cả.",
    theory: [
      "`SELECT city FROM users UNION SELECT department FROM employees;`",
      "Hai vế phải cùng số cột và kiểu tương thích.",
      "`UNION ALL` nhanh hơn vì không loại trùng.",
    ],
    keyTerms: [
      { term: "UNION", definition: "Gộp hai SELECT, loại dòng trùng." },
      { term: "UNION ALL", definition: "Gộp hai SELECT, giữ cả dòng trùng." },
    ],
    tables: ["users", "employees"],
    initialQuery:
      "SELECT city AS label FROM users\nUNION\nSELECT department AS label FROM employees;",
    visualization: { type: "none" },
    exercises: [
      {
        id: "un-1",
        prompt:
          "Gộp DISTINCT: SELECT name FROM users UNION SELECT name FROM employees.",
        solutionQuery:
          "SELECT name FROM users UNION SELECT name FROM employees;",
        hint: "UNION giữa hai SELECT name",
        orderInsensitive: true,
      },
      {
        id: "un-2",
        prompt: "Dùng UNION ALL gộp city (users) và department (employees), alias label.",
        solutionQuery:
          "SELECT city AS label FROM users UNION ALL SELECT department AS label FROM employees;",
        hint: "UNION ALL và alias label",
        orderInsensitive: true,
      },
    ],
    estimatedMinutes: 8,
  },
];
