document.addEventListener('DOMContentLoaded', async () => {
    // Elements
    const els = {
        riskScore: document.getElementById('risk-score-val'),
        verdict: document.getElementById('verdict-text'),
        explanation: document.getElementById('explanation'),
        socialList: document.getElementById('social-list'),
        techList: document.getElementById('tech-list'),
        badge: document.getElementById('status-badge'),
        source: document.getElementById('scan-source'),
        container: document.querySelector('.container'),
        btnScan: document.getElementById('btn-scan'),
        btnReport: document.getElementById('btn-report')
    };

    // 1. Initial Load: Get data from local storage
    const data = await chrome.storage.local.get("lastScanResult");
    if (data.lastScanResult) {
        updateUI(data.lastScanResult);
    }

    // 2. Listen for storage updates (in case background scans while popup is open)
    chrome.storage.onChanged.addListener((changes, namespace) => {
        if (namespace === 'local' && changes.lastScanResult) {
            updateUI(changes.lastScanResult.newValue);
        }
    });

    // 3. Scan Now Button
    els.btnScan.addEventListener('click', () => {
        // Send message to current tab to force a re-scan
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            // Logic: Tell content script to scrape and send to background
            // For this hackathon, we can just trigger a reload or inject a script
            // But cleaner is to send a message to content.js
            if (tabs[0].id) {
                chrome.tabs.reload(tabs[0].id); // Simple way to re-trigger content script scan
                els.verdict.innerText = "Scanning...";
            }
        });
    });

    // 4. Report Button
    els.btnReport.addEventListener('click', () => {
        alert("Report flagged for future submission to Flask API.");
    });

    // 5. Dashboard Button
    const btnDash = document.getElementById('btn-dashboard');
    if (btnDash) {
        btnDash.addEventListener('click', () => {
            chrome.storage.local.get("lastScanResult", (data) => {
                const baseUrl = "http://localhost:5173";
                if (data.lastScanResult) {
                    const dataStr = encodeURIComponent(JSON.stringify(data.lastScanResult));
                    chrome.tabs.create({ url: `${baseUrl}?data=${dataStr}` });
                } else {
                    chrome.tabs.create({ url: baseUrl });
                }
            });
        });
    }

    function updateUI(result) {
        if (!result || result.error) {
            els.verdict.innerText = "Error";
            els.explanation.innerText = result ? result.explanation : "Unknown error";
            return;
        }

        // Set Text
        els.riskScore.innerText = result.risk_score;
        els.verdict.innerText = result.verdict;
        els.explanation.innerText = result.explanation;
        els.badge.innerText = result.verdict.toUpperCase();
        els.source.innerText = result.content_type;

        // Set Class for Color (safe, suspicious, dangerous)
        els.container.className = `container ${result.verdict}`;

        // Populate Lists
        fillList(els.socialList, result.social_engineering_indicators);
        fillList(els.techList, result.technical_indicators);
    }

    function fillList(ulEl, items) {
        ulEl.innerHTML = '';
        if (!items || items.length === 0) {
            ulEl.innerHTML = '<li>None detected</li>';
            return;
        }
        items.forEach(item => {
            const li = document.createElement('li');
            li.innerText = item.replace('_', ' '); // clean up text
            ulEl.appendChild(li);
        });
    }
});
