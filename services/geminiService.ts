
import { GoogleGenAI, Type } from "@google/genai";
import type { NarrationLevel } from '../types';

export interface MangaNarration {
  title: string;
  description: string;
  dialogue: { character: string; text: string }[];
  onomatopoeia: { text: string; sound_description: string }[];
}

const API_KEY = process.env.API_KEY;
if (!API_KEY) {
  // This is a fallback for development and will show an error in the console.
  // In a real deployed environment, the API_KEY should be set.
  console.error("API_KEY is not set. Please set the API_KEY environment variable.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const schema = {
  type: Type.OBJECT,
  properties: {
    title: { 
      type: Type.STRING, 
      description: "このコマを簡潔に表す日本語のタイトル。" 
    },
    description: { 
      type: Type.STRING, 
      description: "コマの情景を説明する文章。" 
    },
    dialogue: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          character: { 
            type: Type.STRING, 
            description: "セリフを話しているキャラクター名。不明な場合は「ナレーター」とすること。"
          },
          text: { 
            type: Type.STRING, 
            description: "キャラクターのセリフ。" 
          }
        },
        required: ["character", "text"]
      }
    },
    onomatopoeia: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          text: { 
            type: Type.STRING, 
            description: "オノマトペの描き文字。" 
          },
          sound_description: { 
            type: Type.STRING, 
            description: "オノマトペが表現する効果音の説明。" 
          }
        },
        required: ["text", "sound_description"]
      }
    }
  },
  required: ["title", "description", "dialogue", "onomatopoeia"]
};

const createPrompt = (level: NarrationLevel): string => {
  const basePrompt = `あなたは、日本の漫画のコマを視覚障碍者向けに音声ガイド化するプロのナレーターです。
提供された画像（漫画の1コマ）を分析し、以下の情報を厳密なJSON形式で返してください。日本の漫画は通常、右上から左下へと読み進めることを考慮してください。

1. title: このコマを簡潔に表す日本語のタイトル。
2. description: ${
    level === 'detailed'
      ? 'まずコマ全体の状況を描写し、次にキャラクターの表情、ポーズ、服装、背景、構図など、視覚的な情報を物語の流れに沿って三人称視点で客観的かつ詳細に説明する文章。セリフや描き文字（オノマトペ）の内容は含めず、純粋な情景描写に徹してください。'
      : 'コマの状況を、物語の流れがわかるように簡潔に説明する文章。キャラクターの重要なアクションや表情の変化に焦点を当ててください。'
  }
3. dialogue: コマ内のセリフを、日本の漫画の読み順（通常は右上から左下）に従って、発話された順番に並べたオブジェクトの配列。各オブジェクトは character (話しているキャラクター名。不明な場合は「ナレーター」) と text (セリフの文字列) を含みます。セリフの順番は物語の理解において非常に重要なので、厳密に守ってください。
4. onomatopoeia: コマ内のオノマトペ（効果音の描き文字）を、その音の表現と共に記述したオブジェクトの配列。各オブジェクトは text (「ゴゴゴゴ」など) と sound_description (「地響きのような不気味な音」など) を含みます。

全てのテキストは自然な日本語で生成し、物語として自然に聞こえるように構成してください。`;

  return basePrompt;
}

export const generateMangaNarration = async (
  imageBase64: string,
  mimeType: string,
  level: NarrationLevel
): Promise<MangaNarration | null> => {
  try {
    const prompt = createPrompt(level);

    const imagePart = {
      inlineData: {
        data: imageBase64,
        mimeType: mimeType,
      },
    };

    const textPart = { text: prompt };

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: { parts: [imagePart, textPart] },
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
      },
    });
    
    const jsonString = response.text.trim();
    const result = JSON.parse(jsonString);

    return result as MangaNarration;
  } catch (error) {
    console.error("Error generating manga narration:", error);
    return null;
  }
};
