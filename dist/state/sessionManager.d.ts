import type { UserSession, RegistrationState, EmployeeRegistrationState, AdminScheduleState, SessionFlow } from '../types';
declare class SessionManager {
    private sessions;
    getSession(telegramId: string): UserSession | null;
    setSession(telegramId: string, flow: SessionFlow, state: UserSession['state'], data?: Partial<UserSession['data']>): void;
    updateSessionData(telegramId: string, data: Partial<UserSession['data']>): void;
    clearSession(telegramId: string): void;
    isInRegistrationFlow(telegramId: string): boolean;
    isInEmployeeFlow(telegramId: string): boolean;
    isInAdminScheduleFlow(telegramId: string): boolean;
    getFlow(telegramId: string): SessionFlow | null;
    getRegistrationState(telegramId: string): RegistrationState | null;
    getEmployeeState(telegramId: string): EmployeeRegistrationState | null;
    getAdminScheduleState(telegramId: string): AdminScheduleState | null;
    getSessionData(telegramId: string): UserSession['data'] | null;
    getAllSessions(): Map<string, UserSession>;
    cleanupOldSessions(): void;
}
export declare const sessionManager: SessionManager;
export default sessionManager;
//# sourceMappingURL=sessionManager.d.ts.map