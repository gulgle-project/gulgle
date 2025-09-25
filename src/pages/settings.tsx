import { Page } from "@/components/layout/page";
import { AddBangForm } from "@/components/settings/bang-form";
import { CustomBangsList } from "@/components/settings/custom-bangs-list";
import { DefaultBangSelection } from "@/components/settings/default-bang-selection";
import { ImportExportSettings } from "@/components/settings/import-export-settings";
import { Card } from "@/components/ui/card";

export function SettingsPage() {
  return (
    <Page>
      <h1 className="text-6xl md:text-7xl font-light mb-16 text-gray-800 dark:text-gray-100 select-none tracking-wide">
        Gulgle Settings
      </h1>

      <div className="space-y-8 max-w-4xl">
        <DefaultBangSelection />
        <Card className="p-6">
          <div>
            <h3 className="text-lg font-semibold">Custom Bangs</h3>
          </div>
          <CustomBangsList />
          <AddBangForm />
        </Card>
        <ImportExportSettings />
      </div>
    </Page>
  );
}
