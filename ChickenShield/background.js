require('dotenv').config();

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_API_URL = process.env.GROQ_API_URL;

let lastScanResult = null;

async function analyzeWithGemini(data) {
  const prompt = `
    You are a cybersecurity expert. Analyze the following content for scams, phishing, or malicious intent.
    
    CONTENT TYPE: ${data.type}
    URL/SENDER: ${data.source}
    SUBJECT/TITLE: ${data.title}
    CONTENT BODY: ${
      data.content ? data.content.substring(0, 10000) : "No text content"
    } 

    Analyze the content. Return ONLY a raw JSON object (no markdown, no backticks) with this structure:
    {
      "content_type": "email" or "website",
      "creation_date_estimate": "ISO date string or null",
      "domain_age_estimate_days": number or null,
      "sender_reputation": "low", "medium", "high", or "unknown",
      "social_engineering_indicators": ["urgency", "fear", "impersonation", "financial_pressure", "etc"],
      "technical_indicators": ["suspicious_links", "spoofed_domain", "tracking_pixels", "hidden_redirects"],
      "risk_score": number (0-100),
      "verdict": "safe", "suspicious", or "dangerous",
      "risk_score": number (0-100),
      "verdict": "safe", "suspicious", or "dangerous",
      "explanation_technical": "Detailed security analysis using cyber-security terminology.",
      "explanation_simple": "A fun, simple analogy explaining the risk to a 5-year-old (e.g. using wolves, candy, locks)."
    }
  `;

  try {
    const response = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile", // Updated to supported model
        messages: [
          {
            role: "system",
            content: "You are a cybersecurity expert. Output valid JSON only.",
          },
          { role: "user", content: prompt },
        ],
        response_format: { type: "json_object" }, // Enforce JSON
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Groq API Error: ${response.status} ${response.statusText} - ${errorText}`
      );
    }

    const json = await response.json();
    const resultText = json.choices[0].message.content;
    const resultFunc = JSON.parse(resultText);

    return resultFunc;
  } catch (error) {
    console.error("Gemini Scan Failed:", error);
    return {
      error: true,
      explanation:
        "Failed to connect to AI service. Please check your API key or internet connection.",
      risk_score: 0,
      verdict: "unknown",
    };
  }
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "ANALYZE_CONTENT") {
    chrome.action.setBadgeText({ text: "..." });
    chrome.action.setBadgeBackgroundColor({ color: "#999" });

    analyzeWithGemini(request.data).then((result) => {
      const finalResult = {
        ...result,
        source: request.data.source,
        title: request.data.title,
        timestamp: new Date().toISOString(),
      };

      lastScanResult = finalResult;
      chrome.storage.local.set({ lastScanResult: finalResult });

      updateBadge(finalResult.verdict);

      sendResponse({ status: "success", result: finalResult });
    });

    return true; 
  }

  if (request.action === "GET_LAST_RESULT") {
    sendResponse(lastScanResult);
    return false;
  }
});

function updateBadge(verdict) {
  let text = "OK";
  let color = "green";

  if (verdict === "suspicious") {
    text = "WARN";
    color = "orange";
  } else if (verdict === "dangerous") {
    text = "BAD";
    color = "red";
  } else if (verdict === "unknown") {
    text = "?";
    color = "gray";
  }

  chrome.action.setBadgeText({ text });
  chrome.action.setBadgeBackgroundColor({ color });
}
