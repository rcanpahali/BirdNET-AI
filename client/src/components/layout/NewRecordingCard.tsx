import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Plus } from 'lucide-react';
import { useNewRecordingDialog } from '../../context/NewRecordingDialogContext';

interface NewRecordingCardProps {
  onNavigate?: () => void;
}

/**
 * The sidebar's primary call to action, styled as a distinct physical
 * object -- a floating card with a dial-like "+" -- rather than a
 * standard button, so it doesn't compete with the active nav item's
 * dark green highlight (same --primary color as a default button).
 */
export function NewRecordingCard({ onNavigate }: NewRecordingCardProps) {
  const { t } = useTranslation();
  const { setOpen } = useNewRecordingDialog();
  const navigate = useNavigate();
  const location = useLocation();

  const handleClick = () => {
    setOpen(true);
    if (location.pathname !== '/recordings') navigate('/recordings');
    onNavigate?.();
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="group block w-full rounded-[18px] text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar"
    >
      <span className="flex items-center gap-2.5 rounded-[18px] border border-sidebar-border bg-card px-3.5 py-3 shadow-[0_1px_1px_rgba(35,40,31,0.04),0_8px_16px_-6px_rgba(35,40,31,0.12),inset_0_1px_0_rgba(255,255,255,0.8)] transition-[background-color,border-color,box-shadow] duration-200 ease-out group-hover:border-border group-hover:bg-muted group-hover:shadow-[0_1px_1px_rgba(35,40,31,0.04),0_10px_22px_-6px_rgba(35,40,31,0.2),inset_0_1px_0_rgba(255,255,255,0.8)] group-active:scale-[0.985]">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full border border-border bg-muted shadow-[inset_0_1px_1px_rgba(255,255,255,0.9),inset_0_-1px_1px_rgba(35,40,31,0.06)]">
          <Plus className="size-4 text-foreground" strokeWidth={2.25} />
        </span>
        <span className="flex min-w-0 flex-col gap-0.5">
          <span className="text-sm font-semibold tracking-tight text-foreground">{t('recordings.new')}</span>
          <span className="text-[11px] leading-snug text-muted-foreground">{t('recordings.newCardSubtitle')}</span>
        </span>
      </span>
    </button>
  );
}
