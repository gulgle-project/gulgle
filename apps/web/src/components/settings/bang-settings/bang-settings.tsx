import { AddBangForm } from "./bang-form";
import { CustomBangList } from "./custom-bang-list";
import { DefaultBangSelection } from "./default-bang-selection";

export function BangSettings() {
  return (
    <div className="flex flex-row gap-4 w-full">
      <div className="flex flex-col gap-4 w-1/2">
        <DefaultBangSelection />
        <AddBangForm />
      </div>
      <div className="flex flex-col w-1/2">
        <CustomBangList />
      </div>
    </div>
  );
}
