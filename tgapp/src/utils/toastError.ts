import toast from 'react-hot-toast';

export function handleTxError(error: unknown) {
  const msg = (error as Error).message ?? '';
  if (msg.includes('Interrupted') || msg.includes('cancel')) {
    toast('Отменено', { icon: '✕' });
  } else {
    toast.error('Ошибка: ' + msg);
  }
}
