"use client";

import * as React from "react";
import { FlaskConical, MonitorPlay, Database, AlertCircle } from "lucide-react";

import { useSqlDatabase } from "@/hooks/use-sql-database";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SqlPlayground } from "@/components/editor/sql-playground";
import { QueryVisualizer } from "@/components/visualizer/query-visualizer";
import { SampleData } from "@/components/lesson/sample-data";

const DEFAULT_QUERY = `SELECT users.name, orders.product, orders.total
FROM users
JOIN orders ON users.id = orders.user_id
WHERE orders.total > 50
ORDER BY orders.total DESC;`;

const ALL_TABLES = ["users", "orders", "departments", "employees"];

export function FreePlayground() {
  const { ready, run, reset, db, loadError } = useSqlDatabase();
  const [query, setQuery] = React.useState(DEFAULT_QUERY);
  const [vizQuery, setVizQuery] = React.useState(DEFAULT_QUERY);
  const [outcome, setOutcome] = React.useState<ReturnType<typeof run> | null>(
    null,
  );
  const [hasRun, setHasRun] = React.useState(false);
  const [dataVersion, setDataVersion] = React.useState(0);
  const [resetting, setResetting] = React.useState(false);

  const handleRun = React.useCallback(() => {
    const oc = run(query);
    setOutcome(oc);
    setHasRun(true);
    setVizQuery(query);
    setDataVersion((v) => v + 1);
  }, [run, query]);

  const handleReset = React.useCallback(() => {
    setResetting(true);
    reset();
    setOutcome(null);
    setHasRun(false);
    setDataVersion((v) => v + 1);
    setTimeout(() => setResetting(false), 250);
  }, [reset]);

  const vizError =
    hasRun && outcome?.error
      ? {
          message: outcome.error.message,
          hint: outcome.error.hint,
          original: outcome.error.original,
        }
      : null;

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <header className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          SQL Playground
        </h1>
        <p className="mt-1.5 max-w-2xl text-muted-foreground">
          Viết và chạy SQL tự do trên SQLite trong trình duyệt. Trình mô phỏng
          tự chọn animation phù hợp khi có thể.
        </p>
      </header>

      {loadError && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
          <AlertCircle className="size-4" /> Không tải được SQLite: {loadError}
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        <div className="space-y-5 lg:col-span-5">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <FlaskConical className="size-4 text-primary" />
                Soạn thảo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <SqlPlayground
                query={query}
                onQueryChange={setQuery}
                onRun={handleRun}
                onReset={handleReset}
                outcome={outcome}
                hasRun={hasRun}
                ready={ready}
                resetting={resetting}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Database className="size-4 text-primary" />
                Dữ liệu mẫu
              </CardTitle>
            </CardHeader>
            <CardContent>
              <SampleData db={db} tables={ALL_TABLES} version={dataVersion} />
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-7">
          <div className="lg:sticky lg:top-[4.5rem]">
            <Card className="border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <MonitorPlay className="size-4 text-primary" />
                  Trình mô phỏng
                </CardTitle>
              </CardHeader>
              <CardContent>
                <QueryVisualizer
                  db={db}
                  query={vizQuery}
                  type="select"
                  tables={ALL_TABLES}
                  isCanonical={false}
                  execError={vizError}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
