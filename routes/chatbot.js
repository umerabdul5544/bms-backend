const express = require('express');
const router = express.Router();
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const { GoogleGenerativeAI } = require('@google/generative-ai');

if (!process.env.GEMINI_API_KEY) {
  const envCandidates = [
    path.join(__dirname, '..', '.env'),
    path.join(__dirname, '..', '..', '.env'),
    path.join(process.cwd(), '.env'),
  ];
  const envFile = envCandidates.find((p) => fs.existsSync(p));
  if (envFile) {
    dotenv.config({ path: envFile, override: true });
    console.log('Chatbot route loaded env from', envFile);
  }
}

const SYSTEM_PROMPT = `
You are the "BMS Assistant", a smart AI companion for the Business Management System (BMS).
Your goal is to help users understand and use the system efficiently AND answer business questions using the data provided.

SYSTEM MODULES: Dashboard, POS, Inventory, Stock/Purchases, Ledger, Customers, Suppliers, Banks, Team/Users.

RULES:
- ALWAYS start your very first interaction with: "Hello sir/mam how may I help you". 
- Language: English or Roman Urdu (based on user).
- Be concise and professional.
- When business data is provided in the prompt, use it to give specific answers.
- No sensitive data sharing beyond what is provided.
`;

router.post('/query', async (req, res) => {
  console.log('Chatbot query request received. GEMINI_API_KEY present:', !!process.env.GEMINI_API_KEY);
  try {
    const { prompt, history, businessContext } = req.body;
    
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      console.error('Chatbot request failed because GEMINI_API_KEY is missing.');
      return res.status(500).json({ 
        error: 'API Key missing. Please add GEMINI_API_KEY to your backend .env file.' 
      });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const chat = model.startChat({
      history: history || [],
      generationConfig: { maxOutputTokens: 500 },
    });

    // If business context provided, prepend it
    let fullPrompt;
    if (history && history.length > 0) {
      fullPrompt = businessContext ? `[Business Context: ${businessContext}]\n\n${prompt}` : prompt;
    } else {
      fullPrompt = businessContext 
        ? `${SYSTEM_PROMPT}\n\n[Current Business Data: ${businessContext}]\n\nUser: ${prompt}`
        : `${SYSTEM_PROMPT}\n\nUser: ${prompt}`;
    }

    const result = await chat.sendMessage(fullPrompt);
    const response = await result.response;
    res.json({ text: response.text() });

  } catch (error) {
    console.error('Chatbot Error:', error);
    res.status(500).json({ error: 'AI response failed. Check your API key and quota.' });
  }
});

module.exports = router;