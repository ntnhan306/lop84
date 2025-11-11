
import React from 'react';
import { Schedule } from '../types';

interface ScheduleProps {
  schedule: Schedule;
  isEditing: boolean;
  onUpdate?: (schedule: Schedule) => void;
}

const daysOfWeek = ['Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
const sessions = ['Sáng', 'Chiều'];
const periods = [1, 2, 3, 4, 5];

const ScheduleComponent: React.FC<ScheduleProps> = ({ schedule, isEditing, onUpdate }) => {

  const handleSubjectChange = (day: string, session: 'morning' | 'afternoon', periodIndex: number, newSubject: string) => {
    if (!onUpdate) return;
    
    const newSchedule = JSON.parse(JSON.stringify(schedule));
    newSchedule[day][session][periodIndex].subject = newSubject;
    onUpdate(newSchedule);
  };
  
  if(!schedule) return <p>Đang tải thời khóa biểu...</p>;

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse border border-gray-300 dark:border-gray-600">
        <thead>
          <tr className="bg-gray-100 dark:bg-gray-700">
            <th className="border p-2 dark:border-gray-600" colSpan={2}>Buổi / Tiết</th>
            {daysOfWeek.map(day => (
              <th key={day} className="border p-2 dark:border-gray-600 font-semibold">{day}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sessions.map(sessionName => (
            <React.Fragment key={sessionName}>
              {periods.map(period => (
                <tr key={`${sessionName}-${period}`} className="text-center even:bg-gray-50 dark:even:bg-gray-800">
                  {period === 1 && (
                    <td rowSpan={5} className="border p-2 dark:border-gray-600 font-medium align-middle w-16">{sessionName}</td>
                  )}
                  <td className="border p-2 dark:border-gray-600 font-medium w-16">Tiết {period}</td>
                  {daysOfWeek.map(day => {
                    const sessionKey = sessionName === 'Sáng' ? 'morning' : 'afternoon';
                    const subject = schedule[day]?.[sessionKey]?.[period - 1]?.subject || '';
                    return (
                      <td key={`${day}-${sessionName}-${period}`} className="border p-1 dark:border-gray-600 h-16">
                        {isEditing ? (
                          <input
                            type="text"
                            value={subject}
                            onChange={(e) => handleSubjectChange(day, sessionKey, period - 1, e.target.value)}
                            className="w-full h-full text-center bg-transparent focus:bg-white dark:focus:bg-gray-700 outline-none rounded-md"
                          />
                        ) : (
                          <span className="p-2 block">{subject}</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ScheduleComponent;
