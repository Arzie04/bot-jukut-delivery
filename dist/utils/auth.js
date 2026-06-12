"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isAdmin = isAdmin;
exports.isPrivateChat = isPrivateChat;
exports.isGroupChat = isGroupChat;
function isAdmin(telegramId) {
    const raw = process.env.ADMIN_TELEGRAM_IDS || '';
    const ids = raw.split(',').map((id) => id.trim()).filter(Boolean);
    return ids.includes(telegramId);
}
function isPrivateChat(chatType) {
    return chatType === 'private';
}
function isGroupChat(chatType) {
    return chatType === 'group' || chatType === 'supergroup';
}
//# sourceMappingURL=auth.js.map