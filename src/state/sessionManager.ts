import { UserSession, RegistrationState } from '../types';

class SessionManager {
  private sessions: Map<string, UserSession> = new Map();

  // Get user session
  getSession(telegramId: string): UserSession | null {
    return this.sessions.get(telegramId) || null;
  }

  // Create or update session
  setSession(telegramId: string, state: RegistrationState, data: Partial<UserSession['data']> = {}): void {
    const existingSession = this.sessions.get(telegramId);
    
    const session: UserSession = {
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
  updateSessionData(telegramId: string, data: Partial<UserSession['data']>): void {
    const session = this.sessions.get(telegramId);
    if (session) {
      session.data = { ...session.data, ...data };
      this.sessions.set(telegramId, session);
      console.log(`📝 Session data updated for ${telegramId}:`, session.data);
    }
  }

  // Clear session
  clearSession(telegramId: string): void {
    this.sessions.delete(telegramId);
    console.log(`🗑️ Session cleared for ${telegramId}`);
  }

  // Check if user is in registration flow
  isInRegistrationFlow(telegramId: string): boolean {
    const session = this.sessions.get(telegramId);
    return session ? session.state !== 'completed' : false;
  }

  // Get current registration state
  getRegistrationState(telegramId: string): RegistrationState | null {
    const session = this.sessions.get(telegramId);
    return session ? session.state : null;
  }

  // Get session data
  getSessionData(telegramId: string): UserSession['data'] | null {
    const session = this.sessions.get(telegramId);
    return session ? session.data : null;
  }

  // Get all active sessions (for debugging)
  getAllSessions(): Map<string, UserSession> {
    return new Map(this.sessions);
  }

  // Clean up old sessions (optional - can be called periodically)
  cleanupOldSessions(maxAgeHours: number = 24): void {
    const now = Date.now();
    const maxAge = maxAgeHours * 60 * 60 * 1000; // Convert to milliseconds

    // Note: This is a simple cleanup. In production, you might want to store timestamps
    // For now, we'll just log the cleanup attempt
    console.log(`🧹 Session cleanup attempted (${this.sessions.size} active sessions)`);
  }
}

// Export singleton instance
export const sessionManager = new SessionManager();
export default sessionManager;