import { BangSettings } from "@/components/settings/bang-settings/bang-settings";
import { ImportExportSettings } from "@/components/settings/import-export-settings";

import { SyncSettings } from "@/components/settings/sync-settings";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function SettingsPage() {
  return (
    <div className="w-full max-w-3xl mx-auto p-4">
      <Tabs className="w-full" defaultValue="account">
        <TabsList variant="line">
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="bangs">Bangs</TabsTrigger>
          <TabsTrigger value="import_export">Import/Export</TabsTrigger>
        </TabsList>
        <TabsContent value="account">
          <SyncSettings />
        </TabsContent>
        <TabsContent value="bangs">
          <BangSettings />
        </TabsContent>
        <TabsContent value="import_export">
          <ImportExportSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
}
