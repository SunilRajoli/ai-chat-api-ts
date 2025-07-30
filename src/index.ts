import express from "express";
import dotenv from "dotenv";
import chatRoutes from "./routes/chat";

dotenv.config(); // Load .env variables like OPENAI_API_KEY

const app = express();
const PORT = process.env.PORT || 3000;

// Enable JSON body parsing
app.use(express.json());

// Health check
app.get("/", (req, res) => {
  res.send("✅ AI Chat Backend is running");
});

// Mount /chat route
app.use("/chat", chatRoutes);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server listening at http://localhost:${PORT}`);
});
