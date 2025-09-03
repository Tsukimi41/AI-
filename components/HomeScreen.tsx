import React from 'react';
import { LogoIcon, UploadIcon, BookOpenIcon } from './icons';
import { speak } from '../services/speechService';

interface HomeScreenProps {
  onNavigate: (view: 'upload' | 'library') => void;
}

const ActionCard: React.FC<{
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
  ariaLabel: string;
  speakText: string;
}> = ({ icon, title, description, onClick, ariaLabel, speakText }) => (
  <button
    onClick={() => {
      speak(speakText);
      onClick();
    }}
    aria-label={ariaLabel}
    className="group w-full bg-gray-800/50 hover:bg-gray-800 border border-gray-700 rounded-lg p-6 text-left transition-all duration-300 transform hover:-translate-y-2 hover:shadow-2xl hover:shadow-purple-500/20 focus:outline-none focus:ring-4 focus:ring-purple-500/50"
  >
    <div className="flex items-center gap-6">
      <div className="text-gray-500">{icon}</div>
      <div>
        <h3 className="text-xl font-bold text-white group-hover:text-purple-400 transition-colors">{title}</h3>
        <p className="text-gray-400 mt-1">{description}</p>
      </div>
    </div>
  </button>
);

export const HomeScreen: React.FC<HomeScreenProps> = ({ onNavigate }) => {
  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex items-center justify-center p-4">
      <div className="max-w-3xl mx-auto w-full">
        <header className="text-center mb-12">
            <div className="inline-block mb-6">
                <LogoIcon />
            </div>
            <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight mb-3">
                AI漫画ナレーター
            </h1>
            <p className="text-lg text-gray-400">
                あなたの漫画を、AIが音声ドラマに変換します。
            </p>
        </header>

        <main className="space-y-6">
          <ActionCard
            icon={<UploadIcon />}
            title="新しい漫画をナレーション"
            description="漫画の画像ファイルをアップロードして、AIナレーションを生成します。"
            onClick={() => onNavigate('upload')}
            ariaLabel="新しい漫画をナレーションする"
            speakText="アップロード画面へ移動します。"
          />
          <ActionCard
            icon={<BookOpenIcon />}
            title="ライブラリを開く"
            description="過去に生成したナレーション付き漫画を聴くことができます。"
            onClick={() => onNavigate('library')}
            ariaLabel="ライブラリを開く"
            speakText="ライブラリ画面へ移動します。"
          />
        </main>
      </div>
    </div>
  );
};