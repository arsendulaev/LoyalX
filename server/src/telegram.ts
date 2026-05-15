const BOT_TOKEN = process.env.BOT_TOKEN;
if (!BOT_TOKEN) {
  console.error('[telegram] BOT_TOKEN is not set. Aborting.');
  process.exit(1);
}

export async function sendTelegramMessage(chatId: string, text: string): Promise<boolean> {
  if (!chatId || chatId === 'undefined' || chatId === 'null') {
    console.error(`[telegram] refusing to send: invalid chatId="${chatId}"`);
    return false;
  }
  try {
    const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' }),
    });
    if (!res.ok) {
      const body = await res.text();
      console.error(`[telegram] error ${res.status} chatId=${chatId}: ${body}`);
      return false;
    }
    return true;
  } catch (e) {
    console.error(`[telegram] fetch failed chatId=${chatId}:`, e);
    return false;
  }
}

export function formatMessage(event: string, data?: Record<string, string>): string {
  switch (event) {
    case 'mint':
      return `💸 <b>Минт выполнен</b>\nНачислены токены <b>${data?.symbol ?? ''}</b>.`;
    case 'swap':
      return `🔄 <b>Обмен выполнен</b>\nОтправлен обмен ${data?.amount ?? ''} <b>${data?.fromSymbol ?? ''}</b> → <b>${data?.toSymbol ?? ''}</b>.`;
    case 'brand_created':
      return `🚀 <b>Бренд создан</b>\nВаш токен <b>${data?.name ?? ''}</b> (<b>${data?.symbol ?? ''}</b>) успешно создан!`;
    case 'rate_proposed':
      return `📤 <b>Предложение отправлено</b>\nКурс для <b>${data?.targetSymbol ?? data?.target ?? ''}</b> предложен другой стороне.`;
    case 'rate_accepted_incoming':
      return `🔔 <b>Входящее предложение курса</b>\nБренд <b>${data?.proposerSymbol ?? data?.proposer ?? ''}</b> предложил курс обмена для вашего <b>${data?.mySymbol ?? data?.myBrand ?? ''}</b>.\nОткройте приложение → Курсы, чтобы принять или отклонить.`;
    case 'rate_accepted_outgoing':
      return `✅ <b>Ваше предложение принято!</b>\nБренд <b>${data?.acceptorSymbol ?? data?.acceptor ?? ''}</b> принял ваш предложенный курс для <b>${data?.mySymbol ?? data?.myBrand ?? ''}</b>.\nОбмен теперь активен.`;
    default:
      return `🔔 Уведомление: ${event}`;
  }
}
