import { Settings } from 'lucide-react';
import { PageHeader } from '../components/shared/PageHeader';
import { EmptyState } from '../components/shared/EmptyState';
import { Card, CardContent } from '../components/ui/card';
import { PlaceholderBadge } from '../components/shared/PlaceholderBadge';

export function SettingsPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Settings" description="Account, project, and platform preferences." />
      <Card className="border-dashed">
        <CardContent className="p-0">
          <EmptyState
            icon={Settings}
            title="Settings aren't implemented yet"
            description="There's no user/account system or configurable preferences yet -- this page is a placeholder for where they'll live."
            action={<PlaceholderBadge label="Coming soon" note="No settings are wired up to a backend yet." />}
          />
        </CardContent>
      </Card>
    </div>
  );
}

export default SettingsPage;
