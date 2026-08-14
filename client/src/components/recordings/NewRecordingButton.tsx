import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Plus } from 'lucide-react';
import { Button } from '../ui/button';
import type { ButtonProps } from '../ui/button';
import { useNewRecordingDialog } from '../../context/NewRecordingDialogContext';

/**
 * Opens the New Recording dialog on the Recordings page -- navigating there
 * first if clicked from anywhere else. The dialog itself only ever renders
 * on RecordingsPage; this button just requests it open.
 */
export function NewRecordingButton(props: Omit<ButtonProps, 'onClick' | 'children'>) {
  const { t } = useTranslation();
  const { setOpen } = useNewRecordingDialog();
  const navigate = useNavigate();
  const location = useLocation();

  const handleClick = () => {
    setOpen(true);
    if (location.pathname !== '/recordings') navigate('/recordings');
  };

  return (
    <Button onClick={handleClick} {...props}>
      <Plus /> {t('recordings.new')}
    </Button>
  );
}
