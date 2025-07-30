import express from "express";
import { z } from "zod";
import OpenAI from "openai";
import { ChatCompletionMessageParam } from "openai/resources/chat/completions";

const router = express.Router();

// 🔐 OpenAI client with API key from .env
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

// 🧠 In-memory short-term memory store per user
const userMemory: Record<string, { user: string; ai: string }[]> = {};

// ✅ Zod schema to validate structured AI responses
const memorySchema = z.object({
  topic: z.string(),
  summary: z.string(),
  fun_fact: z.string(),
});

router.post("/chat", async (req, res) => {
  const { username, message } = req.body;

  // ❌ Reject if no username or message provided
  if (!username || !message) {
    return res.status(400).json({ error: "Missing username or message" });
  }

  // 🧠 Initialize memory store if user is new
  if (!userMemory[username]) userMemory[username] = [];

  // Get user chat history
  const history = userMemory[username];

  // 🔁 Convert last 1–2 exchanges into structured messages
  const memoryMessages: ChatCompletionMessageParam[] = history.slice(-2).flatMap((pair) => [
    { role: "user", content: pair.user },
    { role: "assistant", content: pair.ai },
  ]);

  // 🧭 System instruction that sets strict output format
  const systemPrompt = `
You are a JSON API. Always respond with a JSON object in this format:
{
  "topic": string,
  "summary": string,
  "fun_fact": string
}
No extra text, markdown, or explanations.
`.trim();

  // 📩 Wrap user message into a prompt for clarity
  const userPrompt = `
Message from "${username}": "${message}"
Convert this into a JSON object with a topic, summary, and fun fact.
`.trim();

  try {
    // 🤖 Make OpenAI chat completion request with memory + prompt
    const chatResponse = await openai.chat.completions.create({
      model: "gpt-4o", // or "gpt-3.5-turbo" if you're using a free key
      messages: [
        { role: "system", content: systemPrompt },
        ...memoryMessages,
        { role: "user", content: userPrompt },
      ],
      temperature: 0.7,
    });

    // ✂️ Extract and validate the AI response
    const raw = chatResponse.choices[0].message.content;
    if (!raw) throw new Error("No AI response");

    const parsed = JSON.parse(raw);
    const validated = memorySchema.parse(parsed);

    // 💾 Save to memory for future few-shot context
    history.push({ user: message, ai: raw });

    // ✅ Return structured JSON to frontend
    return res.json(validated);
  } catch (err) {
    console.error("Memory AI Error:", err);
    return res.status(500).json({ error: "Invalid AI response format" });
  }
});

export default router;
