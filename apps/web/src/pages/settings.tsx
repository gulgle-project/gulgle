import { BangSettings } from "@/components/settings/bang-settings/bang-settings";
import { ImportExportSettings } from "@/components/settings/import-export-settings";

import { SyncSettings } from "@/components/settings/sync-settings";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRouter } from "@/contexts/router-context";

const SETTINGS_TABS = ["account", "bangs", "import_export"] as const;
type SettingsTab = (typeof SETTINGS_TABS)[number];

function isSettingsTab(value: string | null): value is SettingsTab {
  return value !== null && SETTINGS_TABS.includes(value as SettingsTab);
}

export function SettingsPage() {
  const { queryParams, updateQueryParams } = useRouter();
  const tabParam = queryParams.get("tab");
  const selectedTab: SettingsTab = isSettingsTab(tabParam) ? tabParam : "account";

  function onTabChange(value: string) {
    if (!isSettingsTab(value)) {
      return;
    }

    updateQueryParams({ tab: value });
  }

  return (
    <div className="w-full max-w-3xl mx-auto p-4">
      <Tabs className="w-full" onValueChange={onTabChange} value={selectedTab}>
        <TabsList className="mb-2" variant="line">
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
