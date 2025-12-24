// content.js

console.log("ChickenShield: Content script loaded.");

// ========================================================
// UTILITIES
// ========================================================
function debounce(func, wait) {
    let timeout;
    return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

function getTextContent() {
    // Simple extraction of visible text
    return document.body.innerText.substring(0, 15000); // Limit to avoid hitting token limits
}

// ========================================================
// SCAN TRIGGERS
// ========================================================

// 1. Generic Website Scanner
function scanWebsite() {
    // Skip scanning if it's Gmail (handled separately)
    if (window.location.hostname.includes("mail.google.com")) return;

    const data = {
        type: "website",
        source: window.location.href,
        title: document.title,
        content: getTextContent()
    };

    console.log("ChickenShield: Scanning Website...", data.source);
    chrome.runtime.sendMessage({ action: "ANALYZE_CONTENT", data: data });
}

// 2. Gmail Scanner
function setupGmailObserver() {
    if (!window.location.hostname.includes("mail.google.com")) return;

    console.log("ChickenShield: Gmail detected. Setting up observer.");

    // Select the main container where emails trigger changes
    // This is heuristic-based for Gmail's architecture
    const targetNode = document.body;

    // We look for specific element classes that appear when an email is OPENED
    // .hP = Subject Line
    // .gD = Sender Name/Email
    // .a3s = Email Body

    let lastUrl = location.href;

    const observer = new MutationObserver(debounce(() => {
        // Check if URL changed (Gmail changes URL hash when opening emails)
        if (location.href !== lastUrl) {
            lastUrl = location.href;
            checkForEmailOpen();
        }
    }, 1000));

    observer.observe(document.body, { childList: true, subtree: true });
}

function checkForEmailOpen() {
    // Attempt to find email components
    const subjectEl = document.querySelector('.hP'); // Subject
    const senderEl = document.querySelector('.gD'); // Sender (often has email in attributes)
    const bodyEl = document.querySelector('.a3s');  // Body content

    if (subjectEl && bodyEl) {
        console.log("ChickenShield: Email open detected!");

        const senderName = senderEl ? senderEl.innerText : "Unknown";
        const senderEmail = senderEl ? senderEl.getAttribute("email") || senderEl.innerText : "Unknown";

        const data = {
            type: "email",
            source: `${senderName} <${senderEmail}>`,
            title: subjectEl.innerText,
            content: bodyEl.innerText
        };

        chrome.runtime.sendMessage({ action: "ANALYZE_CONTENT", data: data });
    }
}

// ========================================================
// INITIALIZATION
// ========================================================

// Run immediately for websites
if (!window.location.hostname.includes("mail.google.com")) {
    scanWebsite();
}

// Run special setup for Gmail
setupGmailObserver();
