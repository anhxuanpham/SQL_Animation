import type { Lesson } from "./types";

/**
 * Intermediate track: mutations, aggregation, joins, subqueries.
 */
export const INTERMEDIATE_LESSONS: Lesson[] = [
  {
    id: "insert",
    title: "INSERT — thêm dữ liệu",
    level: "intermediate",
    category: "Thay đổi dữ liệu",
    summary: "Thêm dòng mới vào bảng với INSERT INTO ... VALUES.",
    description:
      "INSERT thêm một hoặc nhiều dòng mới vào bảng.",
    theory: [
      "Cú pháp: `INSERT INTO bảng (cột1, cột2, ...) VALUES (giá trị1, giá trị2, ...);`",
      "Nên liệt kê rõ tên cột để tránh nhầm thứ tự.",
      "Có thể thêm nhiều dòng cùng lúc bằng nhiều bộ VALUES cách nhau bởi dấu phẩy.",
      "> Trong animation, một thẻ (card) dữ liệu mới xuất hiện rồi trượt vào cuối bảng.",
      "Sau khi INSERT, hãy chạy `SELECT * FROM users;` để thấy dòng mới. Bấm **Reset sample database** để khôi phục dữ liệu gốc.",
    ],
    keyTerms: [
      { term: "INSERT", definition: "Thêm dòng mới vào bảng." },
      { term: "VALUES", definition: "Danh sách giá trị cho dòng được thêm." },
    ],
    tables: ["users"],
    initialQuery:
      "INSERT INTO users (id, name, age, city, department_id)\nVALUES (11, 'Tuan Le', 24, 'Hanoi', 1);",
    visualization: { type: "mutation" },
    steps: [
      { clause: "INSERT", title: "Xác định bảng đích", description: "DBMS chuẩn bị thêm dòng vào bảng users." },
      { clause: "VALUES", title: "Tạo dòng mới", description: "Bộ giá trị được đóng gói thành một dòng." },
      { clause: "INSERT", title: "Ghi vào bảng", description: "Dòng mới trượt vào cuối bảng users." },
    ],
    exercises: [
      {
        id: "ins-1",
        prompt: "Thêm phòng ban mới có id = 6, name = 'Legal'.",
        solutionQuery: "INSERT INTO departments (id, name) VALUES (6, 'Legal');",
        verifyQuery: "SELECT * FROM departments ORDER BY id;",
        hint: "INSERT INTO departments (id, name) VALUES (6, 'Legal');",
      },
      {
        id: "ins-2",
        prompt:
          "Thêm user: id=11, name='Yen Mai', age=29, city='Hue', department_id=2.",
        solutionQuery:
          "INSERT INTO users (id, name, age, city, department_id) VALUES (11, 'Yen Mai', 29, 'Hue', 2);",
        verifyQuery: "SELECT id, name, age FROM users WHERE id = 11;",
        hint: "INSERT INTO users (...) VALUES (11, 'Yen Mai', 29, 'Hue', 2);",
      },
    ],
    estimatedMinutes: 7,
  },
  {
    id: "update",
    title: "UPDATE — cập nhật dữ liệu",
    level: "intermediate",
    category: "Thay đổi dữ liệu",
    summary: "Sửa giá trị các dòng thỏa điều kiện với UPDATE ... SET ... WHERE.",
    description:
      "UPDATE thay đổi giá trị của các dòng đang tồn tại. WHERE quyết định dòng nào bị ảnh hưởng.",
    theory: [
      "Cú pháp: `UPDATE bảng SET cột = giá_trị WHERE điều_kiện;`",
      "> ⚠️ Nếu **quên WHERE**, toàn bộ dòng trong bảng sẽ bị cập nhật!",
      "## Trình tự",
      "- `WHERE` tìm các dòng cần sửa.",
      "- `SET` gán giá trị mới cho các cột.",
      "Trong animation, dòng khớp sáng lên rồi ô giá trị đổi từ giá trị cũ sang giá trị mới.",
    ],
    keyTerms: [
      { term: "UPDATE", definition: "Sửa dữ liệu các dòng đang có." },
      { term: "SET", definition: "Gán giá trị mới cho cột." },
    ],
    tables: ["users"],
    initialQuery:
      "UPDATE users\nSET city = 'Hai Phong'\nWHERE id = 3;",
    visualization: { type: "mutation" },
    steps: [
      { clause: "WHERE", title: "Tìm dòng id = 3", description: "Xác định dòng của Chi Le." },
      { clause: "UPDATE", title: "Dòng khớp sáng lên", description: "Dòng cần cập nhật được làm nổi bật." },
      { clause: "SET", title: "Đổi city", description: "Ô city đổi từ 'Ho Chi Minh' sang 'Hai Phong'." },
    ],
    exercises: [
      {
        id: "upd-1",
        prompt: "Tăng lương (salary) lên 3000 cho nhân viên tên 'An Nguyen' trong bảng employees.",
        solutionQuery:
          "UPDATE employees SET salary = 3000 WHERE name = 'An Nguyen';",
        verifyQuery: "SELECT id, name, salary FROM employees ORDER BY id;",
        hint: "UPDATE employees SET salary = 3000 WHERE name = 'An Nguyen';",
      },
      {
        id: "upd-2",
        prompt: "Đổi city thành 'Hanoi' cho user có name = 'Binh Tran'.",
        solutionQuery:
          "UPDATE users SET city = 'Hanoi' WHERE name = 'Binh Tran';",
        verifyQuery: "SELECT id, name, city FROM users WHERE name = 'Binh Tran';",
        hint: "UPDATE users SET city = 'Hanoi' WHERE name = 'Binh Tran';",
      },
    ],
    estimatedMinutes: 8,
  },
  {
    id: "delete",
    title: "DELETE — xóa dữ liệu",
    level: "intermediate",
    category: "Thay đổi dữ liệu",
    summary: "Xóa các dòng thỏa điều kiện với DELETE FROM ... WHERE.",
    description:
      "DELETE loại bỏ các dòng khỏi bảng. Giống UPDATE, WHERE là bắt buộc trong thực tế.",
    theory: [
      "Cú pháp: `DELETE FROM bảng WHERE điều_kiện;`",
      "> ⚠️ Quên WHERE sẽ **xóa sạch bảng**. Luôn kiểm tra WHERE bằng SELECT trước khi DELETE.",
      "Trong animation, dòng bị xóa chuyển màu cảnh báo rồi thu gọn và biến mất.",
    ],
    keyTerms: [
      { term: "DELETE", definition: "Xóa các dòng khỏi bảng." },
    ],
    tables: ["orders"],
    initialQuery: "DELETE FROM orders\nWHERE total < 20;",
    visualization: { type: "mutation" },
    steps: [
      { clause: "WHERE", title: "Tìm dòng total < 20", description: "Xác định các đơn hàng giá trị nhỏ." },
      { clause: "DELETE", title: "Đánh dấu cảnh báo", description: "Các dòng khớp chuyển sang màu đỏ." },
      { clause: "DELETE", title: "Xóa dòng", description: "Các dòng thu gọn và biến mất khỏi bảng." },
    ],
    exercises: [
      {
        id: "del-1",
        prompt: "Xóa những người dùng dưới 18 tuổi khỏi bảng users.",
        solutionQuery: "DELETE FROM users WHERE age < 18;",
        verifyQuery: "SELECT id, name, age FROM users ORDER BY id;",
        hint: "DELETE FROM users WHERE age < 18;",
      },
      {
        id: "del-2",
        prompt: "Xóa orders có total < 20.",
        solutionQuery: "DELETE FROM orders WHERE total < 20;",
        verifyQuery: "SELECT id, product, total FROM orders ORDER BY id;",
        hint: "DELETE FROM orders WHERE total < 20;",
      },
    ],
    estimatedMinutes: 7,
  },
  {
    id: "aggregate",
    title: "Hàm tổng hợp: COUNT / SUM / AVG",
    level: "intermediate",
    category: "Tổng hợp dữ liệu",
    summary: "Tính toán trên nhiều dòng: đếm, tính tổng, trung bình, min, max.",
    description:
      "Hàm tổng hợp (aggregate) gộp nhiều dòng thành một giá trị duy nhất.",
    theory: [
      "- `COUNT(*)`: đếm số dòng.",
      "- `SUM(cột)`: tổng.",
      "- `AVG(cột)`: trung bình.",
      "- `MIN`, `MAX`: nhỏ nhất, lớn nhất.",
      "## Không có GROUP BY",
      "Khi không có GROUP BY, toàn bộ bảng được coi là **một nhóm** và trả về đúng một dòng kết quả.",
      "Ví dụ: `SELECT COUNT(*), AVG(total) FROM orders;` cho biết có bao nhiêu đơn và giá trị trung bình.",
    ],
    keyTerms: [
      { term: "COUNT", definition: "Đếm số dòng (hoặc số giá trị khác NULL)." },
      { term: "AVG", definition: "Giá trị trung bình của một cột số." },
      { term: "Aggregate", definition: "Hàm gộp nhiều dòng thành một giá trị." },
    ],
    tables: ["orders"],
    initialQuery:
      "SELECT COUNT(*) AS so_don, SUM(total) AS tong, AVG(total) AS trung_binh\nFROM orders;",
    visualization: { type: "group" },
    steps: [
      { clause: "FROM", title: "Nạp bảng orders", description: "Tất cả đơn hàng vào vùng xử lý." },
      { clause: "SELECT", title: "Gộp thành một nhóm", description: "COUNT, SUM, AVG được tính trên toàn bộ dòng, tạo một dòng kết quả." },
    ],
    exercises: [
      {
        id: "agg-1",
        prompt: "Tính lương trung bình (AVG) của toàn bộ nhân viên, đặt tên avg_salary.",
        solutionQuery: "SELECT AVG(salary) AS avg_salary FROM employees;",
        hint: "SELECT AVG(salary) AS avg_salary FROM employees;",
        orderInsensitive: true,
      },
      {
        id: "agg-2",
        prompt: "Đếm số người dùng ở 'Hanoi'.",
        solutionQuery: "SELECT COUNT(*) FROM users WHERE city = 'Hanoi';",
        hint: "Kết hợp COUNT(*) với WHERE city = 'Hanoi'.",
        orderInsensitive: true,
      },
    ],
    estimatedMinutes: 8,
  },
  {
    id: "group-by",
    title: "GROUP BY — gom nhóm",
    level: "intermediate",
    category: "Tổng hợp dữ liệu",
    summary: "Nhóm các dòng theo cột rồi tính tổng hợp cho từng nhóm.",
    description:
      "GROUP BY chia dữ liệu thành các nhóm theo giá trị cột, rồi áp dụng hàm tổng hợp cho mỗi nhóm.",
    theory: [
      "Cú pháp: `SELECT cột_nhóm, COUNT(*) FROM bảng GROUP BY cột_nhóm;`",
      "Mỗi giá trị khác nhau của cột nhóm tạo thành một dòng kết quả.",
      "## Quy tắc quan trọng",
      "Mọi cột trong SELECT mà không nằm trong hàm tổng hợp thì phải xuất hiện trong GROUP BY.",
      "> Animation: các dòng cùng `department` được gom lại thành từng khung màu, rồi bộ đếm COUNT tăng dần cho mỗi nhóm.",
    ],
    keyTerms: [
      { term: "GROUP BY", definition: "Gom các dòng có cùng giá trị thành nhóm." },
      { term: "Group key", definition: "Cột dùng để chia nhóm." },
    ],
    tables: ["employees"],
    initialQuery:
      "SELECT department, COUNT(*) AS so_nhan_vien\nFROM employees\nGROUP BY department;",
    visualization: { type: "group" },
    steps: [
      { clause: "FROM", title: "Nạp bảng employees", description: "Tất cả nhân viên vào vùng xử lý." },
      { clause: "GROUP BY", title: "Gom theo department", description: "Các dòng cùng phòng ban được nhóm lại thành khung riêng." },
      { clause: "SELECT", title: "Đếm mỗi nhóm", description: "COUNT(*) đếm số dòng trong từng nhóm, sinh ra bảng kết quả." },
    ],
    exercises: [
      {
        id: "gb-1",
        prompt: "Đếm số người dùng theo từng thành phố (city, COUNT(*)).",
        solutionQuery: "SELECT city, COUNT(*) FROM users GROUP BY city;",
        hint: "GROUP BY city.",
        orderInsensitive: true,
      },
      {
        id: "gb-2",
        prompt: "Tính tổng lương (SUM(salary)) theo từng department.",
        solutionQuery:
          "SELECT department, SUM(salary) FROM employees GROUP BY department;",
        hint: "SELECT department, SUM(salary) ... GROUP BY department.",
        orderInsensitive: true,
      },
    ],
    estimatedMinutes: 10,
  },
  {
    id: "having",
    title: "HAVING — lọc nhóm",
    level: "intermediate",
    category: "Tổng hợp dữ liệu",
    summary: "Lọc các nhóm sau khi tổng hợp (khác với WHERE lọc dòng).",
    description:
      "HAVING lọc các nhóm dựa trên kết quả tổng hợp. WHERE lọc dòng trước khi nhóm; HAVING lọc nhóm sau khi tính.",
    theory: [
      "Thứ tự: `WHERE` (lọc dòng) → `GROUP BY` (gom nhóm) → `HAVING` (lọc nhóm).",
      "Ví dụ: chỉ giữ phòng ban có nhiều hơn 2 nhân viên: `HAVING COUNT(*) > 2`.",
      "## Phân biệt WHERE và HAVING",
      "- `WHERE` không dùng được với hàm tổng hợp.",
      "- `HAVING` dùng để so sánh với COUNT/SUM/AVG...",
      "> Animation: sau khi gom nhóm và đếm, các nhóm không đạt điều kiện sẽ mờ đi.",
    ],
    keyTerms: [
      { term: "HAVING", definition: "Lọc các nhóm dựa trên giá trị tổng hợp." },
    ],
    tables: ["employees"],
    initialQuery:
      "SELECT department, COUNT(*) AS so_nhan_vien\nFROM employees\nGROUP BY department\nHAVING COUNT(*) > 2;",
    visualization: { type: "group" },
    steps: [
      { clause: "FROM", title: "Nạp bảng employees", description: "Tất cả nhân viên vào xử lý." },
      { clause: "GROUP BY", title: "Gom theo department", description: "Chia nhân viên thành các nhóm phòng ban." },
      { clause: "SELECT", title: "Đếm mỗi nhóm", description: "Tính COUNT(*) cho từng nhóm." },
      { clause: "HAVING", title: "Lọc nhóm > 2", description: "Nhóm có từ 2 nhân viên trở xuống bị loại bỏ." },
    ],
    exercises: [
      {
        id: "hv-1",
        prompt: "Lấy các thành phố có nhiều hơn 2 người dùng (city, COUNT(*)).",
        solutionQuery:
          "SELECT city, COUNT(*) FROM users GROUP BY city HAVING COUNT(*) > 2;",
        hint: "Thêm HAVING COUNT(*) > 2 sau GROUP BY city.",
        orderInsensitive: true,
      },
    ],
    estimatedMinutes: 9,
  },
  {
    id: "inner-join",
    title: "INNER JOIN — ghép bảng",
    level: "intermediate",
    category: "Kết hợp bảng",
    summary: "Ghép dòng của hai bảng khi khóa khớp nhau.",
    description:
      "JOIN kết hợp dữ liệu từ nhiều bảng dựa trên cột liên kết. INNER JOIN chỉ giữ các cặp dòng khớp ở cả hai bên.",
    theory: [
      "Cú pháp: `SELECT ... FROM A INNER JOIN B ON A.khoa = B.khoa;`",
      "INNER JOIN chỉ trả về dòng có cặp khớp ở **cả hai** bảng.",
      "## Ví dụ",
      "Ghép `users` với `orders` theo `users.id = orders.user_id` để biết ai đặt đơn nào.",
      "> Animation: hai bảng đặt cạnh nhau, đường nối vẽ giữa các dòng khớp; dòng không khớp mờ đi; các cặp khớp ghép thành bảng kết quả.",
    ],
    keyTerms: [
      { term: "INNER JOIN", definition: "Chỉ giữ các dòng khớp ở cả hai bảng." },
      { term: "ON", definition: "Điều kiện ghép giữa hai bảng." },
    ],
    tables: ["users", "orders"],
    initialQuery:
      "SELECT users.name, orders.product, orders.total\nFROM users\nINNER JOIN orders ON users.id = orders.user_id;",
    visualization: { type: "join" },
    steps: [
      { clause: "FROM", title: "Hai bảng cạnh nhau", description: "Hiển thị users (trái) và orders (phải)." },
      { clause: "ON", title: "Khóa liên kết", description: "Làm nổi bật users.id và orders.user_id." },
      { clause: "JOIN", title: "Nối dòng khớp", description: "Vẽ đường nối các cặp id = user_id; dòng không khớp mờ đi." },
      { clause: "SELECT", title: "Ghép kết quả", description: "Các cặp khớp gộp thành bảng kết quả cuối." },
    ],
    exercises: [
      {
        id: "ij-1",
        prompt: "Ghép users và departments để lấy users.name và departments.name (đặt bí danh dept).",
        solutionQuery:
          "SELECT users.name, departments.name AS dept FROM users INNER JOIN departments ON users.department_id = departments.id;",
        hint: "JOIN theo users.department_id = departments.id.",
        orderInsensitive: true,
      },
    ],
    estimatedMinutes: 11,
  },
  {
    id: "left-join",
    title: "LEFT JOIN — giữ mọi dòng bảng trái",
    level: "intermediate",
    category: "Kết hợp bảng",
    summary: "Giữ tất cả dòng bảng trái, phần không khớp bên phải là NULL.",
    description:
      "LEFT JOIN giữ mọi dòng của bảng bên trái, kể cả khi không tìm thấy dòng khớp bên phải (khi đó các cột phải là NULL).",
    theory: [
      "Cú pháp: `... FROM A LEFT JOIN B ON A.k = B.k;`",
      "Khác biệt với INNER JOIN: dòng bên trái **không khớp** vẫn được giữ, cột bên phải điền `NULL`.",
      "## Khi nào dùng",
      "Khi bạn muốn 'tất cả A, kèm thông tin B nếu có'. Ví dụ: mọi user, kèm phòng ban nếu đã gán.",
      "> Hoa Dang có `department_id = NULL` nên sẽ xuất hiện với phòng ban trống — đây chính là điểm khác biệt của LEFT JOIN.",
    ],
    keyTerms: [
      { term: "LEFT JOIN", definition: "Giữ tất cả dòng bảng trái, NULL nếu không khớp phải." },
      { term: "NULL", definition: "Giá trị 'không có dữ liệu'." },
    ],
    tables: ["users", "departments"],
    initialQuery:
      "SELECT users.name, departments.name AS dept\nFROM users\nLEFT JOIN departments ON users.department_id = departments.id;",
    visualization: { type: "join" },
    steps: [
      { clause: "FROM", title: "Hai bảng cạnh nhau", description: "users (trái) và departments (phải)." },
      { clause: "ON", title: "Khóa liên kết", description: "users.department_id ↔ departments.id." },
      { clause: "JOIN", title: "Nối và giữ bảng trái", description: "Mọi user được giữ; user không có phòng ban nhận NULL." },
      { clause: "SELECT", title: "Ghép kết quả", description: "Bảng kết quả gồm cả dòng NULL bên phải." },
    ],
    exercises: [
      {
        id: "lj-1",
        prompt: "Dùng LEFT JOIN lấy mọi user (name) kèm product của đơn hàng (nếu có).",
        solutionQuery:
          "SELECT users.name, orders.product FROM users LEFT JOIN orders ON users.id = orders.user_id;",
        hint: "FROM users LEFT JOIN orders ON users.id = orders.user_id.",
        orderInsensitive: true,
      },
    ],
    estimatedMinutes: 10,
  },
  {
    id: "subquery",
    title: "Subquery — truy vấn lồng",
    level: "intermediate",
    category: "Kết hợp bảng",
    summary: "Dùng kết quả của một truy vấn bên trong truy vấn khác.",
    description:
      "Subquery (truy vấn con) là một câu SELECT nằm bên trong câu lệnh khác, thường trong WHERE hoặc FROM.",
    theory: [
      "Ví dụ lấy người có tuổi lớn hơn trung bình: `WHERE age > (SELECT AVG(age) FROM users)`.",
      "## Các dạng thường gặp",
      "- Trả về **một giá trị**: so sánh trực tiếp với `=`, `>`...",
      "- Trả về **một danh sách**: dùng với `IN`.",
      "Subquery được tính trước, rồi giá trị của nó được dùng cho truy vấn ngoài.",
      "> Truy vấn con `(SELECT AVG(age) FROM users)` cho một con số; truy vấn ngoài dùng con số đó để lọc.",
    ],
    keyTerms: [
      { term: "Subquery", definition: "Câu truy vấn lồng bên trong câu truy vấn khác." },
      { term: "IN", definition: "Kiểm tra giá trị thuộc tập kết quả của subquery." },
    ],
    tables: ["users"],
    initialQuery:
      "SELECT name, age\nFROM users\nWHERE age > (SELECT AVG(age) FROM users);",
    visualization: { type: "subquery" },
    steps: [
      { clause: "WHERE", title: "Tính subquery", description: "(SELECT AVG(age) FROM users) được tính trước thành một con số." },
      { clause: "FROM", title: "Nạp bảng users", description: "Truy vấn ngoài nạp toàn bộ người dùng." },
      { clause: "WHERE", title: "Lọc theo subquery", description: "Giữ những người có age lớn hơn giá trị trung bình vừa tính." },
      { clause: "SELECT", title: "Kết quả", description: "Các dòng thỏa điều kiện." },
    ],
    exercises: [
      {
        id: "sq-1",
        prompt: "Lấy các đơn hàng có total lớn hơn total trung bình của bảng orders.",
        solutionQuery:
          "SELECT product, total FROM orders WHERE total > (SELECT AVG(total) FROM orders);",
        hint: "WHERE total > (SELECT AVG(total) FROM orders).",
        orderInsensitive: true,
      },
      {
        id: "sq-2",
        prompt: "Lấy name của users có id nằm trong tập user_id của orders (dùng IN + subquery).",
        solutionQuery:
          "SELECT name FROM users WHERE id IN (SELECT user_id FROM orders);",
        hint: "WHERE id IN (SELECT user_id FROM orders)",
        orderInsensitive: true,
      },
    ],
    estimatedMinutes: 11,
  },
  {
    id: "multi-join",
    title: "JOIN nhiều bảng",
    level: "intermediate",
    category: "Kết hợp bảng",
    summary: "Nối users → orders → (qua user) theo chuỗi JOIN.",
    description:
      "Khi dữ liệu nằm ở nhiều bảng, bạn nối lần lượt từng cặp bằng JOIN.",
    theory: [
      "Có thể viết nhiều `JOIN ... ON ...` liên tiếp.",
      "Ví dụ: `users JOIN orders ON ...` rồi (nếu có bảng khác) JOIN tiếp.",
      "Thứ tự JOIN và điều kiện ON quyết định tập kết quả trung gian.",
      "> Animation: từng bước JOIN được vẽ nối, sau đó gộp thành kết quả cuối.",
    ],
    keyTerms: [
      { term: "Multi-join", definition: "Nối từ ba bảng trở lên trong một câu lệnh." },
    ],
    tables: ["users", "orders", "departments"],
    initialQuery:
      "SELECT users.name, departments.name AS dept, orders.product\nFROM users\nJOIN departments ON users.department_id = departments.id\nJOIN orders ON users.id = orders.user_id;",
    visualization: { type: "join" },
    exercises: [
      {
        id: "mj-1",
        prompt:
          "Lấy name (users), product, total: JOIN users với orders.",
        solutionQuery:
          "SELECT users.name, orders.product, orders.total FROM users JOIN orders ON users.id = orders.user_id;",
        hint: "JOIN orders ON users.id = orders.user_id",
        orderInsensitive: true,
      },
      {
        id: "mj-2",
        prompt:
          "Thêm departments: name user, name dept, product — INNER JOIN đủ 3 bảng.",
        solutionQuery:
          "SELECT users.name, departments.name, orders.product FROM users JOIN departments ON users.department_id = departments.id JOIN orders ON users.id = orders.user_id;",
        hint: "JOIN departments ... JOIN orders ...",
        orderInsensitive: true,
      },
    ],
    estimatedMinutes: 12,
  },
  {
    id: "exists-case",
    title: "EXISTS & CASE",
    level: "intermediate",
    category: "Điều kiện nâng cao",
    summary: "EXISTS kiểm tra tồn tại; CASE rẽ nhánh trong SELECT.",
    description:
      "EXISTS trả về đúng nếu subquery có ít nhất một dòng. CASE gán nhãn theo điều kiện.",
    theory: [
      "`WHERE EXISTS (SELECT 1 FROM orders WHERE orders.user_id = users.id)` — user có ít nhất một đơn.",
      "`CASE WHEN age >= 18 THEN 'adult' ELSE 'minor' END AS group_age`",
      "EXISTS dừng sớm khi tìm thấy một dòng — thường nhanh hơn đếm.",
    ],
    keyTerms: [
      { term: "EXISTS", definition: "Đúng nếu subquery trả về ít nhất một dòng." },
      { term: "CASE", definition: "Biểu thức rẽ nhánh trong SQL." },
    ],
    tables: ["users", "orders"],
    initialQuery:
      "SELECT name,\n  CASE WHEN age >= 18 THEN 'adult' ELSE 'minor' END AS age_group\nFROM users;",
    visualization: { type: "select" },
    exercises: [
      {
        id: "ec-1",
        prompt: "Lấy name users có ít nhất một order (dùng EXISTS).",
        solutionQuery:
          "SELECT name FROM users WHERE EXISTS (SELECT 1 FROM orders WHERE orders.user_id = users.id);",
        hint: "WHERE EXISTS (SELECT 1 FROM orders WHERE orders.user_id = users.id)",
        orderInsensitive: true,
      },
      {
        id: "ec-2",
        prompt:
          "SELECT product, total, và cột size_label: 'big' nếu total >= 100, ngược lại 'small'.",
        solutionQuery:
          "SELECT product, total, CASE WHEN total >= 100 THEN 'big' ELSE 'small' END AS size_label FROM orders;",
        hint: "CASE WHEN total >= 100 THEN 'big' ELSE 'small' END",
        orderInsensitive: true,
      },
    ],
    estimatedMinutes: 11,
  },
];
