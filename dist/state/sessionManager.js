"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sessionManager = void 0;
class SessionManager {
    sessions = new Map();
    getSession(telegramId) {
        return this.sessions.get(telegramId) || null;
    }
    setSession(telegramId, flow, state, data = {}) {
        const existingSession = this.sessions.get(telegramId);
        const session = {
            telegramId,
            flow,
            state,
            data: {
                ...existingSession?.data,
                ...data,
            },
        };
        this.sessions.set(telegramId, session);
        console.log(`📝 Session updated for ${telegramId} [${flow}]: ${state}`, session.data);
    }
    updateSessionData(telegramId, data) {
        const session = this.sessions.get(telegramId);
        if (session) {
            session.data = { ...session.data, ...data };
            this.sessions.set(telegramId, session);
            console.log(`📝 Session data updated for ${telegramId}:`, session.data);
        }
    }
    clearSession(telegramId) {
        this.sessions.delete(telegramId);
        console.log(`🗑️ Session cleared for ${telegramId}`);
    }
    isInRegistrationFlow(telegramId) {
        const session = this.sessions.get(telegramId);
        if (!session)
            return false;
        return session.state !== 'completed' && session.state !== 'employee_completed';
    }
    isInEmployeeFlow(telegramId) {
        const session = this.sessions.get(telegramId);
        return session?.flow === 'employee' && session.state !== 'employee_completed';
    }
    isInAdminScheduleFlow(telegramId) {
        const session = this.sessions.get(telegramId);
        return session?.flow === 'admin_schedule';
    }
    getFlow(telegramId) {
        return this.sessions.get(telegramId)?.flow || null;
    }
    getRegistrationState(telegramId) {
        const session = this.sessions.get(telegramId);
        if (!session || session.flow !== 'driver')
            return null;
        return session.state;
    }
    getEmployeeState(telegramId) {
        const session = this.sessions.get(telegramId);
        if (!session || session.flow !== 'employee')
            return null;
        return session.state;
    }
    getAdminScheduleState(telegramId) {
        const session = this.sessions.get(telegramId);
        if (!session || session.flow !== 'admin_schedule')
            return null;
        return session.state;
    }
    getSessionData(telegramId) {
        const session = this.sessions.get(telegramId);
        return session ? session.data : null;
    }
    getAllSessions() {
        return new Map(this.sessions);
    }
    cleanupOldSessions() {
        console.log(`🧹 Session cleanup attempted (${this.sessions.size} active sessions)`);
    }
}
exports.sessionManager = new SessionManager();
exports.default = exports.sessionManager;
//# sourceMappingURL=sessionManager.js.map