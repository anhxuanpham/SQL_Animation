import type { Lesson } from "./types";

/**
 * Oracle track.
 *
 * Oracle PL/SQL cannot execute inside sql.js/SQLite. These lessons therefore
 * use a dedicated procedure simulator and structural exercise validation while
 * keeping the sample employee rows grounded in the live browser database.
 */
export const ORACLE_LESSONS: Lesson[] = [
  {
    id: "oracle-stored-procedure",
    title: "Stored Procedure trên Oracle",
    level: "advanced",
    dialect: "oracle",
    category: "Oracle PL/SQL",
    summary:
      "Tạo, lưu và gọi procedure với IN/OUT, SQL%ROWCOUNT và lỗi nghiệp vụ.",
    description:
      "Stored procedure là chương trình PL/SQL có tên, được biên dịch và lưu trong schema Oracle để nhiều ứng dụng có thể gọi lại.",
    theory: [
      "## Stored procedure là gì?",
      "Procedure gom nhiều lệnh SQL và logic PL/SQL thành một đơn vị có tên. Oracle **biên dịch** nó khi tạo và lưu metadata/mã đã biên dịch trong schema.",
      "Cú pháp khung: `CREATE OR REPLACE PROCEDURE ten (...) AS BEGIN ... END; /`.",
      "> Dấu `/` không thuộc PL/SQL; đó là lệnh của SQL*Plus, SQLcl hoặc SQL Developer để gửi block vừa nhập sang Oracle.",
      "## Cấu trúc một procedure",
      "- **Header**: tên procedure và danh sách tham số.",
      "- **Declaration** (sau `AS`/`IS`): biến, constant, cursor — phần này có thể rỗng.",
      "- **Executable section** (`BEGIN ... END`): nơi chạy IF, UPDATE, SELECT INTO...",
      "- **Exception section** (`EXCEPTION`): tùy chọn, xử lý lỗi có chủ đích.",
      "## Tham số IN, OUT, IN OUT",
      "- `IN`: nhận dữ liệu từ caller; đây là mode mặc định.",
      "- `OUT`: procedure ghi kết quả để trả về caller.",
      "- `IN OUT`: vừa nhận giá trị ban đầu vừa ghi giá trị mới.",
      "Trong ví dụ, `p_department` và `p_amount` là IN; `p_updated` là OUT.",
      "## SQL%ROWCOUNT",
      "`SQL%ROWCOUNT` là implicit cursor attribute cho biết lệnh SQL gần nhất đã tác động bao nhiêu dòng. Sau UPDATE, ta gán nó vào `p_updated`.",
      "## Gọi procedure",
      "Một anonymous block `DECLARE ... BEGIN ... END; /` khai báo biến nhận OUT, truyền tham số theo tên bằng `=>`, rồi in kết quả qua `DBMS_OUTPUT.PUT_LINE`.",
      "`SET SERVEROUTPUT ON` là lệnh của client để hiện nội dung DBMS_OUTPUT.",
      "## Transaction và quyền",
      "- UPDATE bên trong procedure vẫn thuộc transaction của caller. Thông thường procedure dùng chung **không tự COMMIT**, để caller quyết định COMMIT hay ROLLBACK.",
      "- `CREATE OR REPLACE PROCEDURE` là DDL và gây implicit commit trong Oracle.",
      "- Schema khác muốn gọi cần quyền: `GRANT EXECUTE ON raise_department_salary TO app_user;`.",
      "> Trình duyệt này không nhúng Oracle Server. Nút Mô phỏng dùng dữ liệu mẫu thật để diễn giải luồng PL/SQL; muốn chạy câu lệnh nguyên bản hãy dùng Oracle Database + SQL Developer/SQLcl.",
    ],
    keyTerms: [
      {
        term: "Stored procedure",
        definition:
          "Chương trình PL/SQL có tên, được biên dịch và lưu trong schema Oracle.",
      },
      {
        term: "PL/SQL",
        definition:
          "Ngôn ngữ thủ tục của Oracle, bổ sung biến, IF, loop và exception cho SQL.",
      },
      {
        term: "IN / OUT",
        definition:
          "Mode tham số dùng để nhận dữ liệu vào hoặc trả dữ liệu ra.",
      },
      {
        term: "SQL%ROWCOUNT",
        definition:
          "Số dòng bị tác động bởi câu SQL gần nhất trong session PL/SQL.",
      },
      {
        term: "RAISE_APPLICATION_ERROR",
        definition:
          "Tạo lỗi nghiệp vụ Oracle với mã từ -20000 đến -20999.",
      },
    ],
    tables: ["employees"],
    initialQuery:
      "CREATE OR REPLACE PROCEDURE raise_department_salary (\n  p_department IN VARCHAR2,\n  p_amount     IN NUMBER,\n  p_updated    OUT NUMBER\n) AS\nBEGIN\n  IF p_amount <= 0 THEN\n    RAISE_APPLICATION_ERROR(-20001, 'Mức tăng phải lớn hơn 0');\n  END IF;\n\n  UPDATE employees\n  SET salary = salary + p_amount\n  WHERE department = p_department;\n\n  p_updated := SQL%ROWCOUNT;\nEND;\n/\n\nSET SERVEROUTPUT ON\n\nDECLARE\n  v_updated NUMBER;\nBEGIN\n  raise_department_salary(\n    p_department => 'Sales',\n    p_amount     => 100,\n    p_updated    => v_updated\n  );\n  DBMS_OUTPUT.PUT_LINE('Đã cập nhật: ' || v_updated || ' nhân viên');\nEND;\n/",
    visualization: { type: "procedure", oracleVariant: "lifecycle" },
    steps: [
      {
        clause: "PROCEDURE",
        title: "Biên dịch và lưu procedure",
        description:
          "Oracle kiểm tra cú pháp, biên dịch và lưu RAISE_DEPARTMENT_SALARY trong schema.",
      },
      {
        clause: "BEGIN",
        title: "Caller truyền tham số",
        description:
          "Anonymous block truyền Sales và 100 vào hai tham số IN; v_updated chờ nhận OUT.",
      },
      {
        clause: "IF",
        title: "Kiểm tra luật nghiệp vụ",
        description:
          "p_amount phải lớn hơn 0; nếu sai, Oracle phát lỗi -20001.",
      },
      {
        clause: "UPDATE",
        title: "Chạy SQL trong procedure",
        description:
          "UPDATE tìm nhân viên Sales và tăng salary cho từng dòng phù hợp.",
      },
      {
        clause: "OUT",
        title: "Trả SQL%ROWCOUNT",
        description:
          "Số dòng vừa cập nhật đi qua p_updated và được caller in bằng DBMS_OUTPUT.",
      },
    ],
    exercises: [
      {
        id: "ora-proc-1",
        prompt:
          "Tạo procedure give_bonus nhận p_department IN VARCHAR2, p_amount IN NUMBER, p_count OUT NUMBER; tăng salary rồi gán SQL%ROWCOUNT vào p_count.",
        starterQuery:
          "CREATE OR REPLACE PROCEDURE give_bonus (\n  p_department IN VARCHAR2,\n  p_amount     IN NUMBER,\n  p_count      OUT NUMBER\n) AS\nBEGIN\n  -- Viết UPDATE và gán OUT tại đây\nEND;\n/",
        solutionQuery:
          "CREATE OR REPLACE PROCEDURE give_bonus (\n  p_department IN VARCHAR2,\n  p_amount     IN NUMBER,\n  p_count      OUT NUMBER\n) AS\nBEGIN\n  UPDATE employees\n  SET salary = salary + p_amount\n  WHERE department = p_department;\n\n  p_count := SQL%ROWCOUNT;\nEND;\n/",
        hint:
          "Sau UPDATE employees, dùng `p_count := SQL%ROWCOUNT;` trước END.",
        validation: {
          mode: "structure",
          requirements: [
            {
              label: "CREATE OR REPLACE PROCEDURE give_bonus",
              pattern:
                "\\bcreate\\s+or\\s+replace\\s+procedure\\s+give_bonus\\b",
            },
            {
              label: "p_department là tham số IN",
              pattern: "\\bp_department\\s+in\\s+varchar2\\b",
            },
            {
              label: "p_amount là tham số IN",
              pattern: "\\bp_amount\\s+in\\s+number\\b",
            },
            {
              label: "p_count là tham số OUT",
              pattern: "\\bp_count\\s+out\\s+number\\b",
            },
            {
              label: "UPDATE bảng employees",
              pattern: "\\bupdate\\s+employees\\b",
            },
            {
              label: "tăng salary bằng p_amount",
              pattern:
                "\\bset\\s+salary\\s*=\\s*salary\\s*\\+\\s*p_amount\\b",
            },
            {
              label: "lọc theo p_department",
              pattern:
                "\\bwhere\\s+department\\s*=\\s*p_department\\b",
            },
            {
              label: "trả SQL%ROWCOUNT qua p_count",
              pattern: "\\bp_count\\s*:=\\s*sql%rowcount\\b",
            },
          ],
        },
        successMessage:
          "Đúng cấu trúc! Procedure có đủ IN, OUT, UPDATE và SQL%ROWCOUNT.",
      },
      {
        id: "ora-proc-2",
        prompt:
          "Viết anonymous block gọi give_bonus cho phòng Engineering với mức 200, nhận OUT vào v_count và in v_count bằng DBMS_OUTPUT.PUT_LINE.",
        starterQuery:
          "DECLARE\n  v_count NUMBER;\nBEGIN\n  -- Gọi give_bonus bằng named notation\n  -- In v_count\nEND;\n/",
        solutionQuery:
          "SET SERVEROUTPUT ON\n\nDECLARE\n  v_count NUMBER;\nBEGIN\n  give_bonus(\n    p_department => 'Engineering',\n    p_amount     => 200,\n    p_count      => v_count\n  );\n  DBMS_OUTPUT.PUT_LINE('Đã cập nhật: ' || v_count);\nEND;\n/",
        hint:
          "Dùng `p_department => 'Engineering'`, `p_amount => 200`, `p_count => v_count` rồi gọi DBMS_OUTPUT.PUT_LINE.",
        validation: {
          mode: "structure",
          requirements: [
            {
              label: "khai báo v_count kiểu NUMBER",
              pattern: "\\bv_count\\s+number\\b",
            },
            {
              label: "anonymous block DECLARE ... BEGIN",
              pattern: "\\bdeclare\\b[\\s\\S]*\\bbegin\\b",
            },
            {
              label: "gọi give_bonus",
              pattern: "\\bgive_bonus\\s*\\(",
            },
            {
              label: "truyền Engineering vào p_department",
              pattern:
                "\\bp_department\\s*=>\\s*'engineering'",
            },
            {
              label: "truyền 200 vào p_amount",
              pattern: "\\bp_amount\\s*=>\\s*200\\b",
            },
            {
              label: "nhận OUT vào v_count",
              pattern: "\\bp_count\\s*=>\\s*v_count\\b",
            },
            {
              label: "in v_count bằng DBMS_OUTPUT",
              pattern:
                "\\bdbms_output\\.put_line\\s*\\([\\s\\S]*\\bv_count\\b[\\s\\S]*\\)",
            },
          ],
        },
        successMessage:
          "Chính xác! Caller đã truyền IN bằng named notation và nhận giá trị OUT.",
      },
    ],
    estimatedMinutes: 18,
  },
  {
    id: "oracle-procedure-parameters",
    title: "Procedure parameters — IN / OUT / IN OUT",
    level: "advanced",
    dialect: "oracle",
    category: "Oracle PL/SQL",
    summary:
      "Hiểu chính xác cách Oracle truyền dữ liệu vào, trả dữ liệu ra và ghi ngược IN OUT.",
    description:
      "Parameter mode là contract giữa caller và procedure; chọn sai mode khiến API PL/SQL khó dùng và dễ tạo side effect bất ngờ.",
    theory: [
      "## Ba parameter mode",
      "- `IN`: procedure đọc giá trị nhưng không gán lại cho formal parameter.",
      "- `OUT`: giá trị ban đầu của biến caller không có ý nghĩa; procedure phải ghi kết quả trước khi kết thúc.",
      "- `IN OUT`: caller truyền giá trị ban đầu và nhận lại giá trị đã được procedure thay đổi.",
      "Nếu không ghi mode, Oracle mặc định là `IN`.",
      "## Positional và named notation",
      "`apply_capped_raise(1, v_raise, v_salary)` phụ thuộc thứ tự. Named notation `p_employee_id => 1` dài hơn nhưng an toàn khi procedure có nhiều tham số.",
      "Có thể trộn positional trước và named sau, nhưng không được quay lại positional sau khi đã dùng named notation.",
      "## Dùng %TYPE",
      "`employees.salary%TYPE` giúp biến PL/SQL tự đồng bộ kiểu với cột. Khi schema đổi kiểu salary, code ít bị lệch hơn so với hard-code NUMBER.",
      "## Ví dụ IN OUT",
      "Caller yêu cầu tăng 900. Procedure giới hạn mức tăng tối đa 500 rồi ghi `500` ngược vào biến IN OUT; OUT trả salary mới.",
      "> IN OUT hữu ích nhưng làm API khó đoán hơn. Nếu không cần ghi ngược, ưu tiên tách thành một IN và một OUT rõ nghĩa.",
    ],
    keyTerms: [
      {
        term: "Parameter mode",
        definition: "Quy định hướng dữ liệu đi qua formal parameter.",
      },
      {
        term: "Named notation",
        definition: "Truyền tham số bằng cú pháp ten_tham_so => gia_tri.",
      },
      {
        term: "%TYPE",
        definition: "Kế thừa kiểu dữ liệu từ một biến hoặc cột database.",
      },
    ],
    tables: ["employees"],
    initialQuery:
      "CREATE OR REPLACE PROCEDURE apply_capped_raise (\n  p_employee_id     IN NUMBER,\n  p_requested_raise IN OUT NUMBER,\n  p_new_salary      OUT NUMBER\n) AS\n  v_salary employees.salary%TYPE;\nBEGIN\n  SELECT salary\n  INTO v_salary\n  FROM employees\n  WHERE id = p_employee_id;\n\n  IF p_requested_raise < 0 THEN\n    p_requested_raise := 0;\n  ELSIF p_requested_raise > 500 THEN\n    p_requested_raise := 500;\n  END IF;\n\n  p_new_salary := v_salary + p_requested_raise;\n\n  UPDATE employees\n  SET salary = p_new_salary\n  WHERE id = p_employee_id;\nEND;\n/\n\nSET SERVEROUTPUT ON\n\nDECLARE\n  v_raise     NUMBER := 900;\n  v_new_salary NUMBER;\nBEGIN\n  apply_capped_raise(\n    p_employee_id     => 1,\n    p_requested_raise => v_raise,\n    p_new_salary      => v_new_salary\n  );\n  DBMS_OUTPUT.PUT_LINE('Mức tăng thực tế: ' || v_raise);\n  DBMS_OUTPUT.PUT_LINE('Lương mới: ' || v_new_salary);\nEND;\n/",
    visualization: { type: "procedure", oracleVariant: "parameters" },
    steps: [
      {
        clause: "PROCEDURE",
        title: "Định nghĩa contract tham số",
        description:
          "Header công khai rõ dữ liệu nào chỉ đi vào, dữ liệu nào được trả ra hoặc ghi ngược.",
      },
      {
        clause: "BEGIN",
        title: "Bind biến caller",
        description:
          "v_raise được nối với IN OUT; v_new_salary được nối với OUT.",
      },
      {
        clause: "SELECT",
        title: "Đọc salary hiện tại",
        description:
          "SELECT INTO lấy salary của employee id 1 làm cơ sở tính toán.",
      },
      {
        clause: "IF",
        title: "Chuẩn hóa IN OUT",
        description:
          "Yêu cầu 900 bị cap xuống 500 và giá trị mới được ghi ngược vào v_raise.",
      },
      {
        clause: "OUT",
        title: "Trả salary mới",
        description:
          "p_new_salary trả 2700, trong khi IN OUT trả mức tăng thực tế 500.",
      },
    ],
    exercises: [
      {
        id: "ora-param-1",
        prompt:
          "Tạo procedure normalize_percent(p_percent IN OUT NUMBER): nếu nhỏ hơn 0 gán 0, nếu lớn hơn 100 gán 100.",
        starterQuery:
          "CREATE OR REPLACE PROCEDURE normalize_percent (\n  p_percent IN OUT NUMBER\n) AS\nBEGIN\n  -- Chuẩn hóa về khoảng 0..100\nEND;\n/",
        solutionQuery:
          "CREATE OR REPLACE PROCEDURE normalize_percent (\n  p_percent IN OUT NUMBER\n) AS\nBEGIN\n  IF p_percent < 0 THEN\n    p_percent := 0;\n  ELSIF p_percent > 100 THEN\n    p_percent := 100;\n  END IF;\nEND;\n/",
        hint: "Dùng IF ... ELSIF và gán lại trực tiếp cho p_percent.",
        validation: {
          mode: "structure",
          requirements: [
            {
              label: "procedure normalize_percent",
              pattern:
                "\\bcreate\\s+or\\s+replace\\s+procedure\\s+normalize_percent\\b",
            },
            {
              label: "p_percent là IN OUT NUMBER",
              pattern: "\\bp_percent\\s+in\\s+out\\s+number\\b",
            },
            {
              label: "kiểm tra nhỏ hơn 0",
              pattern: "\\bif\\s+p_percent\\s*<\\s*0\\s+then\\b",
            },
            {
              label: "gán giá trị 0",
              pattern: "\\bp_percent\\s*:=\\s*0\\b",
            },
            {
              label: "kiểm tra lớn hơn 100",
              pattern: "\\belsif\\s+p_percent\\s*>\\s*100\\s+then\\b",
            },
            {
              label: "gán giá trị 100",
              pattern: "\\bp_percent\\s*:=\\s*100\\b",
            },
          ],
        },
      },
      {
        id: "ora-param-2",
        prompt:
          "Viết anonymous block gọi apply_capped_raise cho employee 4, mức tăng ban đầu 700; nhận salary mới và in cả hai biến.",
        starterQuery:
          "DECLARE\n  v_raise NUMBER := 700;\n  v_salary NUMBER;\nBEGIN\n  -- Gọi bằng named notation và in kết quả\nEND;\n/",
        solutionQuery:
          "SET SERVEROUTPUT ON\nDECLARE\n  v_raise NUMBER := 700;\n  v_salary NUMBER;\nBEGIN\n  apply_capped_raise(\n    p_employee_id => 4,\n    p_requested_raise => v_raise,\n    p_new_salary => v_salary\n  );\n  DBMS_OUTPUT.PUT_LINE(v_raise);\n  DBMS_OUTPUT.PUT_LINE(v_salary);\nEND;\n/",
        hint:
          "Truyền v_raise vào p_requested_raise và v_salary vào p_new_salary.",
        validation: {
          mode: "structure",
          requirements: [
            {
              label: "v_raise khởi tạo bằng 700",
              pattern: "\\bv_raise\\s+number\\s*:=\\s*700\\b",
            },
            {
              label: "gọi apply_capped_raise",
              pattern: "\\bapply_capped_raise\\s*\\(",
            },
            {
              label: "employee id 4",
              pattern: "\\bp_employee_id\\s*=>\\s*4\\b",
            },
            {
              label: "bind IN OUT v_raise",
              pattern: "\\bp_requested_raise\\s*=>\\s*v_raise\\b",
            },
            {
              label: "bind OUT v_salary",
              pattern: "\\bp_new_salary\\s*=>\\s*v_salary\\b",
            },
            {
              label: "in bằng DBMS_OUTPUT",
              pattern: "\\bdbms_output\\.put_line\\s*\\(",
            },
          ],
        },
      },
    ],
    estimatedMinutes: 14,
  },
  {
    id: "oracle-procedure-select-into",
    title: "SELECT INTO và trả nhiều giá trị",
    level: "advanced",
    dialect: "oracle",
    category: "Oracle PL/SQL",
    summary:
      "Đọc đúng một dòng vào biến PL/SQL và trả nhiều scalar qua OUT parameters.",
    description:
      "SELECT INTO là cầu nối cơ bản giữa SQL và logic thủ tục: lấy dữ liệu từ bảng vào biến để kiểm tra, tính toán hoặc trả về caller.",
    theory: [
      "## SELECT ... INTO",
      "Trong PL/SQL, `SELECT cot1, cot2 INTO bien1, bien2 FROM ...` yêu cầu kết quả **đúng một dòng**.",
      "- 0 dòng: Oracle phát `NO_DATA_FOUND`.",
      "- Nhiều hơn 1 dòng: Oracle phát `TOO_MANY_ROWS`.",
      "Số cột SELECT phải khớp số biến INTO và kiểu dữ liệu phải tương thích.",
      "## Trả nhiều giá trị",
      "Procedure không có RETURN như function, nhưng có thể trả nhiều OUT parameters. Ví dụ `p_name` và `p_salary` cùng được điền từ một SELECT INTO.",
      "## SELECT INTO hay cursor?",
      "- Dùng SELECT INTO khi chắc chắn cần một dòng.",
      "- Dùng cursor loop hoặc bulk collect khi cần nhiều dòng.",
      "- Dùng aggregate như COUNT khi muốn luôn có đúng một dòng.",
      "> Đừng dùng WHEN OTHERS để che NO_DATA_FOUND. Hãy quyết định rõ: không có dữ liệu là lỗi hay kết quả hợp lệ.",
    ],
    keyTerms: [
      {
        term: "SELECT INTO",
        definition: "Đưa cột của đúng một dòng SQL vào biến PL/SQL.",
      },
      {
        term: "NO_DATA_FOUND",
        definition: "Predefined exception khi SELECT INTO trả 0 dòng.",
      },
      {
        term: "TOO_MANY_ROWS",
        definition: "Predefined exception khi SELECT INTO trả hơn 1 dòng.",
      },
    ],
    tables: ["employees"],
    initialQuery:
      "CREATE OR REPLACE PROCEDURE get_employee_snapshot (\n  p_employee_id IN NUMBER,\n  p_name        OUT VARCHAR2,\n  p_salary      OUT NUMBER\n) AS\nBEGIN\n  SELECT name, salary\n  INTO p_name, p_salary\n  FROM employees\n  WHERE id = p_employee_id;\nEND;\n/\n\nSET SERVEROUTPUT ON\n\nDECLARE\n  v_name employees.name%TYPE;\n  v_salary employees.salary%TYPE;\nBEGIN\n  get_employee_snapshot(\n    p_employee_id => 7,\n    p_name        => v_name,\n    p_salary      => v_salary\n  );\n  DBMS_OUTPUT.PUT_LINE(v_name || ': ' || v_salary);\nEND;\n/",
    visualization: { type: "procedure", oracleVariant: "select-into" },
    steps: [
      {
        clause: "PROCEDURE",
        title: "Khai báo hai OUT parameters",
        description:
          "p_name và p_salary là hai kênh kết quả độc lập cho caller.",
      },
      {
        clause: "BEGIN",
        title: "Nhận khóa tra cứu",
        description: "Caller truyền employee id 7 bằng named notation.",
      },
      {
        clause: "SELECT",
        title: "SELECT đúng một dòng INTO",
        description:
          "Oracle tìm Minh Hoang và chép name, salary vào hai OUT parameters.",
      },
      {
        clause: "OUT",
        title: "Caller nhận hai scalar",
        description: "v_name nhận Minh Hoang; v_salary nhận 2500.",
      },
    ],
    exercises: [
      {
        id: "ora-into-1",
        prompt:
          "Tạo procedure get_department_name(p_department_id IN NUMBER, p_name OUT VARCHAR2) dùng SELECT name INTO p_name FROM departments.",
        starterQuery:
          "CREATE OR REPLACE PROCEDURE get_department_name (\n  p_department_id IN NUMBER,\n  p_name OUT VARCHAR2\n) AS\nBEGIN\n  -- SELECT INTO\nEND;\n/",
        solutionQuery:
          "CREATE OR REPLACE PROCEDURE get_department_name (\n  p_department_id IN NUMBER,\n  p_name OUT VARCHAR2\n) AS\nBEGIN\n  SELECT name INTO p_name\n  FROM departments\n  WHERE id = p_department_id;\nEND;\n/",
        hint: "Đặt INTO p_name ngay sau SELECT name.",
        validation: {
          mode: "structure",
          requirements: [
            {
              label: "procedure get_department_name",
              pattern:
                "\\bcreate\\s+or\\s+replace\\s+procedure\\s+get_department_name\\b",
            },
            {
              label: "p_department_id là IN",
              pattern: "\\bp_department_id\\s+in\\s+number\\b",
            },
            {
              label: "p_name là OUT",
              pattern: "\\bp_name\\s+out\\s+varchar2\\b",
            },
            {
              label: "SELECT name INTO p_name",
              pattern: "\\bselect\\s+name\\s+into\\s+p_name\\b",
            },
            {
              label: "FROM departments",
              pattern: "\\bfrom\\s+departments\\b",
            },
            {
              label: "lọc theo p_department_id",
              pattern: "\\bwhere\\s+id\\s*=\\s*p_department_id\\b",
            },
          ],
        },
      },
      {
        id: "ora-into-2",
        prompt:
          "Viết anonymous block gọi get_employee_snapshot cho id 10, nhận v_name/v_salary và in cả hai.",
        starterQuery:
          "DECLARE\n  v_name VARCHAR2(100);\n  v_salary NUMBER;\nBEGIN\n  -- Gọi procedure và in kết quả\nEND;\n/",
        solutionQuery:
          "SET SERVEROUTPUT ON\nDECLARE\n  v_name VARCHAR2(100);\n  v_salary NUMBER;\nBEGIN\n  get_employee_snapshot(\n    p_employee_id => 10,\n    p_name => v_name,\n    p_salary => v_salary\n  );\n  DBMS_OUTPUT.PUT_LINE(v_name || ': ' || v_salary);\nEND;\n/",
        hint: "Bind hai OUT parameters vào v_name và v_salary.",
        validation: {
          mode: "structure",
          requirements: [
            {
              label: "gọi get_employee_snapshot",
              pattern: "\\bget_employee_snapshot\\s*\\(",
            },
            {
              label: "employee id 10",
              pattern: "\\bp_employee_id\\s*=>\\s*10\\b",
            },
            {
              label: "bind p_name",
              pattern: "\\bp_name\\s*=>\\s*v_name\\b",
            },
            {
              label: "bind p_salary",
              pattern: "\\bp_salary\\s*=>\\s*v_salary\\b",
            },
            {
              label: "DBMS_OUTPUT dùng cả hai biến",
              pattern:
                "\\bdbms_output\\.put_line\\s*\\([\\s\\S]*v_name[\\s\\S]*v_salary",
            },
          ],
        },
      },
    ],
    estimatedMinutes: 13,
  },
  {
    id: "oracle-procedure-exceptions",
    title: "Exception handling trong procedure",
    level: "advanced",
    dialect: "oracle",
    category: "Oracle PL/SQL",
    summary:
      "Xử lý NO_DATA_FOUND, TOO_MANY_ROWS và phát lỗi nghiệp vụ ổn định.",
    description:
      "Exception section là error contract của procedure: nó quyết định lỗi nào được xử lý, lỗi nào đổi thông điệp và lỗi nào phải truyền tiếp.",
    theory: [
      "## Predefined exceptions",
      "Oracle có sẵn `NO_DATA_FOUND`, `TOO_MANY_ROWS`, `ZERO_DIVIDE`, `DUP_VAL_ON_INDEX`...",
      "Handler cụ thể phải đặt trước `WHEN OTHERS`.",
      "## RAISE_APPLICATION_ERROR",
      "Dùng mã từ `-20000` đến `-20999` để trả lỗi nghiệp vụ cho application, ví dụ `-20002: Không tìm thấy nhân viên`.",
      "## RAISE",
      "`RAISE;` trong handler phát lại exception hiện tại và giữ call stack tốt hơn việc tạo lỗi chung chung.",
      "## Anti-pattern",
      "- `WHEN OTHERS THEN NULL` nuốt lỗi và làm dữ liệu sai mà caller tưởng thành công.",
      "- COMMIT trong exception handler có thể lưu trạng thái dở dang.",
      "- Trả mọi lỗi thành một message giống nhau làm mất khả năng điều tra.",
      "Có thể log `SQLCODE`, `SQLERRM` và `DBMS_UTILITY.FORMAT_ERROR_BACKTRACE`, sau đó RAISE lại.",
      "> Chỉ bắt exception khi bạn có hành động cụ thể: phục hồi, chuyển thành domain error, hoặc thêm context rồi phát lại.",
    ],
    keyTerms: [
      {
        term: "Exception handler",
        definition: "Nhánh WHEN xử lý một loại lỗi trong PL/SQL block.",
      },
      {
        term: "SQLCODE / SQLERRM",
        definition: "Mã lỗi và thông điệp của exception hiện tại.",
      },
      {
        term: "Error contract",
        definition: "Tập lỗi có chủ đích mà procedure cam kết với caller.",
      },
    ],
    tables: ["employees"],
    initialQuery:
      "CREATE OR REPLACE PROCEDURE get_employee_salary_safe (\n  p_employee_id IN NUMBER,\n  p_salary      OUT NUMBER\n) AS\nBEGIN\n  SELECT salary\n  INTO p_salary\n  FROM employees\n  WHERE id = p_employee_id;\nEXCEPTION\n  WHEN NO_DATA_FOUND THEN\n    RAISE_APPLICATION_ERROR(-20002, 'Không tìm thấy nhân viên');\n  WHEN TOO_MANY_ROWS THEN\n    RAISE_APPLICATION_ERROR(-20003, 'Dữ liệu nhân viên không duy nhất');\n  WHEN OTHERS THEN\n    RAISE;\nEND;\n/\n\nDECLARE\n  v_salary NUMBER;\nBEGIN\n  get_employee_salary_safe(\n    p_employee_id => 999,\n    p_salary      => v_salary\n  );\nEND;\n/",
    visualization: { type: "procedure", oracleVariant: "exception" },
    steps: [
      {
        clause: "PROCEDURE",
        title: "Định nghĩa error contract",
        description:
          "Procedure chuyển hai lỗi SELECT INTO phổ biến thành mã lỗi nghiệp vụ riêng.",
      },
      {
        clause: "BEGIN",
        title: "Caller gửi id 999",
        description: "Employee id này không tồn tại trong dữ liệu mẫu.",
      },
      {
        clause: "SELECT",
        title: "Oracle phát NO_DATA_FOUND",
        description: "SELECT INTO trả 0 dòng nên executable section dừng.",
      },
      {
        clause: "EXCEPTION",
        title: "Handler trả ORA-20002",
        description:
          "Caller nhận lỗi ổn định 'Không tìm thấy nhân viên' thay vì lỗi kỹ thuật mơ hồ.",
      },
    ],
    exercises: [
      {
        id: "ora-ex-1",
        prompt:
          "Thêm EXCEPTION cho get_department_name: khi NO_DATA_FOUND, phát -20010 với message 'Không tìm thấy phòng ban'.",
        starterQuery:
          "CREATE OR REPLACE PROCEDURE get_department_name_safe (\n  p_id IN NUMBER,\n  p_name OUT VARCHAR2\n) AS\nBEGIN\n  SELECT name INTO p_name FROM departments WHERE id = p_id;\n-- Thêm EXCEPTION\nEND;\n/",
        solutionQuery:
          "CREATE OR REPLACE PROCEDURE get_department_name_safe (\n  p_id IN NUMBER,\n  p_name OUT VARCHAR2\n) AS\nBEGIN\n  SELECT name INTO p_name FROM departments WHERE id = p_id;\nEXCEPTION\n  WHEN NO_DATA_FOUND THEN\n    RAISE_APPLICATION_ERROR(-20010, 'Không tìm thấy phòng ban');\nEND;\n/",
        hint:
          "Đặt EXCEPTION sau câu SELECT và trước END; bắt NO_DATA_FOUND.",
        validation: {
          mode: "structure",
          requirements: [
            {
              label: "EXCEPTION section",
              pattern: "\\bexception\\b",
            },
            {
              label: "WHEN NO_DATA_FOUND",
              pattern: "\\bwhen\\s+no_data_found\\s+then\\b",
            },
            {
              label: "mã lỗi -20010",
              pattern:
                "\\braise_application_error\\s*\\(\\s*-20010\\s*,",
            },
            {
              label: "message phòng ban",
              pattern: "không\\s+tìm\\s+thấy\\s+phòng\\s+ban",
            },
          ],
        },
      },
      {
        id: "ora-ex-2",
        prompt:
          "Viết handler cuối cùng WHEN OTHERS ghi SQLCODE, SQLERRM bằng DBMS_OUTPUT rồi RAISE lại. Không được nuốt lỗi.",
        starterQuery:
          "BEGIN\n  risky_operation;\nEXCEPTION\n  -- Viết handler\nEND;\n/",
        solutionQuery:
          "BEGIN\n  risky_operation;\nEXCEPTION\n  WHEN OTHERS THEN\n    DBMS_OUTPUT.PUT_LINE(SQLCODE || ': ' || SQLERRM);\n    RAISE;\nEND;\n/",
        hint: "Sau DBMS_OUTPUT.PUT_LINE phải có `RAISE;`.",
        validation: {
          mode: "structure",
          requirements: [
            {
              label: "WHEN OTHERS THEN",
              pattern: "\\bwhen\\s+others\\s+then\\b",
            },
            {
              label: "ghi SQLCODE",
              pattern:
                "\\bdbms_output\\.put_line\\s*\\([\\s\\S]*\\bsqlcode\\b",
            },
            {
              label: "ghi SQLERRM",
              pattern:
                "\\bdbms_output\\.put_line\\s*\\([\\s\\S]*\\bsqlerrm\\b",
            },
            {
              label: "RAISE lại exception",
              pattern: "\\braise\\s*;",
            },
          ],
          forbidden: [
            {
              label: "WHEN OTHERS THEN NULL",
              pattern: "\\bwhen\\s+others\\s+then\\s+null\\s*;",
            },
          ],
        },
      },
    ],
    estimatedMinutes: 15,
  },
  {
    id: "oracle-procedure-transactions",
    title: "Procedure và transaction boundary",
    level: "advanced",
    dialect: "oracle",
    category: "Oracle PL/SQL",
    summary:
      "Quyết định đúng nơi COMMIT/ROLLBACK và tránh procedure phá transaction của caller.",
    description:
      "Procedure thực hiện DML không đồng nghĩa nó phải tự COMMIT; ranh giới transaction thường thuộc service hoặc caller điều phối toàn bộ workflow.",
    theory: [
      "## Ai sở hữu transaction?",
      "Reusable procedure nên thực hiện công việc và trả lỗi; caller quyết định COMMIT khi **toàn bộ** use case thành công.",
      "Nếu procedure A tự COMMIT rồi procedure B lỗi, caller không thể rollback A — transaction bị chia vụn.",
      "## Exception không tự rollback toàn bộ",
      "Một statement lỗi được rollback ở mức statement. Những DML trước đó trong transaction vẫn pending cho tới khi caller COMMIT hoặc ROLLBACK.",
      "## SAVEPOINT",
      "`SAVEPOINT ten;` và `ROLLBACK TO ten;` cho phép hoàn tác một phần mà vẫn giữ phần trước savepoint.",
      "## DDL",
      "CREATE/ALTER/DROP gây implicit commit trước và sau DDL trong Oracle. Không trộn DDL tùy tiện vào workflow transaction.",
      "## Autonomous transaction",
      "`PRAGMA AUTONOMOUS_TRANSACTION` tạo transaction độc lập, thường dùng cho audit logging. Nó phải tự COMMIT/ROLLBACK và cần dùng rất thận trọng.",
      "> Quy tắc mặc định tốt: không COMMIT trong procedure business dùng lại; ghi rõ nếu procedure cố ý sở hữu transaction.",
    ],
    keyTerms: [
      {
        term: "Transaction boundary",
        definition: "Điểm bắt đầu và kết thúc đơn vị commit/rollback.",
      },
      {
        term: "SAVEPOINT",
        definition: "Mốc cho phép rollback một phần transaction.",
      },
      {
        term: "Autonomous transaction",
        definition: "Transaction độc lập với transaction của caller.",
      },
    ],
    tables: ["employees"],
    initialQuery:
      "CREATE OR REPLACE PROCEDURE raise_department_salary_tx (\n  p_department IN VARCHAR2,\n  p_amount     IN NUMBER,\n  p_updated    OUT NUMBER\n) AS\nBEGIN\n  UPDATE employees\n  SET salary = salary + p_amount\n  WHERE department = p_department;\n\n  p_updated := SQL%ROWCOUNT;\n  -- Không COMMIT ở đây: caller sở hữu transaction.\nEND;\n/\n\nSAVEPOINT before_raise;\n\nDECLARE\n  v_updated NUMBER;\nBEGIN\n  raise_department_salary_tx(\n    p_department => 'Sales',\n    p_amount     => 100,\n    p_updated    => v_updated\n  );\n  DBMS_OUTPUT.PUT_LINE('Pending rows: ' || v_updated);\nEND;\n/\n\nROLLBACK TO before_raise;",
    visualization: { type: "procedure", oracleVariant: "transaction" },
    steps: [
      {
        clause: "PROCEDURE",
        title: "Procedure không tự COMMIT",
        description:
          "DML của procedure tham gia transaction đang có của caller.",
      },
      {
        clause: "BEGIN",
        title: "Caller tạo SAVEPOINT",
        description:
          "before_raise đánh dấu trạng thái trước khi gọi procedure.",
      },
      {
        clause: "UPDATE",
        title: "Salary thay đổi ở trạng thái pending",
        description:
          "Ba nhân viên Sales được tăng 100 nhưng thay đổi chưa bền vững.",
      },
      {
        clause: "ROLLBACK",
        title: "Caller rollback về SAVEPOINT",
        description:
          "Mọi thay đổi của lần gọi bị hoàn tác mà caller vẫn giữ quyền điều phối.",
      },
    ],
    exercises: [
      {
        id: "ora-tx-1",
        prompt:
          "Tạo procedure update_order_total(p_order_id IN NUMBER, p_total IN NUMBER) chỉ UPDATE orders, không COMMIT/ROLLBACK.",
        starterQuery:
          "CREATE OR REPLACE PROCEDURE update_order_total (\n  p_order_id IN NUMBER,\n  p_total IN NUMBER\n) AS\nBEGIN\n  -- UPDATE, không quản lý transaction\nEND;\n/",
        solutionQuery:
          "CREATE OR REPLACE PROCEDURE update_order_total (\n  p_order_id IN NUMBER,\n  p_total IN NUMBER\n) AS\nBEGIN\n  UPDATE orders\n  SET total = p_total\n  WHERE id = p_order_id;\nEND;\n/",
        hint: "Chỉ viết UPDATE; để caller COMMIT hoặc ROLLBACK.",
        validation: {
          mode: "structure",
          requirements: [
            {
              label: "procedure update_order_total",
              pattern:
                "\\bcreate\\s+or\\s+replace\\s+procedure\\s+update_order_total\\b",
            },
            {
              label: "UPDATE orders",
              pattern: "\\bupdate\\s+orders\\b",
            },
            {
              label: "SET total = p_total",
              pattern: "\\bset\\s+total\\s*=\\s*p_total\\b",
            },
            {
              label: "WHERE id = p_order_id",
              pattern: "\\bwhere\\s+id\\s*=\\s*p_order_id\\b",
            },
          ],
          forbidden: [
            { label: "COMMIT trong procedure", pattern: "\\bcommit\\b" },
            { label: "ROLLBACK trong procedure", pattern: "\\brollback\\b" },
          ],
        },
      },
      {
        id: "ora-tx-2",
        prompt:
          "Viết caller: SAVEPOINT before_update, gọi update_order_total cho order 1 total 99, rồi ROLLBACK TO before_update.",
        starterQuery:
          "SAVEPOINT before_update;\n\nBEGIN\n  -- Gọi procedure\nEND;\n/\n\n-- Rollback về savepoint",
        solutionQuery:
          "SAVEPOINT before_update;\n\nBEGIN\n  update_order_total(\n    p_order_id => 1,\n    p_total => 99\n  );\nEND;\n/\n\nROLLBACK TO before_update;",
        hint: "SAVEPOINT và ROLLBACK TO nằm ở caller, ngoài procedure.",
        validation: {
          mode: "structure",
          requirements: [
            {
              label: "SAVEPOINT before_update",
              pattern: "\\bsavepoint\\s+before_update\\b",
            },
            {
              label: "gọi update_order_total",
              pattern: "\\bupdate_order_total\\s*\\(",
            },
            {
              label: "order id 1",
              pattern: "\\bp_order_id\\s*=>\\s*1\\b",
            },
            {
              label: "total 99",
              pattern: "\\bp_total\\s*=>\\s*99\\b",
            },
            {
              label: "ROLLBACK TO before_update",
              pattern: "\\brollback\\s+to\\s+before_update\\b",
            },
          ],
        },
      },
    ],
    estimatedMinutes: 14,
  },
  {
    id: "oracle-implicit-cursor",
    title: "Implicit cursor và SQL cursor attributes",
    level: "advanced",
    dialect: "oracle",
    category: "Oracle Cursor",
    summary:
      "Đọc ROWCOUNT, FOUND, NOTFOUND sau INSERT/UPDATE/DELETE mà không cần khai báo cursor.",
    description:
      "Oracle tự tạo implicit cursor tên SQL cho mỗi câu DML và SELECT INTO; các attributes của nó cho biết câu lệnh gần nhất đã làm gì.",
    theory: [
      "## Implicit cursor",
      "Khi chạy INSERT, UPDATE, DELETE, MERGE hoặc SELECT INTO, Oracle tự mở và đóng cursor nội bộ. Lập trình viên không viết `OPEN`, `FETCH`, `CLOSE`.",
      "Cursor này được truy cập qua tên `SQL`.",
      "## Bốn attributes quan trọng",
      "- `SQL%ROWCOUNT`: số dòng DML gần nhất tác động.",
      "- `SQL%FOUND`: TRUE nếu DML tác động ít nhất một dòng.",
      "- `SQL%NOTFOUND`: TRUE nếu không có dòng nào bị tác động.",
      "- `SQL%ISOPEN`: luôn FALSE vì Oracle tự đóng implicit cursor sau statement.",
      "Phải đọc attributes ngay sau statement cần đo. Một statement SQL khác chạy sau đó sẽ thay trạng thái cursor SQL.",
      "## Với SELECT INTO",
      "SELECT INTO thành công thì ROWCOUNT = 1. Nếu 0 dòng hoặc nhiều dòng, exception xảy ra trước khi code phía sau đọc attributes.",
      "> SQL%ROWCOUNT tốt để trả affected rows cho API và phát hiện optimistic update không tìm thấy record.",
    ],
    keyTerms: [
      {
        term: "Implicit cursor",
        definition: "Cursor Oracle tự quản lý cho DML và SELECT INTO.",
      },
      {
        term: "SQL%ROWCOUNT",
        definition: "Số dòng bị tác động bởi statement SQL gần nhất.",
      },
      {
        term: "SQL%FOUND",
        definition: "TRUE nếu statement gần nhất tác động ít nhất một dòng.",
      },
    ],
    tables: ["orders"],
    initialQuery:
      "CREATE OR REPLACE PROCEDURE delete_small_orders (\n  p_threshold IN NUMBER,\n  p_deleted   OUT NUMBER\n) AS\nBEGIN\n  DELETE FROM orders\n  WHERE total < p_threshold;\n\n  p_deleted := SQL%ROWCOUNT;\n\n  IF SQL%FOUND THEN\n    DBMS_OUTPUT.PUT_LINE('Đã xóa ' || SQL%ROWCOUNT || ' đơn');\n  END IF;\nEND;\n/\n\nDECLARE\n  v_deleted NUMBER;\nBEGIN\n  delete_small_orders(\n    p_threshold => 50,\n    p_deleted   => v_deleted\n  );\n  DBMS_OUTPUT.PUT_LINE('OUT = ' || v_deleted);\nEND;\n/",
    visualization: { type: "cursor", oracleCursorVariant: "implicit" },
    steps: [
      {
        clause: "DELETE",
        title: "DELETE tạo implicit cursor SQL",
        description:
          "Oracle tự theo dõi các orders có total nhỏ hơn 50 mà không cần khai báo cursor.",
      },
      {
        clause: "OUT",
        title: "Đọc SQL cursor attributes",
        description:
          "ROWCOUNT trả số đơn bị xóa; FOUND/NOTFOUND mô tả statement vừa chạy.",
      },
    ],
    exercises: [
      {
        id: "ora-implicit-1",
        prompt:
          "Tạo procedure mark_hanoi_adults(p_count OUT NUMBER): UPDATE users SET age = age + 1 WHERE city = 'Hanoi' AND age >= 18, rồi gán SQL%ROWCOUNT vào p_count.",
        starterQuery:
          "CREATE OR REPLACE PROCEDURE mark_hanoi_adults (\n  p_count OUT NUMBER\n) AS\nBEGIN\n  -- UPDATE và đọc implicit cursor\nEND;\n/",
        solutionQuery:
          "CREATE OR REPLACE PROCEDURE mark_hanoi_adults (\n  p_count OUT NUMBER\n) AS\nBEGIN\n  UPDATE users\n  SET age = age + 1\n  WHERE city = 'Hanoi' AND age >= 18;\n\n  p_count := SQL%ROWCOUNT;\nEND;\n/",
        hint: "Đọc SQL%ROWCOUNT ngay sau UPDATE.",
        validation: {
          mode: "structure",
          requirements: [
            {
              label: "procedure mark_hanoi_adults",
              pattern:
                "\\bcreate\\s+or\\s+replace\\s+procedure\\s+mark_hanoi_adults\\b",
            },
            {
              label: "p_count OUT NUMBER",
              pattern: "\\bp_count\\s+out\\s+number\\b",
            },
            { label: "UPDATE users", pattern: "\\bupdate\\s+users\\b" },
            {
              label: "tăng age",
              pattern: "\\bset\\s+age\\s*=\\s*age\\s*\\+\\s*1\\b",
            },
            {
              label: "lọc Hanoi adults",
              pattern:
                "\\bwhere\\s+city\\s*=\\s*'hanoi'\\s+and\\s+age\\s*>=\\s*18\\b",
            },
            {
              label: "gán SQL%ROWCOUNT",
              pattern: "\\bp_count\\s*:=\\s*sql%rowcount\\b",
            },
          ],
        },
      },
      {
        id: "ora-implicit-2",
        prompt:
          "Sau một DELETE, nếu SQL%NOTFOUND thì phát lỗi -20030 'Không có dòng để xóa'.",
        starterQuery:
          "BEGIN\n  DELETE FROM orders WHERE id = 999;\n  -- Kiểm tra implicit cursor\nEND;\n/",
        solutionQuery:
          "BEGIN\n  DELETE FROM orders WHERE id = 999;\n\n  IF SQL%NOTFOUND THEN\n    RAISE_APPLICATION_ERROR(-20030, 'Không có dòng để xóa');\n  END IF;\nEND;\n/",
        hint: "Dùng IF SQL%NOTFOUND THEN ngay sau DELETE.",
        validation: {
          mode: "structure",
          requirements: [
            {
              label: "DELETE statement",
              pattern: "\\bdelete\\s+from\\s+orders\\b",
            },
            {
              label: "IF SQL%NOTFOUND",
              pattern: "\\bif\\s+sql%notfound\\s+then\\b",
            },
            {
              label: "mã lỗi -20030",
              pattern:
                "\\braise_application_error\\s*\\(\\s*-20030\\s*,",
            },
          ],
        },
      },
    ],
    estimatedMinutes: 11,
  },
  {
    id: "oracle-explicit-cursor",
    title: "Explicit cursor — OPEN / FETCH / CLOSE",
    level: "advanced",
    dialect: "oracle",
    category: "Oracle Cursor",
    summary:
      "Tự quản lý result set nhiều dòng và điều khiển con trỏ bằng lifecycle đầy đủ.",
    description:
      "Explicit cursor cho phép PL/SQL đọc một query nhiều dòng từng record một, nhưng lập trình viên phải quản lý đúng OPEN, FETCH và CLOSE.",
    theory: [
      "## Lifecycle",
      "1. `CURSOR c IS SELECT ...` khai báo query nhưng chưa chạy.",
      "2. `OPEN c` chạy query và tạo active result set.",
      "3. `FETCH c INTO ...` đọc dòng hiện tại rồi tiến con trỏ.",
      "4. `EXIT WHEN c%NOTFOUND` dừng sau lần FETCH không còn dòng.",
      "5. `CLOSE c` giải phóng cursor.",
      "## Cursor attributes",
      "- `c%ISOPEN`: cursor đang mở hay không.",
      "- `c%ROWCOUNT`: số lần FETCH thành công.",
      "- `c%FOUND` / `c%NOTFOUND`: trạng thái của FETCH gần nhất.",
      "Phải FETCH trước rồi mới kiểm tra `%NOTFOUND`. Nếu kiểm tra trước FETCH, loop có thể xử lý sai hoặc chạy vô hạn.",
      "## Khi nào dùng?",
      "Dùng explicit cursor khi cần kiểm soát lifecycle hoặc fetch theo batch. Nếu chỉ loop đơn giản, cursor FOR LOOP ngắn và an toàn hơn.",
      "> Luôn CLOSE cursor ở mọi đường đi, kể cả khi exception. Cursor FOR LOOP giúp tránh phần cleanup thủ công này.",
    ],
    keyTerms: [
      {
        term: "Active set",
        definition: "Tập dòng được query của cursor tạo ra sau OPEN.",
      },
      {
        term: "FETCH",
        definition: "Đọc dòng hiện tại vào biến và di chuyển cursor.",
      },
      {
        term: "Cursor attribute",
        definition: "Trạng thái như ISOPEN, ROWCOUNT, FOUND, NOTFOUND.",
      },
    ],
    tables: ["employees"],
    initialQuery:
      "CREATE OR REPLACE PROCEDURE print_department_employees (\n  p_department IN VARCHAR2\n) AS\n  CURSOR c_employees IS\n    SELECT id, name, salary\n    FROM employees\n    WHERE department = p_department\n    ORDER BY id;\n\n  v_id employees.id%TYPE;\n  v_name employees.name%TYPE;\n  v_salary employees.salary%TYPE;\nBEGIN\n  OPEN c_employees;\n  LOOP\n    FETCH c_employees INTO v_id, v_name, v_salary;\n    EXIT WHEN c_employees%NOTFOUND;\n\n    DBMS_OUTPUT.PUT_LINE(v_name || ': ' || v_salary);\n  END LOOP;\n  CLOSE c_employees;\nEND;\n/\n\nBEGIN\n  print_department_employees(\n    p_department => 'Engineering'\n  );\nEND;\n/",
    visualization: { type: "cursor", oracleCursorVariant: "explicit" },
    steps: [
      {
        clause: "CURSOR",
        title: "Khai báo cursor c_employees",
        description:
          "Query được định nghĩa nhưng chưa chạy và chưa giữ tài nguyên.",
      },
      {
        clause: "OPEN",
        title: "OPEN tạo active set",
        description:
          "Oracle chạy query cho Engineering và đặt con trỏ trước dòng đầu.",
      },
      {
        clause: "FETCH",
        title: "FETCH dòng đầu",
        description:
          "id, name và salary của record hiện tại được chép vào ba biến.",
      },
      {
        clause: "LOOP",
        title: "Lặp tới c_employees%NOTFOUND",
        description:
          "Mỗi vòng FETCH thêm một dòng; ROWCOUNT tăng theo số fetch thành công.",
      },
      {
        clause: "CLOSE",
        title: "CLOSE giải phóng cursor",
        description:
          "Active set không còn truy cập được và ISOPEN trở thành FALSE.",
      },
    ],
    exercises: [
      {
        id: "ora-cursor-1",
        prompt:
          "Khai báo cursor c_hanoi chọn id, name từ users WHERE city = 'Hanoi'; OPEN, FETCH vào v_id/v_name rồi CLOSE.",
        starterQuery:
          "DECLARE\n  -- Cursor và biến\nBEGIN\n  -- OPEN, FETCH, CLOSE\nEND;\n/",
        solutionQuery:
          "DECLARE\n  CURSOR c_hanoi IS\n    SELECT id, name FROM users WHERE city = 'Hanoi';\n  v_id users.id%TYPE;\n  v_name users.name%TYPE;\nBEGIN\n  OPEN c_hanoi;\n  FETCH c_hanoi INTO v_id, v_name;\n  CLOSE c_hanoi;\nEND;\n/",
        hint: "Lifecycle tối thiểu là OPEN → FETCH INTO → CLOSE.",
        validation: {
          mode: "structure",
          requirements: [
            {
              label: "CURSOR c_hanoi",
              pattern: "\\bcursor\\s+c_hanoi\\s+is\\b",
            },
            {
              label: "query users Hanoi",
              pattern:
                "\\bselect\\s+id\\s*,\\s*name\\s+from\\s+users\\s+where\\s+city\\s*=\\s*'hanoi'",
            },
            { label: "OPEN c_hanoi", pattern: "\\bopen\\s+c_hanoi\\s*;" },
            {
              label: "FETCH INTO v_id, v_name",
              pattern:
                "\\bfetch\\s+c_hanoi\\s+into\\s+v_id\\s*,\\s*v_name\\s*;",
            },
            { label: "CLOSE c_hanoi", pattern: "\\bclose\\s+c_hanoi\\s*;" },
          ],
        },
      },
      {
        id: "ora-cursor-2",
        prompt:
          "Hoàn thiện loop explicit cursor: FETCH c_orders INTO v_id, EXIT WHEN c_orders%NOTFOUND và tăng v_count sau mỗi dòng.",
        starterQuery:
          "DECLARE\n  CURSOR c_orders IS SELECT id FROM orders ORDER BY id;\n  v_id NUMBER;\n  v_count NUMBER := 0;\nBEGIN\n  OPEN c_orders;\n  LOOP\n    -- FETCH, EXIT, đếm\n  END LOOP;\n  CLOSE c_orders;\nEND;\n/",
        solutionQuery:
          "DECLARE\n  CURSOR c_orders IS SELECT id FROM orders ORDER BY id;\n  v_id NUMBER;\n  v_count NUMBER := 0;\nBEGIN\n  OPEN c_orders;\n  LOOP\n    FETCH c_orders INTO v_id;\n    EXIT WHEN c_orders%NOTFOUND;\n    v_count := v_count + 1;\n  END LOOP;\n  CLOSE c_orders;\nEND;\n/",
        hint: "EXIT WHEN phải đứng ngay sau FETCH.",
        validation: {
          mode: "structure",
          requirements: [
            {
              label: "FETCH c_orders",
              pattern: "\\bfetch\\s+c_orders\\s+into\\s+v_id\\s*;",
            },
            {
              label: "EXIT WHEN %NOTFOUND",
              pattern:
                "\\bexit\\s+when\\s+c_orders%notfound\\s*;",
            },
            {
              label: "tăng v_count",
              pattern: "\\bv_count\\s*:=\\s*v_count\\s*\\+\\s*1\\b",
            },
            { label: "CLOSE c_orders", pattern: "\\bclose\\s+c_orders\\s*;" },
          ],
        },
      },
    ],
    estimatedMinutes: 15,
  },
  {
    id: "oracle-parameterized-cursor",
    title: "Parameterized cursor và cursor FOR LOOP",
    level: "advanced",
    dialect: "oracle",
    category: "Oracle Cursor",
    summary:
      "Tái sử dụng cursor với tham số và để FOR LOOP tự OPEN/FETCH/CLOSE.",
    description:
      "Parameterized cursor biến query cursor thành template có input, còn cursor FOR LOOP loại bỏ phần lifecycle boilerplate.",
    theory: [
      "## Cursor có tham số",
      "`CURSOR c_department(p_dept VARCHAR2) IS SELECT ... WHERE department = p_dept;`.",
      "Tham số cursor chỉ dùng lúc OPEN hoặc trong cursor FOR LOOP và có scope bên trong query cursor.",
      "Có thể mở cùng cursor nhiều lần với giá trị khác nhau, miễn đã CLOSE lần trước.",
      "## Cursor FOR LOOP",
      "`FOR r IN c_department('Sales') LOOP ... END LOOP;` tự động:",
      "- OPEN cursor.",
      "- FETCH từng dòng vào record `r` có field theo tên cột.",
      "- EXIT khi hết dòng.",
      "- CLOSE cursor kể cả khi loop kết thúc hoặc exception truyền ra.",
      "Không cần khai báo biến cho từng cột; dùng `r.name`, `r.salary`.",
      "## Query FOR LOOP",
      "Có thể bỏ declaration: `FOR r IN (SELECT ... ) LOOP`. Cách này hợp với query chỉ dùng một lần.",
      "> Ưu tiên cursor FOR LOOP cho việc duyệt toàn bộ result set. Dùng explicit OPEN/FETCH khi cần fetch có kiểm soát hoặc truyền handle.",
    ],
    keyTerms: [
      {
        term: "Parameterized cursor",
        definition: "Cursor declaration nhận input khi được mở.",
      },
      {
        term: "Cursor FOR LOOP",
        definition: "Loop tự quản lý OPEN, FETCH, EXIT và CLOSE.",
      },
      {
        term: "Cursor record",
        definition: "Record tự sinh với field tương ứng các cột SELECT.",
      },
    ],
    tables: ["employees"],
    initialQuery:
      "CREATE OR REPLACE PROCEDURE print_department_with_loop (\n  p_department IN VARCHAR2\n) AS\n  CURSOR c_department(p_dept VARCHAR2) IS\n    SELECT id, name, salary\n    FROM employees\n    WHERE department = p_dept\n    ORDER BY salary DESC;\nBEGIN\n  FOR r_employee IN c_department(p_department) LOOP\n    DBMS_OUTPUT.PUT_LINE(\n      r_employee.name || ': ' || r_employee.salary\n    );\n  END LOOP;\nEND;\n/\n\nBEGIN\n  print_department_with_loop(\n    p_department => 'Finance'\n  );\nEND;\n/",
    visualization: { type: "cursor", oracleCursorVariant: "for-loop" },
    steps: [
      {
        clause: "CURSOR",
        title: "Khai báo cursor nhận p_dept",
        description:
          "Cùng một cursor có thể chạy cho Finance, Sales hoặc Engineering.",
      },
      {
        clause: "OPEN",
        title: "FOR LOOP tự OPEN",
        description:
          "Oracle truyền Finance vào p_dept và tạo active set đã sắp lương.",
      },
      {
        clause: "LOOP",
        title: "Mỗi vòng có một cursor record",
        description:
          "r_employee tự có id, name, salary; không cần FETCH INTO thủ công.",
      },
      {
        clause: "CLOSE",
        title: "FOR LOOP tự CLOSE",
        description:
          "Khi hết dòng, Oracle đóng cursor kể cả không có câu CLOSE trong source.",
      },
    ],
    exercises: [
      {
        id: "ora-param-cursor-1",
        prompt:
          "Khai báo cursor c_city(p_city VARCHAR2) chọn name, age từ users theo city; dùng FOR r IN c_city('Hanoi') LOOP để in r.name.",
        starterQuery:
          "DECLARE\n  -- Parameterized cursor\nBEGIN\n  -- Cursor FOR LOOP\nEND;\n/",
        solutionQuery:
          "DECLARE\n  CURSOR c_city(p_city VARCHAR2) IS\n    SELECT name, age FROM users WHERE city = p_city;\nBEGIN\n  FOR r IN c_city('Hanoi') LOOP\n    DBMS_OUTPUT.PUT_LINE(r.name);\n  END LOOP;\nEND;\n/",
        hint: "Truyền 'Hanoi' ngay trong c_city('Hanoi').",
        validation: {
          mode: "structure",
          requirements: [
            {
              label: "cursor c_city có parameter",
              pattern:
                "\\bcursor\\s+c_city\\s*\\(\\s*p_city\\s+varchar2\\s*\\)\\s+is\\b",
            },
            {
              label: "lọc city bằng cursor parameter",
              pattern: "\\bwhere\\s+city\\s*=\\s*p_city\\b",
            },
            {
              label: "FOR r IN c_city('Hanoi')",
              pattern:
                "\\bfor\\s+r\\s+in\\s+c_city\\s*\\(\\s*'hanoi'\\s*\\)\\s+loop\\b",
            },
            {
              label: "in r.name",
              pattern:
                "\\bdbms_output\\.put_line\\s*\\(\\s*r\\.name\\s*\\)",
            },
          ],
          forbidden: [
            { label: "OPEN thủ công", pattern: "\\bopen\\s+c_city\\b" },
            { label: "CLOSE thủ công", pattern: "\\bclose\\s+c_city\\b" },
          ],
        },
      },
      {
        id: "ora-param-cursor-2",
        prompt:
          "Dùng query FOR LOOP trực tiếp để duyệt orders total >= 100 và cộng vào v_sum. Không khai báo cursor riêng.",
        starterQuery:
          "DECLARE\n  v_sum NUMBER := 0;\nBEGIN\n  -- FOR r IN (SELECT ...)\nEND;\n/",
        solutionQuery:
          "DECLARE\n  v_sum NUMBER := 0;\nBEGIN\n  FOR r IN (SELECT total FROM orders WHERE total >= 100) LOOP\n    v_sum := v_sum + r.total;\n  END LOOP;\nEND;\n/",
        hint: "Đặt SELECT trong ngoặc ngay sau IN.",
        validation: {
          mode: "structure",
          requirements: [
            {
              label: "query FOR LOOP",
              pattern:
                "\\bfor\\s+r\\s+in\\s*\\(\\s*select\\s+total\\s+from\\s+orders",
            },
            {
              label: "lọc total >= 100",
              pattern: "\\bwhere\\s+total\\s*>=\\s*100\\b",
            },
            {
              label: "cộng r.total",
              pattern: "\\bv_sum\\s*:=\\s*v_sum\\s*\\+\\s*r\\.total\\b",
            },
          ],
          forbidden: [
            { label: "CURSOR declaration", pattern: "\\bcursor\\s+" },
          ],
        },
      },
    ],
    estimatedMinutes: 13,
  },
  {
    id: "oracle-cursor-for-update",
    title: "Cursor FOR UPDATE và WHERE CURRENT OF",
    level: "advanced",
    dialect: "oracle",
    category: "Oracle Cursor",
    summary:
      "Khóa các dòng cursor, cập nhật đúng dòng hiện tại và quản lý lock bằng transaction.",
    description:
      "FOR UPDATE biến cursor thành luồng đọc-để-sửa: Oracle khóa row trong active set và WHERE CURRENT OF cập nhật row mà cursor đang đứng.",
    theory: [
      "## FOR UPDATE",
      "Thêm `FOR UPDATE OF salary` vào query cursor để khóa các dòng sẽ sửa. Lock được giữ tới COMMIT hoặc ROLLBACK.",
      "`NOWAIT` báo lỗi ngay nếu row đã bị session khác khóa; `SKIP LOCKED` bỏ qua row đang khóa, hữu ích cho job queue.",
      "## WHERE CURRENT OF",
      "Sau FETCH, `UPDATE employees SET ... WHERE CURRENT OF c_emp` cập nhật chính row hiện tại mà không lặp điều kiện khóa chính.",
      "Cursor phải được khai báo FOR UPDATE và vẫn đang OPEN.",
      "## Rủi ro",
      "- Giữ cursor/transaction quá lâu gây blocking.",
      "- COMMIT bên trong loop làm mất locks và có thể khiến fetch tiếp theo lỗi.",
      "- Thứ tự lock khác nhau giữa sessions có thể gây deadlock.",
      "Nếu có thể làm bằng một câu UPDATE set-based thì thường nhanh và đơn giản hơn cursor.",
      "> Dùng cursor FOR UPDATE khi logic thật sự phụ thuộc từng row; không dùng chỉ để thay một UPDATE thông thường.",
    ],
    keyTerms: [
      {
        term: "FOR UPDATE",
        definition: "Khóa row của cursor để chuẩn bị cập nhật.",
      },
      {
        term: "WHERE CURRENT OF",
        definition: "DML trên row hiện tại của cursor FOR UPDATE.",
      },
      {
        term: "SKIP LOCKED",
        definition: "Bỏ qua row đang bị session khác khóa.",
      },
    ],
    tables: ["employees"],
    initialQuery:
      "CREATE OR REPLACE PROCEDURE raise_department_with_cursor (\n  p_department IN VARCHAR2,\n  p_amount     IN NUMBER,\n  p_updated    OUT NUMBER\n) AS\n  CURSOR c_emp IS\n    SELECT id, salary\n    FROM employees\n    WHERE department = p_department\n    FOR UPDATE OF salary;\n\n  v_id employees.id%TYPE;\n  v_salary employees.salary%TYPE;\nBEGIN\n  p_updated := 0;\n  OPEN c_emp;\n  LOOP\n    FETCH c_emp INTO v_id, v_salary;\n    EXIT WHEN c_emp%NOTFOUND;\n\n    UPDATE employees\n    SET salary = v_salary + p_amount\n    WHERE CURRENT OF c_emp;\n\n    p_updated := p_updated + 1;\n  END LOOP;\n  CLOSE c_emp;\nEND;\n/\n\nDECLARE\n  v_updated NUMBER;\nBEGIN\n  raise_department_with_cursor(\n    p_department => 'Sales',\n    p_amount     => 50,\n    p_updated    => v_updated\n  );\n  COMMIT;\nEND;\n/",
    visualization: { type: "cursor", oracleCursorVariant: "for-update" },
    steps: [
      {
        clause: "CURSOR",
        title: "Cursor chọn các rows cần sửa",
        description: "Query giới hạn active set vào nhân viên Sales.",
      },
      {
        clause: "FOR UPDATE",
        title: "OPEN giữ row locks",
        description:
          "Các dòng trong active set bị khóa cho tới transaction kết thúc.",
      },
      {
        clause: "FETCH",
        title: "FETCH current row",
        description: "Con trỏ đứng trên một employee cụ thể.",
      },
      {
        clause: "CURRENT OF",
        title: "UPDATE WHERE CURRENT OF",
        description:
          "Oracle cập nhật đúng row hiện tại và tiến tới row tiếp theo.",
      },
      {
        clause: "COMMIT",
        title: "Caller COMMIT và nhả lock",
        description: "Mọi salary mới trở nên bền vững; row locks được giải phóng.",
      },
    ],
    exercises: [
      {
        id: "ora-for-update-1",
        prompt:
          "Khai báo cursor c_orders chọn id,total từ orders WHERE total < 50 FOR UPDATE OF total; OPEN và FETCH vào v_id/v_total.",
        starterQuery:
          "DECLARE\n  -- Cursor FOR UPDATE và biến\nBEGIN\n  -- OPEN/FETCH\nEND;\n/",
        solutionQuery:
          "DECLARE\n  CURSOR c_orders IS\n    SELECT id, total\n    FROM orders\n    WHERE total < 50\n    FOR UPDATE OF total;\n  v_id orders.id%TYPE;\n  v_total orders.total%TYPE;\nBEGIN\n  OPEN c_orders;\n  FETCH c_orders INTO v_id, v_total;\n  CLOSE c_orders;\nEND;\n/",
        hint: "FOR UPDATE OF total đặt cuối query cursor.",
        validation: {
          mode: "structure",
          requirements: [
            {
              label: "CURSOR c_orders",
              pattern: "\\bcursor\\s+c_orders\\s+is\\b",
            },
            {
              label: "FOR UPDATE OF total",
              pattern: "\\bfor\\s+update\\s+of\\s+total\\b",
            },
            { label: "OPEN c_orders", pattern: "\\bopen\\s+c_orders\\s*;" },
            {
              label: "FETCH id,total",
              pattern:
                "\\bfetch\\s+c_orders\\s+into\\s+v_id\\s*,\\s*v_total\\s*;",
            },
          ],
        },
      },
      {
        id: "ora-for-update-2",
        prompt:
          "Trong loop của c_orders FOR UPDATE, tăng total 5 bằng UPDATE orders ... WHERE CURRENT OF c_orders. Không COMMIT bên trong loop.",
        starterQuery:
          "LOOP\n  FETCH c_orders INTO v_id, v_total;\n  EXIT WHEN c_orders%NOTFOUND;\n  -- UPDATE current row\nEND LOOP;",
        solutionQuery:
          "LOOP\n  FETCH c_orders INTO v_id, v_total;\n  EXIT WHEN c_orders%NOTFOUND;\n\n  UPDATE orders\n  SET total = v_total + 5\n  WHERE CURRENT OF c_orders;\nEND LOOP;",
        hint: "WHERE CURRENT OF dùng tên cursor, không dùng id.",
        validation: {
          mode: "structure",
          requirements: [
            { label: "UPDATE orders", pattern: "\\bupdate\\s+orders\\b" },
            {
              label: "tăng total 5",
              pattern: "\\bset\\s+total\\s*=\\s*v_total\\s*\\+\\s*5\\b",
            },
            {
              label: "WHERE CURRENT OF c_orders",
              pattern:
                "\\bwhere\\s+current\\s+of\\s+c_orders\\s*;",
            },
          ],
          forbidden: [
            { label: "COMMIT trong cursor loop", pattern: "\\bcommit\\b" },
          ],
        },
      },
    ],
    estimatedMinutes: 15,
  },
  {
    id: "oracle-sys-refcursor",
    title: "SYS_REFCURSOR — trả result set cho caller",
    level: "advanced",
    dialect: "oracle",
    category: "Oracle Cursor",
    summary:
      "Mở cursor động trong procedure, trả handle qua OUT và để caller FETCH/CLOSE.",
    description:
      "SYS_REFCURSOR là weak ref cursor thường dùng để trả một result set nhiều dòng từ PL/SQL sang application hoặc block gọi.",
    theory: [
      "## Ref cursor khác explicit cursor",
      "Explicit cursor gắn với query cố định trong declaration. Ref cursor là biến/handle có thể được `OPEN ... FOR` một query lúc runtime.",
      "`SYS_REFCURSOR` là weak type: nhiều query có shape khác nhau có thể gắn vào cùng kiểu handle.",
      "## Ownership",
      "Procedure mở cursor và trả handle qua OUT. Caller sở hữu handle sau đó: FETCH cho tới `%NOTFOUND` và CLOSE.",
      "Nếu caller quên CLOSE, session giữ tài nguyên và có thể chạm giới hạn `OPEN_CURSORS`.",
      "## Static và dynamic OPEN FOR",
      "- Static: `OPEN p_result FOR SELECT ... WHERE city = p_city;`.",
      "- Dynamic: `OPEN p_result FOR v_sql USING p_value;` với bind variables.",
      "Không nối trực tiếp input vào dynamic SQL; luôn dùng bind để tránh SQL Injection.",
      "## Application integration",
      "Oracle drivers thường map SYS_REFCURSOR thành ResultSet/DataReader. Transaction và connection phải còn sống trong lúc consumer đọc.",
      "> Ref cursor phù hợp khi API database cần trả nhiều dòng. Với một scalar, OUT parameter hoặc function đơn giản hơn.",
    ],
    keyTerms: [
      {
        term: "REF CURSOR",
        definition: "Biến handle trỏ tới một active result set.",
      },
      {
        term: "SYS_REFCURSOR",
        definition: "Weak ref cursor type có sẵn của Oracle.",
      },
      {
        term: "OPEN FOR",
        definition: "Gắn một query runtime vào ref cursor variable.",
      },
      {
        term: "OPEN_CURSORS",
        definition: "Giới hạn số cursor mở đồng thời trong một session.",
      },
    ],
    tables: ["users"],
    initialQuery:
      "CREATE OR REPLACE PROCEDURE open_users_by_city (\n  p_city   IN VARCHAR2,\n  p_result OUT SYS_REFCURSOR\n) AS\nBEGIN\n  OPEN p_result FOR\n    SELECT id, name, age, city\n    FROM users\n    WHERE city = p_city\n    ORDER BY id;\nEND;\n/\n\nDECLARE\n  v_result SYS_REFCURSOR;\n  v_id users.id%TYPE;\n  v_name users.name%TYPE;\n  v_age users.age%TYPE;\n  v_city users.city%TYPE;\nBEGIN\n  open_users_by_city(\n    p_city   => 'Hanoi',\n    p_result => v_result\n  );\n\n  LOOP\n    FETCH v_result INTO v_id, v_name, v_age, v_city;\n    EXIT WHEN v_result%NOTFOUND;\n    DBMS_OUTPUT.PUT_LINE(v_name || ' - ' || v_age);\n  END LOOP;\n\n  CLOSE v_result;\nEND;\n/",
    visualization: { type: "cursor", oracleCursorVariant: "ref-cursor" },
    steps: [
      {
        clause: "PROCEDURE",
        title: "OUT parameter mang cursor handle",
        description:
          "p_result không chứa row trực tiếp; nó sẽ trỏ tới active result set.",
      },
      {
        clause: "OPEN",
        title: "OPEN p_result FOR query",
        description:
          "Procedure chạy query users tại Hanoi và gắn result set vào handle.",
      },
      {
        clause: "OUT",
        title: "Caller nhận SYS_REFCURSOR",
        description:
          "Quyền đọc và trách nhiệm CLOSE được chuyển cho caller.",
      },
      {
        clause: "FETCH",
        title: "Caller FETCH nhiều dòng",
        description:
          "Consumer đọc từng user tới khi v_result%NOTFOUND.",
      },
      {
        clause: "CLOSE",
        title: "Caller CLOSE handle",
        description: "Active result set được giải phóng khỏi session.",
      },
    ],
    exercises: [
      {
        id: "ora-ref-1",
        prompt:
          "Tạo procedure open_big_orders(p_min_total IN NUMBER, p_result OUT SYS_REFCURSOR) mở p_result cho orders total >= p_min_total.",
        starterQuery:
          "CREATE OR REPLACE PROCEDURE open_big_orders (\n  p_min_total IN NUMBER,\n  p_result OUT SYS_REFCURSOR\n) AS\nBEGIN\n  -- OPEN FOR\nEND;\n/",
        solutionQuery:
          "CREATE OR REPLACE PROCEDURE open_big_orders (\n  p_min_total IN NUMBER,\n  p_result OUT SYS_REFCURSOR\n) AS\nBEGIN\n  OPEN p_result FOR\n    SELECT id, product, total\n    FROM orders\n    WHERE total >= p_min_total\n    ORDER BY id;\nEND;\n/",
        hint: "Dùng `OPEN p_result FOR SELECT ...`.",
        validation: {
          mode: "structure",
          requirements: [
            {
              label: "procedure open_big_orders",
              pattern:
                "\\bcreate\\s+or\\s+replace\\s+procedure\\s+open_big_orders\\b",
            },
            {
              label: "p_result OUT SYS_REFCURSOR",
              pattern: "\\bp_result\\s+out\\s+sys_refcursor\\b",
            },
            {
              label: "OPEN p_result FOR",
              pattern: "\\bopen\\s+p_result\\s+for\\b",
            },
            {
              label: "lọc p_min_total",
              pattern: "\\bwhere\\s+total\\s*>=\\s*p_min_total\\b",
            },
          ],
        },
      },
      {
        id: "ora-ref-2",
        prompt:
          "Viết caller nhận v_result từ open_big_orders(100), FETCH id/product/total trong LOOP, EXIT WHEN %NOTFOUND và CLOSE.",
        starterQuery:
          "DECLARE\n  v_result SYS_REFCURSOR;\n  v_id NUMBER;\n  v_product VARCHAR2(100);\n  v_total NUMBER;\nBEGIN\n  -- Gọi, FETCH loop, CLOSE\nEND;\n/",
        solutionQuery:
          "DECLARE\n  v_result SYS_REFCURSOR;\n  v_id NUMBER;\n  v_product VARCHAR2(100);\n  v_total NUMBER;\nBEGIN\n  open_big_orders(\n    p_min_total => 100,\n    p_result => v_result\n  );\n\n  LOOP\n    FETCH v_result INTO v_id, v_product, v_total;\n    EXIT WHEN v_result%NOTFOUND;\n  END LOOP;\n\n  CLOSE v_result;\nEND;\n/",
        hint: "Caller phải tự CLOSE SYS_REFCURSOR.",
        validation: {
          mode: "structure",
          requirements: [
            {
              label: "v_result SYS_REFCURSOR",
              pattern: "\\bv_result\\s+sys_refcursor\\b",
            },
            {
              label: "gọi open_big_orders",
              pattern: "\\bopen_big_orders\\s*\\(",
            },
            {
              label: "bind p_result",
              pattern: "\\bp_result\\s*=>\\s*v_result\\b",
            },
            {
              label: "FETCH ba biến",
              pattern:
                "\\bfetch\\s+v_result\\s+into\\s+v_id\\s*,\\s*v_product\\s*,\\s*v_total\\s*;",
            },
            {
              label: "EXIT WHEN v_result%NOTFOUND",
              pattern:
                "\\bexit\\s+when\\s+v_result%notfound\\s*;",
            },
            {
              label: "CLOSE v_result",
              pattern: "\\bclose\\s+v_result\\s*;",
            },
          ],
        },
      },
    ],
    estimatedMinutes: 15,
  },
  {
    id: "oracle-packages",
    title: "Package — tổ chức stored procedures",
    level: "advanced",
    dialect: "oracle",
    category: "Oracle PL/SQL",
    summary:
      "Đóng gói public API, implementation riêng tư và gọi procedure qua namespace.",
    description:
      "Trong hệ thống Oracle thật, procedure thường sống trong package thay vì đứng rời rạc; package tạo namespace và contract ổn định cho ứng dụng.",
    theory: [
      "## Package specification",
      "Spec công bố procedure, function, type và constant mà caller được dùng. Nó giống interface/public header.",
      "## Package body",
      "Body chứa implementation của public subprogram và có thể thêm private helper không xuất hiện trong spec.",
      "Caller gọi bằng namespace: `hr_salary_api.raise_department_salary(...)`.",
      "## Lợi ích",
      "- Gom API cùng domain vào một namespace.",
      "- Ẩn implementation và helper riêng tư.",
      "- Hỗ trợ overload nhiều procedure cùng tên nhưng signature khác.",
      "- Oracle có thể nạp package vào memory theo session để giảm chi phí parse.",
      "## Dependency",
      "Đổi package body thường ít ảnh hưởng caller hơn đổi specification. Thay public signature trong spec có thể invalidate dependent objects.",
      "## Quyền",
      "`GRANT EXECUTE ON hr_salary_api TO app_user;` cấp quyền cho toàn bộ public API của package.",
      "> Package state là theo session và có thể gây hành vi khó đoán với connection pool. Tránh lưu business state dài hạn trong package globals.",
    ],
    keyTerms: [
      {
        term: "Package spec",
        definition: "Public contract của package.",
      },
      {
        term: "Package body",
        definition: "Implementation và private members của package.",
      },
      {
        term: "Overloading",
        definition: "Nhiều subprogram cùng tên nhưng khác danh sách tham số.",
      },
      {
        term: "Invalidation",
        definition: "Dependent object cần compile lại sau thay đổi contract.",
      },
    ],
    tables: ["employees"],
    initialQuery:
      "CREATE OR REPLACE PACKAGE hr_salary_api AS\n  PROCEDURE raise_department_salary (\n    p_department IN VARCHAR2,\n    p_amount     IN NUMBER,\n    p_updated    OUT NUMBER\n  );\nEND hr_salary_api;\n/\n\nCREATE OR REPLACE PACKAGE BODY hr_salary_api AS\n  PROCEDURE validate_amount(p_amount IN NUMBER) AS\n  BEGIN\n    IF p_amount <= 0 THEN\n      RAISE_APPLICATION_ERROR(-20020, 'Amount phải lớn hơn 0');\n    END IF;\n  END validate_amount;\n\n  PROCEDURE raise_department_salary (\n    p_department IN VARCHAR2,\n    p_amount     IN NUMBER,\n    p_updated    OUT NUMBER\n  ) AS\n  BEGIN\n    validate_amount(p_amount);\n\n    UPDATE employees\n    SET salary = salary + p_amount\n    WHERE department = p_department;\n\n    p_updated := SQL%ROWCOUNT;\n  END raise_department_salary;\nEND hr_salary_api;\n/\n\nDECLARE\n  v_updated NUMBER;\nBEGIN\n  hr_salary_api.raise_department_salary(\n    p_department => 'Marketing',\n    p_amount     => 75,\n    p_updated    => v_updated\n  );\n  DBMS_OUTPUT.PUT_LINE('Updated: ' || v_updated);\nEND;\n/",
    visualization: { type: "procedure", oracleVariant: "package" },
    steps: [
      {
        clause: "CREATE",
        title: "Package spec công bố public API",
        description:
          "Caller thấy signature raise_department_salary nhưng không thấy implementation.",
      },
      {
        clause: "PROCEDURE",
        title: "Package body cài đặt logic",
        description:
          "Body chứa public procedure và private helper validate_amount.",
      },
      {
        clause: "BEGIN",
        title: "Caller dùng namespace package",
        description:
          "Lời gọi bắt đầu bằng hr_salary_api.raise_department_salary.",
      },
      {
        clause: "UPDATE",
        title: "Private implementation chạy DML",
        description:
          "Body tăng lương ba nhân viên Marketing mà caller không phụ thuộc code bên trong.",
      },
      {
        clause: "OUT",
        title: "Public API trả row count",
        description:
          "p_updated trả 3 qua cùng contract đã công bố trong spec.",
      },
    ],
    exercises: [
      {
        id: "ora-pkg-1",
        prompt:
          "Tạo package spec user_api công bố procedure get_user_city(p_user_id IN NUMBER, p_city OUT VARCHAR2).",
        starterQuery:
          "CREATE OR REPLACE PACKAGE user_api AS\n  -- Public procedure\nEND user_api;\n/",
        solutionQuery:
          "CREATE OR REPLACE PACKAGE user_api AS\n  PROCEDURE get_user_city(\n    p_user_id IN NUMBER,\n    p_city OUT VARCHAR2\n  );\nEND user_api;\n/",
        hint: "Spec chỉ cần signature, không có BEGIN implementation.",
        validation: {
          mode: "structure",
          requirements: [
            {
              label: "CREATE OR REPLACE PACKAGE user_api",
              pattern:
                "\\bcreate\\s+or\\s+replace\\s+package\\s+user_api\\s+as\\b",
            },
            {
              label: "procedure get_user_city",
              pattern: "\\bprocedure\\s+get_user_city\\s*\\(",
            },
            {
              label: "p_user_id IN NUMBER",
              pattern: "\\bp_user_id\\s+in\\s+number\\b",
            },
            {
              label: "p_city OUT VARCHAR2",
              pattern: "\\bp_city\\s+out\\s+varchar2\\b",
            },
            {
              label: "END user_api",
              pattern: "\\bend\\s+user_api\\s*;",
            },
          ],
          forbidden: [
            {
              label: "implementation BEGIN trong package spec",
              pattern: "\\bbegin\\b",
            },
          ],
        },
      },
      {
        id: "ora-pkg-2",
        prompt:
          "Viết package body user_api cài đặt get_user_city bằng SELECT city INTO p_city FROM users WHERE id = p_user_id.",
        starterQuery:
          "CREATE OR REPLACE PACKAGE BODY user_api AS\n  PROCEDURE get_user_city(\n    p_user_id IN NUMBER,\n    p_city OUT VARCHAR2\n  ) AS\n  BEGIN\n    -- SELECT INTO\n  END get_user_city;\nEND user_api;\n/",
        solutionQuery:
          "CREATE OR REPLACE PACKAGE BODY user_api AS\n  PROCEDURE get_user_city(\n    p_user_id IN NUMBER,\n    p_city OUT VARCHAR2\n  ) AS\n  BEGIN\n    SELECT city INTO p_city\n    FROM users\n    WHERE id = p_user_id;\n  END get_user_city;\nEND user_api;\n/",
        hint: "Body lặp lại đúng signature public rồi thêm implementation.",
        validation: {
          mode: "structure",
          requirements: [
            {
              label: "CREATE PACKAGE BODY user_api",
              pattern:
                "\\bcreate\\s+or\\s+replace\\s+package\\s+body\\s+user_api\\s+as\\b",
            },
            {
              label: "procedure get_user_city",
              pattern: "\\bprocedure\\s+get_user_city\\s*\\(",
            },
            {
              label: "SELECT city INTO p_city",
              pattern: "\\bselect\\s+city\\s+into\\s+p_city\\b",
            },
            {
              label: "FROM users",
              pattern: "\\bfrom\\s+users\\b",
            },
            {
              label: "WHERE id = p_user_id",
              pattern: "\\bwhere\\s+id\\s*=\\s*p_user_id\\b",
            },
          ],
        },
      },
    ],
    estimatedMinutes: 16,
  },
];
