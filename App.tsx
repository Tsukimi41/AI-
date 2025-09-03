import React, { useState, useCallback, useEffect, useRef } from 'react';
import { FileUpload } from './components/FileUpload';
import { Library } from './components/Library';
import { AudioPlayer } from './components/AudioPlayer';
import { Loader } from './components/Loader';
import { HomeScreen } from './components/HomeScreen';
import { generateMangaNarration, MangaNarration } from './services/geminiService';
import { speak } from './services/speechService';
import type { MangaItem, NarrationLevel } from './types';
import { LogoIcon, HomeIcon } from './components/icons';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<'home' | 'upload' | 'library'>('home');
  const [mangaItems, setMangaItems] = useState<MangaItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<MangaItem | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [narrationLevel, setNarrationLevel] = useState<NarrationLevel>('detailed');
  const [liveRegionMessage, setLiveRegionMessage] = useState('');

  const uploadHeadingRef = useRef<HTMLHeadingElement>(null);
  const libraryHeadingRef = useRef<HTMLHeadingElement>(null);
  const playerHeadingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    // Clear message on view change
    setLiveRegionMessage('');

    switch (currentView) {
      case 'home':
        speak('ホーム画面です。');
        break;
      case 'upload':
        speak('漫画のアップロード画面です。');
        uploadHeadingRef.current?.focus();
        break;
      case 'library':
        speak('ライブラリ画面です。');
        libraryHeadingRef.current?.focus();
        break;
    }
  }, [currentView]);

  const handleNavigate = (view: 'upload' | 'library') => {
    setSelectedItem(null);
    setError(null);
    setCurrentView(view);
  };

  const handleBackToHome = () => {
    speak('ホーム画面に戻ります。');
    setSelectedItem(null);
    setError(null);
    setCurrentView('home');
  }

  const createScriptFromNarration = (narration: MangaNarration): string => {
    const parts: string[] = [];
    parts.push(`タイトル：${narration.title}`);
    parts.push(`場面説明：${narration.description}`);
    narration.dialogue.forEach(d => {
      parts.push(`${d.character}、「${d.text}」`);
    });
    narration.onomatopoeia.forEach(o => {
      parts.push(`${o.sound_description}`);
    });
    return parts.join('。\n');
  };

  const handleConvertToAudio = useCallback(async (file: File) => {
    setIsLoading(true);
    setError(null);
    setSelectedItem(null);

    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onloadend = async () => {
        const base64Data = (reader.result as string).split(',')[1];
        const mimeType = file.type;

        const narrationResult = await generateMangaNarration(base64Data, mimeType, narrationLevel);
        if (narrationResult) {
          const script = createScriptFromNarration(narrationResult);
          const newItem: MangaItem = {
            id: new Date().toISOString(),
            title: narrationResult.title,
            script: script,
            imageUrl: URL.createObjectURL(file),
          };
          setMangaItems(prevItems => [newItem, ...prevItems]);
          setSelectedItem(newItem);
          const message = 'ナレーションの生成が完了しました。';
          speak(message);
          setLiveRegionMessage(message);
          
          // After announcing completion, delay focus shift to the new player.
          setTimeout(() => {
            playerHeadingRef.current?.focus();
          }, 150);
        } else {
          throw new Error('AIによるナレーション生成に失敗しました。');
        }
      };
      reader.onerror = () => {
        throw new Error('ファイルの読み込みに失敗しました。');
      };
    } catch (err) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : '不明なエラーが発生しました。';
      setError(errorMessage);
      speak(`エラーが発生しました。${errorMessage}`, { interrupt: true });
    } finally {
      setIsLoading(false);
    }
  }, [narrationLevel]);

  const handleSelectItem = useCallback((item: MangaItem) => {
    setSelectedItem(item);
    const message = `${item.title}を選択しました。`;
    speak(message);
    setLiveRegionMessage(message);

    // After announcing selection, delay focus shift to the player.
    setTimeout(() => {
      playerHeadingRef.current?.focus();
    }, 150);
  }, []);
  
  const handleDeleteItem = useCallback((id: string) => {
    const itemToDelete = mangaItems.find(item => item.id === id);
    if (itemToDelete) {
        speak(`「${itemToDelete.title}」を削除しました。`);
        setLiveRegionMessage(`「${itemToDelete.title}」を削除しました。`);
    }
    setMangaItems(prevItems => prevItems.filter(item => item.id !== id));
    if (selectedItem?.id === id) {
        setSelectedItem(null);
    }

    // After deletion, move focus to the library heading to provide a stable context.
    // A timeout is used to allow screen readers to announce the deletion message first.
    setTimeout(() => {
      if (libraryHeadingRef.current) {
        libraryHeadingRef.current.focus();
      }
    }, 150);
  }, [selectedItem, mangaItems]);

  if (currentView === 'home') {
    return <HomeScreen onNavigate={handleNavigate} />;
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 font-sans p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <header className="flex items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <LogoIcon />
            <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
              AI漫画ナレーター
            </h1>
          </div>
          <button
            onClick={handleBackToHome}
            aria-label="ホーム画面に戻る"
            className="flex items-center gap-2 bg-gray-700/50 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-purple-500"
          >
            <HomeIcon />
            <span className="hidden sm:inline">ホーム</span>
          </button>
        </header>

        <main className="space-y-12">
          {currentView === 'upload' && (
            <>
              <section id="upload-section" aria-labelledby="upload-heading">
                <h2 id="upload-heading" ref={uploadHeadingRef} tabIndex={-1} className="text-2xl font-semibold mb-4 border-b-2 border-purple-500 pb-2 focus:outline-none">
                  漫画のコマをアップロード
                </h2>
                <FileUpload
                  onConvertToAudio={handleConvertToAudio}
                  disabled={isLoading}
                  narrationLevel={narrationLevel}
                  onLevelChange={setNarrationLevel}
                />
              </section>

              <div role="status" aria-live="polite">
                {isLoading && <Loader message="AIがナレーションを生成中です..." />}
              </div>
              <div role="alert" aria-live="assertive">
                {error && <div className="bg-red-900 border border-red-500 text-red-200 px-4 py-3 rounded-lg">{error}</div>}
              </div>

              {selectedItem && (
                <section id="player-section" aria-labelledby="player-heading">
                  <h2 id="player-heading" ref={playerHeadingRef} tabIndex={-1} className="text-2xl font-semibold mb-4 border-b-2 border-purple-500 pb-2 focus:outline-none">
                    生成された音声
                  </h2>
                  <AudioPlayer key={selectedItem.id} item={selectedItem} setLiveRegionMessage={setLiveRegionMessage} />
                </section>
              )}
            </>
          )}

          {currentView === 'library' && (
            <>
              {selectedItem && (
                 <section id="player-section" aria-labelledby="player-heading" className="mb-12">
                   <h2 id="player-heading" ref={playerHeadingRef} tabIndex={-1} className="text-2xl font-semibold mb-4 border-b-2 border-purple-500 pb-2 focus:outline-none">
                     選択中のアイテム
                   </h2>
                   <AudioPlayer key={selectedItem.id} item={selectedItem} setLiveRegionMessage={setLiveRegionMessage} />
                 </section>
              )}
              <section id="library-section" aria-labelledby="library-heading">
                <h2 id="library-heading" ref={libraryHeadingRef} tabIndex={-1} className="text-2xl font-semibold mb-4 border-b-2 border-purple-500 pb-2 focus:outline-none">
                  ライブラリ
                </h2>
                <Library 
                  items={mangaItems} 
                  onSelectItem={handleSelectItem} 
                  selectedItemId={selectedItem?.id}
                  onDeleteItem={handleDeleteItem}
                />
              </section>
            </>
          )}
        </main>

        <footer className="text-center text-gray-500 mt-16 text-sm">
          <p>&copy; {new Date().getFullYear()} AI Manga Narrator. All Rights Reserved.</p>
        </footer>
      </div>
      <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {liveRegionMessage}
      </div>
    </div>
  );
};

export default App;