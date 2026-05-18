console.log("PhishGuard loaded!");

function getEmailData() {
  const subject = document.querySelector("h2.hP")?.innerText || "No subject";
  const sender = document.querySelector("span.gD")?.getAttribute("email") || "Unknown sender";
  const body = document.querySelector("div.a3s")?.innerText || "No body";

  console.log("Subject:", subject);
  console.log("Sender:", sender);
  console.log("Body:", body);
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