import { useTranslation } from 'react-i18next';
import { Coffee } from 'lucide-react';

/**
 * Floats over the main content area (not the nav chrome) so it stays clear
 * of the sidebar's fixed width -- offset only kicks in at `lg`, where the
 * sidebar is actually visible. Collapsed to a circle by default; the label
 * expands out on hover/focus rather than showing in a separate tooltip, so
 * it also has to double as the accessible name.
 */
export function SupportButton() {
  const { t, i18n } = useTranslation();
  const href = i18n.language === 'de' ? 'https://buymeacoffee.com/rcanpahali?l=de' : 'https://buymeacoffee.com/rcanpahali';

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={t('common.buyMeACoffee')}
      className="group fixed bottom-6 left-6 z-40 flex h-12 items-center overflow-hidden rounded-full bg-[#FFDD00] text-black shadow-lg transition-shadow hover:shadow-xl focus-visible:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 lg:left-[16.5rem]"
    >
      <span className="flex size-12 shrink-0 items-center justify-center">
        <Coffee className="size-5" />
      </span>
      <span className="max-w-0 overflow-hidden whitespace-nowrap text-sm font-medium transition-all duration-700 ease-in-out group-hover:max-w-[min(90vw,32rem)] group-hover:pr-4 group-focus-visible:max-w-[min(90vw,32rem)] group-focus-visible:pr-4">
        {t('common.buyMeACoffee')}
      </span>
    </a>
  );
}
