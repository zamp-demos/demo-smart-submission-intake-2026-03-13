const http = require('http');

function runSimulation(port) {
    const PORT = port || process.env.PORT || 3001;
    const PROCESS_ID = "SUB-2025-0310-PCBK-FI-0042";
    const CASE_NAME = "Pinnacle Community Bancorp — D&O FI Renewal";
    const BASE_URL = "https://backend-production-6452.up.railway.app";

    function post(path, data) {
        return new Promise((resolve, reject) => {
            const body = JSON.stringify(data);
            const opts = {
                hostname: BASE_URL.replace('https://', ''),
                port: 443,
                path,
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }
            };
            const https = require('https');
            const req = https.request(opts, res => {
                let d = '';
                res.on('data', c => d += c);
                res.on('end', () => resolve(d));
            });
            req.on('error', reject);
            req.write(body);
            req.end();
        });
    }

    async function addLog(logEntry) {
        await post('/api/update-process-log', { processId: PROCESS_ID, logEntry });
        await new Promise(r => setTimeout(r, 1800));
    }

    async function addArtifact(artifact) {
        await post('/api/update-process-log', { processId: PROCESS_ID, sidebarArtifacts: [artifact] });
    }

    async function updateStatus(status, statusText) {
        await post('/api/update-status', { id: PROCESS_ID, status, currentStatus: statusText });
    }

    async function waitForSignal(signalId) {
        while (true) {
            try {
                const https = require('https');
                const data = await new Promise((resolve, reject) => {
                    https.get(`${BASE_URL}/signal-status`, res => {
                        let d = '';
                        res.on('data', c => d += c);
                        res.on('end', () => resolve(d));
                    }).on('error', reject);
                });
                const parsed = JSON.parse(data);
                if (parsed.signals && parsed.signals[signalId]) return;
            } catch(e) {}
            await new Promise(r => setTimeout(r, 2000));
        }
    }

    // Email body constants
    const INBOUND_BODY = `Sarah,

Please find attached the renewal submission package for Pinnacle Community Bancorp, Inc. (NASDAQ: PCBK) for their Directors, Officers & Entity Liability coverage.

ACCOUNT OVERVIEW
----------------
Named Insured:       Pinnacle Community Bancorp, Inc.
NASDAQ Ticker:       PCBK
Headquarters:        Charlotte, NC
Total Assets:        $4.21 billion (FY2024)
Incumbent Carrier:   Chubb (5 consecutive years)
Prior Policy:        CHB-DOFI-PCBK-2025 | $10M / $10M | $1M retention | $312,000 premium
Renewal Effective:   May 1, 2025

REGULATORY UPDATE — IMPORTANT
------------------------------
Pinnacle received formal notification from the FDIC on December 18, 2024 that Consent Order CO-2023-PCBK-01 has been formally TERMINATED. The attached FDIC termination letter (Exhibit A) confirms that all provisions of the October 2023 order have been satisfactorily addressed, including:

  - Implementation of NICE Actimize transaction monitoring platform
  - Third-party BSA/AML validation completed (February 2025)
  - New CCO appointed (David Wren, former HSBC compliance executive)
  - New independent board member added (William H. Tran, former FDIC examiner)

Additionally, the shareholder derivative action filed in February 2024 (Thornton v. Caldwell) was dismissed with prejudice in August 2024. Total costs were $850,000, entirely within the $1M retention — Chubb's indemnity payment was $0.00.

DOCUMENTS ATTACHED (10 items)
------------------------------
01. Submission Cover Letter (this email)
02. Chubb ML Application — Financial Institutions Edition (signed, J. Caldwell)
03. ACORD 125 — Commercial Insurance Application
04. Chubb Loss Run — 5-year incumbent FY2020–FY2025
05. Prior Declarations Page — FY2024–FY2025
06. Audited Financial Statements — FY2022, FY2023, FY2024 (Dixon Hughes Goodman LLP)
07. FDIC Consent Order Termination Letter — December 18, 2024 (CO-2023-PCBK-01)
08. BSA/AML Remediation Summary — February 2025
09. Board & Officer Organizational Chart
10. Five-Year Business Plan Summary (2025–2029)

BROKER CONTACT
--------------
Marcus Webb, CPCU, ARM
Vice President — Financial Institutions Practice
Arthur J. Gallagher & Co. | Charlotte, NC
Direct: (704) 555-3842 | marcus.webb@ajg.com

Please confirm receipt and let me know if you need anything additional.

Best,
Marcus

--
Marcus Webb, CPCU, ARM | VP Financial Institutions | Gallagher
227 West Trade Street, Suite 1600 | Charlotte, NC 28202
D: (704) 555-3842 | M: (704) 555-9127 | marcus.webb@ajg.com`;

    const UW_NOTIF_BODY = `Sarah,

Pace has completed automated processing of the following renewal submission and a draft quote letter is ready for your review and approval.

CASE SUMMARY
------------
Case ID:         SUB-2025-0310-PCBK-FI-0042
Named Insured:   Pinnacle Community Bancorp, Inc. (NASDAQ: PCBK)
Broker:          Marcus Webb | Gallagher Charlotte
Submitted:       March 10, 2025 08:28 EST
Processed in:    8 minutes 22 seconds (Steps 1–10 automated)
Triage Result:   PROCEED TO QUOTE — No referral required

KEY FINDINGS (10 STEPS COMPLETED)
-----------------------------------
✓  Submission complete — 10/10 documents, no MIR needed
✓  Incumbent account — 5 years Chubb, no lapse, no blocking flags
✓  Loss history — 1 prior claim (CLM-2024-0214), $850K within retention, Chubb paid $0, closed w/ prejudice
✓  FDIC CO-2023-PCBK-01 — TERMINATED December 18, 2024 (triple-sourced: broker + FDIC database + EDGAR 8-K)
✓  OCC & Federal Reserve — no actions (confirmed)
✓  EDGAR 18-month scan — no undisclosed material events
✓  Financial profile — CET1 12.4% (above peer), NPA improving, earnings +158% YoY
✓  Governance — new CCO (HSBC background), ex-FDIC board member, NICE Actimize deployed
✓  BSA/AML exclusion — NOT applied (order terminated; rep/warranty endorsement applied instead)
✓  Appetite — 14/14 factors cleared (CRE 278% noted, below 300% threshold, declining)

PREMIUM INDICATION
------------------
Prior Year Premium:     $312,000
Rating Tool Indication: $336,000  (+7.7%)
Pace Recommended:       $329,000  (+5.4%)  [relationship/capital strength adjustment applied]
Limits:                 $10M / $10M
Retention:              $1,000,000 (maintained)
Endorsements:           Regulatory Inquiry Rep/Warranty (BSA/AML)

ACTION REQUIRED
---------------
Please review the draft quote letter attached to Case SUB-2025-0310-PCBK-FI-0042 in the Pace dashboard.

You may:
  [APPROVE]  — Pace will send the quote letter PDF to marcus.webb@ajg.com and update PAS to "Quote Issued"
  [EDIT]     — Modify any field in the draft before sending
  [ESCALATE] — Route to senior underwriter or specialist

Time to bind if you approve now: ~2 minutes (Pace handles sending, PAS update, and case closure).

Access the case: https://pace.zamp.ai/cases/SUB-2025-0310-PCBK-FI-0042

—
Pace Agentic Platform | Zamp
Case SUB-2025-0310-PCBK-FI-0042 | Generated 08:49:38 EST March 10, 2025`;

    const QUOTE_ISSUED_BODY = `Marcus,

Please find attached Chubb's renewal quotation for Pinnacle Community Bancorp for the policy period May 1, 2025 – April 30, 2026.

QUOTE SUMMARY
-------------
Named Insured:   Pinnacle Community Bancorp, Inc.
Policy Form:     ForeFront Portfolio — D&O Financial Institutions Edition
Policy Period:   May 1, 2025 – April 30, 2026
Limit:           $10,000,000 per claim / $10,000,000 aggregate
Retention:       $1,000,000 per claim
Annual Premium:  $329,000
Quote Reference: QTE-PCBK-DOFI-2025-0310
Valid Through:   April 9, 2025 (30 days)

I'm pleased we were able to maintain the retention at the prior year level. Given the meaningful governance improvements Pinnacle has made — particularly the FDIC consent order termination, the new CCO appointment, and the board-level compliance additions — I think this is a fair outcome for both sides.

Please review the attached quote letter for full terms, conditions, and endorsement details. Let me know if you'd like to discuss or if the team has any questions.

Looking forward to binding this one.

Best,
Sarah

Sarah Park | Senior Underwriter — Financial Institutions
Chubb North America | Financial Lines
1600 Market Street | Philadelphia, PA 19103
sarah.park@chubb.com | (215) 882-5000`;

    (async () => {
        await post('/api/update-process-log', {
            processId: PROCESS_ID,
            keyDetails: {
                "Named Insured": "Pinnacle Community Bancorp, Inc.",
                "Ticker": "NASDAQ: PCBK",
                "Broker": "Marcus Webb — Gallagher Charlotte",
                "Line": "D&O — Financial Institutions",
                "Transaction Type": "Renewal",
                "Effective Date": "May 1, 2025",
                "Prior Policy": "CHB-DOFI-PCBK-2025 | $312,000",
                "Premium Guidance": "$329,000 (+5.4%)"
            }
        });

        await updateStatus("Running", "Step 1 of 11 — Processing");

        // —— STEP 1 ————————————————————————————————————————————————————
        await addLog({
            step: 1,
            title: "Submission Email Received & Parsed",
            status: "complete",
            reasoning: [
                "Email received from marcus.webb@ajg.com at 08:28:14 EST — subject line parsed: RENEWAL SUBMISSION, Pinnacle Community Bancorp (PCBK), D&O FI, May 1 2025.",
                "10 attachments detected and catalogued: ML Application, ACORD 125, Loss Run, Declarations Page, Financial Statements, FDIC Termination Letter, BSA/AML Summary, Org Chart, Business Plan.",
                "Named Insured extracted: Pinnacle Community Bancorp, Inc. | NASDAQ: PCBK | Charlotte, NC.",
                "Broker confirmed: Marcus Webb, CPCU, ARM — Gallagher Financial Institutions Practice.",
                "Routing: Financial Lines — FI D&O queue. Assigned underwriter: Sarah Park."
            ],
            artifacts: [
                {
                    id: "s1_email", type: "email_draft", label: "Inbound Submission Email — Marcus Webb, Gallagher",
                    data: {
                        from: "marcus.webb@ajg.com",
                        to: "submissions.financiallines@chubb.com",
                        subject: "RENEWAL SUBMISSION — Pinnacle Community Bancorp (PCBK) — D&O FI — May 1, 2025",
                        body: INBOUND_BODY,
                        isIncoming: true
                    }
                },
                { id: "s1_fdic", type: "file", label: "FDIC Consent Order Termination Letter", pdfPath: "/data/fdic_consent_order_termination.pdf" }
            ],
            timestamp: new Date().toISOString()
        });
        await addArtifact({ id: "inbound_email", type: "email_draft", label: "Inbound Submission Email — Marcus Webb, Gallagher", data: { from: "marcus.webb@ajg.com", to: "submissions.financiallines@chubb.com", subject: "RENEWAL SUBMISSION — Pinnacle Community Bancorp (PCBK) — D&O FI — May 1, 2025", body: INBOUND_BODY, isIncoming: true } });

        // —— STEP 2 ————————————————————————————————————————————————————
        await addLog({
            step: 2,
            title: "Document Classification",
            status: "complete",
            reasoning: [
                "10 attachments processed through document classifier — all 10 matched to expected submission document types.",
                "ML Application (FI Edition) confirmed signed by J. Caldwell, CEO — execution date March 6, 2025.",
                "ACORD 125 present and complete. Loss Run format recognized: Chubb proprietary 5-year format.",
                "FDIC Consent Order Termination Letter classified as regulatory document — flagged for Step 5 cross-reference.",
                "No unrecognized or ambiguous documents detected."
            ],
            artifacts: [
                { id: "s2_class", type: "file", label: "Document Classification Report", pdfPath: "/data/doc_classification_report.pdf" }
            ],
            timestamp: new Date().toISOString()
        });

        // —— STEP 3 ————————————————————————————————————————————————————
        await addLog({
            step: 3,
            title: "Completeness Check",
            status: "complete",
            reasoning: [
                "Completeness check executed against Chubb FI D&O renewal checklist — 10/10 required documents present.",
                "Signed ML Application: present. ACORD 125: present. 5-year loss run: present. Financials (3-year audited): present.",
                "Regulatory exhibit (FDIC termination): present and legible. Prior declarations page: present.",
                "No Material Information Request (MIR) required — submission is complete and ready for underwriting.",
                "Completeness score: 100%. Proceeding to clearance and loss history check."
            ],
            artifacts: [
                { id: "s3_complete", type: "file", label: "Completeness Check Report", pdfPath: "/data/completeness_check_report.pdf" }
            ],
            timestamp: new Date().toISOString()
        });

        // —— STEP 4 ————————————————————————————————————————————————————
        await addLog({
            step: 4,
            title: "Clearance Check & Loss History",
            status: "complete",
            reasoning: [
                "PAS clearance query executed: Pinnacle Community Bancorp — no blocking flags, no open claims, no prior declinations on record.",
                "Incumbent status confirmed: 5 consecutive policy years with Chubb, no coverage lapse.",
                "Loss run retrieved and parsed: 1 reported claim — CLM-2024-0214 (Thornton v. Caldwell shareholder derivative action).",
                "Claim status: closed with prejudice August 2024. Total incurred: $850,000 — entirely within $1M retention. Chubb indemnity paid: $0.00.",
                "Loss history assessment: favorable. Single closed claim within retention. No open matters."
            ],
            artifacts: [
                { id: "s4_lossrun", type: "file", label: "Chubb Loss Run — Pinnacle Community Bancorp", pdfPath: "/data/loss_run_chubb_pcbk.pdf" },
                { id: "s4_lossanalysis", type: "file", label: "Loss History Analyzer Output", pdfPath: "/data/loss_history_analyzer_output.pdf" },
                { id: "s4_recording", type: "video", label: "PAS System — Clearance Check Recording", videoPath: "/data/PAS_Browser_Recording.mp4" }
            ],
            timestamp: new Date().toISOString()
        });
        await addArtifact({ id: "pas_recording", type: "video", label: "PAS System — Clearance Check Recording", videoPath: "/data/PAS_Browser_Recording.mp4" });

        // —— STEP 5 ————————————————————————————————————————————————————
        await addLog({
            step: 5,
            title: "Regulatory Verification (FDIC, OCC & Fed)",
            status: "complete",
            reasoning: [
                "FDIC enforcement database queried: Consent Order CO-2023-PCBK-01 status confirmed TERMINATED as of December 18, 2024.",
                "Triple-source verification completed: broker-provided termination letter, FDIC orders.fdic.gov live database, EDGAR 8-K filing (December 2024).",
                "OCC enforcement actions database: no active or historical actions on record for Pinnacle Community Bancorp.",
                "Federal Reserve enforcement actions: no actions on record.",
                "Regulatory risk assessment: significantly improved. Order termination is a favorable underwriting development."
            ],
            artifacts: [
                { id: "s5_fdic_term", type: "file", label: "FDIC Consent Order Termination Letter (Cross-Reference)", pdfPath: "/data/fdic_consent_order_termination.pdf" },
                { id: "s5_fdic_rec", type: "file", label: "FDIC Enforcement Record", pdfPath: "/data/fdic_enforcement_record.pdf" },
                { id: "s5_recording", type: "video", label: "FDIC Enforcement Database — Browser Recording", videoPath: "/data/FDIC_Browser_Recording.mp4" }
            ],
            timestamp: new Date().toISOString()
        });
        await addArtifact({ id: "fdic_recording", type: "video", label: "FDIC Enforcement Database — Browser Recording", videoPath: "/data/FDIC_Browser_Recording.mp4" });

        // —— STEP 6 ————————————————————————————————————————————————————
        await addLog({
            step: 6,
            title: "EDGAR Verification & 8-K Scan",
            status: "complete",
            reasoning: [
                "EDGAR full-text search executed: 18-month window (September 2023 – March 2025) across all filing types.",
                "Two material 8-K filings identified and reviewed: December 2024 (FDIC consent order termination) and August 2024 (derivative action settlement).",
                "December 2024 8-K confirms consent order termination — consistent with broker disclosure. No discrepancy.",
                "August 2024 8-K confirms Thornton v. Caldwell settlement — consistent with loss run. No undisclosed material litigation.",
                "No additional undisclosed material events, restatements, going concern disclosures, or adverse regulatory developments detected."
            ],
            artifacts: [
                { id: "s6_8k_dec", type: "file", label: "8-K — FDIC Consent Order Termination (Dec 2024)", pdfPath: "/data/8k_dec2024_fdic_termination.pdf" },
                { id: "s6_8k_aug", type: "file", label: "8-K — Derivative Action Settlement (Aug 2024)", pdfPath: "/data/8k_aug2024_derivative_settlement.pdf" },
                { id: "s6_edgar", type: "file", label: "EDGAR Verification Report", pdfPath: "/data/edgar_verification_report.pdf" }
            ],
            timestamp: new Date().toISOString()
        });

        // —— STEP 7 ————————————————————————————————————————————————————
        await addLog({
            step: 7,
            title: "Structured Data Extraction & System Population",
            status: "complete",
            reasoning: [
                "ML Application parsed: D&O Side A/B/C coverage requested, $25M limit, $1M retention, ForeFront Portfolio form.",
                "Financial data extracted from audited statements: Total Assets $4.21B, Tier 1 Capital Ratio 12.4%, Net Income $47.2M (FY2024).",
                "PAS populated with extracted submission data — 47 fields updated including coverage specs, financials, and insured details.",
                "Rating tool pre-populated with extracted financial inputs — ready for actuarial pricing model execution.",
                "Data validation: all required fields populated, no extraction errors flagged."
            ],
            artifacts: [
                { id: "s7_ml_app", type: "file", label: "ML Application — Financial Institutions Edition", pdfPath: "/data/ml_application_fi.pdf" },
                { id: "s7_financials", type: "file", label: "Financial Statements FY2022–2024", pdfPath: "/data/financial_statements_fy2022_2024.pdf" },
                { id: "s7_rec1", type: "video", label: "PAS System Population — Browser Recording", videoPath: "/data/PAS_Population_Browser_Recording.mp4" },
                { id: "s7_rec2", type: "video", label: "Rating Tool Data Entry — Browser Recording", videoPath: "/data/Rating_Tool_Input_Recording.mp4" }
            ],
            timestamp: new Date().toISOString()
        });
        await addArtifact({ id: "pas_pop_recording", type: "video", label: "PAS System Population — Browser Recording", videoPath: "/data/PAS_Population_Browser_Recording.mp4" });
        await addArtifact({ id: "rating_input_recording", type: "video", label: "Rating Tool Data Entry — Browser Recording", videoPath: "/data/Rating_Tool_Input_Recording.mp4" });

        // —— STEP 8 ————————————————————————————————————————————————————
        await addLog({
            step: 8,
            title: "Bank Financial Analysis & Peer Benchmarking",
            status: "complete",
            reasoning: [
                "FFIEC UBPR data retrieved for PCBK (RSSD ID: 3284710) — Q3 2024 call report data.",
                "CET1 capital ratio: 12.4% — above peer median of 11.1% and well above regulatory minimum of 6.5%.",
                "Non-performing assets: 0.43% of total assets — improved from 0.71% prior year, below peer median of 0.58%.",
                "Net income: $47.2M (FY2024) — earnings +158% YoY, driven by NIM expansion and provision release.",
                "Peer benchmarking summary: PCBK above peer median on all capital metrics; NPA trajectory improving; earnings recovery strong."
            ],
            artifacts: [
                { id: "s8_ubpr", type: "file", label: "FFIEC UBPR Report — Pinnacle Community Bancorp", pdfPath: "/data/ffiec_ubpr_report.pdf" },
                { id: "s8_analysis", type: "file", label: "Bank Financial Analysis Report", pdfPath: "/data/financial_analysis_report.pdf" }
            ],
            timestamp: new Date().toISOString()
        });

        // —— STEP 9 ————————————————————————————————————————————————————
        await addLog({
            step: 9,
            title: "Loss Run Analysis & Cross-Reference",
            status: "complete",
            reasoning: [
                "Loss run cross-referenced against PAS claims history and EDGAR filings — all three sources consistent.",
                "CLM-2024-0214 confirmed in PAS: Thornton v. Caldwell, filed February 2024, settled August 2024, $850K total incurred.",
                "No discrepancies between broker-provided loss run and internal Chubb records — no evidence of undisclosed claims.",
                "Three-source cross-reference completed: broker loss run, PAS claims history, EDGAR 8-K August 2024 filing.",
                "Loss trend assessment: single isolated event, entirely within retention, no frequency concerns, no adverse pattern."
            ],
            artifacts: [
                { id: "s9_lossrun", type: "file", label: "Chubb Loss Run — Cross-Reference (Pinnacle Community Bancorp)", pdfPath: "/data/loss_run_chubb_pcbk.pdf" },
                { id: "s9_crossref", type: "file", label: "Three-Source Cross-Reference Report", pdfPath: "/data/three_source_crossref_report.pdf" }
            ],
            timestamp: new Date().toISOString()
        });

        // —— STEP 10 ————————————————————————————————————————————————————
        await addLog({
            step: 10,
            title: "Appetite Triage & Routing Decision",
            status: "complete",
            reasoning: [
                "Appetite triage executed against Chubb FI D&O underwriting guidelines — 14/14 appetite factors evaluated.",
                "All blocking criteria cleared: no active regulatory orders, no open material litigation, no prior declinations, no excluded industries.",
                "CRE concentration 278% of risk-based capital — noted but below 300% internal threshold; trend is declining.",
                "Routing decision: PROCEED TO QUOTE — no referral to senior underwriter or specialist required.",
                "Underwriter notification dispatched to Sarah Park — draft quote letter queued for review and approval."
            ],
            artifacts: [
                { id: "s10_appetite", type: "file", label: "Appetite Triage Evaluation", pdfPath: "/data/appetite_triage_evaluation.pdf" },
                {
                    id: "s10_uw_notif", type: "email_draft", label: "Underwriter Notification — Sarah Park",
                    data: {
                        from: "pace-notifications@zamp.ai",
                        to: "sarah.park@chubb.com",
                        subject: "[Pace] Action Required — Quote Ready for Approval | PCBK D&O FI Renewal | Case SUB-2025-0310-PCBK-FI-0042",
                        body: UW_NOTIF_BODY
                    }
                }
            ],
            timestamp: new Date().toISOString()
        });
        await addArtifact({ id: "uw_notif_draft", type: "email_draft", label: "Underwriter Notification — Sarah Park", data: { from: "pace-notifications@zamp.ai", to: "sarah.park@chubb.com", subject: "[Pace] Action Required — Quote Ready for Approval | PCBK D&O FI Renewal | Case SUB-2025-0310-PCBK-FI-0042", body: UW_NOTIF_BODY } });

        // —— STEP 11 (pre-HITL) ————————————————————————————————————————
        await updateStatus("Needs Attention", "Step 11 of 11 — Quote Letter Generated & Queued for Underwriter Approval");
        await addLog({
            step: 11,
            title: "Quote Letter Generated & Queued for Underwriter Approval",
            status: "pending",
            reasoning: [
                "Rating tool execution completed — indication $336,000 (+7.7% vs prior year $312,000).",
                "Pace pricing adjustment applied: relationship credit (5 years incumbent) + capital strength premium — recommended $329,000 (+5.4%).",
                "Draft Quote Letter generated: Pinnacle Community Bancorp, D&O FI, EFF May 1 2025, $25M/$1M, $329,000.",
                "Quote Letter queued for Sarah Park's review and approval prior to broker release."
            ],
            artifacts: [
                { id: "s11_recording", type: "video", label: "Rating Tool — Final Output Recording", videoPath: "/data/Rating_Tool_Final_Recording.mp4" },
                { id: "s11_draft", type: "file", label: "Draft Quote Letter — Pinnacle Community Bancorp", pdfPath: "/data/draft_quote_letter.pdf" },
                {
                    id: "s11_decision", type: "decision", label: "Underwriter Approval Required",
                    options: [
                        { id: "approve", label: "Approve — Issue Quote to Broker", signal: "underwriter_approval" },
                        { id: "revise", label: "Return for Revision", signal: "underwriter_revision" }
                    ]
                }
            ],
            timestamp: new Date().toISOString()
        });
        await addArtifact({ id: "draft_quote", type: "file", label: "Draft Quote Letter — Pinnacle Community Bancorp", pdfPath: "/data/draft_quote_letter.pdf" });

        console.log("[sim] Step 11 waiting for HITL signal...");
        await waitForSignal("underwriter_approval");

        // —— STEP 11 (post-signal) — replaces pre-HITL entry ——————————
        await addLog({
            step: 11,
            replaceStep: 11,
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
                {
                    id: "s11_quote_email", type: "email_draft", label: "Quote Issued Email — Marcus Webb, Gallagher",
                    data: {
                        from: "sarah.park@chubb.com",
                        to: "marcus.webb@ajg.com",
                        subject: "RE: RENEWAL SUBMISSION — Pinnacle Community Bancorp (PCBK) — Quote Enclosed",
                        body: QUOTE_ISSUED_BODY,
                        isSent: true
                    }
                },
                {
                    id: "s11_uw_notif", type: "email_draft", label: "Underwriter Notification — Sarah Park",
                    data: {
                        from: "pace-notifications@zamp.ai",
                        to: "sarah.park@chubb.com",
                        subject: "[Pace] Action Required — Quote Ready for Approval | PCBK D&O FI Renewal | Case SUB-2025-0310-PCBK-FI-0042",
                        body: UW_NOTIF_BODY,
                        isSent: true
                    }
                }
            ],
            timestamp: new Date().toISOString()
        });
        await addArtifact({ id: "quote_email", type: "email_draft", label: "Quote Issued Email — Marcus Webb, Gallagher", data: { from: "sarah.park@chubb.com", to: "marcus.webb@ajg.com", subject: "RE: RENEWAL SUBMISSION — Pinnacle Community Bancorp (PCBK) — Quote Enclosed", body: QUOTE_ISSUED_BODY, isSent: true } });
        await addArtifact({ id: "uw_notif_sent", type: "email_draft", label: "Underwriter Notification — Sarah Park (Sent)", data: { from: "pace-notifications@zamp.ai", to: "sarah.park@chubb.com", subject: "[Pace] Action Required — Quote Ready for Approval | PCBK D&O FI Renewal | Case SUB-2025-0310-PCBK-FI-0042", body: UW_NOTIF_BODY, isSent: true } });

        await updateStatus("Done", "Done — Proceed to Quote");
        console.log("[sim] Simulation complete.");
    })();
}

module.exports = { runSimulation };
