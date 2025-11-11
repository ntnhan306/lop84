
export interface Student {
  id: string;
  name: string;
  studentId: string;
  dob: string;
  phone: string;
  notes?: string;
}

export interface SchedulePeriod {
  subject: string;
}

export interface ScheduleDay {
  morning: SchedulePeriod[];
  afternoon: SchedulePeriod[];
}

export type Schedule = {
  [day: string]: ScheduleDay;
};

export interface MediaItem {
  id: string;
  type: 'image' | 'video';
  url: string;
  caption?: string;
}

export interface AppData {
  students: Student[];
  schedule: Schedule;
  media: MediaItem[];
}
