const http = require('http');

function runSimulation(port) {
    const PORT = port || process.env.PORT || 3001;
    const PROCESS_ID = "SUB-2025-0310-PCBK-FI-0042";
    const CASE_NAME = "Pinnacle Community Bancorp — D&O FI Renewal";
    const BASE_URL = "https://backend-production-6452.up.railway.app";

    function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

    function post(path, body) {
        return new Promise((resolve, reject) => {
            const data = JSON.stringify(body);
            const url = new URL(BASE_URL + path);
            const options = {
                hostname: url.hostname, port: 443, path: url.pathname,
                method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) }
            };
            const req = require('https').request(options, res => {
                let d = ''; res.on('data', c => d += c); res.on('end', () => resolve(d));
            });
            req.on('error', reject); req.write(data); req.end();
        });
    }

    function get(path) {
        return new Promise((resolve, reject) => {
            const url = new URL(BASE_URL + path);
            require('https').get({ hostname: url.hostname, port: 443, path: url.pathname, headers: {} }, res => {
                let d = ''; res.on('data', c => d += c);
                res.on('end', () => { try { resolve(JSON.parse(d)); } catch(e) { resolve({}); } });
            }).on('error', reject);
        });
    }

    async function addLog(logEntry) {
        await post('/api/update-process-log', { processId: PROCESS_ID, logEntry });
    }
    async function addDetails(keyDetails) {
        await post('/api/update-process-log', { processId: PROCESS_ID, keyDetails });
    }
    async function addArtifact(artifact) {
        await post('/api/update-process-log', { processId: PROCESS_ID, artifact });
    }
    async function updateStatus(status, currentStatus) {
        await post('/api/update-status', { id: PROCESS_ID, status, currentStatus });
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

        // —— STEP 1 ————————————————————————————————————————————————————
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
            artifacts: [
                { id: "s1_email", type: "email_draft", label: "Inbound Submission Email — Marcus Webb, Gallagher", isIncoming: true, pdfPath: "/data/inbound_submission_email.eml" },
                { id: "s1_fdic", type: "file", label: "FDIC Consent Order Termination Letter — Dec 18, 2024", pdfPath: "/data/fdic_consent_order_termination.pdf" }
            ],
            timestamp: new Date().toISOString()
        });
        await addArtifact({ id: "inbound_email", type: "email_draft", label: "Inbound Submission Email — Marcus Webb, Gallagher", isIncoming: true, pdfPath: "/data/inbound_submission_email.eml" });
        await addArtifact({ id: "fdic_consent_s1", type: "file", label: "FDIC Consent Order Termination Letter — Dec 18, 2024", pdfPath: "/data/fdic_consent_order_termination.pdf" });
        await addDetails({
            "Named Insured": "Pinnacle Community Bancorp, Inc.",
            "Ticker": "PCBK (NASDAQ)",
            "Broker": "Marcus Webb, Gallagher Charlotte",
            "Line": "D&O — Financial Institutions Edition",
            "Transaction Type": "Renewal — 4th consecutive year (incumbent)",
            "Effective Date": "May 1, 2025"
        });
        console.log("[sim] Step 1 done"); await sleep(4000);

        // —— STEP 2 ————————————————————————————————————————————————————
        await updateStatus("In Progress", "Step 2 of 11 — Document Classification");
        await addLog({
            step: 2,
            title: "Document Classification",
            status: "complete",
            reasoning: [
                "10 attachments classified against Chubb FI D&O submission taxonomy.",
                "Documents mapped: ML Application (FI Edition), ACORD 125, Financial Statements (FY2022–FY2024), FFIEC UBPR, Loss Run, FDIC Termination Letter, 8-K filings (×2), Derivative Settlement Notice, Broker Cover Letter.",
                "All 10 documents assigned document type, source category, and processing priority.",
                "No duplicates, no unreadable files, no password-protected attachments.",
                "Classification confidence: 10/10 high confidence."
            ],
            artifacts: [
                { id: "s2_doc", type: "file", label: "Document Classification Report", pdfPath: "/data/doc_classification_report.pdf" }
            ],
            timestamp: new Date().toISOString()
        });
        await addArtifact({ id: "doc_class", type: "file", label: "Document Classification Report", pdfPath: "/data/doc_classification_report.pdf" });
        console.log("[sim] Step 2 done"); await sleep(4000);

        // —— STEP 3 ————————————————————————————————————————————————————
        await updateStatus("In Progress", "Step 3 of 11 — Completeness Check");
        await addLog({
            step: 3,
            title: "Completeness Check",
            status: "complete",
            reasoning: [
                "Submission verified against the required document checklist for a publicly traded FI D&O renewal.",
                "All 10 required document categories present and accounted for.",
                "One additional voluntary disclosure: FDIC Consent Order termination letter (not on standard checklist).",
                "Completeness score: 10/10. No document deficiency notice required."
            ],
            artifacts: [
                { id: "s3_comp", type: "file", label: "Completeness Check Report", pdfPath: "/data/completeness_check_report.pdf" }
            ],
            timestamp: new Date().toISOString()
        });
        await addArtifact({ id: "completeness_rpt", type: "file", label: "Completeness Check Report", pdfPath: "/data/completeness_check_report.pdf" });
        console.log("[sim] Step 3 done"); await sleep(4000);

        // —— STEP 4 ————————————————————————————————————————————————————
        await updateStatus("In Progress", "Step 4 of 11 — Clearance Check & Loss History Retrieved");
        await addLog({
            step: 4,
            title: "Clearance Check & Loss History Retrieved",
            status: "complete",
            reasoning: [
                "Pinnacle Community Bancorp queried in Chubb PAS clearance system — no existing policy conflict identified.",
                "Account status: renewal eligible. Prior underwriter: Sarah Park. Incumbent since May 2022.",
                "Broker-submitted loss run (Doc #8) retrieved and parsed — 5-year history, Chubb incumbent format.",
                "One claim identified: D&O derivative claim, opened March 2023, settled August 2024.",
                "Settlement amount: $850,000 — within the $1,000,000 per-claim retention. No indemnity payment by Chubb.",
                "Claim closed. No open reserves. No open claims as of submission date.",
                "Three-source cross-reference check initiated: PAS loss run vs. broker-submitted run vs. CLUE FI database.",
                "All three sources consistent — no discrepancies flagged."
            ],
            artifacts: [
                { id: "s4_loss", type: "file", label: "Loss Run — Pinnacle Community Bancorp (Chubb)", pdfPath: "/data/loss_run_chubb_pcbk.pdf" },
                { id: "s4_xref", type: "file", label: "Three-Source Cross-Reference Report", pdfPath: "/data/three_source_crossref_report.pdf" }
            ],
            timestamp: new Date().toISOString()
        });
        await addArtifact({ id: "loss_run_s4", type: "file", label: "Loss Run — Pinnacle Community Bancorp (Chubb)", pdfPath: "/data/loss_run_chubb_pcbk.pdf" });
        await addArtifact({ id: "xref_rpt", type: "file", label: "Three-Source Cross-Reference Report", pdfPath: "/data/three_source_crossref_report.pdf" });
        await addDetails({ "Prior Policy": "CHB-DOFI-PCBK-2024 — $25M / $1M retention — $312,000" });
        console.log("[sim] Step 4 done"); await sleep(4000);

        // —— STEP 5 ————————————————————————————————————————————————————
        await updateStatus("In Progress", "Step 5 of 11 — Regulatory Verification — FDIC, OCC & Federal Reserve");
        await addLog({
            step: 5,
            title: "Regulatory Verification — FDIC, OCC & Federal Reserve",
            status: "complete",
            reasoning: [
                "FDIC BankFind queried for Pinnacle Community Bancorp, Inc. (cert #57832).",
                "Consent Order CO-2023-PCBK-01 identified — issued March 2023 for BSA/AML deficiencies.",
                "Consent Order termination confirmed — FDIC issued formal termination letter December 18, 2024.",
                "Termination letter cross-referenced against broker-disclosed Doc #1 — exact match confirmed.",
                "FDIC enforcement history: 1 prior action (2019 MOU — resolved). No unresolved actions.",
                "OCC query: state-chartered bank, not OCC-supervised — no records.",
                "Federal Reserve query: member bank confirmed. No outstanding supervisory actions.",
                "FFIEC UBPR data retrieved for Q4 2024 — regulatory capital ratios, asset quality, liquidity metrics extracted.",
                "Regulatory risk assessed: elevated but resolved. Termination verified. Routing flag set for underwriter attention."
            ],
            artifacts: [
                { id: "s5_fdic_enf", type: "file", label: "FDIC Enforcement Record — Pinnacle Community Bancorp", pdfPath: "/data/fdic_enforcement_record.pdf" },
                { id: "s5_fdic_consent", type: "file", label: "FDIC Consent Order Termination Letter — Dec 18, 2024", pdfPath: "/data/fdic_consent_order_termination.pdf" },
                { id: "s5_ubpr", type: "file", label: "FFIEC UBPR Report — Q4 2024", pdfPath: "/data/ffiec_ubpr_report.pdf" }
            ],
            timestamp: new Date().toISOString()
        });
        await addArtifact({ id: "fdic_enf", type: "file", label: "FDIC Enforcement Record — Pinnacle Community Bancorp", pdfPath: "/data/fdic_enforcement_record.pdf" });
        await addArtifact({ id: "fdic_consent_s5", type: "file", label: "FDIC Consent Order Termination Letter (cross-ref)", pdfPath: "/data/fdic_consent_order_termination.pdf" });
        await addArtifact({ id: "ubpr_s5", type: "file", label: "FFIEC UBPR Report — Q4 2024", pdfPath: "/data/ffiec_ubpr_report.pdf" });
        console.log("[sim] Step 5 done"); await sleep(4000);

        // —— STEP 6 ————————————————————————————————————————————————————
        await updateStatus("In Progress", "Step 6 of 11 — EDGAR Verification & Material Event Scan");
        await addLog({
            step: 6,
            title: "EDGAR Verification & Material Event Scan",
            status: "complete",
            reasoning: [
                "EDGAR full-text search executed for Pinnacle Community Bancorp (CIK 0001589732).",
                "8-K filing located: August 5, 2024 — derivative litigation settlement disclosed ($850K total, within retention).",
                "8-K filing located: December 19, 2024 — FDIC Consent Order termination disclosed.",
                "No additional material events identified in trailing 12-month EDGAR search.",
                "No going concern disclosures, restatements, or SEC comment letters identified.",
                "EDGAR verification complete. Two material events logged and cross-referenced against submission disclosures — both match."
            ],
            artifacts: [
                { id: "s6_edgar", type: "file", label: "EDGAR Verification Report — Pinnacle Community Bancorp", pdfPath: "/data/edgar_verification_report.pdf" },
                { id: "s6_8k_aug", type: "file", label: "8-K Filing — Aug 5, 2024 (Derivative Settlement)", pdfPath: "/data/8k_aug2024_derivative_settlement.pdf" },
                { id: "s6_8k_dec", type: "file", label: "8-K Filing — Dec 19, 2024 (FDIC Termination)", pdfPath: "/data/8k_dec2024_fdic_termination.pdf" }
            ],
            timestamp: new Date().toISOString()
        });
        await addArtifact({ id: "edgar_rpt", type: "file", label: "EDGAR Verification Report — Pinnacle Community Bancorp", pdfPath: "/data/edgar_verification_report.pdf" });
        await addArtifact({ id: "8k_aug", type: "file", label: "8-K Filing — Aug 5, 2024 (Derivative Settlement)", pdfPath: "/data/8k_aug2024_derivative_settlement.pdf" });
        await addArtifact({ id: "8k_dec", type: "file", label: "8-K Filing — Dec 19, 2024 (FDIC Termination)", pdfPath: "/data/8k_dec2024_fdic_termination.pdf" });
        console.log("[sim] Step 6 done"); await sleep(4000);

        // —— STEP 7 ————————————————————————————————————————————————————
        await updateStatus("In Progress", "Step 7 of 11 — Structured Data Extraction & System Population");
        await addLog({
            step: 7,
            title: "Structured Data Extraction & System Population",
            status: "complete",
            reasoning: [
                "ML Application (FI Edition) parsed — 47 fields extracted across 6 sections.",
                "ACORD 125 parsed — entity details, FEIN, SIC code, state of domicile extracted.",
                "Financial Statements (FY2022–FY2024) parsed — total assets, net income, equity, NPL ratio, CRE concentration extracted.",
                "All extracted fields validated against cross-source checks (FFIEC UBPR, EDGAR, FDIC BankFind).",
                "Three minor discrepancies detected and auto-corrected: FY2023 net income rounding, SIC code formatting, FEIN hyphenation.",
                "Rating engine pre-populated: entity data, financial data, and loss history loaded.",
                "Submission status set to \"Regulatory Verified — In Review.\" Routed to Sarah Park.",
                "Pace processing time to this point: 4 min 11 sec."
            ],
            artifacts: [
                { id: "s7_ml", type: "file", label: "ML Application — Financial Institutions Edition", pdfPath: "/data/ml_application_fi.pdf" },
                { id: "s7_fin", type: "file", label: "Financial Statements — FY2022–FY2024", pdfPath: "/data/financial_statements_fy2022_2024.pdf" }
            ],
            timestamp: new Date().toISOString()
        });
        await addArtifact({ id: "ml_app", type: "file", label: "ML Application — Financial Institutions Edition", pdfPath: "/data/ml_application_fi.pdf" });
        await addArtifact({ id: "fin_stmts", type: "file", label: "Financial Statements — FY2022–FY2024", pdfPath: "/data/financial_statements_fy2022_2024.pdf" });
        console.log("[sim] Step 7 done"); await sleep(4000);

        // —— STEP 8 ————————————————————————————————————————————————————
        await updateStatus("In Progress", "Step 8 of 11 — Bank Financial Analysis & Peer Benchmarking");
        await addLog({
            step: 8,
            title: "Bank Financial Analysis & Peer Benchmarking",
            status: "complete",
            reasoning: [
                "Financial Statements (FY2022–FY2024) and FFIEC UBPR (Q4 2024) analysed in parallel.",
                "Total assets: $1.84B (FY2024) — up 3.2% year-over-year. Asset growth within normal range.",
                "Tier 1 capital ratio: 11.4% — above well-capitalised threshold (6%). Positive indicator.",
                "Net income: $18.7M (FY2024) — consistent with FY2023 ($19.1M). No material earnings deterioration.",
                "NPL ratio: 0.87% — below peer median (1.12%). Asset quality strong.",
                "CRE concentration: 312% of risk-based capital — above 300% regulatory guidance threshold. Flagged.",
                "Peer benchmarking: PCBK ranked in 58th percentile across 12 financial metrics vs. 42-bank UBPR peer group.",
                "Earnings stability and capital adequacy are positive underwriting factors. CRE concentration is the primary financial risk flag.",
                "Financial risk assessment: moderate. Capital strength partially offsets CRE exposure."
            ],
            artifacts: [
                { id: "s8_fin_anal", type: "file", label: "Financial Analysis Report — Pinnacle Community Bancorp", pdfPath: "/data/financial_analysis_report.pdf" },
                { id: "s8_ubpr", type: "file", label: "FFIEC UBPR Report — Q4 2024 (cross-ref)", pdfPath: "/data/ffiec_ubpr_report.pdf" }
            ],
            timestamp: new Date().toISOString()
        });
        await addArtifact({ id: "fin_anal", type: "file", label: "Financial Analysis Report — Pinnacle Community Bancorp", pdfPath: "/data/financial_analysis_report.pdf" });
        await addArtifact({ id: "ubpr_s8", type: "file", label: "FFIEC UBPR Report — Q4 2024 (cross-ref)", pdfPath: "/data/ffiec_ubpr_report.pdf" });
        console.log("[sim] Step 8 done"); await sleep(4000);

        // —— STEP 9 ————————————————————————————————————————————————————
        await updateStatus("In Progress", "Step 9 of 11 — Loss Run Analysis & Cross-Reference");
        await addLog({
            step: 9,
            title: "Loss Run Analysis & Cross-Reference",
            status: "complete",
            reasoning: [
                "Broker-submitted loss run (Doc #8) parsed — 5-year history, Chubb incumbent format.",
                "One claim identified: D&O derivative claim, 2023–2024, settled within retention. No Chubb indemnity.",
                "Loss run cross-referenced against PAS loss history and CLUE FI database — all three sources consistent.",
                "No additional claims, incidents, or reserves identified beyond the one disclosed claim.",
                "5-year pure loss ratio: 0% (all losses within retention). Favourable for renewal pricing.",
                "Loss history assessed as clean given the single within-retention claim. No adverse development."
            ],
            artifacts: [
                { id: "s9_loss", type: "file", label: "Loss Run — Pinnacle Community Bancorp (Chubb)", pdfPath: "/data/loss_run_chubb_pcbk.pdf" },
                { id: "s9_analyzer", type: "file", label: "Loss History Analyzer Output", pdfPath: "/data/loss_history_analyzer_output.pdf" }
            ],
            timestamp: new Date().toISOString()
        });
        await addArtifact({ id: "loss_run_s9", type: "file", label: "Loss Run — Pinnacle Community Bancorp (cross-ref)", pdfPath: "/data/loss_run_chubb_pcbk.pdf" });
        await addArtifact({ id: "loss_analyzer", type: "file", label: "Loss History Analyzer Output", pdfPath: "/data/loss_history_analyzer_output.pdf" });
        console.log("[sim] Step 9 done"); await sleep(4000);

        // —— STEP 10 ————————————————————————————————————————————————————
        await updateStatus("In Progress", "Step 10 of 11 — Appetite Triage & Routing Decision");
        await addLog({
            step: 10,
            title: "Appetite Triage & Routing Decision",
            status: "complete",
            reasoning: [
                "All 14 appetite factors evaluated against Chubb NA Financial Lines FI D&O guidelines.",
                "Positive factors: well-capitalised (Tier 1 11.4%), clean audit opinions FY2022–FY2024, no open litigation, 4-year incumbent relationship, within-retention claim history.",
                "Adverse factors: CRE concentration (312% vs. 300% threshold), prior FDIC Consent Order (now resolved).",
                "Appetite decision: IN APPETITE. Both adverse factors assessed as manageable and partially resolved.",
                "Routing decision: referred to Sarah Park (lead UW) for final pricing and quote approval.",
                "Limit and structure: $25M limit / $1M retention — same as prior year. No structural change recommended.",
                "Endorsements flagged: Regulatory Representation and Warranty endorsement required given consent order history.",
                "Premium guidance: +7–9% over prior year ($333K–$341K), reflecting prior claims event and CRE profile, offset by capital strength and 4-year incumbent relationship.",
                "Triage complete. Submission packet ready for underwriter review and quote issuance."
            ],
            artifacts: [
                { id: "s10_appetite", type: "file", label: "Appetite Triage Evaluation Report", pdfPath: "/data/appetite_triage_evaluation.pdf" }
            ],
            timestamp: new Date().toISOString()
        });
        await addArtifact({ id: "appetite_rpt", type: "file", label: "Appetite Triage Evaluation Report", pdfPath: "/data/appetite_triage_evaluation.pdf" });
        await addDetails({ "Premium Guidance": "+7–9% over prior year ($333K–$341K)" });
        console.log("[sim] Step 10 done"); await sleep(4000);

        // —— STEP 11 (pre-signal) ————————————————————————————————————————
        await updateStatus("Needs Attention", "Step 11 of 11 — Quote Letter Generated & Queued for Underwriter Approval");
        await addLog({
            step: 11,
            title: "Quote Letter Generated & Queued for Underwriter Approval",
            status: "pending",
            hitl: true,
            reasoning: [
                "All 14 appetite and financial data points loaded into Chubb rating engine.",
                "Rating model: D&O Financial Institutions Edition, v4.2.",
                "Rating inputs: $25M limit, $1M retention, total assets $1.84B, NPL 0.87%, CRE 312%, 1 prior claim within retention.",
                "Premium indication returned: $336,000 (+7.7% over prior year $312,000).",
                "Underwriter override applied by Sarah Park: $329,000 — reflecting incumbent relationship discount and resolved regulatory risk.",
                "Draft Quote Letter generated: Pinnacle Community Bancorp, D&O FI, EFF May 1 2025, $25M/$1M, $329,000.",
                "Quote Letter queued for Sarah Park's review and approval prior to broker release."
            ],
            artifacts: [
                { id: "s11_draft", type: "file", label: "Draft Quote Letter — Pinnacle Community Bancorp", pdfPath: "/data/draft_quote_letter.pdf" },
                {
                    id: "s11_decision",
                    type: "decision",
                    label: "Underwriter Approval Required",
                    options: [
                        { label: "Approve — Issue Quote to Broker", value: "underwriter_approval" },
                        { label: "Return for Revision", value: "underwriter_revision" }
                    ]
                }
            ],
            timestamp: new Date().toISOString()
        });
        await addArtifact({ id: "draft_quote", type: "file", label: "Draft Quote Letter — Pinnacle Community Bancorp", pdfPath: "/data/draft_quote_letter.pdf" });

        console.log("[sim] Step 11 waiting for HITL signal...");
        await waitForSignal("underwriter_approval");

        // —— STEP 11 (post-signal) ————————————————————————————————————————
        await addLog({
            step: 11,
            title: "Quote Letter Issued to Broker",
            status: "complete",
            reasoning: [
                "Underwriter approval confirmed — Sarah Park, March 10, 2025 at 11:34 AM.",
                "Quote Letter issued to Marcus Webb at Gallagher Charlotte via secure email.",
                "Underwriter notification sent to Sarah Park confirming broker delivery.",
                "Case status updated: Done — Proceed to Quote.",
                "Total Pace processing time: 4 min 11 sec. Underwriter review time: 1 hr 22 min."
            ],
            artifacts: [
                { id: "s11_quote_email", type: "email_draft", label: "Quote Issued Email — Marcus Webb, Gallagher", pdfPath: "/data/quote_issued_email.eml" },
                { id: "s11_uw_notif", type: "email_draft", label: "Underwriter Notification — Sarah Park", pdfPath: "/data/underwriter_notification_email.eml" }
            ],
            timestamp: new Date().toISOString()
        });
        await addArtifact({ id: "quote_email", type: "email_draft", label: "Quote Issued Email — Marcus Webb, Gallagher", pdfPath: "/data/quote_issued_email.eml" });
        await addArtifact({ id: "uw_notif", type: "email_draft", label: "Underwriter Notification — Sarah Park", pdfPath: "/data/underwriter_notification_email.eml" });

        await updateStatus("Done", "Done — Proceed to Quote");
        console.log("[sim] Simulation complete.");
    })();
}

module.exports = { runSimulation };
