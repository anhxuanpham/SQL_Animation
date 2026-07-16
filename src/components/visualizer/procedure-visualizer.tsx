"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Code2,
  Database,
  Play,
  Terminal,
} from "lucide-react";

import type { SqlDatabase } from "@/lib/db/sql-engine";
import type { Frame } from "@/lib/visualizer/plan";
import type {
  LessonStep,
  OracleProcedureVariant,
} from "@/lib/lessons/types";
import { useStepPlayer } from "@/hooks/use-step-player";
import { StepController } from "./step-controller";
import { QueryClauseView } from "./query-clause-view";
import { ClauseChip } from "./shared";
import { cn } from "@/lib/utils";

interface EmployeeSalary {
  id: number;
  name: string;
  department: string;
  salary: number;
}

interface ProcedureModel {
  name: string;
  packageName: string | null;
  department: string;
  amount: number;
  employeeId: number;
  requestedRaise: number;
  validAmount: boolean;
  employees: EmployeeSalary[];
  selectedEmployee: EmployeeSalary | null;
  namedArgs: { name: string; value: string }[];
}

function matchText(query: string, re: RegExp, fallback: string): string {
  return re.exec(query)?.[1] ?? fallback;
}

function matchNumber(query: string, re: RegExp, fallback: number): number {
  const raw = re.exec(query)?.[1];
  if (!raw) return fallback;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function parseNamedArgs(query: string): { name: string; value: string }[] {
  return Array.from(
    query.matchAll(
      /\b([a-z_][\w$#]*)\s*=>\s*('(?:''|[^'])*'|-?\d+(?:\.\d+)?|[a-z_][\w$#]*)/gi,
    ),
  ).map((match) => ({ name: match[1], value: match[2] }));
}

function namedNumber(
  args: { name: string; value: string }[],
  name: string,
  fallback: number,
): number {
  const value = args.find(
    (arg) => arg.name.toLowerCase() === name.toLowerCase(),
  )?.value;
  const parsed = value ? Number(value) : Number.NaN;
  return Number.isFinite(parsed) ? parsed : fallback;
}

function buildModel(db: SqlDatabase, query: string): ProcedureModel {
  const namedArgs = parseNamedArgs(query);
  const name = matchText(
    query,
    /\bprocedure\s+([a-z_][\w$#]*)/i,
    "raise_department_salary",
  );
  const packageName =
    /\bcreate\s+or\s+replace\s+package(?:\s+body)?\s+([a-z_][\w$#]*)/i.exec(
      query,
    )?.[1] ?? null;
  const department = matchText(
    query,
    /\bp_department\s*=>\s*'([^']+)'/i,
    "Sales",
  );
  const amount = matchNumber(
    query,
    /\bp_amount\s*=>\s*(-?\d+(?:\.\d+)?)/i,
    100,
  );
  const employeeId = namedNumber(namedArgs, "p_employee_id", 7);
  const requestedRaise = namedNumber(namedArgs, "p_requested_raise", 900);
  const escapedDepartment = department.replace(/'/g, "''");

  let employees: EmployeeSalary[] = [];
  let selectedEmployee: EmployeeSalary | null = null;
  try {
    const result = db.exec(
      `SELECT id, name, department, salary
       FROM employees
       WHERE department = '${escapedDepartment}'
       ORDER BY id`,
    );
    employees = result.rows.map((row) => ({
      id: Number(row[0]),
      name: String(row[1]),
      department: String(row[2]),
      salary: Number(row[3]),
    }));
    const selected = db.exec(
      `SELECT id, name, department, salary
       FROM employees
       WHERE id = ${Math.trunc(employeeId)}
       LIMIT 1`,
    );
    if (selected.rows[0]) {
      selectedEmployee = {
        id: Number(selected.rows[0][0]),
        name: String(selected.rows[0][1]),
        department: String(selected.rows[0][2]),
        salary: Number(selected.rows[0][3]),
      };
    }
  } catch {
    employees = [];
    selectedEmployee = null;
  }

  return {
    name,
    packageName,
    department,
    amount,
    employeeId,
    requestedRaise,
    validAmount: amount > 0,
    employees,
    selectedEmployee,
    namedArgs,
  };
}

function SchemaStage({ name }: { name: string }) {
  return (
    <div className="grid items-center gap-3 sm:grid-cols-[1fr_auto_1fr]">
      <div className="rounded-lg border bg-card/70 p-4">
        <p className="mb-3 flex items-center gap-2 text-xs font-medium text-muted-foreground">
          <Code2 className="size-4 text-clause-limit" />
          PL/SQL source
        </p>
        <div className="space-y-1.5 font-mono text-xs">
          <p>
            <span className="text-clause-limit">CREATE OR REPLACE</span>{" "}
            PROCEDURE
          </p>
          <p className="pl-3 text-muted-foreground">header + parameters</p>
          <p className="pl-3 text-muted-foreground">BEGIN ... END;</p>
        </div>
      </div>

      <ArrowRight className="mx-auto size-5 rotate-90 text-muted-foreground sm:rotate-0" />

      <motion.div
        initial={{ scale: 0.96, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="rounded-lg border border-success/40 bg-success/5 p-4"
      >
        <p className="mb-3 flex items-center gap-2 text-xs font-medium text-muted-foreground">
          <Database className="size-4 text-success" />
          Oracle schema
        </p>
        <p className="break-all font-mono text-sm font-semibold uppercase">
          {name}
        </p>
        <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-success/15 px-2 py-0.5 text-[11px] font-medium text-success">
          <CheckCircle2 className="size-3" />
          COMPILED · VALID
        </span>
      </motion.div>
    </div>
  );
}

function CallStage({
  department,
  amount,
}: {
  department: string;
  amount: number;
}) {
  const params = [
    { mode: "IN", name: "p_department", value: `'${department}'` },
    { mode: "IN", name: "p_amount", value: String(amount) },
    { mode: "OUT", name: "p_updated", value: "v_updated (đang chờ)" },
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
        <Play className="size-4 text-clause-join" />
        Anonymous block tạo call frame
      </div>
      <div className="grid gap-2 sm:grid-cols-3">
        {params.map((param, index) => (
          <motion.div
            key={param.name}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.08 }}
            className="rounded-lg border bg-card/70 p-3"
          >
            <div className="mb-2 flex items-center justify-between gap-2">
              <span className="font-mono text-xs font-semibold">
                {param.name}
              </span>
              <span
                className={cn(
                  "rounded px-1.5 py-0.5 text-[10px] font-bold",
                  param.mode === "IN"
                    ? "bg-clause-join/15 text-clause-join"
                    : "bg-clause-groupby/15 text-clause-groupby",
                )}
              >
                {param.mode}
              </span>
            </div>
            <p className="break-words font-mono text-xs text-muted-foreground">
              {param.value}
            </p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function GenericCallStage({
  name,
  args,
}: {
  name: string;
  args: { name: string; value: string }[];
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
        <Play className="size-4 text-clause-join" />
        Caller gọi <code className="font-semibold text-foreground">{name}</code>
      </div>
      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
        {(args.length > 0
          ? args
          : [{ name: "(không có tham số)", value: "call trực tiếp" }]
        ).map((arg, index) => (
          <motion.div
            key={`${arg.name}-${index}`}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.06 }}
            className="rounded-lg border bg-card/70 p-3"
          >
            <p className="font-mono text-xs font-semibold">{arg.name}</p>
            <p className="mt-1 break-words font-mono text-xs text-clause-join">
              {arg.value}
            </p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function ParameterModesStage({
  employee,
  requestedRaise,
}: {
  employee: EmployeeSalary | null;
  requestedRaise: number;
}) {
  const cappedRaise = Math.min(Math.max(requestedRaise, 0), 500);
  const newSalary = employee ? employee.salary + cappedRaise : null;
  return (
    <div className="space-y-4">
      <div className="grid items-stretch gap-2 sm:grid-cols-[1fr_auto_1fr_auto_1fr]">
        <div className="rounded-lg border border-clause-join/40 bg-clause-join/5 p-3">
          <span className="text-[10px] font-bold text-clause-join">IN</span>
          <p className="mt-1 font-mono text-xs">p_employee_id</p>
          <p className="mt-2 text-sm font-semibold">{employee?.id ?? "không có"}</p>
        </div>
        <ArrowRight className="m-auto size-4 rotate-90 text-muted-foreground sm:rotate-0" />
        <div className="rounded-lg border border-clause-where/40 bg-clause-where/5 p-3">
          <span className="text-[10px] font-bold text-clause-where">IN OUT</span>
          <p className="mt-1 font-mono text-xs">p_requested_raise</p>
          <p className="mt-2 text-sm font-semibold">
            {requestedRaise} → {cappedRaise}
          </p>
        </div>
        <ArrowRight className="m-auto size-4 rotate-90 text-muted-foreground sm:rotate-0" />
        <div className="rounded-lg border border-clause-groupby/40 bg-clause-groupby/5 p-3">
          <span className="text-[10px] font-bold text-clause-groupby">OUT</span>
          <p className="mt-1 font-mono text-xs">p_new_salary</p>
          <p className="mt-2 text-sm font-semibold">{newSalary ?? "NULL"}</p>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        IN chỉ đọc; IN OUT nhận giá trị rồi ghi đè; OUT chỉ trả kết quả sau khi
        procedure hoàn tất.
      </p>
    </div>
  );
}

function SelectIntoStage({
  employeeId,
  employee,
}: {
  employeeId: number;
  employee: EmployeeSalary | null;
}) {
  return (
    <div className="space-y-3">
      <code className="block overflow-x-auto rounded-lg border bg-card p-3 font-mono text-xs">
        SELECT name, salary INTO p_name, p_salary FROM employees WHERE id ={" "}
        {employeeId};
      </code>
      {employee ? (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid gap-2 rounded-lg border border-success/40 bg-success/5 p-3 sm:grid-cols-4"
        >
          <span className="font-mono text-xs">id = {employee.id}</span>
          <span className="font-mono text-xs">{employee.name}</span>
          <span className="font-mono text-xs">{employee.department}</span>
          <span className="font-mono text-xs font-semibold text-success">
            salary = {employee.salary}
          </span>
        </motion.div>
      ) : (
        <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-4 text-sm">
          Không có dòng id = {employeeId}; SELECT INTO phát{" "}
          <code className="text-destructive">NO_DATA_FOUND</code>.
        </div>
      )}
    </div>
  );
}

function ExceptionStage({
  employeeId,
  employee,
}: {
  employeeId: number;
  employee: EmployeeSalary | null;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-[1fr_auto_1fr]">
      <div className="rounded-lg border bg-card/70 p-4">
        <p className="text-xs text-muted-foreground">SELECT INTO</p>
        <p className="mt-2 font-mono text-sm">employee id = {employeeId}</p>
        <p className="mt-2 text-xs">
          {employee ? "Tìm thấy 1 dòng" : "Không tìm thấy dòng nào"}
        </p>
      </div>
      <ArrowRight className="m-auto size-5 rotate-90 text-muted-foreground sm:rotate-0" />
      <div
        className={cn(
          "rounded-lg border p-4",
          employee
            ? "border-success/40 bg-success/5"
            : "border-destructive/40 bg-destructive/5",
        )}
      >
        {employee ? (
          <>
            <CheckCircle2 className="size-5 text-success" />
            <p className="mt-2 text-sm font-semibold">Không vào EXCEPTION</p>
          </>
        ) : (
          <>
            <AlertTriangle className="size-5 text-destructive" />
            <p className="mt-2 font-mono text-sm font-semibold text-destructive">
              ORA-20002
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              NO_DATA_FOUND được đổi thành lỗi nghiệp vụ dễ hiểu cho caller.
            </p>
          </>
        )}
      </div>
    </div>
  );
}

function TransactionOwnerStage({
  clause,
}: {
  clause: Frame["clause"];
}) {
  const isStart = clause === "BEGIN";
  const isCommit = clause === "COMMIT";
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg border border-clause-join/40 bg-clause-join/5 p-4">
          <p className="text-xs font-semibold text-clause-join">CALLER</p>
          <p className="mt-2 text-sm">
            {isStart
              ? "Mở transaction và gọi procedure."
              : isCommit
                ? "Quyết định COMMIT khi toàn bộ workflow thành công."
                : "Có thể ROLLBACK nếu bước sau thất bại."}
          </p>
        </div>
        <div className="rounded-lg border bg-card/70 p-4">
          <p className="text-xs font-semibold text-muted-foreground">
            PROCEDURE
          </p>
          <p className="mt-2 text-sm">
            Thực hiện DML nhưng không tự COMMIT, để không phá transaction lớn
            hơn của caller.
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span className="rounded bg-clause-join/15 px-2 py-1">BEGIN</span>
        <ArrowRight className="size-3.5" />
        <span className="rounded bg-warning/15 px-2 py-1">procedure DML</span>
        <ArrowRight className="size-3.5" />
        <span className="rounded bg-success/15 px-2 py-1">COMMIT</span>
        <span>/</span>
        <span className="rounded bg-destructive/15 px-2 py-1">ROLLBACK</span>
      </div>
    </div>
  );
}

function PackageStage({
  packageName,
  clause,
}: {
  packageName: string;
  clause: Frame["clause"];
}) {
  const showBody = clause === "PROCEDURE";
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="rounded-lg border border-clause-limit/40 bg-clause-limit/5 p-4">
        <p className="text-xs font-semibold text-clause-limit">PACKAGE SPEC</p>
        <p className="mt-2 font-mono text-sm uppercase">{packageName}</p>
        <p className="mt-2 text-xs text-muted-foreground">
          Public contract: procedure/function mà schema khác được phép gọi.
        </p>
      </div>
      <motion.div
        animate={{ opacity: showBody ? 1 : 0.55 }}
        className="rounded-lg border bg-card/70 p-4"
      >
        <p className="text-xs font-semibold text-muted-foreground">
          PACKAGE BODY
        </p>
        <p className="mt-2 font-mono text-sm">implementation + private helpers</p>
        <p className="mt-2 text-xs text-muted-foreground">
          Có thể thay body mà không làm caller phụ thuộc implementation.
        </p>
      </motion.div>
    </div>
  );
}

function GenericOutputStage({
  lines,
}: {
  lines: { label: string; value: string | number }[];
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="space-y-2 rounded-lg border border-clause-groupby/40 bg-clause-groupby/5 p-4">
        <p className="text-xs font-medium text-muted-foreground">
          Giá trị trả về caller
        </p>
        {lines.map((line) => (
          <p key={line.label} className="font-mono text-sm">
            {line.label} ={" "}
            <strong className="text-clause-groupby">{line.value}</strong>
          </p>
        ))}
      </div>
      <div className="rounded-lg border bg-slate-950 p-4 text-slate-100 dark:bg-black">
        <p className="mb-3 flex items-center gap-2 text-xs text-slate-400">
          <Terminal className="size-4" />
          Caller / DBMS_OUTPUT
        </p>
        {lines.map((line) => (
          <p key={line.label} className="font-mono text-sm text-emerald-400">
            {line.label}: {line.value}
          </p>
        ))}
      </div>
    </div>
  );
}

function ValidationStage({
  amount,
  valid,
}: {
  amount: number;
  valid: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border p-5",
        valid
          ? "border-success/40 bg-success/5"
          : "border-destructive/40 bg-destructive/5",
      )}
    >
      <div className="flex flex-col items-center gap-3 text-center">
        <code className="rounded-lg border bg-card px-4 py-2 font-mono text-sm">
          IF {amount} &lt;= 0 THEN
        </code>
        {valid ? (
          <>
            <CheckCircle2 className="size-8 text-success" />
            <div>
              <p className="font-semibold">Điều kiện FALSE — dữ liệu hợp lệ</p>
              <p className="text-sm text-muted-foreground">
                Bỏ qua RAISE_APPLICATION_ERROR và đi tiếp tới UPDATE.
              </p>
            </div>
          </>
        ) : (
          <>
            <AlertTriangle className="size-8 text-destructive" />
            <div>
              <p className="font-semibold text-destructive">
                ORA-20001: Mức tăng phải lớn hơn 0
              </p>
              <p className="text-sm text-muted-foreground">
                Procedure dừng trước UPDATE; không có dòng nào bị thay đổi.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function UpdateStage({
  employees,
  amount,
  department,
}: {
  employees: EmployeeSalary[];
  amount: number;
  department: string;
}) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-medium text-muted-foreground">
          WHERE department ={" "}
          <code className="text-clause-where">&apos;{department}&apos;</code>
        </p>
        <span className="rounded-full bg-clause-where/15 px-2 py-0.5 text-xs font-medium text-clause-where">
          {employees.length} dòng khớp
        </span>
      </div>

      {employees.length > 0 ? (
        <div className="overflow-x-auto">
          <div className="min-w-[30rem] space-y-1.5">
            <div className="grid grid-cols-[1.4fr_1fr_0.8fr_auto_0.8fr] gap-2 px-3 text-[11px] font-medium text-muted-foreground">
              <span>name</span>
              <span>department</span>
              <span>salary cũ</span>
              <span />
              <span>salary mới</span>
            </div>
            {employees.map((employee, index) => (
              <motion.div
                key={employee.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.08 }}
                className="grid grid-cols-[1.4fr_1fr_0.8fr_auto_0.8fr] items-center gap-2 rounded-lg border bg-card/70 px-3 py-2 font-mono text-xs"
              >
                <span>{employee.name}</span>
                <span className="text-muted-foreground">
                  {employee.department}
                </span>
                <span>{employee.salary}</span>
                <ArrowRight className="size-3.5 text-clause-where" />
                <motion.span
                  initial={{ opacity: 0.55, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="rounded px-1.5 py-1 font-semibold text-success"
                  style={{
                    backgroundColor:
                      "color-mix(in oklab, var(--success) 18%, transparent)",
                  }}
                >
                  {employee.salary + amount}
                </motion.span>
              </motion.div>
            ))}
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-dashed p-5 text-center text-sm text-muted-foreground">
          Không có nhân viên thuộc phòng {department}; UPDATE tác động 0 dòng.
        </div>
      )}
    </div>
  );
}

function OutputStage({ rowCount }: { rowCount: number }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-lg border border-clause-groupby/40 bg-clause-groupby/5 p-4"
      >
        <p className="text-xs font-medium text-muted-foreground">
          Implicit cursor attribute
        </p>
        <p className="mt-2 font-mono text-sm">
          p_updated :={" "}
          <strong className="text-clause-groupby">SQL%ROWCOUNT</strong>;
        </p>
        <p className="mt-3 text-3xl font-bold text-clause-groupby">
          {rowCount}
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-lg border bg-slate-950 p-4 text-slate-100 dark:bg-black"
      >
        <p className="mb-3 flex items-center gap-2 text-xs text-slate-400">
          <Terminal className="size-4" />
          DBMS_OUTPUT
        </p>
        <p className="font-mono text-sm text-emerald-400">
          Đã cập nhật: {rowCount} nhân viên
        </p>
      </motion.div>
    </div>
  );
}

export function ProcedureVisualizer({
  db,
  query,
  variant = "lifecycle",
  authoredSteps,
}: {
  db: SqlDatabase;
  query: string;
  variant?: OracleProcedureVariant;
  authoredSteps?: LessonStep[];
}) {
  const model = React.useMemo(() => buildModel(db, query), [db, query]);

  const frames = React.useMemo<Frame[]>(() => {
    if (authoredSteps && authoredSteps.length > 0) {
      return authoredSteps.map((step) => ({
        clause: step.clause ?? "PROCEDURE",
        title: step.title,
        description: step.description,
      }));
    }

    if (variant === "parameters") {
      return [
        {
          clause: "PROCEDURE",
          title: "Biên dịch procedure",
          description: "Oracle kiểm tra header và ba mode tham số.",
        },
        {
          clause: "BEGIN",
          title: "Bind giá trị khi gọi",
          description: "Caller nối biến thật với các formal parameters.",
        },
        {
          clause: "SELECT",
          title: "Đọc trạng thái hiện tại",
          description: "Procedure lấy salary trước khi tính mức tăng.",
        },
        {
          clause: "IF",
          title: "Ghi lại IN OUT",
          description: "Mức tăng được giới hạn rồi ghi ngược về caller.",
        },
        {
          clause: "OUT",
          title: "Trả salary mới",
          description: "OUT mang kết quả tính toán cuối cùng về caller.",
        },
      ];
    }

    if (variant === "select-into") {
      return [
        {
          clause: "PROCEDURE",
          title: "Biên dịch procedure tra cứu",
          description: "Procedure khai báo hai OUT parameters.",
        },
        {
          clause: "BEGIN",
          title: "Nhận employee id",
          description: "Caller truyền khóa cần tra cứu.",
        },
        {
          clause: "SELECT",
          title: "SELECT ... INTO",
          description: "Một dòng được chép vào hai biến OUT.",
        },
        {
          clause: "OUT",
          title: "Trả name và salary",
          description: "Caller nhận lại hai giá trị scalar.",
        },
      ];
    }

    if (variant === "exception") {
      return [
        {
          clause: "PROCEDURE",
          title: "Biên dịch error contract",
          description: "Procedure định nghĩa cách đổi lỗi hệ thống thành lỗi nghiệp vụ.",
        },
        {
          clause: "BEGIN",
          title: "Caller gửi id không tồn tại",
          description: "Dữ liệu đầu vào dẫn tới nhánh lỗi có kiểm soát.",
        },
        {
          clause: "SELECT",
          title: "SELECT INTO không có dòng",
          description: "Oracle tự phát NO_DATA_FOUND.",
        },
        {
          clause: "EXCEPTION",
          title: "Map sang ORA-20002",
          description: "Handler trả thông báo ổn định cho ứng dụng.",
        },
      ];
    }

    if (variant === "transaction") {
      return [
        {
          clause: "PROCEDURE",
          title: "Procedure chỉ làm DML",
          description: "Không COMMIT bên trong reusable procedure.",
        },
        {
          clause: "BEGIN",
          title: "Caller mở transaction",
          description: "Caller sở hữu ranh giới transaction.",
        },
        {
          clause: "UPDATE",
          title: "Thay đổi đang pending",
          description: "Salary được cập nhật nhưng chưa bền vững.",
        },
        {
          clause: "ROLLBACK",
          title: "Caller có thể hoàn tác",
          description: "Toàn bộ workflow quay về trạng thái ban đầu.",
        },
      ];
    }

    if (variant === "package") {
      return [
        {
          clause: "CREATE",
          title: "Tạo package specification",
          description: "Spec là public API ổn định cho caller.",
        },
        {
          clause: "PROCEDURE",
          title: "Cài đặt package body",
          description: "Body chứa implementation và helper riêng tư.",
        },
        {
          clause: "BEGIN",
          title: "Gọi procedure có namespace",
          description: "Caller dùng package_name.procedure_name.",
        },
        {
          clause: "UPDATE",
          title: "Body thực hiện DML",
          description: "Logic bên trong vẫn dùng SQL và PL/SQL bình thường.",
        },
        {
          clause: "OUT",
          title: "Trả kết quả qua public API",
          description: "Caller không cần biết implementation trong body.",
        },
      ];
    }

    const common: Frame[] = [
      {
        clause: "PROCEDURE",
        title: "Biên dịch và lưu procedure",
        description:
          "Oracle tạo schema object có tên; OR REPLACE cho phép cập nhật code mà không cần DROP trước.",
      },
      {
        clause: "BEGIN",
        title: "Caller truyền tham số",
        description:
          "Hai giá trị IN đi vào call frame; biến v_updated được nối với tham số OUT.",
      },
      {
        clause: "IF",
        title: "Kiểm tra luật nghiệp vụ",
        description:
          "Procedure chặn mức tăng không hợp lệ trước khi câu UPDATE chạm vào dữ liệu.",
      },
    ];

    if (!model.validAmount) {
      return [
        ...common,
        {
          clause: "EXCEPTION",
          title: "Phát lỗi ORA-20001",
          description:
            "RAISE_APPLICATION_ERROR dừng procedure; UPDATE và OUT không được thực hiện.",
        },
      ];
    }

    return [
      ...common,
      {
        clause: "UPDATE",
        title: "Chạy UPDATE trong procedure",
        description:
          "Oracle lọc theo p_department và tăng salary bằng p_amount cho từng dòng khớp.",
      },
      {
        clause: "OUT",
        title: "Trả số dòng cho caller",
        description:
          "SQL%ROWCOUNT được gán vào p_updated, sau đó caller đọc v_updated và in kết quả.",
      },
    ];
  }, [authoredSteps, model.validAmount, variant]);

  const player = useStepPlayer(frames.length);
  const current = Math.min(player.current, frames.length - 1);
  const frame = frames[current];

  let stage: React.ReactNode;

  if (variant === "parameters") {
    if (frame.clause === "PROCEDURE") {
      stage = <SchemaStage name={model.name} />;
    } else if (frame.clause === "BEGIN") {
      stage = <GenericCallStage name={model.name} args={model.namedArgs} />;
    } else if (frame.clause === "OUT") {
      const capped = Math.min(Math.max(model.requestedRaise, 0), 500);
      stage = (
        <GenericOutputStage
          lines={[
            { label: "p_requested_raise", value: capped },
            {
              label: "p_new_salary",
              value: model.selectedEmployee
                ? model.selectedEmployee.salary + capped
                : "NULL",
            },
          ]}
        />
      );
    } else {
      stage = (
        <ParameterModesStage
          employee={model.selectedEmployee}
          requestedRaise={model.requestedRaise}
        />
      );
    }
  } else if (variant === "select-into") {
    if (frame.clause === "PROCEDURE") {
      stage = <SchemaStage name={model.name} />;
    } else if (frame.clause === "BEGIN") {
      stage = <GenericCallStage name={model.name} args={model.namedArgs} />;
    } else if (frame.clause === "SELECT") {
      stage = (
        <SelectIntoStage
          employeeId={model.employeeId}
          employee={model.selectedEmployee}
        />
      );
    } else if (frame.clause === "EXCEPTION") {
      stage = (
        <ExceptionStage
          employeeId={model.employeeId}
          employee={model.selectedEmployee}
        />
      );
    } else {
      stage = (
        <GenericOutputStage
          lines={[
            { label: "p_name", value: model.selectedEmployee?.name ?? "NULL" },
            {
              label: "p_salary",
              value: model.selectedEmployee?.salary ?? "NULL",
            },
          ]}
        />
      );
    }
  } else if (variant === "exception") {
    if (frame.clause === "PROCEDURE") {
      stage = <SchemaStage name={model.name} />;
    } else if (frame.clause === "BEGIN") {
      stage = <GenericCallStage name={model.name} args={model.namedArgs} />;
    } else if (frame.clause === "SELECT") {
      stage = (
        <SelectIntoStage
          employeeId={model.employeeId}
          employee={model.selectedEmployee}
        />
      );
    } else {
      stage = (
        <ExceptionStage
          employeeId={model.employeeId}
          employee={model.selectedEmployee}
        />
      );
    }
  } else if (variant === "transaction") {
    if (frame.clause === "PROCEDURE") {
      stage = <SchemaStage name={model.name} />;
    } else if (frame.clause === "UPDATE") {
      stage = (
        <UpdateStage
          employees={model.employees}
          amount={model.amount}
          department={model.department}
        />
      );
    } else {
      stage = <TransactionOwnerStage clause={frame.clause} />;
    }
  } else if (variant === "package") {
    if (frame.clause === "CREATE" || frame.clause === "PROCEDURE") {
      stage = (
        <PackageStage
          packageName={model.packageName ?? "hr_salary_api"}
          clause={frame.clause}
        />
      );
    } else if (frame.clause === "BEGIN") {
      stage = (
        <GenericCallStage
          name={`${model.packageName ?? "hr_salary_api"}.${model.name}`}
          args={model.namedArgs}
        />
      );
    } else if (frame.clause === "UPDATE") {
      stage = (
        <UpdateStage
          employees={model.employees}
          amount={model.amount}
          department={model.department}
        />
      );
    } else {
      stage = (
        <GenericOutputStage
          lines={[{ label: "p_updated", value: model.employees.length }]}
        />
      );
    }
  } else {
    switch (frame.clause) {
      case "PROCEDURE":
        stage = <SchemaStage name={model.name} />;
        break;
      case "BEGIN":
        stage = (
          <CallStage department={model.department} amount={model.amount} />
        );
        break;
      case "IF":
      case "EXCEPTION":
        stage = (
          <ValidationStage amount={model.amount} valid={model.validAmount} />
        );
        break;
      case "UPDATE":
        stage = (
          <UpdateStage
            employees={model.employees}
            amount={model.amount}
            department={model.department}
          />
        );
        break;
      default:
        stage = <OutputStage rowCount={model.employees.length} />;
    }
  }

  return (
    <div className="space-y-4">
      <QueryClauseView query={query} activeClause={frame.clause} />
      <StepController player={player} frames={frames} />

      <div
        className="flex items-start gap-3 rounded-lg border bg-muted/20 p-3"
        aria-live="polite"
        aria-atomic="true"
      >
        <ClauseChip clause={frame.clause} active />
        <div className="min-w-0">
          <p className="text-sm font-semibold">{frame.title}</p>
          <p className="text-sm text-muted-foreground">{frame.description}</p>
        </div>
      </div>

      <div className="rounded-lg border bg-card/30 p-3 sm:p-4">{stage}</div>

      <p className="text-xs text-muted-foreground">
        Mô phỏng dùng bảng employees trong browser để minh họa dữ liệu; PL/SQL
        nguyên bản chỉ thực thi trên Oracle Database.
      </p>
    </div>
  );
}
