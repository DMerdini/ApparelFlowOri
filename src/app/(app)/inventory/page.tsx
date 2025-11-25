"use client";

import { useEffect, useState, useMemo } from "react";
import {
  collection,
  onSnapshot,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import type { Good } from "@/types";
import { getColumns } from "../inventory/components/columns";
import { DataTable } from "./data-table"; // Use the new local DataTable
import {
  useFirestore,
  errorEmitter,
  FirestorePermissionError,
} from "@/firebase";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Loader2, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import jsPDF from "jspdf";
import "jspdf-autotable";

export default function ExportPage() {
  const [data, setData] = useState<Good[]>([]);
  const [allGoods, setAllGoods] = useState<Good[]>([]);
  const [models, setModels] = useState<string[]>([]);
  const [selectedModel, setSelectedModel] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [rowSelection, setRowSelection] = useState({});
  const db = useFirestore();
  const { toast } = useToast();

  const exportableColumns = useMemo(
    () => getColumns([], []).filter((c) => c.id !== "actions"),
    []
  );

  useEffect(() => {
    if (!db) return;
    setLoading(true);
    const q = query(collection(db, "goods"));
    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const items: Good[] = [];
        const modelSet = new Set<string>();
        querySnapshot.forEach((doc) => {
          const good = { id: doc.id, ...doc.data() } as Good;
          items.push(good);
          if (good.model) {
            modelSet.add(good.model);
          }
        });
        setAllGoods(items);
        setModels(Array.from(modelSet).sort());
        setLoading(false);
      },
      (error) => {
        const contextualError = new FirestorePermissionError({
          path: "goods",
          operation: "list",
        });
        errorEmitter.emit("permission-error", contextualError);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [db]);

  useEffect(() => {
    if (selectedModel) {
      setData(allGoods.filter((item) => item.model === selectedModel));
    } else {
      setData([]);
    }
    // Reset selection when data changes
    setRowSelection({});
  }, [selectedModel, allGoods]);

  const getRowsToExport = (table: any) => {
    const selectedRows = table.getSelectedRowModel().rows;
    if (selectedRows.length > 0) {
      return selectedRows.map((row: any) => row.original);
    }
    return table.getRowModel().rows.map((row: any) => row.original);
  };

  const mapDataForExport = (rows: Good[]) => {
    return rows.map((item) => ({
      ID: item.id,
      "Invoice Number": item.invoiceNumber,
      "Invoice Date": item.invoiceDate?.toDate
        ? format(item.invoiceDate.toDate(), "dd/MM/yyyy")
        : "",
      Model: item.model,
      Type: item.type,
      Composition: item.comp,
      Origin: item.origin,
      Gender: item.gender,
      Quantity: item.quantity,
      Area: item.area,
      Value: item.value,
      "Accessories Value": item.accessoriesValue,
      Weight: item.weight,
      "Accessories Weight": item.accessoriesWeight,
      "Total Value": item.totalValue,
      "Total Weight": item.totalWeight,
      "Date Added": item.createdAt?.toDate
        ? format(item.createdAt.toDate(), "dd/MM/yyyy")
        : "",
    }));
  };

  const exportToCsv = (filename: string, rows: any[]) => {
    if (!rows || !rows.length) {
      toast({
        variant: "destructive",
        title: "No Data",
        description: "There is no data to export for the selected model.",
      });
      return;
    }

    const mappedRows = mapDataForExport(rows);
    const separator = ",";
    const keys = Object.keys(mappedRows[0]);
    const csvContent =
      keys.join(separator) +
      "\n" +
      mappedRows
        .map((row: any) => {
          return keys
            .map((k) => {
              let cell = row[k] === null || row[k] === undefined ? "" : row[k];
              cell =
                cell instanceof Date
                  ? cell.toLocaleString()
                  : cell.toString().replace(/"/g, '""');
              if (cell.search(/("|,|\n)/g) >= 0) {
                cell = `"${cell}"`;
              }
              return cell;
            })
            .join(separator);
        })
        .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", filename);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const exportToPdf = (filename: string, rows: any[]) => {
    if (!rows || !rows.length) {
      toast({
        variant: "destructive",
        title: "No Data",
        description: "There is no data to export for the selected model.",
      });
      return;
    }

    const doc = new jsPDF({ orientation: "landscape" });
    const mappedRows = mapDataForExport(rows);
    const head = [Object.keys(mappedRows[0])];
    const body = mappedRows.map((row: any) => Object.values(row));

    (doc as any).autoTable({
      head: head,
      body: body,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [22, 163, 74] },
    });

    doc.save(filename);
  };

  const handleExport = (table: any, format: "csv" | "pdf") => {
    if (!selectedModel) {
      toast({
        variant: "destructive",
        title: "No Model Selected",
        description: "Please select a model to export.",
      });
      return;
    }
    setIsExporting(true);
    try {
      const rowsToExport = getRowsToExport(table);
      const filename = `inventory-report-${selectedModel.replace(/ /g, "_")}`;
      if (format === "csv") {
        exportToCsv(`${filename}.csv`, rowsToExport);
      } else {
        exportToPdf(`${filename}.pdf`, rowsToExport);
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error Generating Report",
        description: "An unexpected error occurred. Please try again.",
      });
      console.error(error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold md:text-3xl">Export Inventory</h1>
        <p className="text-muted-foreground">
          Filter inventory by model and export the data.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filter by Model</CardTitle>
          <CardDescription>
            Select a model to view and export the corresponding inventory items.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <Select onValueChange={setSelectedModel} disabled={loading}>
            <SelectTrigger className="w-full sm:w-[280px]">
              <SelectValue
                placeholder={loading ? "Loading models..." : "Select a model"}
              />
            </SelectTrigger>
            <SelectContent>
              {models.map((model) => (
                <SelectItem key={model} value={model}>
                  {model}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {selectedModel && (
        <DataTable
          columns={exportableColumns}
          data={data}
          onExport={handleExport}
          isExporting={isExporting}
          rowSelection={rowSelection}
          setRowSelection={setRowSelection}
        />
      )}
    </div>
  );
}
