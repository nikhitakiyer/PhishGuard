function sanitizeBody(text) {
  text = text.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, "[EMAIL]");
  text = text.replace(/(\+?1?\s?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/g, "[PHONE]");
  text = text.replace(/\b\d{3}-\d{2}-\d{4}\b/g, "[SSN]");
  text = text.replace(/\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g, "[CARD]");
  text = text.replace(/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g, "[IP_ADDRESS]");
  text = text.replace(/\d+\s+[a-zA-Z]+\s+(street|st|avenue|ave|road|rd|boulevard|blvd|lane|ln|drive|dr|court|ct|way|place|pl)\b/gi, "[ADDRESS]");
  return text;
}

function getEmailData() {
  const subject = document.querySelector("h2.hP")?.innerText || "No subject";
  const sender = document.querySelector("span.gD")?.getAttribute("email") || "Unknown sender";
  const rawBody = document.querySelector("div.a3s")?.innerText || "No body";
  const body = sanitizeBody(rawBody);

  console.log("Subject:", subject);
  console.log("Sender:", sender);
  console.log("Body:", body);

  const emailData = { subject, sender, body };
  analyzeWithClaude(emailData);
  return emailData;
}

const observer = new MutationObserver(() => {
  if (document.querySelector("div.a3s")) {
    getEmailData();
  }
});

observer.observe(document.body, {
  childList: true,
  subtree: true
});

function analyzeWithClaude(emailData) {
  chrome.runtime.sendMessage(
    { type: "ANALYZE_EMAIL", data: emailData },
    (response) => {
      if (response.error) {
        console.log("Error:", response.error);
      } else {
        console.log("Claude's analysis:", response.result);
      }
    }
  );
}