
import React, { useState } from 'react';

interface AuthFormProps {
  type: 'login' | 'set';
  onSubmit: (password: string) => Promise<boolean | void>;
}

const AuthForm: React.FC<AuthFormProps> = ({ type, onSubmit }) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const isSettingPassword = type === 'set';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (isSettingPassword && password !== confirmPassword) {
      setError('Mật khẩu không khớp.');
      return;
    }
     if (password.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự.');
      return;
    }

    setIsLoading(true);
    const result = await onSubmit(password);
    setIsLoading(false);

    if (type === 'login' && result === false) {
      setError('Mật khẩu không đúng. Vui lòng thử lại.');
    }
  };

  const title = isSettingPassword ? 'Thiết lập Mật khẩu' : 'Đăng nhập';
  const description = isSettingPassword 
    ? 'Đây là lần đầu tiên bạn truy cập trang chỉnh sửa. Vui lòng tạo một mật khẩu để bảo vệ dữ liệu.' 
    : 'Vui lòng nhập mật khẩu để truy cập trang chỉnh sửa.';
  const buttonText = isSettingPassword ? 'Lưu Mật khẩu' : 'Đăng nhập';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 px-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 shadow-xl rounded-2xl p-8 space-y-6">
        <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white">{title}</h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{description}</p>
        </div>
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="password" className="sr-only">Mật khẩu</label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="appearance-none rounded-md relative block w-full px-3 py-3 border border-gray-300 dark:border-gray-600 placeholder-gray-500 text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="Mật khẩu"
            />
          </div>
          {isSettingPassword && (
            <div>
              <label htmlFor="confirm-password" className="sr-only">Xác nhận Mật khẩu</label>
              <input
                id="confirm-password"
                name="confirm-password"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="appearance-none rounded-md relative block w-full px-3 py-3 border border-gray-300 dark:border-gray-600 placeholder-gray-500 text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Xác nhận Mật khẩu"
              />
            </div>
          )}
          {error && <p className="text-red-500 text-sm text-center">{error}</p>}
          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400"
            >
              {isLoading ? 'Đang xử lý...' : buttonText}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AuthForm;
