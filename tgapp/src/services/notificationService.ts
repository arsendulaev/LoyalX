const SERVER_URL = import.meta.env.VITE_NOTIFY_SERVER_URL as string | undefined;

function getChatId(): string | undefined {
  return window.Telegram?.WebApp?.initDataUnsafe?.user?.id?.toString();
}

export async function registerForNotifications(
  walletAddress: string,
  brandAddresses: string[]
): Promise<void> {
  const chatId = getChatId();
  if (!chatId || !SERVER_URL) return;
  try {
    await fetch(`${SERVER_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ walletAddress, chatId, brandAddresses }),
    });
  } catch (e) {
    console.warn('[notifications] register failed:', e);
  }
}

export async function notifyEvent(
  event: string,
  data?: Record<string, string>
): Promise<void> {
  const chatId = getChatId();
  if (!chatId || !SERVER_URL) return;
  try {
    await fetch(`${SERVER_URL}/notify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chatId, event, data }),
    });
  } catch (e) {
    console.warn('[notifications] notify failed:', e);
  }
}
