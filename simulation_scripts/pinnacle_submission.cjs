const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = path.join(__dirname, '..');
const PUBLIC_DATA_DIR = path.join(PROJECT_ROOT, 'public/data');
const PROCESSES_FILE = path.join(PUBLIC_DATA_DIR, 'processes.json');
const PROCESS_ID = "SUB-2025-0310-PCBK-FI-0042";
const CASE_NAME = "Pinnacle Community Bancorp — D&O FI Renewal";

const readJson = (file) => (fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : []);
const writeJson = (file, data) => fs.writeFileSync(file, JSON.stringify(data, null, 4));
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const updateProcessLog = (processId, logEntry, keyDetailsUpdate = {}) => {
    const processFile = path.join(PUBLIC_DATA_DIR, `process_${processId}.json`);
    let data = { logs: [], keyDetails: {}, sidebarArtifacts: [] };
    if (fs.existsSync(processFile)) data = readJson(processFile);
    if (logEntry) {
        const existingIdx = logEntry.id ? data.logs.findIndex(l => l.id === logEntry.id) : -1;
        if (existingIdx !== -1) data.logs[existingIdx] = { ...data.logs[existingIdx], ...logEntry };
        else data.logs.push(logEntry);
    }
    if (keyDetailsUpdate && Object.keys(keyDetailsUpdate).length > 0) data.keyDetails = { ...data.keyDetails, ...keyDetailsUpdate };
    writeJson(processFile, data);
};

const updateProcessListStatus = async (processId, status, currentStatus) => {
    const apiUrl = process.env.VITE_API_URL || 'http://localhost:3001';
    try {
        const response = await fetch(`${apiUrl}/api/update-status`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: processId, status, currentStatus }) });
        if (!response.ok) throw new Error(`${response.status}`);
    } catch(e) {
        try {
            const processes = JSON.parse(fs.readFileSync(PROCESSES_FILE, 'utf8'));
            const idx = processes.findIndex(p => p.id === String(processId));
            if (idx !== -1) { processes[idx].status = status; processes[idx].currentStatus = currentStatus; fs.writeFileSync(PROCESSES_FILE, JSON.stringify(processes, null, 4)); }
        } catch(err) {}
    }
};

const waitForSignal = async (signalId) => {
    const signalFile = path.join(__dirname, '../interaction-signals.json');
    for (let i = 0; i < 15; i++) {
        try {
            if (fs.existsSync(signalFile)) {
                const signals = JSON.parse(fs.readFileSync(signalFile, 'utf8'));
                if (signals[signalId]) { delete signals[signalId]; fs.writeFileSync(signalFile, JSON.stringify(signals, null, 4)); }
                break;
            }
        } catch(e) { await delay(150); }
    }
    while (true) {
        try {
            if (fs.existsSync(signalFile)) {
                const signals = JSON.parse(fs.readFileSync(signalFile, 'utf8'));
                if (signals[signalId]) {
                    delete signals[signalId];
                    const tmp = signalFile + '.' + Math.random().toString(36).substring(7) + '.tmp';
                    fs.writeFileSync(tmp, JSON.stringify(signals, null, 4));
                    fs.renameSync(tmp, signalFile);
                    return true;
                }
            }
        } catch(e) {}
        await delay(1000);
    }
};

