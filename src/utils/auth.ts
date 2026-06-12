export function isAdmin(telegramId: string): boolean {
  const raw = process.env.ADMIN_TELEGRAM_IDS || '';
  const ids = raw.split(',').map((id) => id.trim()).filter(Boolean);
  return ids.includes(telegramId);
}

export function isPrivateChat(chatType: string | undefined): boolean {
  return chatType === 'private';
}

export function isGroupChat(chatType: string | undefined): boolean {
  return chatType === 'group' || chatType === 'supergroup';
}
