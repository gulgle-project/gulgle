import { useRef } from "react";
import { toast } from "sonner";
import { useBangManager } from "@/hooks/use-bang-manager.hook";
import { Button } from "../ui/button";
import { Card } from "../ui/card";

export function ImportExportSettings() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { exportSettings, importSettings } = useBangManager();

  function handleExport() {
    try {
      const settings = exportSettings();
      const dataStr = JSON.stringify(settings, null, 2);
      const dataBlob = new Blob([dataStr], { type: "application/json" });

      const link = document.createElement("a");
      link.href = URL.createObjectURL(dataBlob);
      link.download = `gulgle-settings-${new Date().toISOString().split("T")[0]}.json`;
      link.click();

      toast.success("Settings exported successfully");
    } catch {
      toast.error("Failed to export settings");
    }
  }

  function handleImport() {
    fileInputRef.current?.click();
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const settings = JSON.parse(text);

        const result = importSettings(settings);

        if (result.success) {
          toast.success(result.message);
        } else {
          toast.error(result.message);
        }
      } catch {
        toast.error("Invalid settings file");
      }
    };

    reader.readAsText(file);

    // Clear the input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold">Import/Export Settings</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Backup and restore your custom bangs and default search engine
          </p>
        </div>

        <input accept=".json" onChange={handleFileChange} ref={fileInputRef} style={{ display: "none" }} type="file" />

        <div className="grid grid-cols-2 gap-4">
          <Button onClick={handleExport} variant="outline">
            Export Settings
          </Button>
          <Button onClick={handleImport} variant="outline">
            Import Settings
          </Button>
        </div>
      </div>
    </Card>
  );
}
