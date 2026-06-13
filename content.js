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

let popup = null;
let scanRequested = false;
let skipActive = false;

function createPopup(targetElement) {
  removePopup();

  popup = document.createElement("div");
  popup.id = "phishguard-popup";
  popup.style.cssText = `
    position: fixed;
    background: white;
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    padding: 12px 14px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    z-index: 999999;
    max-width: 280px;
    font-family: Arial, sans-serif;
    font-size: 13px;
  `;

  popup.innerHTML = `
    <div style="font-weight: 600; margin-bottom: 6px; color: #1a1a1a;">Before you click</div>
    <div style="color: #555; font-size: 12px; margin-bottom: 10px; line-height: 1.5;">
      Want PhishGuard to scan this email? If it contains sensitive personal info, skip scanning and review manually.
    </div>
    <div style="display: flex; gap: 8px;">
      <button id="phishguard-scan" style="
        flex: 1; padding: 7px; background: #1a73e8; color: white;
        border: none; border-radius: 6px; cursor: pointer; font-size: 12px; font-weight: 500;
      ">Scan email</button>
      <button id="phishguard-skip" style="
        flex: 1; padding: 7px; background: #f1f3f4; color: #444;
        border: none; border-radius: 6px; cursor: pointer; font-size: 12px;
      ">Skip</button>
    </div>
  `;

  const rect = targetElement.getBoundingClientRect();
  popup.style.top = (rect.bottom + window.scrollY + 8) + "px";
  popup.style.left = (rect.left + window.scrollX) + "px";

  document.body.appendChild(popup);

  document.getElementById("phishguard-scan").addEventListener("click", () => {
    removePopup();
    scanRequested = true;
    const emailData = getEmailData();
    analyzeWithClaude(emailData);
  });

  document.getElementById("phishguard-skip").addEventListener("click", () => {
  skipActive = true;
  removePopup();
  setTimeout(() => { skipActive = false; }, 3000);
});
}

function removePopup() {
  if (popup) {
    popup.remove();
    popup = null;
  }
}

function setupLinkHover() {
  document.addEventListener("mouseover", (e) => {
    const link = e.target.closest("a[href], div.aQH");
    if (!link) return;

    const emailBody = document.querySelector("div.a3s");
    if (!emailBody || !emailBody.contains(link)) return;

   if (!skipActive) createPopup(link);
  });

  document.addEventListener("mouseout", (e) => {
    const link = e.target.closest("a[href], div.aQH");
    if (!link) return;
    setTimeout(() => {
      if (popup && !popup.matches(":hover")) removePopup();
    }, 300);
  });
}

setupLinkHover();