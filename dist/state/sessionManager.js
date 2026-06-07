"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sessionManager = void 0;
class SessionManager {
    sessions = new Map();
    // Get user session
    getSession(telegramId) {
        return this.sessions.get(telegramId) || null;
    }
    // Create or update session
    setSession(telegramId, state, data = {}) {
        const existingSession = this.sessions.get(telegramId);
        const session = {
            telegramId,
            state,
            data: {
                ...existingSession?.data,
                ...data,
            },
        };
        this.sessions.set(telegramId, session);
        console.log(`📝 Session updated for ${telegramId}: ${state}`, session.data);
    }
    // Update session data
    updateSessionData(telegramId, data) {
        const session = this.sessions.get(telegramId);
        if (session) {
            session.data = { ...session.data, ...data };
            this.sessions.set(telegramId, session);
            console.log(`📝 Session data updated for ${telegramId}:`, session.data);
        }
    }
    // Clear session
    clearSession(telegramId) {
        this.sessions.delete(telegramId);
        console.log(`🗑️ Session cleared for ${telegramId}`);
    }
    // Check if user is in registration flow
    isInRegistrationFlow(telegramId) {
        const session = this.sessions.get(telegramId);
        return session ? session.state !== 'completed' : false;
    }
    // Get current registration state
    getRegistrationState(telegramId) {
        const session = this.sessions.get(telegramId);
        return session ? session.state : null;
    }
    // Get session data
    getSessionData(telegramId) {
        const session = this.sessions.get(telegramId);
        return session ? session.data : null;
    }
    // Get all active sessions (for debugging)
    getAllSessions() {
        return new Map(this.sessions);
    }
    // Clean up old sessions (optional - can be called periodically)
    cleanupOldSessions(maxAgeHours = 24) {
        const now = Date.now();
        const maxAge = maxAgeHours * 60 * 60 * 1000; // Convert to milliseconds
        // Note: This is a simple cleanup. In production, you might want to store timestamps
        // For now, we'll just log the cleanup attempt
        console.log(`🧹 Session cleanup attempted (${this.sessions.size} active sessions)`);
    }
}
// Export singleton instance
exports.sessionManager = new SessionManager();
exports.default = exports.sessionManager;
//# sourceMappingURL=sessionManager.js.map