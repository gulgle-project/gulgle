import type { CustomBang } from "gulgle-shared";
import { useState } from "react";
import { toast } from "sonner";
import { useBangManager } from "@/hooks/use-bang-manager.hook";
import { removeLeadingBangs } from "@/lib/utils";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { Input } from "../ui/input";
import { Label } from "../ui/label";

function BangForm({ bang, onClose }: { bang?: CustomBang; onClose?: () => void }) {
  const [trigger, setTrigger] = useState<string>(bang?.t || "");
  const [name, setName] = useState<string>(bang?.s || "");
  const [url, setUrl] = useState<string>(bang?.u || "");

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

  return (
    <form onSubmit={onSubmitForm}>
      <Card className="p-6">
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold">{bang ? "Edit" : "Add"} Custom bang</h3>
          </div>
          <div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="mb-2" htmlFor="trigger">
                  Bang
                </Label>
                <Input
                  className="flex-1 text-lg border-none bg-none dark:bg-none shadow-none focus:ring-0 p-2 h-8"
                  onChange={(e) => setTrigger(e.target.value)}
                  placeholder="example"
                  type="text"
                  value={trigger}
                />
              </div>
              <div>
                <Label className="mb-2" htmlFor="name">
                  Name
                </Label>
                <Input
                  className="flex-1 text-lg border-none bg-none dark:bg-none shadow-none focus:ring-0 p-2 h-8"
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Example"
                  type="text"
                  value={name}
                />
              </div>
              <div className="col-span-2">
                <Label className="mb-2" htmlFor="url">
                  URL
                </Label>
                <Input
                  className="flex-1 text-lg border-none bg-none dark:bg-none shadow-none focus:ring-0 p-2 h-8"
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://example.com/search?q=%s"
                  type="text"
                  value={url}
                />
              </div>
              <div className={bang ? "" : "col-span-2"}>
                <Button className="w-full" type="submit">
                  {bang ? "Save Changes" : "Add Bang"}
                </Button>
              </div>
              <div className={bang ? "" : "hidden"}>
                <Button className="w-full" onClick={onClose} type="button">
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </form>
  );
}

export function AddBangForm() {
  return <BangForm />;
}

export function EditBangInlineForm({ bang, onClose }: { bang: CustomBang; onClose: () => void }) {
  return <BangForm bang={bang} onClose={onClose} />;
}
