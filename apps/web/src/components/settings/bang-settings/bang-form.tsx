import type { CustomBang } from "gulgle-shared";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useBangManager } from "@/hooks/use-bang-manager.hook";
import { removeLeadingBangs } from "@/utils/bang.utils";

function BangForm({
  bang,
  embedded = false,
  onClose,
  showHeading = true,
}: {
  bang?: CustomBang;
  embedded?: boolean;
  onClose?: () => void;
  showHeading?: boolean;
}) {
  const [trigger, setTrigger] = useState<string>(bang?.t || "");
  const [name, setName] = useState<string>(bang?.s || "");
  const [url, setUrl] = useState<string>(bang?.u || "");
  const fieldIdPrefix = bang ? `edit-bang-${bang.t}` : "add-bang";

  const { addCustomBang, updateCustomBang } = useBangManager();

  function onSubmitForm(e: React.FormEvent) {
    e.preventDefault();

    if (!trigger || !name || !url) {
      return;
    }

    const newBang: CustomBang = {
      t: removeLeadingBangs(trigger),
      s: name,
      u: url,
      d: new URL(url).hostname,
      c: true,
    };

    if (bang) {
      updateCustomBang(bang.t, newBang);
    } else {
      addCustomBang(newBang);
    }

    setTrigger("");
    setName("");
    setUrl("");
    toast.success(`Bang ${bang ? "updated" : "created"} successfully.`);

    onClose?.();
  }

  const formContent = (
    <div className="space-y-3">
      {showHeading ? (
        <div>
          <h3 className="text-lg font-semibold">{bang ? "Edit" : "Add"} Custom Bang</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Use %s in the URL where the search query should be inserted.
          </p>
        </div>
      ) : null}
      <div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label className="block" htmlFor={`${fieldIdPrefix}-trigger`}>
              Bang
            </Label>
            <Input
              id={`${fieldIdPrefix}-trigger`}
              onChange={(e) => setTrigger(e.target.value)}
              placeholder="example"
              type="text"
              value={trigger}
            />
          </div>
          <div className="space-y-2">
            <Label className="block" htmlFor={`${fieldIdPrefix}-name`}>
              Name
            </Label>
            <Input
              id={`${fieldIdPrefix}-name`}
              onChange={(e) => setName(e.target.value)}
              placeholder="Example"
              type="text"
              value={name}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label className="block" htmlFor={`${fieldIdPrefix}-url`}>
              URL
            </Label>
            <Input
              id={`${fieldIdPrefix}-url`}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com/search?q=%s"
              type="text"
              value={url}
            />
          </div>
          <div className="sm:col-span-2">
            <div className={bang ? "grid grid-cols-2 gap-2" : "grid grid-cols-1"}>
              {bang ? (
                <Button onClick={onClose} type="button" variant="outline">
                  Cancel
                </Button>
              ) : null}
              <Button type="submit">{bang ? "Save Changes" : "Add Bang"}</Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <form onSubmit={onSubmitForm}>
      {embedded ? (
        formContent
      ) : (
        <section className="rounded-xl bg-card p-6 text-card-foreground shadow-xs ring-1 ring-foreground/10">
          {formContent}
        </section>
      )}
    </form>
  );
}

export function AddBangForm() {
  return <BangForm />;
}

export function EditBangForm({
  bang,
  embedded,
  onClose,
  showHeading,
}: {
  bang: CustomBang;
  embedded?: boolean;
  onClose: () => void;
  showHeading?: boolean;
}) {
  return <BangForm bang={bang} embedded={embedded} onClose={onClose} showHeading={showHeading} />;
}
