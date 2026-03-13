const http = require('http');
const path = require('path');

const SERVER_URL = 'http://localhost:3001';
const PROCESS_ID = "SUB-2025-0310-PCBK-FI-0042";
const CASE_NAME = "Pinnacle Community Bancorp — D&O FI Renewal";

function post(endpoint, data) {
    return new Promise((resolve, reject) => {
        const body = JSON.stringify(data);
        const opts = {
            hostname: 'localhost',
            port: 3001,
            path: endpoint,
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }
        };
        const req = http.request(opts, res => {
            let d = '';
            res.on('data', c => d += c);
            res.on('end', () => resolve(d));
        });
        req.on('error', reject);
        req.write(body);
        req.end();
    });
}

function get(endpoint) {
    return new Promise((resolve, reject) => {
        const req = http.request({ hostname: 'localhost', port: 3001, path: endpoint, method: 'GET' }, res => {
            let d = '';
            res.on('data', c => d += c);
            res.on('end', () => { try { resolve(JSON.parse(d)); } catch(e) { resolve({}); } });
        });
        req.on('error', reject);
        req.end();
    });
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function updateProcessListStatus(id, status, currentStatus) {
    await post('/api/update-status', { id, status, currentStatus });
}

async function addLog(logEntry) {
    await post('/api/update-process-log', { processId: PROCESS_ID, logEntry });
}

async function updateKeyDetails(keyDetails) {
    await post('/api/update-process-log', { processId: PROCESS_ID, keyDetails });
}

async function addArtifact(artifact) {
    await post('/api/update-process-log', { processId: PROCESS_ID, sidebarArtifacts: [artifact] });
}

async function waitForSignal(signalId, pollInterval = 2000) {
    while (true) {
        try {
            const signals = await get('/signal-status');
            if (signals[signalId] === true) return;
        } catch(e) {}
        await sleep(pollInterval);
    }
}

(async () => {
    console.log(`Starting simulation: ${CASE_NAME}`);
    await sleep(2000);

    // ── STEP 1: Submission Received ──────────────────────────────────────────
    await updateProcessListStatus(PROCESS_ID, "In Progress", "Step 1 of 11 — Submission Received");
    await addLog({ step: 1, title: "Submission Received", status: "complete",
        description: "Inbound submission email received from Marcus Webb at Gallagher Charlotte. Policy type: D&O Financial Institutions Edition. Named insured: Pinnacle Community Bancorp, Inc.",
        timestamp: new Date().toISOString() });
    await addArtifact({ id: "inbound_email", type: "email", label: "Inbound Submission Email",
        isIncoming: true, pdfPath: "/data/inbound_submission_email.eml" });
    await updateKeyDetails({ "Named Insured": "Pinnacle Community Bancorp, Inc.", "Broker": "Marcus Webb, Gallagher Charlotte", "Line": "D&O — Financial Institutions Edition" });
    await sleep(4000);

    // ── STEP 2: Document Classification ─────────────────────────────────────
    await updateProcessListStatus(PROCESS_ID, "In Progress", "Step 2 of 11 — Document Classification");
    await addLog({ step: 2, title: "Document Classification", status: "complete",
        description: "8 documents classified across 5 categories: ML Application (FI), Financial Statements FY2022–2024, FFIEC UBPR Report, Loss Run, FDIC Consent Order Termination.",
        timestamp: new Date().toISOString() });
    await addArtifact({ id: "doc_class", type: "pdf", label: "Document Classification Report",
        pdfPath: "/data/doc_classification_report.pdf" });
    await sleep(4000);

    // ── STEP 3: Completeness Check ───────────────────────────────────────────
    await updateProcessListStatus(PROCESS_ID, "In Progress", "Step 3 of 11 — Completeness Check");
    await addLog({ step: 3, title: "Completeness Check", status: "complete",
        description: "All 8 required documents present. No missing items. Submission is complete and ready for triage.",
        timestamp: new Date().toISOString() });
    await addArtifact({ id: "completeness", type: "pdf", label: "Completeness Check Report",
        pdfPath: "/data/completeness_check_report.pdf" });
    await sleep(4000);

    // ── STEP 4: FDIC Regulatory Verification ────────────────────────────────
    await updateProcessListStatus(PROCESS_ID, "In Progress", "Step 4 of 11 — FDIC Regulatory Verification");
    await addLog({ step: 4, title: "FDIC Regulatory Verification", status: "complete",
        description: "FDIC enforcement records searched. Consent order from 2021 confirmed terminated December 2024. Institution currently in good standing with no active enforcement actions.",
        timestamp: new Date().toISOString() });
    await addArtifact({ id: "fdic_enforcement", type: "pdf", label: "FDIC Enforcement Record",
        pdfPath: "/data/fdic_enforcement_record.pdf" });
    await addArtifact({ id: "fdic_video", type: "video", label: "FDIC Browser Recording",
        videoPath: "/data/FDIC_Browser_Recording.mp4" });
    await updateKeyDetails({ "FDIC Status": "Consent Order Terminated Dec 2024", "Current Standing": "Good Standing" });
    await sleep(5000);

    // ── STEP 5: EDGAR Verification ───────────────────────────────────────────
    await updateProcessListStatus(PROCESS_ID, "In Progress", "Step 5 of 11 — EDGAR Verification");
    await addLog({ step: 5, title: "EDGAR Verification", status: "complete",
        description: "SEC EDGAR filings verified. Most recent 10-K and 8-K filings confirmed current. No material restatements or SEC enforcement actions found.",
        timestamp: new Date().toISOString() });
    await addArtifact({ id: "edgar", type: "pdf", label: "EDGAR Verification Report",
        pdfPath: "/data/edgar_verification_report.pdf" });
    await sleep(4000);

    // ── STEP 6: PAS System Lookup ────────────────────────────────────────────
    await updateProcessListStatus(PROCESS_ID, "In Progress", "Step 6 of 11 — PAS System Lookup");
    await addLog({ step: 6, title: "PAS System Lookup", status: "complete",
        description: "Policy Administration System searched for prior Chubb coverage. Prior D&O policy located: FI-D&O-2024-PCBK-001. Premium history and loss record retrieved.",
        timestamp: new Date().toISOString() });
    await addArtifact({ id: "pas_video", type: "video", label: "PAS Browser Recording",
        videoPath: "/data/PAS_Browser_Recording.mp4" });
    await addArtifact({ id: "pas_pop_video", type: "video", label: "PAS Auto-Population Recording",
        videoPath: "/data/PAS_Population_Browser_Recording.mp4" });
    await updateKeyDetails({ "Prior Policy": "FI-D&O-2024-PCBK-001", "Prior Premium": "$312,000" });
    await sleep(4000);

    // ── STEP 7: Financial Analysis ───────────────────────────────────────────
    await updateProcessListStatus(PROCESS_ID, "In Progress", "Step 7 of 11 — Financial Analysis");
    await addLog({ step: 7, title: "Financial Analysis", status: "complete",
        description: "FY2022–2024 financial statements analyzed. Total assets: $2.4B. NPL ratio: 0.82% (below 1% threshold). Capital adequacy: Well-capitalized. Earnings trend: stable with moderate improvement.",
        timestamp: new Date().toISOString() });
    await addArtifact({ id: "financials", type: "pdf", label: "Financial Analysis Report",
        pdfPath: "/data/financial_analysis_report.pdf" });
    await updateKeyDetails({ "Total Assets": "$2.4B", "NPL Ratio": "0.82%", "Capital": "Well-Capitalized" });
    await sleep(5000);

    // ── STEP 8: Loss History Analysis ────────────────────────────────────────
    await updateProcessListStatus(PROCESS_ID, "In Progress", "Step 8 of 11 — Loss History Analysis");
    await addLog({ step: 8, title: "Loss History Analysis", status: "complete",
        description: "5-year loss run reviewed. No D&O claims in period. One employment practices matter (2022) closed with no indemnity payment. Loss ratio: 0%. Favorable loss history.",
        timestamp: new Date().toISOString() });
    await addArtifact({ id: "loss_run", type: "pdf", label: "Loss Run",
        pdfPath: "/data/loss_run_chubb_pcbk.pdf" });
    await addArtifact({ id: "loss_analysis", type: "pdf", label: "Loss History Analyzer Output",
        pdfPath: "/data/loss_history_analyzer_output.pdf" });
    await updateKeyDetails({ "Loss Ratio (5yr)": "0%", "Open Claims": "None" });
    await sleep(4000);

    // ── STEP 9: Appetite Triage ───────────────────────────────────────────────
    await updateProcessListStatus(PROCESS_ID, "In Progress", "Step 9 of 11 — Appetite Triage");
    await addLog({ step: 9, title: "Appetite Triage Evaluation", status: "complete",
        description: "Risk scored against Chubb FI appetite matrix. Score: 78/100 (Preferred tier). Consent order termination confirmed — no longer an exclusion trigger. Recommended: proceed to quote.",
        timestamp: new Date().toISOString() });
    await addArtifact({ id: "triage", type: "pdf", label: "Appetite Triage Evaluation",
        pdfPath: "/data/appetite_triage_evaluation.pdf" });
    await updateKeyDetails({ "Appetite Score": "78/100 — Preferred Tier", "Triage Decision": "Proceed to Quote" });
    await sleep(4000);

    // ── STEP 10: Rating Tool ──────────────────────────────────────────────────
    await updateProcessListStatus(PROCESS_ID, "In Progress", "Step 10 of 11 — Rating Tool");
    await addLog({ step: 10, title: "Rating Tool — Premium Calculation", status: "complete",
        description: "FI Rating Tool populated with verified submission data. Base rate applied with regulatory risk modifier (+4.2%) and loss-free credit (−3.1%). Indicated premium: $336,000.",
        timestamp: new Date().toISOString() });
    await addArtifact({ id: "rating_input", type: "video", label: "Rating Tool Input Recording",
        videoPath: "/data/Rating_Tool_Input_Recording.mp4" });
    await addArtifact({ id: "rating_final", type: "video", label: "Rating Tool Final Recording",
        videoPath: "/data/Rating_Tool_Final_Recording.mp4" });
    await updateKeyDetails({ "Indicated Premium": "$336,000", "Rate Change": "+7.7% vs prior year" });
    await sleep(4000);

    // ── STEP 11: HITL — Underwriter Quote Approval ───────────────────────────
    await updateProcessListStatus(PROCESS_ID, "In Progress", "Step 11 of 11 — Awaiting Underwriter Approval");
    await addLog({ step: 11, title: "Underwriter Quote Approval", status: "pending",
        description: "Pace has prepared the draft quote letter for $336,000. Awaiting underwriter review and approval to release to broker.",
        timestamp: new Date().toISOString() });
    await addArtifact({ id: "draft_quote", type: "pdf", label: "Draft Quote Letter",
        pdfPath: "/data/draft_quote_letter.pdf" });
    await addArtifact({ id: "uw_notification", type: "email", label: "Underwriter Notification Email",
        isIncoming: false, pdfPath: "/data/underwriter_notification_email.eml" });

    console.log("Waiting for underwriter_approval signal...");
    await waitForSignal('underwriter_approval');
    console.log("Signal received — releasing quote.");

    // Post-signal: release quote email
    await addLog({ step: 11, title: "Quote Approved & Issued", status: "complete",
        description: "Underwriter approved. Quote issued to Marcus Webb at Gallagher Charlotte. $336,000 premium, $25M limit, $1M retention. Valid 30 days.",
        timestamp: new Date().toISOString() });
    await addArtifact({ id: "quote_email", type: "email_draft", label: "Quote Issued Email",
        isIncoming: false,
        from: "sarah.park@chubb.com",
        to: "marcus.webb@ajg.com",
        cc: "chubb.fi.underwriting@chubb.com",
        subject: "Chubb Quote — Pinnacle Community Bancorp D&O FI — $336,000",
        body: "Dear Marcus,\n\nPlease find attached Chubb's formal quote for Pinnacle Community Bancorp's D&O Financial Institutions renewal:\n\n• Policy Period: May 1, 2025 – May 1, 2026\n• Line: D&O Liability — Financial Institutions Edition\n• Limit: $25,000,000\n• Retention: $1,000,000\n• Premium: $336,000\n• Endorsements: Regulatory Representation and Warranty\n\nThis quote is valid for 30 days. Please don't hesitate to reach out with any questions.\n\nBest regards,\nSarah Park\nSr. Underwriter, Financial Institutions\nChubb"
    });
    await updateKeyDetails({
        "Premium Indication": "$336,000 (+7.7% over prior year)",
        "Pace Processing Time": "8 min 22 sec",
        "Status": "Done — Quote Queued for Underwriter Review"
    });
    await updateProcessListStatus(PROCESS_ID, "Done", "Done — Proceed to Quote");

    console.log(`${PROCESS_ID} Complete: ${CASE_NAME}`);
})();
