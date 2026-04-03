import { AddBangForm } from "./bang-form";
import { CustomBangList } from "./custom-bang-list";
import { DefaultBangSelection } from "./default-bang-selection";

export function BangSettings() {
  return (
    <div className="grid w-full gap-4 lg:grid-cols-[minmax(300px,380px)_minmax(0,1fr)] lg:items-start">
      <div className="space-y-4">
        <DefaultBangSelection />
        <AddBangForm />
      </div>
      <div className="min-w-0 w-full">
        <CustomBangList />
      </div>
    </div>
  );
}
