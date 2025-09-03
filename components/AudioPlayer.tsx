import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { MangaItem } from '../types';
import { PlayIcon, PauseIcon, ClosedCaptioningIcon, VolumeIcon } from './icons';
import { speak, createUtterance } from '../services/speechService';

interface AudioPlayerProps {
  item: MangaItem;
  setLiveRegionMessage: (message: string) => void;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({ item, setLiveRegionMessage }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [volume, setVolume] = useState(1);
  const [showScript, setShowScript] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const isPlayingRef = useRef(false);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  const cleanupSpeech = useCallback(() => {
    if (speechSynthesis.speaking || speechSynthesis.pending) {
      speechSynthesis.cancel();
    }
  }, []);

  useEffect(() => {
    // Component unmount or item change
    return () => {
      cleanupSpeech();
      setIsPlaying(false);
    };
  }, [item.id, cleanupSpeech]);

  const handlePlayPause = useCallback(() => {
    if (isPlaying) {
      // --- PAUSE/STOP ---
      setIsPlaying(false);
      cleanupSpeech();
      speak('一時停止'); 
    } else {
      // --- PLAY ---
      setIsPlaying(true);
      
      cleanupSpeech();

      const playAnnounce = createUtterance('再生');
      
      playAnnounce.onend = () => {
        if (!isPlayingRef.current) {
          return; 
        }
        const mainUtterance = createUtterance(item.script, { rate: playbackRate, volume: volume });
        
        mainUtterance.onend = () => setIsPlaying(false);
        mainUtterance.onerror = () => {
          console.error("Speech synthesis error");
          setIsPlaying(false);
        };
        utteranceRef.current = mainUtterance;
        speechSynthesis.speak(mainUtterance);
      };
      
      speechSynthesis.speak(playAnnounce);
    }
  }, [isPlaying, item.script, playbackRate, volume, cleanupSpeech]);
  
  const handleRateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newRate = parseFloat(e.target.value);
    setPlaybackRate(newRate);
    
    setLiveRegionMessage(`再生速度を${newRate}倍に変更しました。再度再生ボタンを押して適用してください。`);
    
    if (isPlayingRef.current) {
      cleanupSpeech();
      setIsPlaying(false); 
    }
  };
  
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    setLiveRegionMessage(`音量を${Math.round(newVolume * 100)}パーセントに変更しました。`);
    if (utteranceRef.current && speechSynthesis.speaking) {
        utteranceRef.current.volume = newVolume;
    }
  };

  const handleToggleScript = () => {
    const newShowState = !showScript;
    setShowScript(newShowState);
    const message = newShowState ? 'スクリプトを表示します。' : 'スクリプトを非表示にします。';
    // Use live region for screen reader users, and speak for others, but don't interrupt main narration.
    setLiveRegionMessage(message);
    speak(message, { interrupt: false }); // Attempt non-interrupting speech for sighted users.
  }

  const scriptId = `script-${item.id}`;

  return (
    <div className="bg-gray-800 rounded-lg shadow-xl p-6 border border-gray-700 flex flex-col md:flex-row gap-6">
      <div className="flex-shrink-0">
        <img src={item.imageUrl} alt={item.title} className="w-full md:w-48 h-auto rounded-lg object-cover shadow-md" />
      </div>
      <div className="flex-grow flex flex-col justify-center">
        <h3 className="text-xl font-bold mb-3">{item.title}</h3>
        
        <div className="flex flex-wrap items-center gap-4">
          <button
            onClick={handlePlayPause}
            className="bg-purple-600 text-white p-4 rounded-full hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-purple-500 transition-transform transform hover:scale-110"
            aria-label={isPlaying ? "一時停止" : "再生"}
          >
            {isPlaying ? <PauseIcon /> : <PlayIcon />}
          </button>
          
          <div className="flex items-center gap-2">
            <label htmlFor="speed-control" className="text-sm text-gray-400">速度:</label>
            <select
                id="speed-control"
                value={playbackRate}
                onChange={handleRateChange}
                className="bg-gray-700 text-white border border-gray-600 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="0.5">0.5x</option>
              <option value="0.75">0.75x</option>
              <option value="1">1.0x</option>
              <option value="1.25">1.25x</option>
              <option value="1.5">1.5x</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <VolumeIcon />
            <input
              type="range"
              id="volume-control"
              min="0"
              max="1"
              step="0.1"
              value={volume}
              onChange={handleVolumeChange}
              className="w-24 h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:bg-purple-500 [&::-moz-range-thumb]:bg-purple-500"
              aria-label="音量調整"
              aria-valuetext={`音量 ${Math.round(volume * 100)}%`}
            />
          </div>

           <button
            onClick={handleToggleScript}
            className="text-gray-400 hover:text-white p-2 rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-purple-500"
            aria-label={showScript ? "スクリプトを隠す" : "スクリプトを表示"}
            aria-expanded={showScript}
            aria-controls={scriptId}
          >
            <ClosedCaptioningIcon />
          </button>
        </div>
        
        {showScript && (
          <div id={scriptId} className="mt-4 p-4 bg-gray-900/70 rounded-lg max-h-40 overflow-y-auto">
            <p className="text-gray-300 whitespace-pre-wrap text-sm">{item.script}</p>
          </div>
        )}
      </div>
    </div>
  );
};
