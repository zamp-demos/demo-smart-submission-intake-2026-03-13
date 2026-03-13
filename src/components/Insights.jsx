import React, { useState } from 'react';
import {
    ChevronDown, ChevronRight, CheckCircle2, Edit3, X, Save,
    ListOrdered, Layers, User, FileText, TrendingUp, Lightbulb, Clock,
} from 'lucide-react';

// ─── Data ────────────────────────────────────────────────────────────────────

const INSIGHTS_DATA = [
  {
    id: 'INS-CHUBB-001',
    status: 'Pending Approval',
    severity: 'high',
    direction: 'Submissions → Triage',
    category: 'Underwriting Risk',
    title: 'Financial institution submissions lacking FDIC enforcement history are being triaged as standard risk — three active consent orders missed in Q1 2025',
    description: 'Pace identified three submissions in Q1 2025 where FDIC enforcement records — including active consent orders and formal agreements — were present in public FDIC data but not surfaced during triage. All three were initially scored as standard risk and routed to standard underwriting queues. Two resulted in mid-process referrals after the underwriter independently discovered the enforcement history, adding an average of 11 days to the submission cycle.',
    steps: [
      'Add FDIC enforcement database lookup as a mandatory triage step for all financial institution submissions',
      'Flag any submission with an active consent order, formal agreement, or MOU as High Risk at point of intake',
      'Auto-route flagged submissions to senior underwriter queue with enforcement record attached',
      'Require underwriter to document disposition of enforcement history before advancing to quote stage',
      'Update appetite triage criteria to include regulatory enforcement status as a standalone scoring dimension',
      'Set 5-year lookback window for resolved enforcement actions — flag as Medium Risk if resolved within 36 months',
    ],
    pattern: [
      { label: 'Current Process', value: 'FDIC enforcement data not queried at triage. Risk score derived from application data and financial statements only.' },
      { label: 'Change Type', value: 'Underwriting Risk: Submissions → Triage' },
      { label: 'Ingestion Rule', value: 'Query FDIC enforcement database at intake; flag active orders as High Risk; attach record to submission before underwriter routing' },
      { label: 'Direction', value: 'Submissions → Triage' },
    ],
    profile: [
      { label: 'Submissions Reviewed', value: '47 FI submissions (Q1 2025)' },
      { label: 'Missed Flags', value: '3 active consent orders (6.4%)' },
      { label: 'Avg Cycle Delay', value: '11 days per late-discovered case' },
      { label: 'Re-route Rate', value: '2 of 3 required mid-process referral' },
    ],
    evidence: [
      { label: 'Example', value: 'Pinnacle Community Bancorp — FDIC consent order active since Dec 2024, not surfaced at triage; discovered by underwriter on Day 9' },
      { label: 'Root Cause', value: 'FDIC enforcement lookup not integrated into triage workflow; no automated public data enrichment at intake' },
      { label: 'Test Result', value: 'Retrospective check of Q1 2025 FI submissions: 3 of 47 had active enforcement records present in FDIC public data at submission date' },
      { label: 'Trigger Case', value: 'INS-CHUBB-001 — Q1 2025 FI submission cohort analysis, Chubb Pinnacle D&O review' },
    ],
    impact: [
      { label: 'Financial Impact', value: '$340K/year in avoided mid-process referral costs' },
      { label: 'Scope', value: 'All financial institution D&O submissions' },
      { label: 'Risk Level', value: 'High — active enforcement orders represent material coverage risk' },
      { label: 'Projected Benefit', value: 'Cycle time reduction from 18 days → 7 days on flagged submissions' },
    ],
    recommendation: 'Integrate FDIC enforcement database lookup as a mandatory first step in the FI submission triage workflow. Any submission with an active consent order, formal agreement, or MOU must be automatically flagged as High Risk and routed to a senior underwriter with the enforcement record pre-attached. This eliminates the current blind spot where enforcement history is only discovered mid-process, adding unnecessary cycle time and underwriter rework.',
  },
  {
    id: 'INS-CHUBB-002',
    status: 'Pending Approval',
    severity: 'high',
    direction: 'Loss History → Underwriting',
    category: 'Coverage Accuracy',
    title: 'Known circumstances disclosed in prior loss runs are not being cross-referenced against new application representations — coverage disputes emerging at claims stage',
    description: 'Pace cross-referenced loss run data from the prior policy period against representations made in current ML applications for 12 E&O renewals in Q4 2024. In 4 cases, circumstances disclosed as "known" in the expiring policy loss run were not reflected in the new application\'s known circumstances disclosure. Three of these cases have since generated coverage disputes at the claims stage, with insureds asserting no known circumstances at time of binding.',
    steps: [
      'Build a structured known circumstances registry from all loss run data at point of submission intake',
      'Cross-reference registry against new application known circumstances disclosures before binding',
      'Flag any discrepancy where a prior loss run lists a known circumstance absent from the new application',
      'Route flagged submissions to underwriter with side-by-side comparison of prior loss run and new application representations',
      'Require underwriter sign-off on known circumstances reconciliation before policy issuance',
      'Retain reconciliation documentation in case file for claims reference',
    ],
    pattern: [
      { label: 'Current Process', value: 'Loss run review and application review conducted independently. No automated cross-reference for known circumstances continuity.' },
      { label: 'Change Type', value: 'Coverage Accuracy: Loss History → Underwriting' },
      { label: 'Ingestion Rule', value: 'Extract known circumstances from prior loss run at intake; flag discrepancies vs. new application before advancing to bind' },
      { label: 'Direction', value: 'Loss History → Underwriting' },
    ],
    profile: [
      { label: 'Renewals Reviewed', value: '12 E&O renewals (Q4 2024)' },
      { label: 'Discrepancies Found', value: '4 cases (33%)' },
      { label: 'Claims Disputes', value: '3 of 4 flagged cases' },
      { label: 'Avg Dispute Value', value: '$2.1M per disputed claim' },
    ],
    evidence: [
      { label: 'Example', value: 'Meridian Strategy Partners — prior loss run listed SEC inquiry as known circumstance; new application did not disclose; coverage dispute filed Q1 2025' },
      { label: 'Root Cause', value: 'Loss run review and application underwriting handled by different teams with no shared data layer or cross-reference protocol' },
      { label: 'Test Result', value: '4 of 12 E&O renewals had known circumstances present in prior loss run but absent from new application — 33% discrepancy rate' },
      { label: 'Trigger Case', value: 'INS-CHUBB-002 — Q4 2024 E&O renewal cohort, Meridian Strategy Partners cross-reference analysis' },
    ],
    impact: [
      { label: 'Financial Impact', value: '$6.3M in active coverage disputes attributable to known circumstances gap' },
      { label: 'Scope', value: 'All E&O and D&O renewals with prior loss history' },
      { label: 'Risk Level', value: 'High — coverage disputes at claims stage represent direct loss exposure' },
      { label: 'Projected Benefit', value: 'Eliminate known circumstances discrepancy as a source of coverage disputes at bind' },
    ],
    recommendation: 'Implement a structured known circumstances cross-reference step at renewal intake. Prior loss run data must be parsed for disclosed circumstances and compared against new application representations before any renewal advances to bind. Where discrepancies exist, the underwriter must review and reconcile the record with the insured before issuance — preserving Chubb\'s coverage position and eliminating a recurring source of claims-stage disputes.',
  },
  {
    id: 'INS-CHUBB-003',
    status: 'Pending Approval',
    severity: 'medium',
    direction: 'Triage → Quote',
    category: 'Process Efficiency',
    title: 'Appetite triage is re-evaluating submissions already cleared by automated EDGAR and FDIC checks — underwriter time spent re-confirming data Pace has already verified',
    description: 'Pace reviewed 31 D&O and E&O submissions from Q4 2024 through Q1 2025 where automated EDGAR verification and FDIC enforcement checks returned clean results. In 26 of these cases, the assigned underwriter independently re-ran equivalent public data lookups — repeating work already completed by the automated triage layer. The average redundant research time per submission was 47 minutes, representing approximately 20 underwriter-hours per quarter spent re-confirming data that Pace had already verified and attached to the case file.',
    steps: [
      'Surface Pace verification outputs directly in the underwriter queue view — EDGAR status, FDIC enforcement result, and financial cross-reference summary visible before case is opened',
      'Add a "Pace Verified" indicator to submissions where automated checks returned clean results',
      'Define a protocol where underwriters accept Pace verification for standard public data sources without re-running',
      'Limit manual re-verification to cases flagged by Pace as requiring human review or where data was unavailable',
      'Track underwriter re-verification rate quarterly and report as a process efficiency metric',
    ],
    pattern: [
      { label: 'Current Process', value: 'Automated Pace verification outputs stored in case file but not prominently surfaced. Underwriters default to independent lookup regardless of prior automated check.' },
      { label: 'Change Type', value: 'Process Efficiency: Triage → Quote' },
      { label: 'Ingestion Rule', value: 'Display Pace verification summary at top of underwriter queue card; mark as Pace Verified; remove from standard underwriter public data checklist' },
      { label: 'Direction', value: 'Triage → Quote' },
    ],
    profile: [
      { label: 'Submissions Reviewed', value: '31 D&O/E&O submissions (Q4 2024–Q1 2025)' },
      { label: 'Redundant Re-checks', value: '26 of 31 (84%)' },
      { label: 'Avg Redundant Time', value: '47 minutes per submission' },
      { label: 'Quarterly Impact', value: '~20 underwriter-hours wasted per quarter' },
    ],
    evidence: [
      { label: 'Example', value: 'Pinnacle Community Bancorp submission — EDGAR verification and FDIC check both completed by Pace at triage; underwriter re-ran both on Day 2, adding 52 minutes' },
      { label: 'Root Cause', value: 'Pace verification results not visually prominent in underwriter workflow; no protocol distinguishing Pace-verified vs. unverified data sources' },
      { label: 'Test Result', value: '84% of submissions with clean Pace verification still triggered manual underwriter re-check; average 47 min per redundant check' },
      { label: 'Trigger Case', value: 'INS-CHUBB-003 — Q4 2024–Q1 2025 underwriter workflow efficiency audit, Chubb D&O/E&O portfolio' },
    ],
    impact: [
      { label: 'Financial Impact', value: '$28K/year in recoverable underwriter time (at loaded rate)' },
      { label: 'Scope', value: 'All D&O and E&O submissions with automated Pace triage' },
      { label: 'Risk Level', value: 'Medium — efficiency loss, no direct coverage risk' },
      { label: 'Projected Benefit', value: '20 underwriter-hours/quarter redirected to judgment-intensive review work' },
    ],
    recommendation: 'Surface Pace verification outputs prominently in the underwriter queue — not buried in the case file — and establish a clear protocol that Pace-verified public data sources do not require manual re-confirmation. Reserve underwriter research time for cases flagged by Pace as requiring human judgment. This recovers approximately 20 hours per quarter currently spent re-confirming data that has already been verified, validated, and attached to the submission.',
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const statusStyle = (s) => s === 'Approved'
  ? { background: '#dcfce7', color: '#166534', border: '1px solid #bbf7d0' }
  : { background: '#fef9ee', color: '#b45309', border: '1px solid #fde68a' };

const severityStyle = (s) => s === 'high'
  ? { background: '#fee2e2', color: '#991b1b', border: '1px solid #fecaca' }
  : { background: '#fef3c7', color: '#92400e', border: '1px solid #fde68a' };

const directionStyle = () => ({ background: '#ede9fe', color: '#5b21b6', border: '1px solid #ddd6fe' });

// ─── Section Header ────────────────────────────────────────────────────────────

const SectionHeader = ({ icon: Icon, label, iconColor }) => (
  <div style={{ borderTop: '1px solid #f3f4f6', paddingTop: 20, marginTop: 20 }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
      <Icon size={14} color={iconColor || '#9ca3af'} />
      <span style={{
        fontSize: 11, fontWeight: 700, color: '#9ca3af',
        letterSpacing: '0.1em', textTransform: 'uppercase',
        fontFamily: 'Inter, sans-serif',
      }}>
        {label}
      </span>
    </div>
  </div>
);

// ─── KV 2x2 Grid ──────────────────────────────────────────────────────────────

const KV2x2 = ({ rows, editing, editValues, onEdit }) => (
  <div>
    {Array.from({ length: Math.ceil(rows.length / 2) }, (_, ri) => {
      const left = rows[ri * 2];
      const right = rows[ri * 2 + 1];
      return (
        <div key={ri} style={{
          display: 'grid', gridTemplateColumns: '140px 1fr 140px 1fr',
          gap: 0, borderBottom: '1px solid #f9fafb',
          alignItems: 'start',
        }}>
          <div style={{ fontSize: 12, color: '#9ca3af', fontWeight: 500, padding: '12px 12px 12px 0', fontFamily: 'Inter, sans-serif' }}>
            {left.label}
          </div>
          <div style={{ fontSize: 13, color: '#111827', fontWeight: 600, padding: '12px 24px 12px 0', fontFamily: 'Inter, sans-serif', lineHeight: 1.5 }}>
            {editing ? (
              <textarea
                value={(editValues && editValues[ri * 2]) || left.value}
                onChange={e => onEdit && onEdit(ri * 2, e.target.value)}
                style={{ width: '100%', padding: 6, borderRadius: 6, border: '1px solid #d1d5db', fontSize: 12, fontFamily: 'Inter, sans-serif', resize: 'vertical', minHeight: 48, color: '#111827' }}
              />
            ) : left.value}
          </div>
          {right ? (
            <>
              <div style={{ fontSize: 12, color: '#9ca3af', fontWeight: 500, padding: '12px 12px 12px 0', fontFamily: 'Inter, sans-serif' }}>
                {right.label}
              </div>
              <div style={{ fontSize: 13, color: '#111827', fontWeight: 600, padding: '12px 0 12px 0', textAlign: 'right', fontFamily: 'Inter, sans-serif', lineHeight: 1.5 }}>
                {editing ? (
                  <textarea
                    value={(editValues && editValues[ri * 2 + 1]) || right.value}
                    onChange={e => onEdit && onEdit(ri * 2 + 1, e.target.value)}
                    style={{ width: '100%', padding: 6, borderRadius: 6, border: '1px solid #d1d5db', fontSize: 12, fontFamily: 'Inter, sans-serif', resize: 'vertical', minHeight: 48, textAlign: 'right', color: '#111827' }}
                  />
                ) : right.value}
              </div>
            </>
          ) : <div style={{ gridColumn: 'span 2' }} />}
        </div>
      );
    })}
  </div>
);

// ─── InsightCard ──────────────────────────────────────────────────────────────

const InsightCard = ({ insight, onApprove }) => {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState({
    description: insight.description,
    steps: [...insight.steps],
    recommendation: insight.recommendation,
    pattern: insight.pattern.map(r => r.value),
    profile: insight.profile.map(r => r.value),
    evidence: insight.evidence.map(r => r.value),
    impact: insight.impact.map(r => r.value),
  });

  const isApproved = insight.status === 'Approved';

  const handleApproveClick = (e) => { e.stopPropagation(); onApprove(insight.id); };
  const handleEditClick = (e) => { e.stopPropagation(); setEditing(true); };
  const handleSave = (e) => { e.stopPropagation(); setEditing(false); };
  const handleCancel = (e) => {
    e.stopPropagation();
    setEditData({
      description: insight.description,
      steps: [...insight.steps],
      recommendation: insight.recommendation,
      pattern: insight.pattern.map(r => r.value),
      profile: insight.profile.map(r => r.value),
      evidence: insight.evidence.map(r => r.value),
      impact: insight.impact.map(r => r.value),
    });
    setEditing(false);
  };

  return (
    <div style={{
      background: '#fff',
      borderRadius: 16,
      border: '1px solid #f3f4f6',
      boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
      marginBottom: 16,
      overflow: 'hidden',
      fontFamily: 'Inter, sans-serif',
    }}>
      {/* ── Collapsed header ── */}
      <div
        onClick={() => !editing && setExpanded(!expanded)}
        style={{ padding: '24px 24px 0 24px', cursor: editing ? 'default' : 'pointer', userSelect: 'none' }}
      >
        {/* Top row: ID + status + edit button + chevron */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <span style={{ fontSize: 12, color: '#9ca3af', fontWeight: 500, fontFamily: '"SF Mono", monospace' }}>
            {insight.id}
          </span>
          <span style={{
            fontSize: 12, fontWeight: 600, padding: '3px 12px',
            borderRadius: 20, display: 'inline-flex', alignItems: 'center', gap: 6,
            ...statusStyle(insight.status),
          }}>
            <Clock size={11} />
            {insight.status}
          </span>
          <div style={{ flex: 1 }} />
          {expanded && !isApproved && (
            <button
              onClick={handleEditClick}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                padding: '4px 12px', borderRadius: 8,
                border: '1px solid #e5e7eb', background: '#fff',
                color: '#6b7280', fontSize: 12, fontWeight: 500,
                cursor: 'pointer', fontFamily: 'Inter, sans-serif',
              }}
            >
              <Edit3 size={12} /> Edit
            </button>
          )}
          <div style={{ color: '#9ca3af' }}>
            {expanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
          </div>
        </div>

        {/* Pills row */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
          <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20, ...severityStyle(insight.severity) }}>
            {insight.severity === 'high' ? 'High Severity' : 'Medium Severity'}
          </span>
          <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20, background: '#1f2937', color: '#f9fafb', border: '1px solid #374151' }}>
            {insight.category}
          </span>
          <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20, ...directionStyle() }}>
            {insight.direction}
          </span>
        </div>

        {/* Title */}
        <div style={{ fontSize: 15, fontWeight: 700, color: '#111827', lineHeight: 1.45, marginBottom: 10, fontFamily: 'Inter, sans-serif' }}>
          {insight.title}
        </div>

        {/* Description (truncated when collapsed) */}
        <div style={{
          fontSize: 13, color: '#6b7280', lineHeight: 1.6,
          marginBottom: 20,
          display: '-webkit-box', WebkitLineClamp: expanded ? 'unset' : 2,
          WebkitBoxOrient: 'vertical', overflow: expanded ? 'visible' : 'hidden',
          fontFamily: 'Inter, sans-serif',
        }}>
          {editing ? (
            <textarea
              value={editData.description}
              onChange={e => setEditData(d => ({ ...d, description: e.target.value }))}
              onClick={e => e.stopPropagation()}
              style={{ width: '100%', padding: 8, borderRadius: 8, border: '1px solid #d1d5db', fontSize: 13, fontFamily: 'Inter, sans-serif', resize: 'vertical', minHeight: 80, color: '#374151' }}
            />
          ) : insight.description}
        </div>
      </div>

      {/* ── Expanded body ── */}
      {expanded && (
        <div style={{ padding: '0 24px 24px 24px' }}>

          {/* Steps */}
          <SectionHeader icon={ListOrdered} label="Recommended Steps" iconColor="#6366f1" />
          {editing ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {editData.steps.map((s, i) => (
                <textarea key={i} value={s}
                  onChange={e => {
                    const arr = [...editData.steps];
                    arr[i] = e.target.value;
                    setEditData(d => ({ ...d, steps: arr }));
                  }}
                  style={{ width: '100%', padding: 8, borderRadius: 8, border: '1px solid #d1d5db', fontSize: 13, fontFamily: 'Inter, sans-serif', resize: 'vertical', minHeight: 48, color: '#374151' }}
                />
              ))}
            </div>
          ) : (
            <ol style={{ margin: 0, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {insight.steps.map((s, i) => (
                <li key={i} style={{ fontSize: 13, color: '#374151', lineHeight: 1.6, fontFamily: 'Inter, sans-serif' }}>{s}</li>
              ))}
            </ol>
          )}

          {/* Pattern */}
          <SectionHeader icon={Layers} label="Pattern" iconColor="#8b5cf6" />
          <KV2x2
            rows={insight.pattern}
            editing={editing}
            editValues={editData.pattern}
            onEdit={(i, v) => { const arr = [...editData.pattern]; arr[i] = v; setEditData(d => ({ ...d, pattern: arr })); }}
          />

          {/* Profile */}
          <SectionHeader icon={User} label="Profile" iconColor="#0ea5e9" />
          <KV2x2
            rows={insight.profile}
            editing={editing}
            editValues={editData.profile}
            onEdit={(i, v) => { const arr = [...editData.profile]; arr[i] = v; setEditData(d => ({ ...d, profile: arr })); }}
          />

          {/* Evidence */}
          <SectionHeader icon={FileText} label="Evidence" iconColor="#f59e0b" />
          <KV2x2
            rows={insight.evidence}
            editing={editing}
            editValues={editData.evidence}
            onEdit={(i, v) => { const arr = [...editData.evidence]; arr[i] = v; setEditData(d => ({ ...d, evidence: arr })); }}
          />

          {/* Impact */}
          <SectionHeader icon={TrendingUp} label="Impact" iconColor="#ef4444" />
          <KV2x2
            rows={insight.impact}
            editing={editing}
            editValues={editData.impact}
            onEdit={(i, v) => { const arr = [...editData.impact]; arr[i] = v; setEditData(d => ({ ...d, impact: arr })); }}
          />

          {/* Recommendation */}
          <SectionHeader icon={Lightbulb} label="Recommendation" iconColor="#10b981" />
          {editing ? (
            <textarea
              value={editData.recommendation}
              onChange={e => setEditData(d => ({ ...d, recommendation: e.target.value }))}
              style={{ width: '100%', padding: 8, borderRadius: 8, border: '1px solid #d1d5db', fontSize: 13, fontFamily: 'Inter, sans-serif', resize: 'vertical', minHeight: 80, color: '#374151' }}
            />
          ) : (
            <p style={{ fontSize: 13, color: '#374151', lineHeight: 1.7, margin: 0, fontFamily: 'Inter, sans-serif' }}>
              {insight.recommendation}
            </p>
          )}

          {/* Footer */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 28, borderTop: '1px solid #f3f4f6', paddingTop: 20 }}>
            {editing ? (
              <>
                <button onClick={handleCancel} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 18px', borderRadius: 8, border: '1px solid #e5e7eb', background: '#fff', color: '#6b7280', fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
                  <X size={14} /> Cancel
                </button>
                <button onClick={handleSave} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 18px', borderRadius: 8, border: 'none', background: '#111827', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
                  <Save size={14} /> Save Changes
                </button>
              </>
            ) : isApproved ? (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 18px', borderRadius: 8, background: '#dcfce7', color: '#166534', fontSize: 13, fontWeight: 600, fontFamily: 'Inter, sans-serif' }}>
                <CheckCircle2 size={14} /> Approved
              </div>
            ) : (
              <>
                <button onClick={e => { e.stopPropagation(); }} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 18px', borderRadius: 8, border: '1px solid #fecaca', background: '#fff', color: '#dc2626', fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
                  <X size={14} /> Reject
                </button>
                <button onClick={handleApproveClick} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 18px', borderRadius: 8, border: 'none', background: '#111827', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
                  <CheckCircle2 size={14} /> Approve &amp; Update KB
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Main Insights Component ──────────────────────────────────────────────────

const Insights = () => {
  const [insights, setInsights] = useState(INSIGHTS_DATA);

  const handleApprove = (id) => {
    setInsights(prev => prev.map(ins => ins.id === id ? { ...ins, status: 'Approved' } : ins));
  };

  const total = insights.length;
  const highCount = insights.filter(i => i.severity === 'high').length;
  const pendingCount = insights.filter(i => i.status === 'Pending Approval').length;
  const approvedCount = insights.filter(i => i.status === 'Approved').length;

  return (
    <div style={{ fontFamily: 'Inter, sans-serif', padding: '24px 0 0 0' }}>
      {/* Stats bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 32 }}>
        {[
          { label: 'Total Insights', value: total, bg: '#f9fafb', border: '#e5e7eb', col: '#111827', lc: '#6b7280' },
          { label: 'High Severity', value: highCount, bg: '#fef2f2', border: '#fecaca', col: '#991b1b', lc: '#991b1b' },
          { label: 'Pending Approval', value: pendingCount, bg: '#fefce8', border: '#fde68a', col: '#92400e', lc: '#92400e' },
          { label: 'Approved', value: approvedCount, bg: '#f0fdf4', border: '#bbf7d0', col: '#166534', lc: '#166534' },
        ].map(({ label, value, bg, border, col, lc }) => (
          <div key={label} style={{ background: bg, borderRadius: 10, padding: '14px 18px', border: `1px solid ${border}` }}>
            <div style={{ fontSize: 11, color: lc, textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.05em', marginBottom: 4 }}>{label}</div>
            <div style={{ fontSize: 26, fontWeight: 700, color: col }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Cards */}
      {insights.map(insight => (
        <InsightCard key={insight.id} insight={insight} onApprove={handleApprove} />
      ))}
    </div>
  );
};

export default Insights;
