import type { Employee, Schedule, ShiftType } from '../types/index.js';
export interface WeekRange {
    start: string;
    end: string;
    dates: string[];
}
export declare class ScheduleService {
    static getCurrentWeekRange(referenceDate?: Date): WeekRange;
    static formatDate(date: Date): string;
    static getDayName(dateStr: string): string;
    static formatDateDisplay(dateStr: string): string;
    static getShiftLabel(shift: ShiftType): string;
    static generateWeeklySchedule(employees: Employee[], shiftLimit: number, weekDates: string[]): Omit<Schedule, 'id' | 'created_at'>[] | null;
    private static tryAssign;
    private static shuffle;
    static groupSchedulesByDayShift(schedules: Schedule[]): Map<string, Schedule[]>;
    static getEmployeeFromSchedule(schedule: Schedule): Employee | null;
}
export default ScheduleService;
//# sourceMappingURL=scheduleService.d.ts.map