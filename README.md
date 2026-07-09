# SQL Visual Academy

Nền tảng học SQL từ cơ bản đến nâng cao, tập trung vào việc **giải thích trực quan quá trình thực thi câu lệnh SQL bằng animation**. Mỗi bài học có lý thuyết ngắn gọn, trình mô phỏng từng bước (`FROM → WHERE → SELECT → ORDER BY …`), và một khu vực thực hành chạy **SQLite thật ngay trong trình duyệt** (qua WebAssembly).

> Không dùng mock: mọi truy vấn trong phần thực hành đều được thực thi thật bằng `sql.js`.

---

## 1. Cách chạy project

Yêu cầu: **Node.js ≥ 20.9** (khuyến nghị 20 LTS trở lên).

```bash
# Cài dependencies
npm install

# Chạy môi trường phát triển
npm run dev
# Mở http://localhost:3000

# Build production
npm run build
npm run start

# Kiểm tra tính hợp lệ của toàn bộ SQL trong các bài học
npm run verify-queries
```

Không cần backend hay database server — tất cả chạy phía client.

---

## 2. Tech stack

| Thành phần        | Công nghệ                                   |
| ----------------- | ------------------------------------------- |
| Framework         | Next.js 16 (App Router) + React 19          |
| Ngôn ngữ          | TypeScript                                  |
| Styling           | Tailwind CSS v4 + shadcn/ui                 |
| Animation         | Framer Motion                               |
| SQL Editor        | CodeMirror (`@uiw/react-codemirror`)        |
| Database          | SQLite qua WebAssembly (`sql.js`)           |
| Theme             | `next-themes` (mặc định dark, có light)     |

**Điểm kỹ thuật đáng chú ý**

- `sql.js` được nạp lúc runtime từ `public/sqljs/` bằng cách chèn thẻ `<script>`, **không bundle** vào JS. Cách này tránh việc Turbopack cố resolve các Node built-in (`fs`, `path`) trong glue code của Emscripten.
- Mỗi bài học dùng một database SQLite **độc lập** (`createDatabase()`), nên thao tác INSERT/UPDATE/DELETE ở bài này không ảnh hưởng bài khác.
- Trình kiểm tra bài tập và các visualizer cho mutation dùng `SAVEPOINT … ROLLBACK` để tính trạng thái "sau khi chạy" mà **không làm thay đổi** database thực hành.

---

## 3. Kiến trúc thư mục

```
src/
├── app/
│   ├── layout.tsx                 # Root layout: theme, header, tooltip provider
│   ├── page.tsx                   # Trang chủ (hero + demo animation + features)
│   ├── globals.css                # Tailwind v4 theme tokens + màu cho từng SQL clause
│   └── learn/
│       ├── layout.tsx             # Bọc nội dung bằng LearnShell (sidebar)
│       ├── page.tsx               # Trang tổng quan lộ trình học
│       └── [lessonId]/page.tsx    # Trang bài học (async params, generateStaticParams)
│
├── components/
│   ├── ui/                        # shadcn/ui primitives (button, card, badge, tabs…)
│   ├── editor/
│   │   ├── code-mirror-editor.tsx # Editor thật (client-only)
│   │   ├── sql-editor.tsx         # Wrapper next/dynamic (ssr:false)
│   │   ├── result-table.tsx       # Bảng kết quả + lỗi thân thiện
│   │   └── sql-playground.tsx     # Editor + Run/Reset + kết quả
│   ├── visualizer/
│   │   ├── query-visualizer.tsx   # Bộ điều phối chính, chọn visualizer theo loại
│   │   ├── step-controller.tsx    # Play/Pause/Next/Prev/Reset + tốc độ + progress
│   │   ├── query-clause-view.tsx  # Tô sáng clause SQL đang được giải thích
│   │   ├── table-visualizer.tsx   # SELECT / WHERE / ORDER BY / LIMIT
│   │   ├── join-visualizer.tsx    # JOIN (đường nối giữa các row khớp)
│   │   ├── group-by-visualizer.tsx# GROUP BY / HAVING (+ bộ đếm động)
│   │   ├── mutation-visualizer.tsx# INSERT / UPDATE / DELETE
│   │   ├── index-visualizer.tsx   # Full scan vs Index lookup
│   │   ├── transaction-visualizer.tsx # COMMIT / ROLLBACK
│   │   └── shared.tsx             # Helper: màu clause, format giá trị
│   ├── lesson/
│   │   ├── lesson-workspace.tsx   # Bộ điều phối 1 bài học (state, DB, tiến độ)
│   │   ├── lesson-sidebar.tsx     # Lộ trình + tiến độ
│   │   ├── learn-shell.tsx        # Layout responsive + drawer trên mobile
│   │   ├── theory.tsx             # Render lý thuyết (mini-markdown) + tooltip thuật ngữ
│   │   ├── sample-data.tsx        # Xem dữ liệu mẫu (accordion)
│   │   ├── exercise-panel.tsx     # Bài tập: kiểm tra / gợi ý / đáp án
│   │   ├── lesson-checklist.tsx   # Checklist hoàn thành
│   │   └── learn-overview.tsx     # Lưới bài học cho trang /learn
│   ├── home/hero-demo.tsx         # Animation demo trên trang chủ
│   ├── site-header.tsx            # Header chung
│   ├── theme-provider.tsx / theme-toggle.tsx
│
├── hooks/
│   ├── use-sql-database.ts        # Nạp sql.js + tạo DB riêng cho từng bài
│   ├── use-step-player.ts         # Điều khiển phát animation từng bước
│   └── use-progress.ts            # Đọc tiến độ từ store (useSyncExternalStore)
│
└── lib/
    ├── db/
    │   ├── seed.ts                # SEED_SQL + TABLE_SCHEMAS (users/orders/departments/employees)
    │   └── sql-engine.ts          # Nạp sql.js, class SqlDatabase, lỗi thân thiện
    ├── lessons/
    │   ├── types.ts               # Kiểu Lesson, ExerciseSpec, VisualizationType, CLAUSE_META
    │   ├── basic.ts               # Bài cơ bản
    │   ├── intermediate.ts        # Bài trung cấp
    │   ├── advanced.ts            # Bài nâng cao
    │   ├── index.ts               # Gộp + LEARNING_PATH + getLesson/getAdjacentLessons
    │   └── exercise-checker.ts    # So khớp kết quả learner vs đáp án
    ├── visualizer/
    │   ├── analyze.ts             # Bộ phân tích SQL "đủ dùng" cho animation
    │   └── plan.ts                # buildVizPlan: dựng dữ liệu + các bước animation
    └── progress/progress-store.ts # Store tiến độ (localStorage)

public/sqljs/                      # sql-wasm.js + sql-wasm.wasm (nạp lúc runtime)
scripts/verify-queries.mjs         # Kiểm tra mọi câu SQL trong bài học
```

