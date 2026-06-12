import type { UserSession, RegistrationState, EmployeeRegistrationState, AdminScheduleState, SessionFlow } from '../types';

class SessionManager {
  private sessions: Map<string, UserSession> = new Map();

  getSession(telegramId: string): UserSession | null {
    return this.sessions.get(telegramId) || null;
  }

  setSession(
    telegramId: string,
    flow: SessionFlow,
    state: UserSession['state'],
    data: Partial<UserSession['data']> = {}
  ): void {
    const existingSession = this.sessions.get(telegramId);

    const session: UserSession = {
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

  updateSessionData(telegramId: string, data: Partial<UserSession['data']>): void {
    const session = this.sessions.get(telegramId);
    if (session) {
      session.data = { ...session.data, ...data };
      this.sessions.set(telegramId, session);
      console.log(`📝 Session data updated for ${telegramId}:`, session.data);
    }
  }

  clearSession(telegramId: string): void {
    this.sessions.delete(telegramId);
    console.log(`🗑️ Session cleared for ${telegramId}`);
  }

  isInRegistrationFlow(telegramId: string): boolean {
    const session = this.sessions.get(telegramId);
    if (!session) return false;
    return session.state !== 'completed' && session.state !== 'employee_completed';
  }

  isInEmployeeFlow(telegramId: string): boolean {
    const session = this.sessions.get(telegramId);
    return session?.flow === 'employee' && session.state !== 'employee_completed';
  }

  isInAdminScheduleFlow(telegramId: string): boolean {
    const session = this.sessions.get(telegramId);
    return session?.flow === 'admin_schedule';
  }

  getFlow(telegramId: string): SessionFlow | null {
    return this.sessions.get(telegramId)?.flow || null;
  }

  getRegistrationState(telegramId: string): RegistrationState | null {
    const session = this.sessions.get(telegramId);
    if (!session || session.flow !== 'driver') return null;
    return session.state as RegistrationState;
  }

  getEmployeeState(telegramId: string): EmployeeRegistrationState | null {
    const session = this.sessions.get(telegramId);
    if (!session || session.flow !== 'employee') return null;
    return session.state as EmployeeRegistrationState;
  }

  getAdminScheduleState(telegramId: string): AdminScheduleState | null {
    const session = this.sessions.get(telegramId);
    if (!session || session.flow !== 'admin_schedule') return null;
    return session.state as AdminScheduleState;
  }

  getSessionData(telegramId: string): UserSession['data'] | null {
    const session = this.sessions.get(telegramId);
    return session ? session.data : null;
  }

  getAllSessions(): Map<string, UserSession> {
    return new Map(this.sessions);
  }

  cleanupOldSessions(): void {
    console.log(`🧹 Session cleanup attempted (${this.sessions.size} active sessions)`);
  }
}

export const sessionManager = new SessionManager();
export default sessionManager;
