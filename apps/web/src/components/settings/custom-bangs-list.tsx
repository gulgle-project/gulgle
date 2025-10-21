import type { CustomBang } from "gulgle-shared";
import { useState } from "react";
import { toast } from "sonner";
import { useBangManager } from "@/hooks/use-bang-manager.hook";
import { Button } from "../ui/button";
import { EditBangInlineForm } from "./bang-form";

export function CustomBangsList() {
  const { customBangs, removeCustomBang } = useBangManager();
  const [editingBang, setEditingBang] = useState<string | null>(null);

  if (customBangs.length === 0) {
    return <p className="text-center text-neutral-500">No custom bangs added yet.</p>;
  }

  function onDeleteBang(bang: CustomBang) {
    if (confirm(`Are you sure you want to delete the bang "!${bang.t}"?`)) {
      removeCustomBang(bang.t);
      toast.success("Bang deleted successfully.");
      if (editingBang === bang.t) {
        setEditingBang(null);
      }
    }
  }

  return (
    <div className="space-y-4">
      {customBangs.map((bang) => (
        <div key={bang.t}>
          {editingBang === bang.t ? (
            <EditBangInlineForm bang={bang} onClose={() => setEditingBang(null)} />
          ) : (
            <div className="flex items-center justify-between border border-neutral-200 dark:border-neutral-700 rounded-md p-4">
              <div>
                <p className="font-medium text-lg">{bang.s}</p>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">{bang.u}</p>
                <p className="text-sm text-neutral-400 dark:text-neutral-500">Trigger: !{bang.t}</p>
              </div>
              <div className="flex space-x-2">
                <Button className="w-20" onClick={() => setEditingBang(bang.t)} variant="outline">
                  Edit
                </Button>
                <Button className="w-20" onClick={() => onDeleteBang(bang)} variant="destructive">
                  Delete
                </Button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
