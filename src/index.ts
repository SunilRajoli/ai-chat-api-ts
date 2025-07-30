import OpenAI from "openai";
import dotenv from "dotenv";
import express from "express";

dotenv.config();

const app = express();
app.use(express.json());


const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

app.post('/chat', async (req, res) => {
    const userMessage = req.body.message;

    if(!userMessage) {
        return res.status(400).json({ error: 'Message is required' });
    }

    try {
        const response = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: [
                { role: 'user', content: userMessage }
            ],
        });
        res.status(200).json({ reply: response.choices[0].message.content});
    } catch (error) {
        console.error('Error processing request:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
})
