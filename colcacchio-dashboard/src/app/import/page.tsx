import { CsvImporter } from "@/components/csv-importer";

export default function ImportPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Import Data</h1>
      <p className="text-muted-foreground">
        Upload a new CSV export to update the dashboard data without redeploying.
        Data is stored in your browser&apos;s localStorage.
      </p>
      <CsvImporter />
    </div>
  );
}
