'use strict';
const http = require('http');

const BASE_URL = 'https://backend-production-6452.up.railway.app';
const PROCESS_ID = 'EO-2025-0312-MSPX-PL-0017';

function post(path, data) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(data);
    const url = new URL(BASE_URL + path);
    const options = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }
    };
    const req = require('https').request(options, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => resolve(d));
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

function get(path) {
  return new Promise((resolve, reject) => {
    const url = new URL(BASE_URL + path);
    require('https').get({ hostname: url.hostname, port: 443, path: url.pathname }, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => resolve(d));
    }).on('error', reject);
  });
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function waitForSignal(signalId, intervalMs = 3000) {
  console.log(`Waiting for signal: ${signalId}`);
  while (true) {
    const raw = await get('/signal-status');
    const parsed = JSON.parse(raw);
    if (parsed[signalId]) {
      console.log(`Signal received: ${signalId}`);
      return;
    }
    await sleep(intervalMs);
  }
}

async function addLog(entry, keyDetails) {
  const sidebarArtifacts = entry.artifacts || [];
  const payload = { processId: PROCESS_ID, logEntry: entry, sidebarArtifacts };
  if (keyDetails) payload.keyDetails = keyDetails;
  await post('/api/update-process-log', payload);
}

async function updateProcess(id, status, currentStatus) {
  await post('/api/update-status', { id, status, currentStatus });
}

