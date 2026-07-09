"use client";

import * as React from "react";
import { Table2 } from "lucide-react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ResultTable } from "@/components/editor/result-table";
import { TABLE_SCHEMAS } from "@/lib/db/seed";
import type { SqlDatabase, QueryResult } from "@/lib/db/sql-engine";

/**
 * Collapsible preview of the sample tables used by a lesson. Reads live from
 * the lesson database so it reflects the current (possibly mutated) state.
 * `version` bumps to force a re-read after Run/Reset.
 */
export function SampleData({
  db,
  tables,
  version = 0,
}: {
  db: SqlDatabase | null;
  tables: string[];
  version?: number;
}) {
  const previews = React.useMemo(() => {
    if (!db) return [];
    return tables.map((name) => {
      let result: QueryResult | null = null;
      try {
        result = db.exec(`SELECT * FROM ${name}`);
      } catch {
        result = null;
      }
      return { name, result, schema: TABLE_SCHEMAS[name] };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [db, tables, version]);

  if (!db) {
    return (
      <p className="text-sm text-muted-foreground">Đang tải dữ liệu mẫu…</p>
    );
  }

  return (
    <Accordion type="single" collapsible defaultValue={tables[0]}>
      {previews.map(({ name, result, schema }) => (
        <AccordionItem key={name} value={name}>
          <AccordionTrigger>
            <span className="flex items-center gap-2">
              <Table2 className="size-4 text-primary" />
              <span className="font-mono">{name}</span>
              {schema && (
                <span className="text-xs font-normal text-muted-foreground">
                  {schema.description}
                </span>
              )}
            </span>
          </AccordionTrigger>
          <AccordionContent>
            {result ? (
              <ResultTable result={result} error={null} hasRun />
            ) : (
              <p className="text-sm text-muted-foreground">
                Không đọc được bảng.
              </p>
            )}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
