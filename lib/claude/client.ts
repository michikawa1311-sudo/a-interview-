import Anthropic from "@anthropic-ai/sdk";

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

// 会話・記事生成のどちらも同じモデルを使う。
export const CLAUDE_MODEL = "claude-sonnet-5";
