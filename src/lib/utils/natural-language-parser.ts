/**
 * Natural Language Parser for Quick Task Entry
 * 
 * Parses natural language input into structured task data.
 * Supports: dates, times, tags (#), priorities (!), workspaces (@), and pomodoros (~)
 * 
 * @example
 * parseNaturalLanguageTask("Meeting tomorrow at 3pm #work !high ~2")
 * // Returns: { title: "Meeting", dueDate: Date, tags: ["work"], priority: "high", pomodoros: 2 }
 * 
 * @module NaturalLanguageParser
 */

import type { Workspace } from '@/lib/types';
import { Priority } from '@/lib/priority';

/** Result of parsing a natural language task input */
export type ParsedTask = {
  /** The cleaned task title */
  title: string;
  /** Extracted tags (from #tag syntax) */
  tags: string[];
  /** Task priority (from !high, !medium, !low syntax) */
  priority?: Priority;
  /** Workspace assignment (from @work, @personal syntax) */
  workspace?: Workspace;
  /** Parsed due date */
  dueDate?: Date;
  /** Number of pomodoros (from ~N syntax) */
  pomodoros?: number;
};

// Date patterns
const DATE_PATTERNS = {
  today: /\b(today)\b/i,
  tomorrow: /\b(tomorrow)\b/i,
  dayAfterTomorrow: /\b(day after tomorrow)\b/i,
  nextWeek: /\b(next week)\b/i,
  thisWeekend: /\b(this weekend)\b/i,
  nextMonth: /\b(next month)\b/i,
  // Relative days: "in 3 days", "in a week"
  inDays: /\bin (\d+) days?\b/i,
  inWeeks: /\bin (\d+) weeks?\b/i,
  inMonths: /\bin (\d+) months?\b/i,
  // Named days: "on Monday", "next Friday"
  onDay: /\b(?:on |next )?(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i,
  // Specific dates: "Dec 25", "December 25", "12/25", "25/12"
  monthDay: /\b(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+(\d{1,2})(?:st|nd|rd|th)?\b/i,
  dateSlash: /\b(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?\b/,
  // Time patterns: "at 3pm", "at 15:00", "at 3:30pm"
  atTime: /\bat (\d{1,2})(?::(\d{2}))?\s*(am|pm)?\b/i,
};

// Priority patterns: !high, !urgent, !!!, !1, !2, !3
const PRIORITY_PATTERNS = {
  high: /(!high|!urgent|!!!|!1)\b/i,
  medium: /(!medium|!normal|!!|!2)\b/i,
  low: /(!low|!|!3)\b/i,
};

// Workspace patterns: @work, @personal, @side-project
const WORKSPACE_PATTERNS = {
  work: /@work\b/i,
  personal: /@personal\b/i,
  'side-project': /@(side-project|sideproject|side)\b/i,
};

// Tag pattern: #tag
const TAG_PATTERN = /#(\w+(?:-\w+)*)/g;

// Pomodoro pattern: ~3, ~4p
const POMODORO_PATTERN = /~(\d+)p?\b/i;

const DAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

const MONTHS: Record<string, number> = {
  jan: 0, january: 0,
  feb: 1, february: 1,
  mar: 2, march: 2,
  apr: 3, april: 3,
  may: 4,
  jun: 5, june: 5,
  jul: 6, july: 6,
  aug: 7, august: 7,
  sep: 8, september: 8,
  oct: 9, october: 9,
  nov: 10, november: 10,
  dec: 11, december: 11,
};

function getNextDayOfWeek(dayName: string): Date {
  const targetDay = DAYS.indexOf(dayName.toLowerCase());
  const today = new Date();
  const currentDay = today.getDay();
  let daysUntil = targetDay - currentDay;

  if (daysUntil <= 0) {
    daysUntil += 7;
  }

  const result = new Date(today);
  result.setDate(today.getDate() + daysUntil);
  result.setHours(23, 59, 59, 999);
  return result;
}

function parseDate(input: string): { date: Date | undefined; cleanedInput: string } {
  let date: Date | undefined;
  let cleanedInput = input;

  // Today
  if (DATE_PATTERNS.today.test(input)) {
    date = new Date();
    date.setHours(23, 59, 59, 999);
    cleanedInput = cleanedInput.replace(DATE_PATTERNS.today, '');
  }
  // Tomorrow
  else if (DATE_PATTERNS.tomorrow.test(input)) {
    date = new Date();
    date.setDate(date.getDate() + 1);
    date.setHours(23, 59, 59, 999);
    cleanedInput = cleanedInput.replace(DATE_PATTERNS.tomorrow, '');
  }
  // Day after tomorrow
  else if (DATE_PATTERNS.dayAfterTomorrow.test(input)) {
    date = new Date();
    date.setDate(date.getDate() + 2);
    date.setHours(23, 59, 59, 999);
    cleanedInput = cleanedInput.replace(DATE_PATTERNS.dayAfterTomorrow, '');
  }
  // Next week
  else if (DATE_PATTERNS.nextWeek.test(input)) {
    date = new Date();
    date.setDate(date.getDate() + 7);
    date.setHours(23, 59, 59, 999);
    cleanedInput = cleanedInput.replace(DATE_PATTERNS.nextWeek, '');
  }
  // This weekend
  else if (DATE_PATTERNS.thisWeekend.test(input)) {
    date = getNextDayOfWeek('saturday');
    cleanedInput = cleanedInput.replace(DATE_PATTERNS.thisWeekend, '');
  }
  // Next month
  else if (DATE_PATTERNS.nextMonth.test(input)) {
    date = new Date();
    date.setMonth(date.getMonth() + 1);
    date.setHours(23, 59, 59, 999);
    cleanedInput = cleanedInput.replace(DATE_PATTERNS.nextMonth, '');
  }
  // In X days
  else {
    const inDaysMatch = DATE_PATTERNS.inDays.exec(input);
    if (inDaysMatch) {
      date = new Date();
      date.setDate(date.getDate() + parseInt(inDaysMatch[1]));
      date.setHours(23, 59, 59, 999);
      cleanedInput = cleanedInput.replace(DATE_PATTERNS.inDays, '');
    }
  }

  // In X weeks
  if (!date) {
    const inWeeksMatch = DATE_PATTERNS.inWeeks.exec(input);
    if (inWeeksMatch) {
      date = new Date();
      date.setDate(date.getDate() + parseInt(inWeeksMatch[1]) * 7);
      date.setHours(23, 59, 59, 999);
      cleanedInput = cleanedInput.replace(DATE_PATTERNS.inWeeks, '');
    }
  }

  // In X months
  if (!date) {
    const inMonthsMatch = DATE_PATTERNS.inMonths.exec(input);
    if (inMonthsMatch) {
      date = new Date();
      date.setMonth(date.getMonth() + parseInt(inMonthsMatch[1]));
      date.setHours(23, 59, 59, 999);
      cleanedInput = cleanedInput.replace(DATE_PATTERNS.inMonths, '');
    }
  }

  // On day name (Monday, Tuesday, etc.)
  if (!date) {
    const dayMatch = DATE_PATTERNS.onDay.exec(input);
    if (dayMatch) {
      date = getNextDayOfWeek(dayMatch[1]);
      cleanedInput = cleanedInput.replace(DATE_PATTERNS.onDay, '');
    }
  }

  // Month day (Dec 25, January 15)
  if (!date) {
    const monthDayMatch = DATE_PATTERNS.monthDay.exec(input);
    if (monthDayMatch) {
      const month = MONTHS[monthDayMatch[1].toLowerCase()];
      const day = parseInt(monthDayMatch[2]);
      date = new Date();
      date.setMonth(month, day);
      date.setHours(23, 59, 59, 999);
      // If the date is in the past, assume next year
      if (date < new Date()) {
        date.setFullYear(date.getFullYear() + 1);
      }
      cleanedInput = cleanedInput.replace(DATE_PATTERNS.monthDay, '');
    }
  }

  // Parse time if we have a date
  if (date) {
    const timeMatch = DATE_PATTERNS.atTime.exec(input);
    if (timeMatch) {
      let hours = parseInt(timeMatch[1]);
      const minutes = timeMatch[2] ? parseInt(timeMatch[2]) : 0;
      const period = timeMatch[3]?.toLowerCase();

      if (period === 'pm' && hours !== 12) {
        hours += 12;
      } else if (period === 'am' && hours === 12) {
        hours = 0;
      }

      date.setHours(hours, minutes, 0, 0);
      cleanedInput = cleanedInput.replace(DATE_PATTERNS.atTime, '');
    }
  }

  return { date, cleanedInput };
}

function parsePriority(input: string): { priority: Priority | undefined; cleanedInput: string } {
  let priority: Priority | undefined;
  let cleanedInput = input;

  if (PRIORITY_PATTERNS.high.test(input)) {
    priority = Priority.HIGH;
    cleanedInput = cleanedInput.replace(PRIORITY_PATTERNS.high, '');
  } else if (PRIORITY_PATTERNS.medium.test(input)) {
    priority = Priority.MEDIUM;
    cleanedInput = cleanedInput.replace(PRIORITY_PATTERNS.medium, '');
  } else if (PRIORITY_PATTERNS.low.test(input)) {
    priority = Priority.LOW;
    cleanedInput = cleanedInput.replace(PRIORITY_PATTERNS.low, '');
  }

  return { priority, cleanedInput };
}

function parseWorkspace(input: string): { workspace: Workspace | undefined; cleanedInput: string } {
  let workspace: Workspace | undefined;
  let cleanedInput = input;

  if (WORKSPACE_PATTERNS.work.test(input)) {
    workspace = 'work';
    cleanedInput = cleanedInput.replace(WORKSPACE_PATTERNS.work, '');
  } else if (WORKSPACE_PATTERNS['side-project'].test(input)) {
    workspace = 'side-project';
    cleanedInput = cleanedInput.replace(WORKSPACE_PATTERNS['side-project'], '');
  } else if (WORKSPACE_PATTERNS.personal.test(input)) {
    workspace = 'personal';
    cleanedInput = cleanedInput.replace(WORKSPACE_PATTERNS.personal, '');
  }

  return { workspace, cleanedInput };
}

function parseTags(input: string): { tags: string[]; cleanedInput: string } {
  const tags: string[] = [];
  let cleanedInput = input;

  const matches = input.matchAll(TAG_PATTERN);
  for (const match of matches) {
    tags.push(match[1]);
    cleanedInput = cleanedInput.replace(match[0], '');
  }

  return { tags, cleanedInput };
}

function parsePomodoros(input: string): { pomodoros: number | undefined; cleanedInput: string } {
  let pomodoros: number | undefined;
  let cleanedInput = input;

  const match = POMODORO_PATTERN.exec(input);
  if (match) {
    pomodoros = parseInt(match[1]);
    cleanedInput = cleanedInput.replace(POMODORO_PATTERN, '');
  }

  return { pomodoros, cleanedInput };
}

export function parseNaturalLanguageTask(input: string): ParsedTask {
  let cleanedInput = input;

  // Parse in order of specificity
  const { tags, cleanedInput: afterTags } = parseTags(cleanedInput);
  cleanedInput = afterTags;

  const { priority, cleanedInput: afterPriority } = parsePriority(cleanedInput);
  cleanedInput = afterPriority;

  const { workspace, cleanedInput: afterWorkspace } = parseWorkspace(cleanedInput);
  cleanedInput = afterWorkspace;

  const { pomodoros, cleanedInput: afterPomodoros } = parsePomodoros(cleanedInput);
  cleanedInput = afterPomodoros;

  const { date: dueDate, cleanedInput: afterDate } = parseDate(cleanedInput);
  cleanedInput = afterDate;

  // Clean up the remaining title
  const title = cleanedInput
    .replace(/\s+/g, ' ')
    .replace(/^[\s,]+|[\s,]+$/g, '')
    .trim();

  return {
    title,
    tags,
    priority,
    workspace,
    dueDate,
    pomodoros,
  };
}

// Export for testing
export const _testExports = {
  parseDate,
  parsePriority,
  parseWorkspace,
  parseTags,
  parsePomodoros,
};
