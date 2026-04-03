import type { CustomBang } from "gulgle-shared";
import { SquarePen, Trash } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useBangManager } from "@/hooks/use-bang-manager.hook";
import { EditCustomBangForm } from "./custom-bang-form";

export function CustomBangList() {
  const { customBangs, removeCustomBang } = useBangManager();
  const [editingBang, setEditingBang] = useState<CustomBang | null>(null);
  const [deletingBang, setDeletingBang] = useState<CustomBang | null>(null);

  if (customBangs.length === 0) {
    return (
      <section className="rounded-xl bg-card p-6 text-card-foreground shadow-xs ring-1 ring-foreground/10">
        <h3 className="text-lg font-semibold">Custom Bangs</h3>
        <p className="mt-1 text-sm text-muted-foreground">No custom bangs added yet.</p>
      </section>
    );
  }

  function onDeleteBang() {
    if (!deletingBang) {
      return;
    }

    removeCustomBang(deletingBang.t);
    toast.success("Bang deleted successfully.");

    if (editingBang?.t === deletingBang.t) {
      setEditingBang(null);
    }

    setDeletingBang(null);
  }

  return (
    <section className="rounded-xl bg-card p-6 text-card-foreground shadow-xs ring-1 ring-foreground/10">
      <div className="mb-4">
        <h3 className="text-lg font-semibold">Custom Bangs</h3>
        <p className="mt-1 text-sm text-muted-foreground">Edit or remove your personal search shortcuts.</p>
      </div>
      <div className="space-y-4">
        {customBangs.map((bang) => (
          <CustomBangListItem
            bang={bang}
            key={bang.t}
            onDelete={(bang) => setDeletingBang(bang)}
            onEdit={(bang) => setEditingBang(bang)}
          />
        ))}
      </div>

      <Dialog onOpenChange={(open) => !open && setEditingBang(null)} open={editingBang !== null}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Edit Custom Bang</DialogTitle>
            <DialogDescription>Update your bang trigger, name, and search URL.</DialogDescription>
          </DialogHeader>
          {editingBang && (
            <EditCustomBangForm bang={editingBang} embedded onClose={() => setEditingBang(null)} showHeading={false} />
          )}
        </DialogContent>
      </Dialog>

      <Dialog onOpenChange={(open) => !open && setDeletingBang(null)} open={deletingBang !== null}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Custom Bang</DialogTitle>
            <DialogDescription>
              {deletingBang
                ? `Are you sure you want to delete the bang "!${deletingBang.t}"? This action cannot be undone.`
                : "Are you sure you want to delete this bang?"}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setDeletingBang(null)} type="button" variant="outline">
              Cancel
            </Button>
            <Button onClick={onDeleteBang} type="button" variant="destructive">
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}

type CustomBangListItemProps = {
  bang: CustomBang;
  onEdit: (bang: CustomBang) => void;
  onDelete: (bang: CustomBang) => void;
};

function CustomBangListItem({ bang, onEdit, onDelete }: CustomBangListItemProps) {
  return (
    <div className="flex flex-col items-start justify-between bg-accent rounded-md border p-4 gap-4">
      <p className="text-sm">
        <span className="font-medium">!{bang.t}</span> - {bang.s}
      </p>

      <Tooltip>
        <TooltipTrigger className="w-full text-left" title={bang.u}>
          <span className="block truncate text-sm text-muted-foreground">{bang.u}</span>
        </TooltipTrigger>
        <TooltipContent>{bang.u}</TooltipContent>
      </Tooltip>

      <div className="flex w-full gap-2">
        <Button className="flex-1" onClick={() => onEdit(bang)} variant="default">
          <SquarePen /> Edit
        </Button>
        <Button className="flex-1" onClick={() => onDelete(bang)} variant="destructive">
          <Trash /> Delete
        </Button>
      </div>
    </div>
  );
}
