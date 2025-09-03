
import React from 'react';

interface LoaderProps {
  message?: string;
}

export const Loader: React.FC<LoaderProps> = ({ message = '読み込み中...' }) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 bg-gray-800 rounded-lg border border-gray-700" aria-live="polite" aria-busy="true">
      <div className="w-12 h-12 border-4 border-t-purple-500 border-r-purple-500 border-b-gray-600 border-l-gray-600 rounded-full animate-spin"></div>
      <p className="mt-4 text-lg text-gray-300">{message}</p>
    </div>
  );
};