async function run() {
  console.log('Starting Meridian E&O simulation...');

  await sleep(500);

  // ── STEP 1: Submission Email Received & Parsed ──
  await addLog({
      step: 1,
      status: 'complete',
      title: 'Submission Email Received & Parsed',
      reasoning: [
        'Inbound email received from jennifer.park@wtwco.com via Willis Towers Watson Chicago AMS 4.2',
        'Named insured confirmed: Meridian Strategy Partners, Inc. (NASDAQ: MSPX)',
        'Line of business identified: Professional Liability — E&O Renewal, effective May 1, 2025',
        '8 attachments parsed: ML Application, ACORD 125, 10-K FY2024, 10-Q Q3, financials FY2022–24, Chubb loss run, AIG loss run, prior dec page',
        'Acquisition disclosure noted in email body: Bridgepoint Advisory LLC acquired March 5, 2025 ($28M, 120 employees)',
        'Indication deadline: March 28, 2025 — 16 calendar days remaining'
      ],
      artifacts: [
        {
          id: 'mspx-s1-inbound-email',
          type: 'email_draft',
          label: 'Inbound Submission Email',
          data: {
            from: 'jennifer.park@wtwco.com',
            to: 'professionallinessubmissions.northeast@chubb.com',
            subject: 'Meridian Strategy Partners, Inc. — E&O Renewal — Eff. 5/1/2025 — WTW Chicago',
            isIncoming: true,
            isSent: false,
            body: `David,\n\nPlease find attached our renewal submission for Meridian Strategy Partners, Inc. for their Professional Liability / E&O program, effective May 1, 2025.\n\nACCOUNT OVERVIEW\n\nMeridian Strategy Partners (NASDAQ: MSPX) is a Chicago-based management and strategy consulting firm with approximately 1,820 employees and $412M in FY2024 revenue. Chubb has been the E&O carrier for three consecutive years, and Meridian has been a Chubb account in good standing throughout. The account has a clean E&O loss history — zero claims across all Chubb policy periods and the prior AIG period.\n\nRECENT ACQUISITION\n\nAs you may have seen in their March 6 8-K filing, Meridian closed the acquisition of Bridgepoint Advisory LLC on March 5, 2025 — a Chicago-based operations consulting boutique focused on manufacturing and industrial supply chain. $28M all-cash. This adds approximately 120 employees and $31M in annualized revenue to the Meridian platform. The acquisition rounds out their Operations & Supply Chain practice and is the fourth bolt-on since 2021.\n\nRENEWAL REQUEST\n\nWe are requesting renewal of the current program: $15M primary E&O limit, $500,000 retention, ForeFront Portfolio Management Liability form. Given three consecutive clean years with no E&O activity, we would ask you to give serious consideration to a flat or modest reduction in premium from the current $224,000. I appreciate that the Bridgepoint acquisition increases the exposure base modestly, but the combined entity remains a well-managed, disciplined consultancy.\n\nIndication deadline: March 28, 2025.\n\nPlease don't hesitate to reach out with any questions. Happy to set up a brief call with Meridian's General Counsel if that would be helpful.\n\nBest,\nJennifer\n\n--\nJennifer Park\nManaging Director, Financial & Executive Risk\nWillis Towers Watson\n233 South Wacker Drive, Suite 8100\nChicago, IL 60606\nDirect: +1 312 201 7744\njennifer.park@wtwco.com`
          }
        }
      ]
  }, {
    namedInsured: 'Meridian Strategy Partners, Inc.',
    ticker: 'NASDAQ: MSPX',
    broker: 'Jennifer Park — WTW',
    line: 'E&O — Professional Liability',
    transactionType: 'Renewal',
    effectiveDate: 'May 1, 2025',
    priorPolicy: 'CHB-EOPL-MSPX-2022',
    premiumGuidance: '$224,000'
  });

  await sleep(1500);

  // ── STEP 2: Document Classification ──
  await addLog({
      step: 2,
      status: 'complete',
      title: 'Document Classification',
      reasoning: [
        'ML classifier applied to 8 attached documents — all classified with confidence >= 0.94',
        'ACORD 125 confirmed as primary application form; ML Application supplement identified as secondary application',
        '10-K FY2024 and 10-Q Q3 classified as financial disclosures — flagged for financial analysis queue',
        'FY2022–24 financials classified as audited financial statements',
        'Chubb and AIG loss runs classified as carrier loss histories — 5-year coverage confirmed',
        'Prior dec page classified as expiring policy — limits and retention extracted: $15M / $500K',
        'No unclassified or ambiguous documents — completeness check queued'
      ],
      artifacts: [
        { id: 'mspx-s2-doc-class', type: 'file', label: 'Document Classification Report', pdfPath: '/data/02_doc_classification_mspx.pdf' }
      ]
  });

  await sleep(1500);

  // ── STEP 3: Completeness Check ──
  await addLog({
      step: 3,
      status: 'complete',
      title: 'Completeness Check',
      reasoning: [
        'Completeness check applied against Chubb E&O renewal requirements checklist (47 fields)',
        'ML Application: 44 of 47 fields populated — 3 fields incomplete (Q6.3, Q6.4, Q6.5 litigation section)',
        'Q6.3 answered NO — no pending or threatened claims against any subsidiary or affiliate',
        'ACORD 125 supplemental data complete — all required fields present',
        'Financial disclosures complete — FY2022, FY2023, FY2024 audited statements on file',
        'Loss runs complete — continuous coverage confirmed from AIG (2020–2022) through Chubb (2022–2025)',
        'Completeness score: 93.6% — Q6 gap flagged for follow-up but does not block processing'
      ],
      artifacts: [
        { id: 'mspx-s3-completeness', type: 'file', label: 'Completeness Check Report', pdfPath: '/data/03_completeness_check_mspx.pdf' }
      ]
  });

  await sleep(1500);

  // ── STEP 4: Clearance Check & Loss History Retrieved ──
  await addLog({
      step: 4,
      status: 'complete',
      title: 'Clearance Check & Loss History Retrieved',
      reasoning: [
        'PAS clearance search: "Meridian Strategy Partners" — 1 result returned, incumbent confirmed, no conflict',
        'Existing PAS record: CHB-EO-MSPX-2022 — active, assigned to David Chen, Sr. UW Professions E&O',
        'Chubb loss run retrieved: 3 policy periods (2022–2025) — 0 E&O claims, 0 incidents, 0 reserves',
        'AIG prior carrier loss run retrieved: 2 policy periods (2020–2022) — 0 E&O claims, 1 EPL claim (closed, $0 indemnity)',
        'Loss history analyzer: combined 5-year E&O loss ratio = 0.0% — favorable renewal indicator',
        'Bridgepoint Advisory LLC subsidiary checked: no prior Chubb relationship identified'
      ],
      artifacts: [
        { id: 'mspx-s4-pas-video', type: 'video', label: 'PAS Clearance Recording', videoPath: '/data/PAS_Clearance_MSPX_Recording.mp4' },
        { id: 'mspx-s4-chubb-loss-run', type: 'file', label: 'Chubb Loss Run — MSPX 2022–2025', pdfPath: '/data/04_loss_run_chubb_mspx.pdf' },
        { id: 'mspx-s4-aig-loss-run', type: 'file', label: 'AIG Loss Run — MSPX 2020–2022', pdfPath: '/data/05_loss_run_aig_mspx.pdf' },
        { id: 'mspx-s4-loss-analyzer', type: 'file', label: 'Loss History Analyzer Output', pdfPath: '/data/06_loss_history_analyzer_mspx.pdf' }
      ]
  });

  await sleep(1500);

  // ── STEP 5: EDGAR Verification & 8-K Scan ──
  await addLog({
      step: 5,
      status: 'complete',
      title: 'EDGAR Verification & 8-K Scan',
      reasoning: [
        'EDGAR API query: MSPX — entity verified as Meridian Strategy Partners, Inc., CIK 0001389207',
        '8-K filed March 6, 2025: Item 1.01 — Entry into Material Definitive Agreement (Bridgepoint acquisition)',
        '8-K also discloses: Item 8.01 — Hartwell Manufacturing Group v. Bridgepoint Advisory LLC, Cook County Circuit Court, Case No. 2024-L-008471',
        'Legal proceedings section identifies $4,100,000 in claimed damages — professional negligence, supply chain engagement 2022–2023',
        'Bridgepoint became Meridian wholly owned subsidiary March 5, 2025 — acquisition predates ML Application signing date (March 12, 2025)',
        'ML Application Q6.3 conflict identified: acquisition + active litigation confirmed via 8-K; Q6.3 answered NO — flagged for court records verification'
      ],
      artifacts: [
        { id: 'mspx-s5-8k-filing', type: 'file', label: '8-K Filing — Bridgepoint Acquisition (March 6, 2025)', pdfPath: '/data/08_8k_march2025_bridgepoint.pdf' },
        { id: 'mspx-s5-edgar', type: 'file', label: 'EDGAR Verification Report', pdfPath: '/data/09_edgar_verification_mspx.pdf' }
      ]
  });

  await sleep(1500);

  // ── STEP 6: Court Records Search ──
  await addLog({
      step: 6,
      status: 'complete',
      title: 'Court Records Search — Bridgepoint Advisory LLC',
      reasoning: [
        'CourtListener API query: "Bridgepoint Advisory LLC" + Cook County Circuit Court — 1 active case returned',
        'Case No. 2024-L-008471: Hartwell Manufacturing Group v. Bridgepoint Advisory LLC — filed July 8, 2024',
        'Cause of action: Professional negligence — supply chain consulting engagement, 2022–2023',
        'Damages claimed: $4,100,000 — active, not dismissed, not settled as of March 12, 2025',
        'Defendant counsel: Perkins Coie LLP on behalf of Bridgepoint (Markel E&O policy)',
        'Claim predates Meridian acquisition — Markel Insurance confirmed as defending carrier under Bridgepoint prior policy',
        'Known circumstance confirmed: claim existed before policy inception date — coverage clause analysis triggered'
      ],
      artifacts: [
        { id: 'mspx-s6-court-record', type: 'file', label: 'Court Record — Cook County 2024-L-008471', pdfPath: '/data/10_court_record_cook_county.pdf' }
      ]
  });

  await sleep(1500);

  // ── STEP 7: Known Circumstances & Coverage Clause Analysis ──
  await addLog({
      step: 7,
      status: 'complete',
      title: 'Known Circumstances & Coverage Clause Analysis',
      reasoning: [
        'ForeFront Portfolio Management Liability form reviewed: Newly Acquired Entity auto-coverage clause applies to subsidiaries acquired during policy period',
        'Known circumstance carve-out: auto-coverage does not apply to claims or circumstances known to insured prior to acquisition date',
        'Hartwell v. Bridgepoint filed July 2024 — Bridgepoint principals had knowledge of claim at acquisition date (March 5, 2025)',
        'Known circumstances carve-out applies — Hartwell claim falls outside Chubb E&O scope regardless of application answer',
        'Markel Insurance remains primary responding carrier for Hartwell matter under Bridgepoint prior policy',
        'Coverage analysis conclusion: Chubb exposure is not materially increased by Bridgepoint acquisition, but Q6.3 misrepresentation creates application integrity issue requiring correction'
      ],
      artifacts: [
        { id: 'mspx-s7-known-circ', type: 'file', label: 'Known Circumstances Coverage Analysis', pdfPath: '/data/11_known_circumstances_mspx.pdf' }
      ]
  });

  await sleep(1500);

  // ── STEP 8: HITL Exception (pre-signal) ──
  await addLog({
      step: 8,
      status: 'pending',
      title: 'HITL Exception: Undisclosed Known Circumstance',
      reasoning: [
        'ML Application Q6.3 answered NO — confirmed incorrect based on EDGAR 8-K and CourtListener records',
        'Bridgepoint Advisory LLC acquired March 5, 2025; Hartwell Manufacturing Group claim active since July 2024',
        'Application signed March 12, 2025 — 7 days post-acquisition; insured had constructive knowledge of claim at signing',
        'Known circumstance carve-out confirmed — Chubb coverage scope not materially affected',
        'However: application misrepresentation creates policy integrity risk — must be resolved before quote issuance',
        'Pace recommendation: Option 2 — Hold and request corrected application from broker'
      ],
      hitlOptions: [
        { id: 'opt1', label: 'Option 1', description: 'Proceed as submitted (no action on Q6.3)' },
        { id: 'opt2', label: 'Option 2 — Recommended', description: 'Hold; request corrected application from broker' },
        { id: 'opt3', label: 'Option 3', description: 'Require corrected application + endorsement before quoting' },
        { id: 'opt4', label: 'Option 4', description: 'Decline to quote; material misrepresentation protocol' }
      ],
      artifacts: [
        { id: 'mspx-s8-hitl-report', type: 'file', label: 'HITL Exception Report', pdfPath: '/data/12_hitl_exception_report_mspx.pdf' },
        {
          id: 'mspx-s8-decision',
          type: 'decision',
          label: 'Underwriter Decision Required',
          options: [
            { id: 'opt1', label: 'Option 1 — Proceed as submitted (no action on Q6.3)', signal: 'underwriter_decision_opt1' },
            { id: 'opt2', label: '[RECOMMENDED] Option 2 — Hold; request corrected application from broker', signal: 'underwriter_decision' },
            { id: 'opt3', label: 'Option 3 — Require corrected application + endorsement before quoting', signal: 'underwriter_decision_opt3' },
            { id: 'opt4', label: 'Option 4 — Decline to quote; material misrepresentation protocol', signal: 'underwriter_decision_opt4' }
          ]
        }
      ]
  });

  await updateProcess(PROCESS_ID, 'Needs Attention', 'Awaiting underwriter decision — undisclosed known circumstance');
  console.log('Step 8 pending — waiting for underwriter_decision signal...');

  await waitForSignal('underwriter_decision');

  // ── STEP 8 REPLACE (post-signal) ──
  await addLog({
      step: 8,
      replaceStep: 8,
      status: 'complete',
      title: 'HITL Exception: Undisclosed Known Circumstance',
      reasoning: [
        'David Chen selected Option 2: Hold; request corrected application from broker',
        'Exception notification sent to Jennifer Park / Willis Towers Watson Chicago at 10:52 AM',
        'Broker response received same day — inadvertent omission confirmed, corrected application committed for March 13',
        'SOP EO-EXCEPTION-001 created: Acquisition Court Records Check — applied to all future E&O and D&O submissions',
        'New rule: any submission with 8-K acquisition disclosure triggers automatic CourtListener verification of acquired entity before Q6 review',
        'Exception resolved — processing resumed; corrected application expected by 09:00 AM March 13, 2025'
      ],
      artifacts: [
        { id: 'mspx-s8-hitl-report', type: 'file', label: 'HITL Exception Report', pdfPath: '/data/12_hitl_exception_report_mspx.pdf' }
      ]
  });

  await sleep(1200);
  console.log('Step 8 replaced — running Steps 9-14...');

  // ── STEP 9: Broker Response & Corrected Application ──
  await addLog({
      step: 9,
      status: 'complete',
      title: 'Broker Response & Corrected Application Received',
      reasoning: [
        'Jennifer Park / Willis Towers Watson responded same day (March 12, 2025 14:17 PM)',
        'Confirmed: Q6.3 NO answer was inadvertent oversight — GC completed application pre-acquisition, did not revisit litigation section after March 5 closing',
        'Broker confirmed: Hartwell v. Bridgepoint is Markel-covered matter, predates acquisition, no bearing on Meridian operations',
        'Corrected ML Application received March 13, 2025 at 08:45 AM — Q6.3 corrected to YES with Bridgepoint/Hartwell detail',
        'Corrected application executed by Robert Okafor, General Counsel, Meridian Strategy Partners',
        'Application integrity restored — Hartwell claim documented, exclusion endorsement path confirmed'
      ],
      artifacts: [
        { id: 'mspx-s9-corrected-app', type: 'file', label: 'Corrected ML Application — E&O', pdfPath: '/data/14_ml_application_eo_corrected.pdf' },
        {
          id: 'mspx-s9-broker-confirm',
          type: 'email_draft',
          label: 'Broker Confirmation — Jennifer Park',
          data: {
            from: 'jennifer.park@wtwco.com',
            to: 'david.chen@chubb.com',
            subject: 'RE: Meridian Strategy Partners — E&O Renewal — Application Clarification',
            isIncoming: true,
            isSent: false,
            body: `David,\n\nThanks for the quick flag — you're right, and I appreciate you catching this.\n\nTo confirm: the NO answer on Question 6.3 was an inadvertent oversight. Meridian's GC, Robert Okafor, had substantially completed the application before the Bridgepoint closing on March 5 and did not revisit the litigation disclosure section after the acquisition closed. It was a process gap on our end, not intentional non-disclosure.\n\nTo be clear on the Bridgepoint matter: Hartwell Manufacturing Group filed an action against Bridgepoint Advisory LLC in Cook County Circuit Court in July 2024 (Case No. 2024-L-008471) — a professional negligence claim related to a supply chain project from 2022-2023. Bridgepoint's prior E&O carrier, Markel, is defending the matter under their policy. The claim predates the acquisition and is entirely a Markel-covered matter. It has no bearing on Meridian's operations and should not impact Chubb's exposure.\n\nI will have Robert re-execute the application with Q6.3 corrected to YES and the Bridgepoint/Hartwell detail included. You'll have the corrected application by tomorrow morning (March 13).\n\nAgain — we appreciate the thorough review and the professional way you raised this. The Meridian team is a long-term Chubb relationship and we want to keep the file clean.\n\nBest,\nJennifer\n\n--\nJennifer Park\nManaging Director, Financial & Executive Risk\nWillis Towers Watson\n233 South Wacker Drive, Suite 8100\nChicago, IL 60606\nDirect: +1 312 201 7744\njennifer.park@wtwco.com`
          }
        }
      ]
  });

  await sleep(1500);

  // ── STEP 10: Structured Data Extraction & System Population ──
  await addLog({
      step: 10,
      status: 'complete',
      title: 'Structured Data Extraction & System Population',
      reasoning: [
        'Corrected ML Application processed — 52 structured fields extracted and mapped to PAS schema',
        'Named insured: Meridian Strategy Partners, Inc. | NASDAQ: MSPX | FEIN: 36-4891723',
        'Combined revenue post-acquisition: $443M ($412M Meridian + $31M Bridgepoint annualized)',
        'Combined headcount: 1,940 (1,820 + 120 Bridgepoint)',
        'Known circumstance tag applied: Bridgepoint Advisory LLC / Hartwell Manufacturing Group / Cook County 2024-L-008471',
        'PAS record CHB-EO-MSPX-2025 created and populated — all 52 fields complete',
        'E&O Rating Tool: initial data load complete — combined revenue and headcount reflect post-acquisition entity'
      ],
      artifacts: [
        { id: 'mspx-s10-pas-pop-video', type: 'video', label: 'PAS Population Recording', videoPath: '/data/PAS_Population_MSPX_Recording.mp4' },
        { id: 'mspx-s10-rating-input-video', type: 'video', label: 'Rating Tool Input Recording', videoPath: '/data/Rating_Tool_Input_MSPX_Recording.mp4' }
      ]
  });

  await sleep(1500);

  // ── STEP 11: Financial Analysis ──
  await addLog({
      step: 11,
      status: 'complete',
      title: 'Financial Analysis',
      reasoning: [
        'Audited financial statements reviewed: FY2022, FY2023, FY2024 (PwC audit opinion — unqualified)',
        'Revenue: $412M FY2024 (+14% YoY from $361M); NI: $38.4M (9.3% net margin)',
        'Balance sheet: clean — no going concern, no material contingent liabilities outside disclosed litigation',
        'Bridgepoint acquisition: $28M all-cash, no debt financing — absorbed from existing liquidity',
        'Pro forma post-acquisition revenue: ~$443M; no financial stress indicators',
        'Financial health score: 87/100 — strong, well above Chubb E&O underwriting threshold of 65'
      ],
      artifacts: [
        { id: 'mspx-s11-financial', type: 'file', label: 'Financial Analysis Report', pdfPath: '/data/18_financial_analysis_mspx.pdf' }
      ]
  });

  await sleep(1500);

  // ── STEP 12: Loss Run Analysis ──
  await addLog({
      step: 12,
      status: 'complete',
      title: 'Loss Run Analysis',
      reasoning: [
        'Five-year loss history confirmed: AIG 2020–2022 (2 periods) + Chubb 2022–2025 (3 periods)',
        'E&O claims across all periods: 0 — zero claims, zero reserves, zero incidents',
        'One EPL claim in AIG period (2020): employment practices matter, closed $0 indemnity — does not affect E&O pricing',
        'Bridgepoint loss history: Markel policy, 1 active claim (Hartwell) — excluded from Meridian renewal scope',
        'Chubb loss run cross-referenced with Step 4 clearance data — consistent, no discrepancies',
        'Loss run analysis conclusion: 5-year E&O loss ratio = 0.0% — supports favorable renewal terms'
      ],
      artifacts: [
        { id: 'mspx-s12-loss-analysis', type: 'file', label: 'Loss Run Analysis Report', pdfPath: '/data/19_loss_run_analysis_mspx.pdf' },
        { id: 'mspx-s12-chubb-crossref', type: 'file', label: 'Chubb Loss Run — MSPX (Cross-Reference)', pdfPath: '/data/04_loss_run_chubb_mspx.pdf' }
      ]
  });

  await sleep(1500);

  // ── STEP 13: Appetite Triage & Routing Decision ──
  await addLog({
      step: 13,
      status: 'complete',
      title: 'Appetite Triage & Routing Decision',
      reasoning: [
        'Triage model applied: management consulting, $443M revenue, Professions E&O — within Chubb Financial Lines appetite',
        'Exception resolved: Hartwell/Bridgepoint excluded by endorsement — Markel-covered, no Chubb exposure',
        'Financial score 87/100, 5-year E&O loss ratio 0.0%, incumbent carrier in good standing',
        'Bridgepoint acquisition increases exposure base modestly — reflected in 3.1% premium increase ($224K to $231K)',
        'Triage decision: PROCEED TO CONDITIONAL QUOTE — Hartwell exclusion endorsement required at binding',
        'Underwriter notification sent: David Chen alerted, draft quote letter ready for review and approval'
      ],
      artifacts: [
        { id: 'mspx-s13-appetite', type: 'file', label: 'Appetite Triage Evaluation', pdfPath: '/data/20_appetite_triage_mspx.pdf' },
        {
          id: 'mspx-s13-uw-notify',
          type: 'email_draft',
          label: 'Ready for Review — Underwriter Notification',
          data: {
            from: 'notifications@pace.ai',
            to: 'david.chen@chubb.com',
            subject: 'Ready for Review — Meridian Strategy Partners E&O Renewal | Case EO-2025-0312-MSPX-PL-0017',
            isIncoming: false,
            isSent: true,
            body: `SUBMISSION READY FOR REVIEW\n\nCase:    EO-2025-0312-MSPX-PL-0017\nInsured: Meridian Strategy Partners, Inc. (NASDAQ: MSPX)\nLine:    Professional Liability — E&O Renewal | Eff. May 1, 2025\nBroker:  Jennifer Park, Willis Towers Watson Chicago | Deadline: March 28\n\nEXCEPTION RESOLVED\nCorrected ML Application received March 13, 2025 at 08:45 AM.\nQ6.3 corrected to YES — Bridgepoint Advisory LLC / Hartwell Manufacturing Group / Cook County 2024-L-008471 / Markel-covered / excluded from Chubb scope.\nSOP EO-EXCEPTION-001 applied to all future E&O and D&O submissions.\n\nSUMMARY\n\n  Financial:   Revenue $412M (+14% YoY) | NI $38.4M | Audited FY2022-24\n               Clean balance sheet | No going concern | PwC audit opinion\n  Loss hist:   0 E&O claims all periods | 1 EPL claim 2020 (AIG, closed)\n  Exception:   Bridgepoint/Hartwell excluded by endorsement (Markel-covered)\n  Triage:      PROCEED TO CONDITIONAL QUOTE\n  Premium:     $231,000 (+3.1% vs. prior $224,000)\n  Condition:   Bridgepoint Advisory LLC / Hartwell exclusion endorsement required\n\nACTION REQUIRED\nDraft quote letter ready for review. Review, edit if needed, and approve to send. Pace will not send until you approve.\n\n  Draft quote letter: [MSPX_EO_2025_DRAFT_QuoteLetter_v1.pdf]\n  Full case file:     https://pace.chubb.internal/cases/EO-2025-0312-MSPX-PL-0017\n  PAS record:         [CHB-EO-MSPX-2025 in PAS]\n\nPace processing time: 9 min 48 sec\n\nPace Smart Commercial Underwriting | Chubb North America Financial Lines`
          }
        }
      ]
  });

  await sleep(1500);

  // ── STEP 14: Quote Letter Generated (pre-signal, pending) ──
  await addLog({
      step: 14,
      status: 'pending',
      title: 'Quote Letter Generated & Queued for Underwriter Approval',
      reasoning: [
        'Draft quote letter generated: $231,000 premium (+3.1% vs. prior $224,000)',
        'Terms: $15M primary E&O limit, $500,000 retention, ForeFront Portfolio Management Liability form',
        'Condition: Bridgepoint Advisory LLC / Hartwell Manufacturing Group exclusion endorsement required at binding',
        'Rating Tool final output recorded — combined entity pricing reflects post-acquisition exposure base',
        'Quote letter queued for David Chen review and approval — Pace will not transmit until approved',
        'Awaiting underwriter approval to release quote to Jennifer Park / Willis Towers Watson Chicago'
      ],
      artifacts: [
        { id: 'mspx-s14-rating-final-video', type: 'video', label: 'Rating Tool Final Output Recording', videoPath: '/data/Rating_Tool_Final_MSPX_Recording.mp4' },
        { id: 'mspx-s14-draft-quote', type: 'file', label: 'Draft Quote Letter', pdfPath: '/data/23_draft_quote_letter_mspx.pdf' }
      ]
  });

  await updateProcess(PROCESS_ID, 'Needs Attention', 'Awaiting underwriter approval — quote ready for release');
  console.log('Step 14 pending — waiting for quote_approved signal...');

  await waitForSignal('quote_approved');

  // ── STEP 14 REPLACE (post quote_approved signal) ──
  await addLog({
      step: 14,
      replaceStep: 14,
      status: 'complete',
      title: 'Quote Letter Generated & Queued for Underwriter Approval',
      reasoning: [
        'David Chen reviewed and approved draft quote letter — March 13, 2025 11:34 AM',
        'Quote letter transmitted to Jennifer Park / Willis Towers Watson Chicago',
        'CC: Robert Okafor, General Counsel, Meridian Strategy Partners',
        'Terms confirmed: $231,000 premium, $15M limit, $500K retention, Hartwell exclusion endorsement included',
        'Corrected application on file — Q6.3 corrected, paper trail complete',
        'Case EO-2025-0312-MSPX-PL-0017 complete — quote issued, binding subject to endorsement execution'
      ],
      artifacts: [
        { id: 'mspx-s14-rating-final-video', type: 'video', label: 'Rating Tool Final Output Recording', videoPath: '/data/Rating_Tool_Final_MSPX_Recording.mp4' },
        { id: 'mspx-s14-draft-quote', type: 'file', label: 'Draft Quote Letter', pdfPath: '/data/23_draft_quote_letter_mspx.pdf' },
        {
          id: 'mspx-s14-quote-issued',
          type: 'email_draft',
          label: 'Quote Issued — Jennifer Park',
          data: {
            from: 'david.chen@chubb.com',
            to: 'jennifer.park@wtwco.com',
            subject: 'Meridian Strategy Partners, Inc. — E&O Renewal Quotation — Eff. 5/1/2025',
            isIncoming: false,
            isSent: true,
            body: `Jennifer,\n\nPlease find attached Chubb's renewal quotation for Meridian Strategy Partners, Inc., Professional Liability — Errors & Omissions, effective May 1, 2025.\n\nWe are pleased to offer renewal of the existing program. I have reflected the updated exposure base following the Bridgepoint Advisory LLC acquisition and included an endorsement addressing the Hartwell matter as discussed. The corrected application is on file.\n\nAs always, please call if you'd like to walk through the terms.\n\nBest,\nDavid\n\n--\nDavid Chen\nSenior Underwriter, Professions E&O\nChubb North America Financial Lines\n525 West Monroe Street, Chicago, IL 60661\nDirect: +1 312 894 3307\ndavid.chen@chubb.com`
          }
        }
      ]
  });

  await updateProcess(PROCESS_ID, 'Complete', 'Quote issued — binding subject to Hartwell exclusion endorsement');
  console.log('Case 2 complete — all 14 steps done, quote issued.');
}

run().catch(e => { console.error('Sim error:', e); process.exit(1); });
