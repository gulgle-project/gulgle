import { AccountSettings } from "@/components/settings/account/account-settings";
import { Customization } from "@/components/settings/customization/customization";
import { DataSettings } from "@/components/settings/data/data-settings";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRouter } from "@/contexts/router-context";

type Tab = {
  value: string;
  label: string;
  content: React.ReactNode;
};

const SettingTabs: Array<Tab> = [
  {
    value: "account",
    label: "Account",
    content: <AccountSettings />,
  },
  {
    value: "customization",
    label: "Customization",
    content: <Customization />,
  },
  {
    value: "data",
    label: "Data",
    content: <DataSettings />,
  },
];

const SettingsTabsOptions = SettingTabs.map((tab) => tab.value);

type SettingsTabValue = (typeof SettingsTabsOptions)[number];

function isSettingsTab(value: string | null): value is SettingsTabValue {
  return value !== null && SettingsTabsOptions.includes(value as SettingsTabValue);
}

export function SettingsPage() {
  const { queryParams, updateQueryParams } = useRouter();
  const tabParam = queryParams.get("tab");
  const selectedTab: SettingsTabValue = isSettingsTab(tabParam) ? tabParam : "account";

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
          {SettingTabs.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
        {SettingTabs.map((tab) => (
          <TabsContent key={tab.value} value={tab.value}>
            {tab.content}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
