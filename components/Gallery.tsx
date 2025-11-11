
import React, { useState } from 'react';
import { MediaItem } from '../types';
import Modal from './common/Modal';

interface GalleryProps {
  media: MediaItem[];
  isEditing: boolean;
  onUpdate?: (media: MediaItem[]) => void;
}

const Gallery: React.FC<GalleryProps> = ({ media, isEditing, onUpdate }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState<MediaItem | null>(null);

  const handleAdd = () => {
    setCurrentItem({ id: '', type: 'image', url: '', caption: '' });
    setIsModalOpen(true);
  };

  const handleEdit = (item: MediaItem) => {
    setCurrentItem(item);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Bạn có chắc muốn xóa mục này?')) {
      onUpdate?.(media.filter(item => item.id !== id));
    }
  };

  const handleSave = (item: MediaItem) => {
    if (item.id) {
      onUpdate?.(media.map(m => m.id === item.id ? item : m));
    } else {
      onUpdate?.([...media, { ...item, id: crypto.randomUUID() }]);
    }
    setIsModalOpen(false);
    setCurrentItem(null);
  };

  return (
    <div>
      {isEditing && (
        <div className="mb-4 text-right">
          <button onClick={handleAdd} className="px-4 py-2 bg-teal-500 text-white font-semibold rounded-lg shadow-md hover:bg-teal-600">
            Thêm Ảnh/Video
          </button>
        </div>
      )}
      {media.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400">Chưa có ảnh hoặc video nào.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {media.map(item => (
            <div key={item.id} className="group relative overflow-hidden rounded-lg shadow-lg">
              {item.type === 'image' ? (
                <img src={item.url} alt={item.caption || 'Gallery image'} className="w-full h-56 object-cover transform group-hover:scale-110 transition-transform duration-300" />
              ) : (
                 <div className="w-full h-56 bg-black flex items-center justify-center">
                    <p className="text-white text-center p-2">Video: {item.caption || new URL(item.url).hostname}</p>
                 </div>
              )}
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-60 transition-all duration-300 flex flex-col justify-end p-4">
                <p className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300">{item.caption}</p>
                 {isEditing && (
                    <div className="absolute top-2 right-2 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <button onClick={() => handleEdit(item)} className="p-2 bg-blue-500 rounded-full text-white hover:bg-blue-600"><PencilIcon/></button>
                      <button onClick={() => handleDelete(item.id)} className="p-2 bg-red-500 rounded-full text-white hover:bg-red-600"><TrashIcon/></button>
                    </div>
                  )}
              </div>
            </div>
          ))}
        </div>
      )}
      {isModalOpen && currentItem && (
        <MediaFormModal
          item={currentItem}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSave}
        />
      )}
    </div>
  );
};

interface MediaFormModalProps {
  item: MediaItem;
  onClose: () => void;
  onSave: (item: MediaItem) => void;
}

const MediaFormModal: React.FC<MediaFormModalProps> = ({ item, onClose, onSave }) => {
    const [formData, setFormData] = useState(item);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <Modal title={item.id ? 'Sửa Ảnh/Video' : 'Thêm Ảnh/Video'} onClose={onClose}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Loại</label>
                    <select name="type" value={formData.type} onChange={handleChange} className="mt-1 block w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600">
                        <option value="image">Hình ảnh</option>
                        <option value="video">Video (URL)</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">URL</label>
                    <input type="text" name="url" value={formData.url} onChange={handleChange} required className="mt-1 block w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" placeholder="https://..."/>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Chú thích</label>
                    <textarea name="caption" value={formData.caption} onChange={handleChange} className="mt-1 block w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" />
                </div>
                <div className="flex justify-end space-x-2">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-300 rounded-md hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-500">Hủy</button>
                    <button type="submit" className="px-4 py-2 bg-teal-500 text-white rounded-md hover:bg-teal-600">Lưu</button>
                </div>
            </form>
        </Modal>
    );
};

const PencilIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L15.232 5.232z" /></svg>;
const TrashIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>;

export default Gallery;
