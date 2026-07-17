import { CloudSync } from "./cloud-sync";
import { DeleteAccount } from "./delete-account";

export function AccountSettings() {
  return (
    <div className="space-y-6">
      <CloudSync />
      <DeleteAccount />
    </div>
  );
}