---

## 4. Dữ liệu mẫu (schema)

Bốn bảng dùng chung cho mọi bài (định nghĩa trong `src/lib/db/seed.ts`):

- **departments** — `id, name`
- **users** — `id, name, age, city, department_id` (khóa ngoại → `departments.id`)
- **orders** — `id, user_id, product, total, created_at`
- **employees** — `id, name, department, salary, joined_at`

Dữ liệu được thiết kế để minh họa rõ: có người dùng dưới 18 tuổi (cho `WHERE age >= 18`), có `department_id` NULL (cho `LEFT JOIN`), nhiều đơn hàng của cùng một người (cho `JOIN`/`GROUP BY`).

---

## 5. Mô hình một bài học (Lesson)

Nội dung bài học là **dữ liệu thuần** (không chứa JSX), khai báo trong các file config. Xem `src/lib/lessons/types.ts`:

```ts
interface Lesson {
  id: string;                 // slug + id, ví dụ "where-basics"
  title: string;
  level: "beginner" | "intermediate" | "advanced";
  category: string;           // nhãn nhóm hiển thị ở sidebar
  summary: string;            // mô tả 1 dòng
  description: string;        // đoạn giới thiệu
  theory: string[];           // mini-markdown: "## heading", "- bullet", "> callout", `code`, **bold**
  keyTerms?: { term: string; definition: string }[]; // tooltip thuật ngữ
  tables: string[];           // bảng liên quan (key của TABLE_SCHEMAS)
  initialQuery: string;       // query mặc định trong editor
  visualization: {
    type: "select" | "join" | "group" | "mutation" | "index" | "transaction" | "none";
    query?: string;           // query dùng cho animation (mặc định = initialQuery)
  };
  steps?: LessonStep[];       // lời dẫn từng bước (tùy chọn, phủ lên narration tự sinh)
  exercises: ExerciseSpec[];
  estimatedMinutes?: number;
}
```

Bài tập (`ExerciseSpec`) được chấm bằng cách chạy **query của học viên** và **đáp án mẫu** trên hai database sạch riêng biệt rồi so sánh kết quả:

```ts
interface ExerciseSpec {
  id: string;
  prompt: string;
  solutionQuery: string;      // đáp án — chạy thật để lấy kết quả kỳ vọng
  hint: string;
  orderInsensitive?: boolean; // so sánh không quan tâm thứ tự dòng (khi không có ORDER BY)
  verifyQuery?: string;       // với INSERT/UPDATE/DELETE: SELECT để so sánh trạng thái bảng sau đó
  starterQuery?: string;
  successMessage?: string;
}
```

---

## 6. Cách thêm một bài học mới

