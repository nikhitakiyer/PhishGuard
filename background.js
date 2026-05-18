chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "ANALYZE_EMAIL") {
    analyzeEmail(message.data).then(sendResponse);
    return true;
  }
});

async function analyzeEmail(emailData) {
  const apiKey = await getApiKey();
  
  if (!apiKey) {
    return { error: "No API key found" };
  }

  const prompt = `Analyze this email for phishing and psychological manipulation tactics.

Subject: ${emailData.subject}
Sender: ${emailData.sender}
Body: ${emailData.body}

Return ONLY a JSON object in this exact format, no other text:
{
  "flags": [],
  "emotional_target": "",
  "manipulation_tactics": [],
  "explanation": ""
}

For "flags", use only these exact values (include all that apply):
"urgency language", "requests credentials", "requests sensitive info",
"authority manipulation", "threat of loss", "artificial deadline",
"fear induction", "sender mismatch", "unexpected attachment", "unusual request"

For "emotional_target": one short phrase describing the emotional state this email tries to create. Return "none" if not applicable.
For "manipulation_tactics": list specific psychological techniques used. Return empty array if none.
For "explanation": 1-2 neutral factual sentences describing what this email tries to make the reader feel and do. Return "No manipulation tactics detected." if nothing suspicious.`;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "anthropic-dangerous-direct-browser-access": "true"
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1000,
        messages: [{ role: "user", content: prompt }]
      })
    });

    const data = await response.json();
    console.log("API response:", JSON.stringify(data));
    const text = data.content[0].text;
    const clean = text.replace(/```json\n?|\n?```/g, "").trim();
    const result = JSON.parse(clean);
    return { success: true, result };

  } catch (error) {
    return { error: error.message };
  }
}

async function getApiKey() {
  return new Promise((resolve) => {
    chrome.storage.local.get("apiKey", (data) => {
      resolve(data.apiKey || null);
    });
  });
}