(async () => {
    console.log(`Starting ${PROCESS_ID}: ${CASE_NAME}...`);

    writeJson(path.join(PUBLIC_DATA_DIR, `process_${PROCESS_ID}.json`), {
        logs: [],
        keyDetails: {
            "Case ID": "SUB-2025-0310-PCBK-FI-0042",
            "Named Insured": "Pinnacle Community Bancorp, Inc.",
            "Ticker": "PCBK (NASDAQ)",
            "Institution Type": "State-chartered commercial bank — Federal Reserve member",
            "Total Assets": "$4.2B (FY2024)",
            "Broker": "Marcus Webb, Gallagher Charlotte",
            "Underwriter": "Sarah Park, Sr. Underwriter — Financial Institutions",
            "Line": "D&O Liability — Financial Institutions Edition",
            "Transaction Type": "Renewal — 4th consecutive year (incumbent)",
            "Effective Date": "May 1, 2025",
            "Prior Policy": "CHB-DOFI-PCBK-2024 — $25M / $1M retention — $312,000",
            "Documents Received": "10",
            "Status": "Initializing..."
        }
    });

    // STEP 1
    updateProcessLog(PROCESS_ID, { id: "step-1", time: new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'}), title: "Parsing inbound submission email and attachments...", status: "processing" });
    await updateProcessListStatus(PROCESS_ID, "In Progress", "Parsing submission email...");
    await delay(8000);
    updateProcessLog(PROCESS_ID, {
        id: "step-1", title: "Submission email parsed — 10 attachments identified, 2 priority flags set", status: "success",
        reasoning: [
            "Inbound email from marcus.webb@ajg.com at 9:12 AM, March 10, 2025",
            "Named insured, LOB, transaction type, and effective date extracted from subject line",
            "Cover letter processed — 5 paragraphs read in full",
            "Broker proactively disclosed FDIC Consent Order termination (December 2024)",
            "One prior D&O derivative claim disclosed — settled August 2024 within $1M retention",
            "10 attachments identified — no encrypted files, no missing documents",
            "(R) Priority flag: regulatory history — consent order",
            "(R) Priority flag: prior D&O claim",
            "Case created and routed to Sarah Park, Sr. Underwriter, Financial Institutions"
        ],
        artifacts: [
            { id: "a-inbound-email", type: "email_draft", label: "Inbound Submission Email — Marcus Webb", isIncoming: true, from: "Marcus Webb <marcus.webb@ajg.com>", to: "submissions@chubb.com", cc: "", subject: "D&O FI Renewal — Pinnacle Community Bancorp — EFF 5/1/2025", body: "Dear Chubb Submissions Team,\n\nPlease find attached our renewal submission for Pinnacle Community Bancorp, Inc. (PCBK) for D&O Financial Institutions coverage effective May 1, 2025.\n\nPinnacle is a 4th-year incumbent with Chubb. This year's submission includes one regulatory disclosure: the FDIC Consent Order (CO-2023-PCBK-01, BSA/AML) was formally terminated by the FDIC on December 18, 2024. We have included the termination letter as a separate attachment.\n\nWe are also disclosing one prior D&O claim: a derivative suit filed May 2023, settled August 2024 for $850K total, within the $1M retention. Chubb paid $0. The case was dismissed with prejudice and no appeal was filed.\n\nAll 10 required documents are included. Please let me know if anything further is needed.\n\nBest regards,\nMarcus Webb\nSenior Vice President, Financial Lines\nGallagher Charlotte" },
            { id: "a-fdic-letter", type: "file", label: "FDIC Consent Order Termination Letter — Dec 18, 2024", pdfPath: "/data/fdic_consent_order_termination.pdf" }
        ]
    });
    await updateProcessListStatus(PROCESS_ID, "In Progress", "Submission email parsed — 2 flags set");
    await delay(1500);

    // STEP 2
    updateProcessLog(PROCESS_ID, { id: "step-2", time: new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'}), title: "Classifying all 10 attached documents...", status: "processing" });
    await updateProcessListStatus(PROCESS_ID, "In Progress", "Classifying documents...");
    await delay(18000);
    updateProcessLog(PROCESS_ID, {
        id: "step-2", title: "Document classification complete — 10/10 classified, 2 non-standard types flagged", status: "success",
        reasoning: [
            "All 10 documents ingested and classified simultaneously",
            "8 of 10 are standard FI D&O submission types — classified at 98–99% confidence",
            "Doc #3 (FDIC Termination Letter): formal government regulatory document — routed for dedicated regulatory verification",
            "Doc #10 (BSA/AML Remediation Summary): management-prepared compliance narrative — routed for qualitative triage analysis",
            "No bundles requiring splitting. No OCR failures. All documents machine-readable."
        ],
        artifacts: [{ id: "a-doc-class", type: "file", label: "Document Classification Report", pdfPath: "/data/doc_classification_report.pdf" }]
    });
    await updateProcessListStatus(PROCESS_ID, "In Progress", "Documents classified — 2 special types flagged");
    await delay(1500);

    // STEP 3
    updateProcessLog(PROCESS_ID, { id: "step-3", time: new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'}), title: "Running completeness check against FI D&O renewal checklist...", status: "processing" });
    await updateProcessListStatus(PROCESS_ID, "In Progress", "Completeness check running...");
    await delay(5000);
    updateProcessLog(PROCESS_ID, {
        id: "step-3", title: "Completeness check passed — all 10 items confirmed, no MIR needed", status: "success",
        reasoning: [
            "Verified against standard FI D&O renewal checklist",
            "Two additional items applied based on regulatory disclosure: (1) consent order termination letter, (2) BSA/AML remediation documentation",
            "Both additional documents present — proactively supplied by broker",
            "All 10 required items confirmed present. No missing information request needed."
        ],
        artifacts: [{ id: "a-completeness", type: "file", label: "Completeness Check Report", pdfPath: "/data/completeness_check_report.pdf" }]
    });
    await updateProcessListStatus(PROCESS_ID, "In Progress", "Completeness check passed — no MIR needed");
    await delay(1500);

    // STEP 4
    updateProcessLog(PROCESS_ID, { id: "step-4", time: new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'}), title: "Executing PAS clearance check and retrieving loss history...", status: "processing" });
    await updateProcessListStatus(PROCESS_ID, "In Progress", "PAS clearance check running...");
    await delay(55000);
    updateProcessLog(PROCESS_ID, {
        id: "step-4", title: "Clearance confirmed — incumbent 4 years, 1 prior claim closed within retention, Chubb paid $0", status: "success",
        reasoning: [
            "PAS search: 'Pinnacle Community Bancorp' — 1 record returned",
            "Incumbent confirmed: 4 consecutive policy years, prior policy CHB-DOFI-PCBK-2024 active",
            "FEIN cross-reference passed. No declinations. No blocking. No duplicate records.",
            "(G) Cross-line flag noted: Chubb also writes BPL policy — same account team (Sarah Park)",
            "Loss History Analyzer: full 5-year history retrieved",
            "4 policy years with zero claims",
            "One D&O derivative claim (May 2023–Apr 2024): $850K total, within $1M retention",
            "(G) Chubb paid $0 — dismissed with prejudice August 2024, no appeal filed",
            "Loss run data consistent with broker cover letter disclosure"
        ],
        artifacts: [
            { id: "a-loss-run", type: "file", label: "Loss Run — Chubb Incumbent FY2020–FY2025", pdfPath: "/data/loss_run_chubb_pcbk.pdf" },
            { id: "a-loss-analyzer", type: "file", label: "Loss History Analyzer Output", pdfPath: "/data/loss_history_analyzer_output.pdf" },
            { id: "a-pas-video", type: "video", label: "PAS Clearance Browser Recording", videoPath: "/data/PAS_Browser_Recording.mp4" }
        ]
    });
    await updateProcessListStatus(PROCESS_ID, "In Progress", "Clearance confirmed — incumbent 4 years");
    await delay(1500);

    // STEP 5
    updateProcessLog(PROCESS_ID, { id: "step-5", time: new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'}), title: "Verifying regulatory status — FDIC, OCC, Federal Reserve...", status: "processing" });
    await updateProcessListStatus(PROCESS_ID, "In Progress", "Regulatory verification in progress...");
    await delay(52000);
    updateProcessLog(PROCESS_ID, {
        id: "step-5", title: "Regulatory verification complete — consent order confirmed terminated Dec 18, 2024 ✅", status: "success",
        reasoning: [
            "FDIC Enforcement Actions portal (orders.fdic.gov) — searched by institution name and state",
            "CO-2023-PCBK-01 (Consent Order — BSA/AML, Oct 12, 2023): status TERMINATED — December 18, 2024 ✅",
            "Termination basis confirmed: transaction monitoring upgrade, CDD remediation, SAR compliance, staffing, third-party validation all completed",
            "(G) Termination date matches broker-supplied letter (Doc #3) ✅",
            "Prior 2018 CRE informal agreement — terminated November 2018 — no relevance",
            "OCC search (apps.occ.gov): no records — expected; Pinnacle is state-chartered, not OCC-supervised ✅",
            "Federal Reserve enforcement search: no records ✅",
            "(G) Current regulatory status: no outstanding formal enforcement actions across all applicable regulators"
        ],
        artifacts: [
            { id: "a-fdic-letter-5", type: "file", label: "FDIC Consent Order Termination Letter — Dec 18, 2024", pdfPath: "/data/fdic_consent_order_termination.pdf" },
            { id: "a-fdic-record", type: "file", label: "FDIC Enforcement Record — CO-2023-PCBK-01", pdfPath: "/data/fdic_enforcement_record.pdf" },
            { id: "a-fdic-video", type: "video", label: "FDIC Browser Recording", videoPath: "/data/FDIC_Browser_Recording.mp4" }
        ]
    });
    await updateProcessListStatus(PROCESS_ID, "In Progress", "Regulatory verification complete");
    await delay(1500);

    // STEP 6
    updateProcessLog(PROCESS_ID, { id: "step-6", time: new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'}), title: "Querying SEC EDGAR — verifying documents and scanning 8-K history...", status: "processing" });
    await updateProcessListStatus(PROCESS_ID, "In Progress", "EDGAR verification running...");
    await delay(14000);
    updateProcessLog(PROCESS_ID, {
        id: "step-6", title: "EDGAR verification complete — all docs verified, termination triple-sourced, no undisclosed events", status: "success",
        reasoning: [
            "EDGAR REST API queried by ticker PCBK — CIK retrieved",
            "All 3 submitted SEC documents verified against EDGAR filing records ✅",
            "18-month 8-K history scanned — 7 filings reviewed",
            "(G) Dec 19, 2024 8-K confirms FDIC consent order termination — third independent source ✅",
            "(G) Aug 5, 2024 8-K confirms derivative litigation settled and dismissed — consistent with loss run ✅",
            "No undisclosed material events. No SEC comment letters. No other regulatory investigations."
        ],
        artifacts: [
            { id: "a-8k-dec", type: "file", label: "8-K Dec 19 2024 — FDIC Termination Disclosure", pdfPath: "/data/8k_dec2024_fdic_termination.pdf" },
            { id: "a-8k-aug", type: "file", label: "8-K Aug 5 2024 — Derivative Settlement", pdfPath: "/data/8k_aug2024_derivative_settlement.pdf" },
            { id: "a-edgar-report", type: "file", label: "EDGAR Verification Report", pdfPath: "/data/edgar_verification_report.pdf" }
        ]
    });
    await updateProcessListStatus(PROCESS_ID, "In Progress", "EDGAR verification complete");
    await delay(1500);

    // STEP 7
    updateProcessLog(PROCESS_ID, { id: "step-7", time: new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'}), title: "Extracting structured data and populating PAS and rating tool...", status: "processing" });
    await updateProcessListStatus(PROCESS_ID, "In Progress", "Extracting data and populating systems...");
    await delay(48000);
    updateProcessLog(PROCESS_ID, {
        id: "step-7", title: "Data extraction complete — 61 PAS fields populated across 7 screens, zero manual keystrokes", status: "success",
        reasoning: [
            "Key fields extracted from ACORD 125, FI management liability application, and financial statements",
            "Capital ratios extracted: CET1 12.4% · Tier 1 12.4% · Total Capital 13.7% · Leverage 9.8%",
            "Asset quality extracted: NPA / Total Assets 0.82% · CRE concentration 278% of regulatory capital",
            "61 PAS fields populated across 7 screens — zero manual keystrokes",
            "Bank-specific screens populated: capital ratio inputs, regulatory examination status, CRE concentration, CAMELS-equivalent fields",
            "Regulatory tags applied in PAS: 'Consent order — VERIFIED TERMINATED 12/18/2024' and 'Prior D&O claim — within retention — Chubb paid $0'",
            "FI rating worksheet opened and pre-populated with bank-specific rating inputs",
            "Submission status set to 'Regulatory Verified — In Review.' Routed to Sarah Park."
        ],
        artifacts: [
            { id: "a-ml-app", type: "file", label: "Management Liability Application — FI Edition", pdfPath: "/data/ml_application_fi.pdf" },
            { id: "a-financials", type: "file", label: "Financial Statements Bundle FY2022–FY2024", pdfPath: "/data/financial_statements_fy2022_2024.pdf" },
            { id: "a-pas-pop", type: "video", label: "PAS Population Browser Recording", videoPath: "/data/PAS_Population_Browser_Recording.mp4" },
            { id: "a-rating-input", type: "video", label: "Rating Tool Input Recording", videoPath: "/data/Rating_Tool_Input_Recording.mp4" }
        ]
    });
    await updateProcessListStatus(PROCESS_ID, "In Progress", "61 PAS fields populated");
    await delay(1500);

    // STEP 8
    updateProcessLog(PROCESS_ID, { id: "step-8", time: new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'}), title: "Running bank financial analysis and peer benchmarking...", status: "processing" });
    await updateProcessListStatus(PROCESS_ID, "In Progress", "Financial analysis running...");
    await delay(45000);
    updateProcessLog(PROCESS_ID, {
        id: "step-8", title: "Financial analysis complete — capital above peer median, earnings recovering, CRE elevated but declining", status: "success",
        reasoning: [
            "FFIEC UBPR portal (cdr.ffiec.gov) — Q4 2024 data retrieved by FDIC certificate number",
            "Capital ratios cross-referenced against UBPR — CET1 12.4% confirmed ✅",
            "Peer group: community banks $3B–$5B assets, Southeast region",
            "(G) Capital: CET1 12.4% vs. peer median 11.8% — above peer, top quartile, well-capitalized ✅",
            "(G) Asset quality: NPA 0.82% vs. peer median 0.94% — improving from 1.14% in FY2023, below peer ✅",
            "(R) CRE concentration: 278% vs. peer median 295% — elevated but below peer median, below 300% regulatory guidance threshold, declining from 291% in FY2023",
            "(G) Earnings: Net income $39.5M (+16% YoY), ROA 0.94%, NIM expanding 3.28% → 3.41%",
            "One-time remediation costs ($4–6M) visible in FY2023, absent in FY2024 — consistent with consent order completion",
            "(G) Overall financial health: Good — solid capital, improving asset quality, recovering earnings"
        ],
        artifacts: [
            { id: "a-ubpr", type: "file", label: "FFIEC UBPR Report — Pinnacle Q4 2024", pdfPath: "/data/ffiec_ubpr_report.pdf" },
            { id: "a-fin-analysis", type: "file", label: "Financial Analysis & Peer Benchmarking Report", pdfPath: "/data/financial_analysis_report.pdf" }
        ]
    });
    await updateProcessListStatus(PROCESS_ID, "In Progress", "Financial analysis complete");
    await delay(1500);

    // STEP 9
    updateProcessLog(PROCESS_ID, { id: "step-9", time: new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'}), title: "Cross-referencing loss run across three independent sources...", status: "processing" });
    await updateProcessListStatus(PROCESS_ID, "In Progress", "Loss run cross-reference running...");
    await delay(10000);
    updateProcessLog(PROCESS_ID, {
        id: "step-9", title: "Loss run cross-reference complete — three sources fully consistent, rated clean for renewal", status: "success",
        reasoning: [
            "Broker-submitted loss run (Doc #8) parsed — 5-year history, Chubb incumbent format",
            "Three-source cross-reference: broker loss run · Loss History Analyzer · EDGAR 8-K (Aug 5, 2024)",
            "(G) All three sources fully consistent — same claim, same amount ($850K), same disposition ✅",
            "Claim context: derivative suit during active consent order period is standard secondary consequence in FI D&O",
            "(G) Chubb paid $0. Claim closed with prejudice. No reopening risk. No pending appeal.",
            "(G) Loss run rated: Clean for renewal. Maintain $1M retention."
        ],
        artifacts: [
            { id: "a-loss-run-9", type: "file", label: "Loss Run — Chubb Incumbent FY2020–FY2025", pdfPath: "/data/loss_run_chubb_pcbk.pdf" },
            { id: "a-crossref", type: "file", label: "Three-Source Cross-Reference Report", pdfPath: "/data/three_source_crossref_report.pdf" }
        ]
    });
    await updateProcessListStatus(PROCESS_ID, "In Progress", "Loss run rated clean — three sources consistent");
    await delay(1500);

    // STEP 10
    updateProcessLog(PROCESS_ID, { id: "step-10", time: new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'}), title: "Evaluating appetite triage and routing decision...", status: "processing" });
    await updateProcessListStatus(PROCESS_ID, "In Progress", "Appetite triage evaluation running...");
    await delay(18000);
    updateProcessLog(PROCESS_ID, {
        id: "step-10", title: "Triage complete — ✅ Proceed to Quote. Premium guidance: $333K–$341K (+7–9%)", status: "success",
        reasoning: [
            "All 14 appetite factors evaluated against Chubb NA Financial Lines FI D&O guidelines",
            "BSA/AML Remediation Summary reviewed — narrative consistent with FDIC termination, EDGAR 8-K, and UBPR data at every factual point",
            "No referral triggers identified. No missing information. No adverse findings.",
            "(G) Endorsement recommendation: regulatory rep/warranty — no BSA/AML exclusion (consent order is terminated)",
            "Premium guidance: +7–9% over prior year ($333K–$341K), reflecting prior claims event and CRE profile, offset by capital strength and 4-year incumbent relationship",
            "(G) Triage decision: ✅ Proceed to Quote. No referral required.",
            "PAS updated — triage tags and premium guidance recorded. Routing confirmed to Sarah Park's queue.",
            "Notification email sent to Sarah Park with full Pace summary."
        ],
        artifacts: [
            { id: "a-triage", type: "file", label: "Appetite Triage Evaluation", pdfPath: "/data/appetite_triage_evaluation.pdf" },
            { id: "a-uw-notif", type: "email_draft", label: "Underwriter Notification Email", isIncoming: false, from: "pace@chubb.com", to: "sarah.park@chubb.com", cc: "", subject: "Pace Summary — Pinnacle Community Bancorp D&O FI Renewal — Triage Complete", body: "Hi Sarah,\n\nPace has completed triage on the Pinnacle Community Bancorp D&O FI renewal (SUB-2025-0310-PCBK-FI-0042). Here's the summary:\n\n✅ REGULATORY: FDIC Consent Order CO-2023-PCBK-01 confirmed TERMINATED December 18, 2024. Triple-sourced: broker letter, FDIC portal, EDGAR 8-K. OCC and Fed Reserve: no records.\n\n✅ LOSS HISTORY: One prior D&O derivative claim — $850K, within $1M retention, Chubb paid $0, dismissed with prejudice August 2024. Three-source cross-reference consistent.\n\n✅ FINANCIALS: CET1 12.4% (above peer). NPA 0.82% (improving, below peer). CRE 278% (elevated but declining, below 300% threshold). Earnings +16% YoY.\n\n✅ TRIAGE: Proceed to Quote. No referral triggers.\n\nENDORSEMENT RECOMMENDATION: Regulatory rep/warranty — no BSA/AML exclusion.\nPREMIUM GUIDANCE: $333K–$341K (+7–9% over prior $312K).\n\nDraft quote letter queued for your review and approval.\n\n— Pace" }
        ]
    });
    updateProcessLog(PROCESS_ID, {}, {
        "Regulatory Flag": "FDIC Consent Order (BSA/AML, Oct 2023) — Confirmed Terminated Dec 18, 2024",
        "Prior D&O Claim": "1 claim — $850K within retention — Chubb paid $0 — Closed",
        "Triage Decision": "✅ Proceed to Quote"
    });
    await updateProcessListStatus(PROCESS_ID, "In Progress", "Triage complete — Proceed to Quote");
    await delay(1500);

    // STEP 11 — HITL
    updateProcessLog(PROCESS_ID, { id: "step-11", time: new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'}), title: "Running FI D&O rating model and generating draft quote letter...", status: "processing" });
    await updateProcessListStatus(PROCESS_ID, "In Progress", "Generating draft quote letter...");
    await delay(30000);

    // Pre-signal state
    updateProcessLog(PROCESS_ID, {
        id: "step-11",
        title: "Draft quote letter generated — $336,000 (+7.7%) — awaiting underwriter approval to send",
        status: "warning",
        reasoning: [
            "FI D&O rating model run — all bank-specific inputs confirmed",
            "Premium indication returned: $336,000 (+7.7% over prior year $312,000)",
            "Quote letter template loaded — all fields populated by Pace",
            "Regulatory rep/warranty endorsement language drafted and included",
            "Prior acts coverage and continuity of coverage provisions included",
            "Draft saved as PCBK_DOFI_2025_DRAFT_QuoteLetter_v1.pdf",
            "Draft linked to PAS submission record — case flagged for underwriter action",
            "⚠️ Awaiting Sarah Park's review and approval before sending to Marcus Webb"
        ],
        artifacts: [
            { id: "a-rating-final", type: "video", label: "Rating Tool Final Recording", videoPath: "/data/Rating_Tool_Final_Recording.mp4" },
            { id: "a-draft-quote", type: "file", label: "Draft Quote Letter v1", pdfPath: "/data/draft_quote_letter.pdf" }
        ]
    });
    await updateProcessListStatus(PROCESS_ID, "Needs Attention", "⚠️ Awaiting underwriter approval to send quote");

    // Wait for signal
    await waitForSignal("underwriter_approval");
    await updateProcessListStatus(PROCESS_ID, "In Progress", "Underwriter approved — sending quote to broker...");
    await delay(2000);

    // Post-signal state — add quote email artifact
    updateProcessLog(PROCESS_ID, {
        id: "step-11",
        title: "Quote sent to Marcus Webb — $336,000 premium indication. Case complete.",
        status: "completed",
        reasoning: [
            "Sarah Park approved the draft quote letter",
            "Quote email sent to marcus.webb@ajg.com with PCBK_DOFI_2025_QuoteLetter_v1.pdf attached",
            "PAS submission record updated — status set to 'Quote Issued'",
            "Case closed in Pace. Submission tracker updated: Pinnacle Community Bancorp | D&O FI Renewal | EFF 5/1/25 | Quote Issued | $336,000"
        ],
        artifacts: [
            { id: "a-rating-final", type: "video", label: "Rating Tool Final Recording", videoPath: "/data/Rating_Tool_Final_Recording.mp4" },
            { id: "a-draft-quote", type: "file", label: "Draft Quote Letter v1", pdfPath: "/data/draft_quote_letter.pdf" },
            { id: "a-quote-email", type: "email_draft", label: "Quote Issued Email", isIncoming: false, from: "sarah.park@chubb.com", to: "marcus.webb@ajg.com", cc: "submissions@chubb.com", subject: "Quote — Pinnacle Community Bancorp D&O FI Renewal EFF 5/1/2025", body: "Hi Marcus,\n\nPlease find attached the D&O Financial Institutions renewal quote for Pinnacle Community Bancorp, Inc.\n\nQuote Summary:\n• Named Insured: Pinnacle Community Bancorp, Inc. (PCBK)\n• Policy Period: May 1, 2025 – May 1, 2026\n• Line: D&O Liability — Financial Institutions Edition\n• Limit: $25,000,000\n• Retention: $1,000,000\n• Premium: $336,000\n• Endorsements: Regulatory Representation and Warranty\n\nThis quote is valid for 30 days. Please don't hesitate to reach out with any questions.\n\nBest regards,\nSarah Park\nSr. Underwriter, Financial Institutions\nChubb" }
        ]
    });
    updateProcessLog(PROCESS_ID, {}, {
        "Premium Indication": "$336,000 (+7.7% over prior year)",
        "Pace Processing Time": "8 min 22 sec",
        "Status": "Done — Quote Queued for Underwriter Review"
    });
    await updateProcessListStatus(PROCESS_ID, "Done — Proceed to Quote", "Quote sent to Marcus Webb ✅");

    console.log(`${PROCESS_ID} Complete: ${CASE_NAME}`);
})();