1. Mở file cấp độ phù hợp: `src/lib/lessons/basic.ts`, `intermediate.ts` hoặc `advanced.ts`.
2. Thêm một object `Lesson` vào mảng. Ví dụ tối giản:

```ts
{
  id: "distinct",
  title: "DISTINCT — loại trùng",
  level: "beginner",
  category: "Truy vấn dữ liệu",
  summary: "Loại bỏ các dòng trùng lặp trong kết quả.",
  description: "DISTINCT giữ lại các giá trị duy nhất.",
  theory: [
    "Cú pháp: `SELECT DISTINCT city FROM users;`",
    "> Kết quả chỉ còn mỗi thành phố một lần.",
  ],
  keyTerms: [{ term: "DISTINCT", definition: "Loại bỏ dòng trùng nhau." }],
  tables: ["users"],
  initialQuery: "SELECT DISTINCT city FROM users;",
  visualization: { type: "none" },      // dùng "select" nếu muốn animation pipeline
  exercises: [
    {
      id: "ds-1",
      prompt: "Lấy danh sách các thành phố (không trùng).",
      solutionQuery: "SELECT DISTINCT city FROM users;",
      hint: "Dùng SELECT DISTINCT.",
      orderInsensitive: true,
    },
  ],
  estimatedMinutes: 5,
}
```

3. Vị trí trong mảng quyết định **thứ tự** trong lộ trình và nút Trước/Tiếp.
4. Chạy `npm run verify-queries` để chắc chắn mọi `initialQuery`/`solutionQuery`/`verifyQuery` hợp lệ với schema.

Không cần khai báo route — trang bài học sinh tự động từ `id` qua `generateStaticParams`.

**Mẹo về `visualization.type`:**

- `select` — pipeline `FROM → WHERE → SELECT → ORDER BY → LIMIT` (một bảng).
- `join` — có `JOIN … ON …` (hai bảng).
- `group` — có `GROUP BY` hoặc hàm tổng hợp.
- `mutation` — `INSERT` / `UPDATE` / `DELETE`.
- `index`, `transaction` — visualizer chuyên biệt.
- `none` — chỉ chạy query và hiển thị kết quả (khi không cần animation chi tiết). Nếu query không phân tích được để dựng animation, hệ thống tự hiển thị thông báo: *"Truy vấn này chạy được nhưng chưa hỗ trợ animation chi tiết."*

---

## 7. Cách thêm một loại visualization mới

1. **Khai báo type**: thêm giá trị vào `VisualizationType` trong `src/lib/lessons/types.ts`.
2. **Dựng dữ liệu + các bước**: trong `src/lib/visualizer/plan.ts`, viết một `buildXxxPlan(db, analysis, rawQuery, authoredSteps)` trả về dữ liệu cần cho animation kèm mảng `frames` (mỗi frame gồm `clause`, `title`, `description`). Đăng ký nó trong `buildVizPlan`.
   - Dùng `db.exec(...)` để lấy **dữ liệu thật**. Nếu là mutation, bọc trong `SAVEPOINT __viz` … `ROLLBACK TO __viz; RELEASE __viz` để không làm hỏng dữ liệu thực hành.
3. **Component hiển thị**: tạo `src/components/visualizer/xxx-visualizer.tsx`, nhận `data` và `activeClause` (hoặc `step`), dùng Framer Motion để animate. Tham khảo `table-visualizer.tsx` (layout animation cho row) hoặc `join-visualizer.tsx` (đường nối SVG).
4. **Kết nối**: trong `src/components/visualizer/query-visualizer.tsx`, render component mới theo `plan.kind` (hoặc theo `type` nếu là visualizer tự quản như index/transaction).

Bảng điều khiển (Play/Pause/Next/Prev/Reset, tốc độ, progress) và phần tô sáng clause dùng lại `StepController` + `QueryClauseView` nên không cần viết lại.

---

## 8. Tính năng chính

- **Trình mô phỏng thực thi SQL** theo từng bước với điều khiển đầy đủ và 3 mức tốc độ (chậm/vừa/nhanh).
- **Editor SQL** có gợi ý bảng/cột, phím tắt `⌘/Ctrl + Enter` để chạy.
- **Thực hành thật**: chạy query, xem kết quả, lỗi được diễn giải dễ hiểu, nút *Reset dữ liệu mẫu*.
- **Bài tập** có kiểm tra tự động (so khớp kết quả với đáp án), gợi ý và đáp án mẫu.
- **Tiến độ** lưu trong `localStorage`; checklist hoàn thành mỗi bài.
- **Dark/Light mode**, responsive cho desktop và tablet.

---

## 9. Giấy phép & ghi chú

- `sql.js` phát hành theo giấy phép MIT.
- Đây là dự án học tập; dữ liệu mẫu là hư cấu.
