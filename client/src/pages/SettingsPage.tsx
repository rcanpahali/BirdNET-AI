import { useTranslation } from 'react-i18next';
import { Settings } from 'lucide-react';
import { PageHeader } from '../components/shared/PageHeader';
import { EmptyState } from '../components/shared/EmptyState';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { PlaceholderBadge } from '../components/shared/PlaceholderBadge';
import { LanguageToggle } from '../components/layout/LanguageToggle';

export function SettingsPage() {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <PageHeader title={t('nav.settings')} description={t('settings.description')} />

      <Card>
        <CardHeader>
          <CardTitle>{t('settings.language.title')}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center justify-between gap-4">
          <p className="max-w-md text-sm text-muted-foreground">{t('settings.language.description')}</p>
          <LanguageToggle variant="full" />
        </CardContent>
      </Card>

      <Card className="border-dashed">
        <CardContent className="p-0">
          <EmptyState
            icon={Settings}
            title={t('settings.placeholderTitle')}
            description={t('settings.placeholderDescription')}
            action={<PlaceholderBadge label={t('common.comingSoon')} note={t('settings.placeholderNote')} />}
          />
        </CardContent>
      </Card>
    </div>
  );
}

export default SettingsPage;
