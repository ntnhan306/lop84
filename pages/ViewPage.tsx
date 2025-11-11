
import React from 'react';
import { Link } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import Gallery from '../components/Gallery';
import ClassList from '../components/ClassList';
import ScheduleComponent from '../components/Schedule';

const ViewPage: React.FC = () => {
  const { data } = useAppContext();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-800 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="flex justify-between items-center mb-8 pb-4 border-b-2 border-indigo-500">
          <div>
            <h1 className="text-4xl font-bold text-indigo-600 dark:text-indigo-400">Thông tin Lớp 8/4</h1>
            <p className="text-lg text-gray-600 dark:text-gray-300 mt-1">Trang xem thông tin công khai</p>
          </div>
          <Link
            to="/edit"
            className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-75 transition-colors"
          >
            Chỉnh sửa
          </Link>
        </header>

        <main className="space-y-12">
          <Section title="Thư viện Ảnh/Video">
            <Gallery media={data.media} isEditing={false} />
          </Section>

          <Section title="Danh sách Lớp">
            <ClassList students={data.students} isEditing={false} />
          </Section>

          <Section title="Thời khóa biểu">
            <ScheduleComponent schedule={data.schedule} isEditing={false} />
          </Section>
        </main>

        <footer className="text-center mt-12 text-gray-500 dark:text-gray-400">
            <p>&copy; {new Date().getFullYear()} Lớp 8/4. Powered by Modern Technology.</p>
        </footer>
      </div>
    </div>
  );
};

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <section className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-6">
    <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-6 border-l-4 border-indigo-500 pl-4">{title}</h2>
    {children}
  </section>
);


export default ViewPage;
