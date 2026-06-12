"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScheduleService = void 0;
const SHIFTS = ['pagi', 'siang'];
const SLOTS_PER_SHIFT = 2;
class ScheduleService {
    static getCurrentWeekRange(referenceDate = new Date()) {
        const date = new Date(referenceDate);
        const day = date.getDay();
        const diffToMonday = day === 0 ? -6 : 1 - day;
        const monday = new Date(date);
        monday.setHours(0, 0, 0, 0);
        monday.setDate(date.getDate() + diffToMonday);
        const dates = [];
        for (let i = 0; i < 7; i++) {
            const d = new Date(monday);
            d.setDate(monday.getDate() + i);
            dates.push(this.formatDate(d));
        }
        return {
            start: dates[0],
            end: dates[6],
            dates,
        };
    }
    static formatDate(date) {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    }
    static getDayName(dateStr) {
        const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
        const date = new Date(`${dateStr}T00:00:00`);
        return days[date.getDay()] ?? dateStr;
    }
    static formatDateDisplay(dateStr) {
        const date = new Date(`${dateStr}T00:00:00`);
        return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
    }
    static getShiftLabel(shift) {
        return shift === 'pagi' ? '🌅 Pagi' : '☀️ Siang';
    }
    static generateWeeklySchedule(employees, shiftLimit, weekDates) {
        const verified = employees.filter((e) => e.is_verified && e.id);
        if (verified.length < SLOTS_PER_SHIFT) {
            return null;
        }
        const minRequired = Math.ceil((weekDates.length * SHIFTS.length * SLOTS_PER_SHIFT) / shiftLimit);
        if (verified.length < minRequired) {
            return null;
        }
        for (let attempt = 0; attempt < 200; attempt++) {
            const result = this.tryAssign(verified, shiftLimit, weekDates);
            if (result)
                return result;
        }
        return null;
    }
    static tryAssign(employees, shiftLimit, weekDates) {
        const shiftCount = {};
        const dayShiftUsed = {};
        const schedules = [];
        for (const tanggal of weekDates) {
            for (const shift of SHIFTS) {
                const key = `${tanggal}:${shift}`;
                dayShiftUsed[key] = new Set();
                const pool = this.shuffle(employees.filter((e) => {
                    const id = e.id;
                    const count = shiftCount[id] || 0;
                    if (count >= shiftLimit)
                        return false;
                    const otherShift = shift === 'pagi' ? 'siang' : 'pagi';
                    const otherKey = `${tanggal}:${otherShift}`;
                    if (dayShiftUsed[otherKey]?.has(id))
                        return false;
                    const sameShiftKey = `${tanggal}:${shift}`;
                    if (dayShiftUsed[sameShiftKey]?.has(id))
                        return false;
                    return true;
                }));
                if (pool.length < SLOTS_PER_SHIFT) {
                    return null;
                }
                const selected = pool.slice(0, SLOTS_PER_SHIFT);
                for (const emp of selected) {
                    const id = emp.id;
                    shiftCount[id] = (shiftCount[id] || 0) + 1;
                    dayShiftUsed[key].add(id);
                    schedules.push({
                        tanggal,
                        shift,
                        employee_id: id,
                    });
                }
            }
        }
        return schedules;
    }
    static shuffle(arr) {
        const copy = [...arr];
        for (let i = copy.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [copy[i], copy[j]] = [copy[j], copy[i]];
        }
        return copy;
    }
    static groupSchedulesByDayShift(schedules) {
        const map = new Map();
        for (const s of schedules) {
            const key = `${s.tanggal}:${s.shift}`;
            const list = map.get(key) || [];
            list.push(s);
            map.set(key, list);
        }
        return map;
    }
    static getEmployeeFromSchedule(schedule) {
        if (!schedule.employees)
            return null;
        return Array.isArray(schedule.employees) ? schedule.employees[0] ?? null : schedule.employees;
    }
}
exports.ScheduleService = ScheduleService;
exports.default = ScheduleService;
//# sourceMappingURL=scheduleService.js.map