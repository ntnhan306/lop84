
import { useState, useEffect, useCallback } from 'react';
import { AppData, Student, Schedule, MediaItem } from '../types';

const APP_DATA_KEY = 'lop84_app_data';

const initialSchedule: Schedule = ['Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'].reduce((acc, day) => {
    acc[day] = {
        morning: Array(5).fill({ subject: '' }),
        afternoon: Array(5).fill({ subject: '' }),
    };
    return acc;
}, {} as Schedule);


const getInitialData = (): AppData => {
  try {
    const item = window.localStorage.getItem(APP_DATA_KEY);
    return item ? JSON.parse(item) : {
      students: [],
      schedule: initialSchedule,
      media: [],
    };
  } catch (error) {
    console.error('Error reading from localStorage', error);
    return {
      students: [],
      schedule: initialSchedule,
      media: [],
    };
  }
};

export const useAppData = () => {
  const [data, setData] = useState<AppData>(getInitialData);

  useEffect(() => {
    try {
      window.localStorage.setItem(APP_DATA_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Error writing to localStorage', error);
    }
  }, [data]);

  const setStudents = useCallback((students: Student[]) => {
    setData(prevData => ({ ...prevData, students }));
  }, []);

  const setSchedule = useCallback((schedule: Schedule) => {
    setData(prevData => ({ ...prevData, schedule }));
  }, []);

  const setMedia = useCallback((media: MediaItem[]) => {
    setData(prevData => ({ ...prevData, media }));
  }, []);

  return { data, setStudents, setSchedule, setMedia };
};
