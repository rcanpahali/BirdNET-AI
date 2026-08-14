import { useTranslation } from 'react-i18next';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '../ui/button';

interface PaginationProps {
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ page, pageCount, onPageChange }: PaginationProps) {
  const { t } = useTranslation();

  return (
    <div className="flex items-center justify-between gap-3">
      <p className="text-xs text-muted-foreground">{t('common.pageOf', { page, count: pageCount })}</p>
      <div className="flex items-center gap-1.5">
        <Button
          variant="outline"
          size="icon"
          className="h-11 w-11"
          aria-label={t('common.previousPage')}
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronLeft className="size-5" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="h-11 w-11"
          aria-label={t('common.nextPage')}
          disabled={page >= pageCount}
          onClick={() => onPageChange(page + 1)}
        >
          <ChevronRight className="size-5" />
        </Button>
      </div>
    </div>
  );
}
