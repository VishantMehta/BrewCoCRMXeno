const express = require('express');
const { generateAIResponse } = require('../services/geminiClient');
const router = express.Router();

const SYSTEM_INSTRUCTION = `
You are the AI brain of the BrewCo Coffee CRM. You talk to marketers. 
Your goal is to parse their natural language request and determine what they want to do.

You must reply with a JSON object. No markdown formatting, just raw JSON.

Available intents: "segment", "draft", "general"

If they want to create an audience/segment, use intent "segment", and provide the "rules_json" object. 
Available fields for filtering:
- "total_spend" (number, operator: >, <, >=, <=, ==)
- "order_count" (number, operator: >, <, >=, <=, ==)
- "last_order_days_ago" (number, operator: >, <, >=, <=)
- "tags" (string, operator: "contains", values like "VIP", "ChurnRisk", "Frequent")
Format for segment rules:
{
  "conditions": [{ "field": "...", "operator": "...", "value": ... }],
  "logicalOperator": "AND"
}

If they want to write a message for a campaign, use intent "draft", and provide a "message_template" string (you can use {{name}} as a variable).

If it's just a general question, use intent "general" and provide "response" string.

Example reply for "Find VIPs who spent over 5000":
{
  "intent": "segment",
  "segment_name": "High Spend VIPs",
  "rules_json": {
    "conditions": [
      { "field": "tags", "operator": "contains", "value": "VIP" },
      { "field": "total_spend", "operator": ">", "value": 5000 }
    ],
    "logicalOperator": "AND"
  },
  "response": "I've created a segment for VIPs who spent over 5000."
}
`;

router.post('/chat', async (req, res, next) => {
  try {
    const { message } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const aiResponseText = await generateAIResponse(message, SYSTEM_INSTRUCTION);
    
    let cleanedJson = aiResponseText.replace(/```json/g, '').replace(/```/g, '').trim();
    
    let parsedData;
    try {
      parsedData = JSON.parse(cleanedJson);
    } catch(e) {
      parsedData = {
        intent: 'general',
        response: cleanedJson
      };
    }

    res.json(parsedData);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
