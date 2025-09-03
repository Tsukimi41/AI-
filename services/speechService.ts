let selectedVoice: SpeechSynthesisVoice | null = null;

// 音声リストから最適な日本語音声を選択するロジック
const selectJapaneseVoice = () => {
  const voices = speechSynthesis.getVoices();
  if (voices.length === 0) return;

  const japaneseVoices = voices.filter(voice => voice.lang === 'ja-JP');
  if (japaneseVoices.length === 0) return;

  // 優先順位: 1. Google/Microsoft製, 2. ネットワークベース, 3. ローカル
  const preferredVoices = [
    japaneseVoices.find(voice => voice.name === 'Google 日本語'),
    japaneseVoices.find(voice => voice.name.includes('Microsoft') && voice.name.includes('Online')),
    ...japaneseVoices.filter(voice => !voice.localService),
    ...japaneseVoices.filter(voice => voice.localService),
  ];
  
  // null/undefinedを除外して最初の有効な音声を選択
  selectedVoice = preferredVoices.find(v => v) || japaneseVoices[0];
};

// ブラウザが音声リストを非同期で読み込むのに対応
if (speechSynthesis.getVoices().length === 0) {
  speechSynthesis.onvoiceschanged = selectJapaneseVoice;
} else {
  selectJapaneseVoice();
}


interface UtteranceOptions {
  rate?: number;
  volume?: number;
}

/**
 * 最適な音声と設定で SpeechSynthesisUtterance オブジェクトを作成します。
 * @param text - 読み上げるテキスト文字列。
 * @param options - 再生速度と音量のオプション。
 * @returns 設定済みの SpeechSynthesisUtterance インスタンス。
 */
export const createUtterance = (text: string, options: UtteranceOptions = {}): SpeechSynthesisUtterance => {
  const { rate = 1, volume = 1 } = options;
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'ja-JP';
  
  if (selectedVoice) {
    utterance.voice = selectedVoice;
  }
  
  // 自然な抑揚のためにピッチを少し調整
  utterance.pitch = 1.1; 
  utterance.rate = rate;
  utterance.volume = volume;

  return utterance;
};


interface SpeakOptions {
  interrupt?: boolean;
}

/**
 * 指定されたテキストを音声で読み上げます。
 * デフォルトでは、他の音声を中断して即座に再生します。
 * @param text - 読み上げるテキスト文字列。
 * @param options - オプション。
 *                  interrupt: false に設定すると、既存の読み上げを中断せず、
 *                             再生キューの末尾に追加します。
 *                             デフォルトは true です（中断して即時再生）。
 */
export const speak = (text: string, options: SpeakOptions = {}) => {
  // デフォルトを true (中断あり) に変更
  const { interrupt = true } = options;

  // interruptがtrueの場合、現在の読み上げとキューをすべてキャンセル
  if (interrupt && (speechSynthesis.speaking || speechSynthesis.pending)) {
    speechSynthesis.cancel();
  }

  // テキストが空文字列の場合は、キューをクリアする目的で呼ばれたとみなし、ここで処理を終了
  if (!text.trim()) {
    if (interrupt) speechSynthesis.cancel(); // 空文字でもキャンセルは実行
    return;
  }

  // 新しい発話オブジェクトを作成
  const utterance = createUtterance(text);
  
  // 発話をキューに追加（または即時再生）
  speechSynthesis.speak(utterance);
};
