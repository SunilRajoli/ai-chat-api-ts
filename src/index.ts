import express from "express";
import { z } from "zod";
import OpenAI from "openai";

const router = express.Router();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

// 1. Define the expected structure of the AI's JSON output using Zod
const aiSchema = z.object({
  topic: z.string(),
  summary: z.string(),
  fun_fact: z.string()
});

router.post("/chat", async (req, res) => {
  const { username, message } = req.body;

  // 2. Basic input validation for client request
  if (!username || !message) {
    return res.status(400).json({ error: "Missing username or message" });
  }

  // 3. Prompt that locks the LLM into JSON-only response mode
  const systemPrompt = `
You are a backend API that ONLY returns pure JSON.
You must NEVER include extra text, markdown, or formatting.
Respond ONLY with valid JSON, and always match the expected format exactly.
`.trim();

  // 4. Instruction to the LLM including schema + user input
  const userPrompt = `
Convert the following message into a JSON summary with this structure:

{
  "topic": string,
  "summary": string,
  "fun_fact": string
}

Message from "${username}": "${message}"
`.trim();

  try {
    // 5. Send chat prompt to OpenAI API
    const chatResponse = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.7
    });

    // 6. Get raw string output from model
    const raw = chatResponse.choices[0].message.content;
    if (!raw) throw new Error("No response from AI");

    // 7. Parse the response string into JSON
    const parsed = JSON.parse(raw);

    // 8. Validate the parsed JSON structure using Zod
    const validated = aiSchema.parse(parsed);

    // 9. Send validated output to the client
    return res.json(validated);
  } catch (err) {
    // 10. Catch both JSON and schema validation errors
    console.error("AI Error:", err);
    return res.status(500).json({ error: "Invalid AI response format" });
  }
});

export default router;
