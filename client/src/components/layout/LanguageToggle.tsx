import { useTranslation } from 'react-i18next';
import { ChevronsUpDown, Globe } from 'lucide-react';
import { ToggleGroup, ToggleGroupItem } from '../ui/toggle-group';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { SUPPORTED_LANGUAGES } from '../../i18n';
import type { SupportedLanguage } from '../../i18n';

interface LanguageToggleProps {
  /** full: segmented control with self-name labels, for the Settings page. dropdown: compact nav-row-style trigger, for the Sidebar. */
  variant?: 'full' | 'dropdown';
}

function languageLabelKey(lang: SupportedLanguage) {
  return `settings.language.${lang === 'en' ? 'english' : 'german'}` as const;
}

export function LanguageToggle({ variant = 'full' }: LanguageToggleProps) {
  const { t, i18n } = useTranslation();

  if (variant === 'dropdown') {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger
          className="flex w-full items-center gap-2 rounded-lg border border-sidebar-border bg-sidebar-accent/40 px-3 py-2 text-sm font-medium text-sidebar-foreground shadow-sm outline-none transition-colors hover:bg-sidebar-accent focus-visible:ring-2 focus-visible:ring-ring data-[state=open]:bg-sidebar-accent"
          aria-label={t('common.language')}
        >
          <Globe className="size-4 shrink-0 text-sidebar-foreground/70" />
          <span className="flex-1 truncate text-left">{t(languageLabelKey(i18n.language as SupportedLanguage))}</span>
          <ChevronsUpDown className="size-3.5 shrink-0 text-sidebar-foreground/60" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="min-w-[var(--radix-dropdown-menu-trigger-width)]">
          <DropdownMenuRadioGroup value={i18n.language} onValueChange={(value) => i18n.changeLanguage(value)}>
            {SUPPORTED_LANGUAGES.map((lang) => (
              <DropdownMenuRadioItem key={lang} value={lang}>
                {t(languageLabelKey(lang))}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <ToggleGroup
      type="single"
      value={i18n.language}
      onValueChange={(value) => value && i18n.changeLanguage(value)}
      aria-label={t('common.language')}
    >
      {SUPPORTED_LANGUAGES.map((lang) => (
        <ToggleGroupItem key={lang} value={lang}>
          {t(languageLabelKey(lang))}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}
