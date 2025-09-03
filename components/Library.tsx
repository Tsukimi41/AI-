import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { MangaItem } from '../types';
import { TrashIcon, WarningIcon } from './icons';
import { speak } from '../services/speechService';

interface LibraryProps {
  items: MangaItem[];
  onSelectItem: (item: MangaItem) => void;
  selectedItemId?: string | null;
  onDeleteItem: (id: string) => void;
}

export const Library: React.FC<LibraryProps> = ({ items, onSelectItem, selectedItemId, onDeleteItem }) => {
  const [itemToDelete, setItemToDelete] = useState<MangaItem | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const dialogRef = useRef<HTMLDivElement | null>(null);

  const handleCloseDialog = useCallback(() => {
    setItemToDelete(null);
    triggerRef.current?.focus();
  }, []);
  
  useEffect(() => {
    if (!itemToDelete || !dialogRef.current) return;

    const dialogNode = dialogRef.current;
    const focusableElements = Array.from(
      dialogNode.querySelectorAll<HTMLElement>(
        'a[href], button, input, textarea, select, details, [tabindex]:not([tabindex="-1"])'
      )
    ).filter(el => !el.hasAttribute('disabled'));

    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    firstElement.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleCancelDelete();
      }
      if (e.key === 'Tab') {
        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    dialogNode.addEventListener('keydown', handleKeyDown);
    return () => {
      dialogNode.removeEventListener('keydown', handleKeyDown);
    };
  }, [itemToDelete]);


  if (items.length === 0) {
    return (
      <div className="text-center py-10 px-6 bg-gray-800 rounded-lg border border-gray-700">
        <p className="text-gray-400">まだ音声に変換された漫画はありません。</p>
        <p className="text-gray-500 text-sm mt-1">最初のコマをアップロードして始めましょう！</p>
      </div>
    );
  }

  const handleDeleteClick = (e: React.MouseEvent<HTMLButtonElement>, item: MangaItem) => {
    e.stopPropagation();
    triggerRef.current = e.currentTarget;
    speak(`「${item.title}」を削除しますか？`);
    setItemToDelete(item);
  }

  const handleConfirmDelete = () => {
    if (itemToDelete) {
      onDeleteItem(itemToDelete.id);
      handleCloseDialog();
    }
  };

  const handleCancelDelete = () => {
    speak('削除をキャンセルしました。');
    handleCloseDialog();
  };

  return (
    <>
      <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {items.map((item) => {
          const isSelected = selectedItemId === item.id;
          return (
            <li key={item.id} className="relative group aspect-w-3 aspect-h-4">
              <button
              onClick={() => onSelectItem(item)}
              aria-label={`${item.title}を再生する`}
              aria-current={isSelected ? "true" : "false"}
              className={`w-full h-full focus:outline-none rounded-lg overflow-hidden transition-all duration-300 transform hover:-translate-y-1 hover:shadow-2xl hover:shadow-purple-500/30 ${isSelected ? 'ring-4 ring-purple-500' : 'ring-2 ring-transparent focus:ring-purple-500'}`}
              >
              <img
                  src={item.imageUrl}
                  alt={item.title}
                  className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
              <div className="absolute bottom-0 left-0 p-2 w-full">
                  <h4 className="text-white text-sm font-semibold truncate group-hover:whitespace-normal">{item.title}</h4>
              </div>
              </button>
              <button
                  onClick={(e) => handleDeleteClick(e, item)}
                  className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 hover:bg-red-600 focus:opacity-100 transition-all duration-200 transform hover:scale-110"
                  aria-label={`${item.title}を削除する`}
              >
                  <TrashIcon />
              </button>
          </li>
          )
        })}
      </ul>

      {itemToDelete && (
        <div 
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" 
        >
          <div 
            ref={dialogRef}
            className="bg-gray-800 rounded-xl shadow-2xl p-6 sm:p-8 max-w-md w-full border border-gray-700 text-center"
            role="dialog" 
            aria-modal="true" 
            aria-labelledby="dialog-title"
            aria-describedby="dialog-description"
          >
            <div className="mx-auto mb-4 flex justify-center">
              <WarningIcon />
            </div>
            <h3 id="dialog-title" className="text-2xl font-bold text-white mb-2">
              アイテムを削除
            </h3>
            <p id="dialog-description" className="text-gray-400 mb-6">
              本当に「{itemToDelete.title}」を削除してもよろしいですか？この操作は取り消せません。
            </p>
            <div className="flex justify-center gap-4">
              <button
                onClick={handleCancelDelete}
                className="w-full sm:w-auto px-6 py-2.5 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-gray-500"
              >
                キャンセル
              </button>
              <button
                onClick={handleConfirmDelete}
                className="w-full sm:w-auto px-6 py-2.5 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-red-500"
              >
                削除
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
