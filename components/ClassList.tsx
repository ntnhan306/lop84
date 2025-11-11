
import React, { useState } from 'react';
import { Student } from '../types';
import Modal from './common/Modal';

interface ClassListProps {
  students: Student[];
  isEditing: boolean;
  onUpdate?: (students: Student[]) => void;
}

const ClassList: React.FC<ClassListProps> = ({ students, isEditing, onUpdate }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentStudent, setCurrentStudent] = useState<Student | null>(null);

  const handleAdd = () => {
    setCurrentStudent({ id: '', name: '', studentId: '', dob: '', phone: '', notes: '' });
    setIsModalOpen(true);
  };

  const handleEdit = (student: Student) => {
    setCurrentStudent(student);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Bạn có chắc muốn xóa học sinh này?')) {
      onUpdate?.(students.filter(s => s.id !== id));
    }
  };

  const handleSave = (student: Student) => {
    if (student.id) {
      onUpdate?.(students.map(s => s.id === student.id ? student : s));
    } else {
      onUpdate?.([...students, { ...student, id: crypto.randomUUID() }]);
    }
    setIsModalOpen(false);
    setCurrentStudent(null);
  };

  return (
    <div>
      {isEditing && (
        <div className="mb-4 text-right">
          <button onClick={handleAdd} className="px-4 py-2 bg-teal-500 text-white font-semibold rounded-lg shadow-md hover:bg-teal-600">
            Thêm Học sinh
          </button>
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
            <tr>
              <th scope="col" className="px-6 py-3">STT</th>
              <th scope="col" className="px-6 py-3">Họ và Tên</th>
              <th scope="col" className="px-6 py-3">Mã học sinh</th>
              <th scope="col" className="px-6 py-3">Ngày sinh</th>
              <th scope="col" className="px-6 py-3">Số điện thoại</th>
              <th scope="col" className="px-6 py-3">Ghi chú</th>
              {isEditing && <th scope="col" className="px-6 py-3">Hành động</th>}
            </tr>
          </thead>
          <tbody>
            {students.length === 0 ? (
              <tr>
                <td colSpan={isEditing ? 7 : 6} className="text-center py-4">Chưa có thông tin học sinh.</td>
              </tr>
            ) : (
              students.map((student, index) => (
                <tr key={student.id} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                  <td className="px-6 py-4">{index + 1}</td>
                  <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{student.name}</td>
                  <td className="px-6 py-4">{student.studentId}</td>
                  <td className="px-6 py-4">{student.dob}</td>
                  <td className="px-6 py-4">{student.phone}</td>
                  <td className="px-6 py-4">{student.notes}</td>
                  {isEditing && (
                    <td className="px-6 py-4 flex space-x-2">
                      <button onClick={() => handleEdit(student)} className="font-medium text-blue-600 dark:text-blue-500 hover:underline">Sửa</button>
                      <button onClick={() => handleDelete(student.id)} className="font-medium text-red-600 dark:text-red-500 hover:underline">Xóa</button>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {isModalOpen && currentStudent && (
        <StudentFormModal
          student={currentStudent}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSave}
        />
      )}
    </div>
  );
};

interface StudentFormModalProps {
    student: Student;
    onClose: () => void;
    onSave: (student: Student) => void;
}

const StudentFormModal: React.FC<StudentFormModalProps> = ({ student, onClose, onSave }) => {
    const [formData, setFormData] = useState(student);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <Modal title={student.id ? 'Sửa thông tin học sinh' : 'Thêm học sinh'} onClose={onClose}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Họ và Tên" required className="block w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"/>
                <input type="text" name="studentId" value={formData.studentId} onChange={handleChange} placeholder="Mã học sinh" required className="block w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"/>
                <input type="date" name="dob" value={formData.dob} onChange={handleChange} placeholder="Ngày sinh" required className="block w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"/>
                <input type="tel" name="phone" value={formData.phone} onChange={handleChange} placeholder="Số điện thoại" required className="block w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"/>
                <textarea name="notes" value={formData.notes} onChange={handleChange} placeholder="Ghi chú" className="block w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"/>
                <div className="flex justify-end space-x-2">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-300 rounded-md hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-500">Hủy</button>
                    <button type="submit" className="px-4 py-2 bg-teal-500 text-white rounded-md hover:bg-teal-600">Lưu</button>
                </div>
            </form>
        </Modal>
    );
};

export default ClassList;
