const http = require('http');

function runSimulation(port) {
    const PORT = port || process.env.PORT || 3001;
    const PROCESS_ID = "SUB-2025-0310-PCBK-FI-0042";
    const CASE_NAME = "Pinnacle Community Bancorp — D&O FI Renewal";
    const BASE_URL = "https://backend-production-6452.up.railway.app";

    function post(endpoint, data) {
        return new Promise((resolve) => {
            try {
                const body = JSON.stringify(data);
                const opts = {
                    hostname: '127.0.0.1',
                    port: parseInt(PORT),
                    path: endpoint,
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }
                };
                const req = http.request(opts, res => {
                    let d = '';
                    res.on('data', c => d += c);
                    res.on('end', () => resolve(d));
                });
                req.on('error', (e) => { console.error(`[sim] POST ${endpoint} error:`, e.message); resolve(null); });
                req.write(body);
                req.end();
            } catch(e) { console.error(`[sim] POST ${endpoint} threw:`, e.message); resolve(null); }
        });
    }

    function get(endpoint) {
        return new Promise((resolve) => {
            try {
                const req = http.request({ hostname: '127.0.0.1', port: parseInt(PORT), path: endpoint, method: 'GET' }, res => {
                    let d = '';
                    res.on('data', c => d += c);
                    res.on('end', () => { try { resolve(JSON.parse(d)); } catch(e) { resolve({}); } });
                });
                req.on('error', (e) => { console.error(`[sim] GET ${endpoint} error:`, e.message); resolve({}); });
                req.end();
            } catch(e) { console.error(`[sim] GET ${endpoint} threw:`, e.message); resolve({}); }
        });
    }

    function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

    async function updateStatus(status, currentStatus) {
        await post('/api/update-status', { id: PROCESS_ID, status, currentStatus });
    }
    async function addLog(logEntry) {
        await post('/api/update-process-log', { processId: PROCESS_ID, logEntry });
    }
    async function addDetails(keyDetails) {
        await post('/api/update-process-log', { processId: PROCESS_ID, keyDetails });
    }
    async function addArtifact(artifact) {
        await post('/api/update-process-log', { processId: PROCESS_ID, sidebarArtifacts: [artifact] });
    }
    async function waitForSignal(signalId) {
        console.log(`[sim] Waiting for signal: ${signalId}`);
        while (true) {
            const signals = await get('/signal-status');
            if (signals[signalId] === true) { console.log(`[sim] Signal received: ${signalId}`); return; }
            await sleep(2000);
        }
    }

    return (async () => {
        console.log(`[sim] Starting: ${CASE_NAME}`);
        await sleep(2000);

        // ── STEP 1 ──────────────────────────────────────────────────────────────
        await updateStatus("In Progress", "Step 1 of 11 — Submission Email Received & Parsed");
        await addLog({
            step: 1,
            title: "Submission Email Received & Parsed",
            status: "complete",
            reasoning: [
                "Inbound email received from marcus.webb@ajg.com at 9:12 AM, March 10, 2025.",
                "Subject line parsed — named insured, line of business, transaction type, and effective date extracted.",
                "Cover letter read in full — 5 paragraphs processed.",
                "Broker proactively disclosed FDIC Consent Order termination (December 2024).",
                "One prior D&O derivative claim disclosed — settled August 2024 within $1M retention.",
                "10 attachments identified. No encrypted files. No missing documents flagged.",
                "Two priority flags set: regulatory history — consent order and prior D&O claim.",
                "Case created and routed to Sarah Park, Sr. Underwriter, Financial Institutions."
            ],
            timestamp: new Date().toISOString()
        });
        await addArtifact({ id: "inbound_email", type: "email", label: "Inbound Submission Email — Marcus Webb, Gallagher",
            isIncoming: true, pdfPath: "/data/inbound_submission_email.eml" });
        await addArtifact({ id: "fdic_consent_s1", type: "pdf", label: "FDIC Consent Order Termination Letter — Dec 18, 2024",
            pdfPath: "/data/fdic_consent_order_termination.pdf" });
        await addDetails({
            "Named Insured": "Pinnacle Community Bancorp, Inc.",
            "Ticker": "PCBK (NASDAQ)",
            "Broker": "Marcus Webb, Gallagher Charlotte",
            "Line": "D&O — Financial Institutions Edition",
            "Transaction Type": "Renewal — 4th consecutive year (incumbent)",
            "Effective Date": "May 1, 2025"
        });
        console.log("[sim] Step 1 done"); await sleep(4000);

        // ── STEP 2 ──────────────────────────────────────────────────────────────
        await updateStatus("In Progress", "Step 2 of 11 — Document Classification");
        await addLog({
            step: 2,
            title: "Document Classification",
            status: "complete",
            reasoning: [
                "All 10 attached documents ingested and classified simultaneously.",
                "8 of 10 documents are standard FI D&O submission types — classified at 98–99% confidence.",
                "Doc #3 (FDIC Termination Letter) identified as a formal government regulatory document — routed for dedicated regulatory verification.",
                "Doc #10 (BSA/AML Remediation Summary) classified as a management-prepared compliance narrative — routed for qualitative triage analysis.",
                "No bundles requiring splitting. No OCR failures. All documents machine-readable."
            ],
            timestamp: new Date().toISOString()
        });
        await addArtifact({ id: "doc_class", type: "pdf", label: "Document Classification Report",
            pdfPath: "/data/doc_classification_report.pdf" });
        console.log("[sim] Step 2 done"); await sleep(4000);

        // ── STEP 3 ──────────────────────────────────────────────────────────────
        await updateStatus("In Progress", "Step 3 of 11 — Completeness Check");
        await addLog({
            step: 3,
            title: "Completeness Check",
            status: "complete",
            reasoning: [
                "Submission verified against the required document checklist for a publicly traded FI D&O renewal.",
                "Two additional items applied dynamically based on regulatory disclosure in the cover letter: (1) consent order termination letter and (2) BSA/AML remediation documentation.",
                "Both additional documents present — proactively supplied by broker.",
                "All 10 required items confirmed present. No missing information request needed."
            ],
            timestamp: new Date().toISOString()
        });
        await addArtifact({ id: "completeness", type: "pdf", label: "Completeness Check Report",
            pdfPath: "/data/completeness_check_report.pdf" });
        console.log("[sim] Step 3 done"); await sleep(4000);

        // ── STEP 4 ──────────────────────────────────────────────────────────────
        await updateStatus("In Progress", "Step 4 of 11 — Clearance Check & Loss History Retrieved");
        await addLog({
            step: 4,
            title: "Clearance Check & Loss History Retrieved",
            status: "complete",
            reasoning: [
                "PAS search executed — \"Pinnacle Community Bancorp\" — 1 record returned.",
                "Incumbent confirmed: 4 consecutive policy years. Prior policy CHB-DOFI-PCBK-2024 active.",
                "FEIN cross-reference passed. No declinations. No blocking. No duplicate records.",
                "Cross-line flag noted: Chubb also writes the bank's BPL policy — same account team (Sarah Park).",
                "Loss History Analyzer accessed via @chubb portal — full 5-year history retrieved.",
                "4 policy years with zero claims. One D&O derivative claim in May 2023–Apr 2024.",
                "Claim detail: $850K total incurred, settled within $1M retention, Chubb paid $0, dismissed with prejudice August 2024, no appeal filed.",
                "Loss run data consistent with broker cover letter disclosure."
            ],
            timestamp: new Date().toISOString()
        });
        await addArtifact({ id: "loss_run_s4", type: "pdf", label: "Loss Run — Chubb Incumbent FY2020–FY2025",
            pdfPath: "/data/loss_run_chubb_pcbk.pdf" });
        await addArtifact({ id: "loss_analyzer", type: "pdf", label: "Loss History Analyzer Output",
            pdfPath: "/data/loss_history_analyzer_output.pdf" });
        await addArtifact({ id: "pas_video", type: "video", label: "PAS Clearance Browser Recording",
            videoPath: "/data/PAS_Browser_Recording.mp4" });
        await addDetails({
            "Prior Policy": "CHB-DOFI-PCBK-2024 — $25M / $1M retention — $312,000",
            "Prior D&O Claim": "1 claim — $850K within retention — Chubb paid $0 — Closed"
        });
        console.log("[sim] Step 4 done"); await sleep(5000);

        // ── STEP 5 ──────────────────────────────────────────────────────────────
        await updateStatus("In Progress", "Step 5 of 11 — Regulatory Verification — FDIC, OCC & Federal Reserve");
        await addLog({
            step: 5,
            title: "Regulatory Verification — FDIC, OCC & Federal Reserve",
            status: "complete",
            reasoning: [
                "Navigated to FDIC Enforcement Actions portal (orders.fdic.gov) — searched by institution name and state.",
                "Two records returned for Pinnacle Community Bancorp (NC).",
                "CO-2023-PCBK-01 (Consent Order — BSA/AML, Oct 12, 2023): status Terminated — December 18, 2024. ✅",
                "Termination basis confirmed on FDIC record: transaction monitoring upgrade, CDD remediation, SAR compliance, staffing, and third-party validation all completed to FDIC satisfaction.",
                "Termination date matches broker-supplied letter (Doc #3). ✅",
                "Prior 2018 CRE informal agreement — terminated November 2018 — no relevance to current submission.",
                "OCC enforcement search (apps.occ.gov): no records — expected; Pinnacle is state-chartered, not OCC-supervised.",
                "Federal Reserve enforcement search: no records. ✅",
                "Current regulatory status: no outstanding formal enforcement actions across all applicable regulators."
            ],
            timestamp: new Date().toISOString()
        });
        await addArtifact({ id: "fdic_consent_s5", type: "pdf", label: "FDIC Consent Order Termination Letter — Dec 18, 2024 (cross-reference)",
            pdfPath: "/data/fdic_consent_order_termination.pdf" });
        await addArtifact({ id: "fdic_enforcement", type: "pdf", label: "FDIC Enforcement Record — CO-2023-PCBK-01",
            pdfPath: "/data/fdic_enforcement_record.pdf" });
        await addArtifact({ id: "fdic_video", type: "video", label: "FDIC Browser Recording",
            videoPath: "/data/FDIC_Browser_Recording.mp4" });
        await addDetails({
            "Regulatory Flag": "FDIC Consent Order (BSA/AML, Oct 2023) — Confirmed Terminated Dec 18, 2024",
            "OCC Status": "No records — state-chartered, not OCC-supervised",
            "Federal Reserve": "No records ✅"
        });
        console.log("[sim] Step 5 done"); await sleep(5000);

        // ── STEP 6 ──────────────────────────────────────────────────────────────
        await updateStatus("In Progress", "Step 6 of 11 — EDGAR Verification & Material Event Scan");
        await addLog({
            step: 6,
            title: "EDGAR Verification & Material Event Scan",
            status: "complete",
            reasoning: [
                "EDGAR REST API queried by ticker (PCBK) — CIK retrieved.",
                "All 3 submitted SEC documents verified against EDGAR filing records. ✅",
                "18-month 8-K history scanned — 7 filings reviewed.",
                "December 19, 2024 8-K confirms FDIC consent order termination — third independent source. ✅",
                "August 5, 2024 8-K confirms derivative litigation settled and dismissed — cross-referenced with loss run, fully consistent. ✅",
                "No undisclosed material events. No SEC comment letters. No other regulatory investigations."
            ],
            timestamp: new Date().toISOString()
        });
        await addArtifact({ id: "8k_dec", type: "pdf", label: "8-K Dec 19 2024 — FDIC Termination Disclosure",
            pdfPath: "/data/8k_dec2024_fdic_termination.pdf" });
        await addArtifact({ id: "8k_aug", type: "pdf", label: "8-K Aug 5 2024 — Derivative Settlement",
            pdfPath: "/data/8k_aug2024_derivative_settlement.pdf" });
        await addArtifact({ id: "edgar_report", type: "pdf", label: "EDGAR Verification Report",
            pdfPath: "/data/edgar_verification_report.pdf" });
        console.log("[sim] Step 6 done"); await sleep(4000);

        // ── STEP 7 ──────────────────────────────────────────────────────────────
        await updateStatus("In Progress", "Step 7 of 11 — Structured Data Extraction & System Population");
        await addLog({
            step: 7,
            title: "Structured Data Extraction & System Population",
            status: "complete",
            reasoning: [
                "Key fields extracted from ACORD 125, FI management liability application, and financial statements.",
                "Capital ratios extracted: CET1 12.4% · Tier 1 12.4% · Total Capital 13.7% · Leverage 9.8%.",
                "Asset quality extracted: NPA / Total Assets 0.82% · CRE concentration 278% of regulatory capital.",
                "61 PAS fields populated across 7 screens — zero manual keystrokes.",
                "Bank-specific screens populated: capital ratio inputs, regulatory examination status, CRE concentration, CAMELS-equivalent fields.",
                "Regulatory tags applied in PAS: \"Consent order — VERIFIED TERMINATED 12/18/2024\" and \"Prior D&O claim — within retention — Chubb paid $0.\"",
                "FI rating worksheet opened and pre-populated with bank-specific rating inputs.",
                "Submission status set to \"Regulatory Verified — In Review.\" Routed to Sarah Park."
            ],
            timestamp: new Date().toISOString()
        });
        await addArtifact({ id: "ml_app", type: "pdf", label: "Management Liability Application — FI Edition",
            pdfPath: "/data/ml_application_fi.pdf" });
        await addArtifact({ id: "financials", type: "pdf", label: "Financial Statements Bundle FY2022–FY2024",
            pdfPath: "/data/financial_statements_fy2022_2024.pdf" });
        await addArtifact({ id: "pas_pop_video", type: "video", label: "PAS Population Browser Recording",
            videoPath: "/data/PAS_Population_Browser_Recording.mp4" });
        await addArtifact({ id: "rating_input_video", type: "video", label: "Rating Tool Input Recording",
            videoPath: "/data/Rating_Tool_Input_Recording.mp4" });
        await addDetails({
            "CET1 Capital Ratio": "12.4%",
            "NPA / Total Assets": "0.82%",
            "CRE Concentration": "278% of regulatory capital",
            "PAS Fields Populated": "61 across 7 screens — zero manual keystrokes"
        });
        console.log("[sim] Step 7 done"); await sleep(5000);

        // ── STEP 8 ──────────────────────────────────────────────────────────────
        await updateStatus("In Progress", "Step 8 of 11 — Bank Financial Analysis & Peer Benchmarking");
        await addLog({
            step: 8,
            title: "Bank Financial Analysis & Peer Benchmarking",
            status: "complete",
            reasoning: [
                "FFIEC UBPR portal (cdr.ffiec.gov) navigated — Q4 2024 data retrieved by FDIC certificate number.",
                "Capital ratios cross-referenced against UBPR — CET1 12.4% confirmed. ✅",
                "Peer group benchmarks retrieved: community banks $3B–$5B assets, Southeast region.",
                "Capital: CET1 12.4% vs. peer median 11.8% — above peer, top quartile, well-capitalized. ✅",
                "Asset quality: NPA 0.82% vs. peer median 0.94% — improving from 1.14% in FY2023, below peer. ✅",
                "CRE concentration: 278% vs. peer median 295% — elevated but below peer median, below 300% regulatory guidance threshold, declining from 291% in FY2023. 🟡",
                "Earnings: Net income $39.5M (+16% YoY). ROA 0.94%. NIM expanding 3.28% → 3.41%. Recovering toward pre-consent order baseline. ✅",
                "One-time remediation costs ($4–6M) visible in FY2023 financials, absent in FY2024 — consistent with consent order completion and clean exit.",
                "Overall financial health: 🟢 Good — solid capital, improving asset quality, recovering earnings."
            ],
            timestamp: new Date().toISOString()
        });
        await addArtifact({ id: "ffiec_ubpr", type: "pdf", label: "FFIEC UBPR Report — Pinnacle Q4 2024",
            pdfPath: "/data/ffiec_ubpr_report.pdf" });
        await addArtifact({ id: "fin_analysis", type: "pdf", label: "Financial Analysis & Peer Benchmarking Report",
            pdfPath: "/data/financial_analysis_report.pdf" });
        await addDetails({
            "Total Assets": "$4.2B (FY2024)",
            "CET1 vs. Peer Median": "12.4% vs. 11.8% — top quartile ✅",
            "NPA vs. Peer Median": "0.82% vs. 0.94% — below peer ✅",
            "Net Income": "$39.5M (+16% YoY)",
            "Financial Health": "🟢 Good"
        });
        console.log("[sim] Step 8 done"); await sleep(5000);

        // ── STEP 9 ──────────────────────────────────────────────────────────────
        await updateStatus("In Progress", "Step 9 of 11 — Loss Run Analysis & Cross-Reference");
        await addLog({
            step: 9,
            title: "Loss Run Analysis & Cross-Reference",
            status: "complete",
            reasoning: [
                "Broker-submitted loss run (Doc #8) parsed — 5-year history, Chubb incumbent format.",
                "Three-source cross-reference executed: broker loss run · Loss History Analyzer · EDGAR 8-K (Aug 5, 2024).",
                "All three sources fully consistent — same claim, same amount ($850K), same disposition. ✅",
                "Claim context assessed: derivative suit during an active consent order period is a standard secondary consequence in FI D&O — well understood by the market.",
                "Chubb paid $0. Claim closed with prejudice. No reopening risk. No pending appeal.",
                "Loss run rated: 🟢 Clean for renewal. Maintain $1M retention."
            ],
            timestamp: new Date().toISOString()
        });
        await addArtifact({ id: "loss_run_s9", type: "pdf", label: "Loss Run — Chubb Incumbent FY2020–FY2025 (cross-reference)",
            pdfPath: "/data/loss_run_chubb_pcbk.pdf" });
        await addArtifact({ id: "crossref_report", type: "pdf", label: "Three-Source Cross-Reference Report",
            pdfPath: "/data/three_source_crossref_report.pdf" });
        console.log("[sim] Step 9 done"); await sleep(4000);

        // ── STEP 10 ──────────────────────────────────────────────────────────────
        await updateStatus("In Progress", "Step 10 of 11 — Appetite Triage & Routing Decision");
        await addLog({
            step: 10,
            title: "Appetite Triage & Routing Decision",
            status: "complete",
            reasoning: [
                "All 14 appetite factors evaluated against Chubb NA Financial Lines FI D&O guidelines.",
                "Capital, asset quality, earnings, regulatory status, governance response, and loss history all assessed.",
                "BSA/AML Remediation Summary (Doc #10) reviewed — narrative consistent with FDIC termination record, EDGAR 8-K disclosures, and UBPR data at every factual point. No inconsistencies detected.",
                "No referral triggers identified. No missing information. No adverse findings.",
                "Endorsement recommendation: regulatory representation and warranty — no BSA/AML exclusion (consent order is terminated; exclusion penalises a resolved issue).",
                "Premium guidance: +7–9% over prior year ($333K–$341K), reflecting prior claims event and CRE profile, offset by capital strength and 4-year incumbent relationship.",
                "Triage decision: ✅ Proceed to Quote. No referral required.",
                "PAS updated — triage tags and premium guidance recorded. Routing confirmed to Sarah Park's queue.",
                "Notification email sent to Sarah Park with full Pace summary, flags, endorsement recommendation, and premium guidance."
            ],
            timestamp: new Date().toISOString()
        });
        await addArtifact({ id: "triage_eval", type: "pdf", label: "Appetite Triage Evaluation",
            pdfPath: "/data/appetite_triage_evaluation.pdf" });
        await addArtifact({ id: "uw_notification", type: "email", label: "Underwriter Notification Email",
            isIncoming: false, pdfPath: "/data/underwriter_notification_email.eml" });
        await addDetails({
            "Triage Decision": "✅ Proceed to Quote",
            "Endorsement": "Regulatory representation and warranty — no BSA/AML exclusion",
            "Premium Guidance": "+7–9% over prior year ($333K–$341K)"
        });
        console.log("[sim] Step 10 done"); await sleep(4000);

        // ── STEP 11 (pre-HITL) ───────────────────────────────────────────────────
        await updateStatus("In Progress", "Step 11 of 11 — Quote Letter Generated & Queued for Underwriter Approval");
        await addLog({
            step: 11,
            title: "Quote Letter Generated & Queued for Underwriter Approval",
            status: "pending",
            hitl: true,
            hitlMessage: "⚠️ Human-in-the-Loop — Underwriter Approval Required\nSarah Park reviews the full Pace summary and draft quote letter. She may edit any field — premium, retention, endorsement language, or conditions — before approving. Pace does not send until approval is given.",
            reasoning: [
                "FI D&O rating model run in Chubb Proprietary Rating Tool — all bank-specific inputs confirmed.",
                "Premium indication returned: $336,000 (+7.7% over prior year $312,000).",
                "Quote letter template loaded and all fields populated directly by Pace.",
                "Regulatory representation and warranty endorsement language drafted and included.",
                "Prior acts coverage and continuity of coverage provisions included.",
                "Draft saved as PCBK_DOFI_2025_DRAFT_QuoteLetter_v1.docx and .pdf.",
                "Draft linked to PAS submission record. Case flagged for underwriter action."
            ],
            timestamp: new Date().toISOString()
        });
        await addArtifact({ id: "rating_final_video", type: "video", label: "Rating Tool Final Recording",
            videoPath: "/data/Rating_Tool_Final_Recording.mp4" });
        await addArtifact({ id: "draft_quote", type: "pdf", label: "Draft Quote Letter v1",
            pdfPath: "/data/draft_quote_letter.pdf" });
        console.log("[sim] Step 11 pre-HITL done — waiting for underwriter_approval signal");

        await waitForSignal('underwriter_approval');

        // ── STEP 11 (post-HITL) ──────────────────────────────────────────────────
        await addLog({
            step: 11,
            title: "Quote Approved & Issued",
            status: "complete",
            reasoning: [
                "Underwriter Sarah Park reviewed and approved the draft quote letter.",
                "Pace sent the quote email to Marcus Webb (marcus.webb@ajg.com) with PCBK_DOFI_2025_QuoteLetter_v1.pdf attached.",
                "PAS submission record updated — status set to \"Quote Issued.\"",
                "Case closed in Pace. Submission tracker updated: Pinnacle Community Bancorp | D&O FI Renewal | EFF 5/1/25 | Quote Issued | $329,000."
            ],
            timestamp: new Date().toISOString()
        });
        await addArtifact({ id: "quote_email", type: "email_draft", label: "Quote Issued Email",
            isIncoming: false,
            from: "sarah.park@chubb.com",
            to: "marcus.webb@ajg.com",
            cc: "chubb.fi.underwriting@chubb.com",
            subject: "Chubb Quote — Pinnacle Community Bancorp D&O FI — $329,000",
            body: "Dear Marcus,\n\nPlease find attached Chubb's formal quote for Pinnacle Community Bancorp's D&O Financial Institutions renewal:\n\n• Policy Period: May 1, 2025 – May 1, 2026\n• Line: D&O Liability — Financial Institutions Edition\n• Limit: $25,000,000\n• Retention: $1,000,000\n• Premium: $329,000\n• Endorsements: Regulatory Representation and Warranty\n\nThis quote is valid for 30 days. Please don't hesitate to reach out with any questions.\n\nBest regards,\nSarah Park\nSr. Underwriter, Financial Institutions\nChubb",
            pdfPath: "/data/quote_issued_email.eml"
        });
        await addDetails({
            "Premium Indication": "$336,000 indicated → $329,000 issued (+5.4% over prior year)",
            "Pace Processing Time": "8 min 22 sec",
            "Status": "Done — Quote Queued for Underwriter Review"
        });
        await updateStatus("Done", "Done — Proceed to Quote");
        console.log(`[sim] Complete: ${CASE_NAME}`);
    })();
}

module.exports = { runSimulation };
