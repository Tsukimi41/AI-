import React, { useState, useCallback, useRef } from 'react';
import { UploadIcon, SpinnerIcon, CloseIcon } from './icons';
import type { NarrationLevel } from '../types';
import { speak } from '../services/speechService';

interface FileUploadProps {
  onConvertToAudio: (file: File) => void;
  disabled: boolean;
  narrationLevel: NarrationLevel;
  onLevelChange: (level: NarrationLevel) => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onConvertToAudio, disabled, narrationLevel, onLevelChange }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      speak(`${file.name}が選択されました。`);
    }
  };

  const handleButtonClick = () => {
    speak('ファイル選択ダイアログを開きます。');
    fileInputRef.current?.click();
  };

  const handleClearSelection = () => {
    speak('ファイルの選択を解除しました。');
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
        fileInputRef.current.value = '';
    }
  }

  const handleLevelChange = (level: NarrationLevel) => {
    onLevelChange(level);
    speak(`ナレーションの詳細度を${level === 'simple' ? 'シンプル' : '詳細'}に変更しました。`);
  }
  
  const handleSubmit = useCallback(() => {
    if (selectedFile) {
      speak('AIによるナレーション生成を開始します。');
      onConvertToAudio(selectedFile);
    }
  }, [selectedFile, onConvertToAudio]);

  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-700">
      {!selectedFile ? (
        <div 
          className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center cursor-pointer hover:border-purple-500 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500"
          onClick={handleButtonClick}
          role="button"
          aria-label="画像ファイルを選択するための領域"
          aria-describedby="file-upload-description"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && handleButtonClick()}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/png, image/jpeg, image/webp"
            className="hidden"
            aria-hidden="true"
          />
          <div className="flex flex-col items-center justify-center text-gray-400">
             <UploadIcon />
            <p className="mt-2 text-lg">クリックして画像を選択</p>
            <p id="file-upload-description" className="text-sm">（PNG, JPG, WEBP形式に対応）</p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="relative max-w-lg mx-auto">
            <img src={previewUrl!} alt="選択された漫画のコマのプレビュー" className="w-full h-auto rounded-md shadow-lg" />
            <button
              onClick={handleClearSelection}
              className="absolute -top-3 -right-3 bg-red-600 text-white rounded-full p-1.5 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-white transition-transform transform hover:scale-110"
              aria-label="選択を解除"
            >
              <CloseIcon />
            </button>
          </div>

          <fieldset>
            <legend className="text-lg font-medium text-gray-200 mb-2">ナレーションの詳細度</legend>
            <div className="flex gap-4">
              {(['simple', 'detailed'] as NarrationLevel[]).map(level => {
                const isChecked = narrationLevel === level;
                return (
                  <div key={level} className="flex-1">
                    <input
                      type="radio"
                      id={`level-${level}`}
                      name="narration-level"
                      value={level}
                      checked={isChecked}
                      onChange={() => handleLevelChange(level)}
                      className="sr-only peer"
                    />
                    <label
                      htmlFor={`level-${level}`}
                      className={`block w-full text-center p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                        isChecked
                          ? 'bg-purple-600 border-purple-500 text-white'
                          : 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600/50'
                      }`}
                    >
                      <span className="font-semibold">{level === 'simple' ? 'シンプル' : '詳細'}</span>
                      <span className="text-xs block">{level === 'simple' ? '（ストーリー中心）' : '（背景描写など）'}</span>
                    </label>
                  </div>
                );
              })}
            </div>
          </fieldset>

          <button
            onClick={handleSubmit}
            disabled={disabled}
            aria-disabled={disabled}
            aria-label="選択した画像を音声に変換します"
            className="w-full flex items-center justify-center bg-purple-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-purple-500 disabled:bg-gray-600 disabled:cursor-wait transition-all duration-300 ease-in-out transform hover:scale-105 disabled:scale-100 disabled:ring-2 disabled:ring-purple-500/50 disabled:ring-offset-gray-900"
          >
            {disabled ? (
              <>
                <SpinnerIcon />
                <span>変換中...</span>
              </>
            ) : (
              <span>音声に変換する</span>
            )}
          </button>
        </div>
      )}
    </div>
  );
};
