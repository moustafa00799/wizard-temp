/**
 * ai-engine.ts
 * محرك AI: يتصل بـ Gemini 3.5 Flash لتوليد Blueprint أولي
 * يتضمن: معالجة أخطاء، إعادة محاولة، validation أساسي
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import type { WizardPayload, RichBlueprintData } from "./blueprint-types";
import { buildFullPrompt as buildAIPrompt } from "./ai-prompts";

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey && process.env.NODE_ENV === "development") {
  console.warn("[AI Engine] GEMINI_API_KEY not set. AI generation will be skipped.");
}

const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

// نموذج مجاني سريع
const MODEL_NAME = "gemini-1.5-flash"; // أو "gemini-3.5-flash" حسب التوفر

/**
 * يحاول توليد Blueprint باستخدام AI
 * إذا فشل، يعيد null ويتم الاعتماد على Rules Backfill بالكامل
 */
export async function generateBlueprintWithAI(
  data: WizardPayload,
  options?: { timeoutMs?: number; retries?: number }
): Promise<{ blueprint: Partial<RichBlueprintData>; rawResponse: string; success: boolean; error?: string }> {
  if (!genAI) {
    return { blueprint: {}, rawResponse: "", success: false, error: "GEMINI_API_KEY missing" };
  }

  const timeoutMs = options?.timeoutMs ?? 25000;
  const retries = options?.retries ?? 1;

  const prompt = buildAIPrompt(data as any);
  const model = genAI.getGenerativeModel({ model: MODEL_NAME });

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      const result = await model.generateContent(
        { contents: [{ role: "user", parts: [{ text: prompt }] }] },
        { signal: controller.signal as any }
      );
      clearTimeout(timeoutId);

      const response = result.response;
      const text = response.text();

      // استخراج JSON من الرد
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("No JSON object found in AI response");
      }

      const parsed = JSON.parse(jsonMatch[0]) as Partial<RichBlueprintData>;

      // Validation أساسي: التأكد من وجود الأقسام الرئيسية
      const requiredSections = [
        "executive_summary",
        "strategy_summary",
        "campaign_structure",
        "audience_structure",
        "budget_split",
        "creative_angles",
        "tracking_checklist",
        "risk_flags",
      ];

      const missing = requiredSections.filter((key) => !(key in parsed));
      if (missing.length > 0) {
        throw new Error(`AI response missing sections: ${missing.join(", ")}`);
      }

      // إضافة بيانات وصفية
      (parsed as any).blueprint_id = `bp_ai_${Date.now()}`;
      (parsed as any).version = "2.0.0-ai";
      (parsed as any).rule_engine_version = "ai-1.0";
      (parsed as any).generated_at = new Date().toISOString();

      return { blueprint: parsed, rawResponse: text, success: true };

    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[AI Engine] Attempt ${attempt + 1} failed:`, msg);

      if (attempt === retries) {
        return { blueprint: {}, rawResponse: "", success: false, error: msg };
      }
      // انتظار قصير قبل إعادة المحاولة
      await new Promise((r) => setTimeout(r, 500));
    }
  }

  return { blueprint: {}, rawResponse: "", success: false, error: "Unknown error" };
}