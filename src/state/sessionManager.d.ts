import { UserSession, RegistrationState } from '../types';
declare class SessionManager {
    private sessions;
    getSession(telegramId: string): UserSession | null;
    setSession(telegramId: string, state: RegistrationState, data?: Partial<UserSession['data']>): void;
    updateSessionData(telegramId: string, data: Partial<UserSession['data']>): void;
    clearSession(telegramId: string): void;
    isInRegistrationFlow(telegramId: string): boolean;
    getRegistrationState(telegramId: string): RegistrationState | null;
    getSessionData(telegramId: string): UserSession['data'] | null;
    getAllSessions(): Map<string, UserSession>;
    cleanupOldSessions(maxAgeHours?: number): void;
}
export declare const sessionManager: SessionManager;
export default sessionManager;
//# sourceMappingURL=sessionManager.d.ts.map