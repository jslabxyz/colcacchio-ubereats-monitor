"use client";

import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function CsvImporter() {
  const [dragActive, setDragActive] = useState(false);
  const [status, setStatus] = useState<"idle" | "preview" | "saved">("idle");
  const [preview, setPreview] = useState<{ rows: number; stores: number } | null>(null);
  const [fileName, setFileName] = useState<string>("");

  const handleFile = useCallback((file: File) => {
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.trim().split("\n");
      const storeNames = new Set<string>();
      for (let i = 1; i < lines.length; i++) {
        // Extract store_name (5th column, 0-indexed: 4)
        const parts = lines[i].split(",");
        if (parts[4]) storeNames.add(parts[4].replace(/"/g, ""));
      }
      setPreview({ rows: lines.length - 1, stores: storeNames.size });
      setStatus("preview");

      // Store in localStorage
      localStorage.setItem("colcacchio-csv-data", text);
      localStorage.setItem("colcacchio-csv-date", new Date().toISOString());
    };
    reader.readAsText(file);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragActive(false);
      if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
    },
    [handleFile]
  );

  const handleReset = () => {
    localStorage.removeItem("colcacchio-csv-data");
    localStorage.removeItem("colcacchio-csv-date");
    setStatus("idle");
    setPreview(null);
    setFileName("");
  };

  const savedDate = typeof window !== "undefined"
    ? localStorage.getItem("colcacchio-csv-date")
    : null;

  return (
    <div className="space-y-6">
      {/* Upload area */}
      <Card
        className={`border-2 border-dashed transition-colors ${
          dragActive ? "border-primary bg-primary/5" : "border-muted"
        }`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
      >
        <CardContent className="flex flex-col items-center justify-center py-12">
          <p className="text-lg font-medium">
            {dragActive ? "Drop CSV file here" : "Drag & drop a CSV file"}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Or click to browse
          </p>
          <input
            type="file"
            accept=".csv"
            className="absolute inset-0 cursor-pointer opacity-0"
            onChange={(e) => {
              if (e.target.files?.[0]) handleFile(e.target.files[0]);
            }}
          />
        </CardContent>
      </Card>

      {/* Preview */}
      {status === "preview" && preview && (
        <Card>
          <CardHeader>
            <CardTitle>Import Preview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm">
              File: <span className="font-medium">{fileName}</span>
            </p>
            <div className="flex gap-4">
              <Badge variant="secondary">{preview.rows} rows</Badge>
              <Badge variant="secondary">{preview.stores} stores</Badge>
            </div>
            <p className="text-sm text-green-600">
              Data saved to browser storage. Reload the page to use the new data.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Saved data info */}
      {savedDate && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Stored Data
              <Button variant="destructive" size="sm" onClick={handleReset}>
                Reset to Built-in Data
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Last imported: {new Date(savedDate).toLocaleString()}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>CSV Format</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>The CSV should match the Uber Eats extract format with these columns:</p>
          <code className="block rounded bg-muted p-3 text-xs">
            item_name, item_name_citation, category, category_citation, store_name,
            store_name_citation, store_location, store_location_citation, store_rating,
            store_rating_citation, store_review_count, store_review_count_citation,
            special_name, special_name_citation, special_description, special_description_citation
          </code>
        </CardContent>
      </Card>
    </div>
  );
}
