try { require('dotenv').config(); } catch(e) {}

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3001;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.VITE_MODEL || 'gemini-2.5-flash';

const PUBLIC_DIR = path.join(__dirname, 'public');
const DATA_DIR = path.join(PUBLIC_DIR, 'data');
const KB_PATH = path.join(__dirname, 'src', 'data', 'knowledgeBase.md');
const SNAPSHOTS_DIR = path.join(DATA_DIR, 'snapshots');

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
};

// ── In-memory state (survives Railway's ephemeral filesystem) ──────────────
const INITIAL_PROCESSES = [
    {
        id: "SUB-2025-0310-PCBK-FI-0042",
        caseId: "SUB-2025-0310-PCBK-FI-0042",
        namedInsured: "Pinnacle Community Bancorp, Inc.",
        broker: "Marcus Webb, Gallagher Charlotte",
        underwriter: "Sarah Park — Financial Institutions",
        line: "D&O — Financial Institutions Edition",
        process: "D&O FI Renewal — Regulatory Verification",
        pathway: "Full Regulatory Verification → Financial Analysis → Triage → Quote",
        lastUpdated: "2025-03-10",
        status: "In Progress",
        currentStatus: "Initializing..."
    }
];

let memState = {
    signals: { underwriter_approval: false },
    emailSent: false,
    processes: JSON.parse(JSON.stringify(INITIAL_PROCESSES)),
    processLogs: {
        "SUB-2025-0310-PCBK-FI-0042": { logs: [], keyDetails: {}, sidebarArtifacts: [] }
    },
    feedbackQueue: [],
    kbVersions: []
};


// Ensure snapshots dir exists (static files like PDFs/videos live here)
if (!fs.existsSync(SNAPSHOTS_DIR)) fs.mkdirSync(SNAPSHOTS_DIR, { recursive: true });

const mime = {
    '.html': 'text/html', '.js': 'application/javascript', '.jsx': 'application/javascript',
    '.css': 'text/css', '.json': 'application/json', '.png': 'image/png',
    '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.ico': 'image/x-icon',
    '.pdf': 'application/pdf', '.mp4': 'video/mp4', '.webm': 'video/webm',
    '.eml': 'message/rfc822', '.md': 'text/markdown', '.txt': 'text/plain'
};

async function callGemini(messages, systemPrompt) {
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: GEMINI_MODEL, systemInstruction: systemPrompt });
    const history = messages.slice(0, -1).map(m => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] }));
    const last = messages[messages.length - 1];
    const chat = model.startChat({ history });
    const result = await chat.sendMessage(last.content);
    return result.response.text();
}

function resetMemState() {
    memState.signals = { underwriter_approval: false };
    memState.emailSent = false;
    memState.processes = JSON.parse(JSON.stringify(INITIAL_PROCESSES));
    memState.processLogs = {
        "SUB-2025-0310-PCBK-FI-0042": { logs: [], keyDetails: {}, sidebarArtifacts: [] }
    };
    memState.feedbackQueue = [];
    memState.kbVersions = [];
}

let simRunning = false;

function startSimulation() {
    if (simRunning) {
        console.log('Simulation already running, skipping');
        return;
    }
    console.log('Starting simulation in-process...');
    simRunning = true;
    try {
        // Clear require cache so re-runs work after /reset
        const simPath = require.resolve('./simulation_scripts/pinnacle_submission.cjs');
        delete require.cache[simPath];
        const { runSimulation } = require('./simulation_scripts/pinnacle_submission.cjs');
        runSimulation(PORT).then(() => {
            console.log('Simulation complete');
            simRunning = false;
        }).catch(e => {
            console.error('Simulation error:', e.message);
            simRunning = false;
        });
    } catch(e) {
        console.error('Failed to start simulation:', e.message);
        global.__simLastError = e.message;
        simRunning = false;
    }
}

const server = http.createServer(async (req, res) => {
    const cleanPath = req.url.split('?')[0];

    if (req.method === 'OPTIONS') {
        res.writeHead(204, corsHeaders);
        res.end();
        return;
    }

    // ── RESET ────────────────────────────────────────────────────────────────
    if (cleanPath === '/reset' && req.method === 'GET') {
        resetMemState();
        setTimeout(startSimulation, 500);
        res.writeHead(200, { ...corsHeaders, 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'ok' }));
        return;
    }

    // ── IN-MEMORY: serve processes.json ─────────────────────────────────────
    if (cleanPath === '/data/processes.json' && req.method === 'GET') {
        res.writeHead(200, { ...corsHeaders, 'Content-Type': 'application/json' });
        res.end(JSON.stringify(memState.processes));
        return;
    }

    // ── IN-MEMORY: serve per-process log ────────────────────────────────────
    const processLogMatch = cleanPath.match(/^\/data\/process_(.+)\.json$/);
    if (processLogMatch && req.method === 'GET') {
        const pid = processLogMatch[1];
        const log = memState.processLogs[pid] || { logs: [], keyDetails: {}, sidebarArtifacts: [] };
        res.writeHead(200, { ...corsHeaders, 'Content-Type': 'application/json' });
        res.end(JSON.stringify(log));
        return;
    }

    // ── API: update processes list status (called by simulation) ────────────
    if (cleanPath === '/api/update-status' && req.method === 'POST') {
        let body = '';
        req.on('data', d => body += d);
        req.on('end', () => {
            try {
                const p = JSON.parse(body);
                const idx = memState.processes.findIndex(x => x.id === String(p.id));
                if (idx !== -1) {
                    memState.processes[idx].status = p.status;
                    memState.processes[idx].currentStatus = p.currentStatus;
                }
            } catch(e) { console.error('update-status err:', e.message); }
            res.writeHead(200, { ...corsHeaders, 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ status: 'ok' }));
        });
        return;
    }

    // ── API: update process log (called by simulation) ───────────────────────
    if (cleanPath === '/api/update-process-log' && req.method === 'POST') {
        let body = '';
        req.on('data', d => body += d);
        req.on('end', () => {
            try {
                const { processId, logEntry, keyDetails, sidebarArtifacts } = JSON.parse(body);
                if (!memState.processLogs[processId]) {
                    memState.processLogs[processId] = { logs: [], keyDetails: {}, sidebarArtifacts: [] };
                }
                const log = memState.processLogs[processId];
                if (logEntry) log.logs.push(logEntry);
                if (keyDetails) Object.assign(log.keyDetails, keyDetails);
                if (sidebarArtifacts) {
                    sidebarArtifacts.forEach(a => {
                        const existing = log.sidebarArtifacts.findIndex(x => x.id === a.id);
                        if (existing !== -1) log.sidebarArtifacts[existing] = a;
                        else log.sidebarArtifacts.push(a);
                    });
                }
            } catch(e) { console.error('update-process-log err:', e.message); }
            res.writeHead(200, { ...corsHeaders, 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ status: 'ok' }));
        });
        return;
    }

    // ── SIGNAL STATUS ─────────────────────────────────────────────────────────
    if (cleanPath === '/signal-status' && req.method === 'GET') {
        res.writeHead(200, { ...corsHeaders, 'Content-Type': 'application/json' });
        res.end(JSON.stringify(memState.signals));
        return;
    }

    // ── SIGNAL POST ───────────────────────────────────────────────────────────
    if (cleanPath === '/signal' && req.method === 'POST') {
        let body = '';
        req.on('data', d => body += d);
        req.on('end', () => {
            try {
                const p = JSON.parse(body);
                memState.signals[p.signalId] = true;
                console.log(`Signal fired: ${p.signalId}`);
            } catch(e) {}
            res.writeHead(200, { ...corsHeaders, 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ status: 'ok' }));
        });
        return;
    }

    // ── EMAIL STATUS ──────────────────────────────────────────────────────────
    if (cleanPath === '/email-status') {
        if (req.method === 'GET') {
            res.writeHead(200, { ...corsHeaders, 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ sent: memState.emailSent }));
        } else if (req.method === 'POST') {
            let body = '';
            req.on('data', d => body += d);
            req.on('end', () => {
                try { const p = JSON.parse(body); memState.emailSent = p.sent; } catch(e) {}
                res.writeHead(200, { ...corsHeaders, 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ status: 'ok' }));
            });
        }
        return;
    }

    // ── CHAT ──────────────────────────────────────────────────────────────────
    if (cleanPath === '/api/chat' && req.method === 'POST') {
        let body = '';
        req.on('data', d => body += d);
        req.on('end', async () => {
            try {
                const parsed = JSON.parse(body);
                let response;
                if (parsed.messages && parsed.systemPrompt) {
                    response = await callGemini(parsed.messages, parsed.systemPrompt);
                } else {
                    const kbContent = parsed.knowledgeBase || '';
                    const systemPrompt = `You are a helpful assistant for Chubb's Smart Submission Intake process. Use this knowledge base to answer questions:\n\n${kbContent}`;
                    const history = (parsed.history || []).map(h => ({ role: h.role, content: h.content }));
                    const messages = [...history, { role: 'user', content: parsed.message }];
                    response = await callGemini(messages, systemPrompt);
                }
                res.writeHead(200, { ...corsHeaders, 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ response }));
            } catch(e) {
                res.writeHead(500, { ...corsHeaders, 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: e.message }));
            }
        });
        return;
    }

    // ── FEEDBACK QUESTIONS ────────────────────────────────────────────────────
    if (cleanPath === '/api/feedback/questions' && req.method === 'POST') {
        let body = '';
        req.on('data', d => body += d);
        req.on('end', async () => {
            try {
                const { feedback, knowledgeBase } = JSON.parse(body);
                const prompt = `Based on this feedback about our knowledge base, generate 3 clarifying questions to better understand the user's intent. Return only a JSON array of 3 question strings.\n\nKnowledge Base:\n${knowledgeBase}\n\nFeedback:\n${feedback}`;
                const response = await callGemini([{ role: 'user', content: prompt }], 'You are a helpful assistant that generates clarifying questions.');
                let questions;
                try { questions = JSON.parse(response.match(/\[[\s\S]*\]/)[0]); } catch(e) { questions = [response]; }
                res.writeHead(200, { ...corsHeaders, 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ questions }));
            } catch(e) {
                res.writeHead(500, { ...corsHeaders, 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: e.message }));
            }
        });
        return;
    }

    // ── FEEDBACK SUMMARIZE ────────────────────────────────────────────────────
    if (cleanPath === '/api/feedback/summarize' && req.method === 'POST') {
        let body = '';
        req.on('data', d => body += d);
        req.on('end', async () => {
            try {
                const { feedback, questions, answers, knowledgeBase } = JSON.parse(body);
                const qa = questions.map((q, i) => `Q: ${q}\nA: ${answers[i] || ''}`).join('\n\n');
                const prompt = `Summarize the following feedback and Q&A into a concise proposal for updating the knowledge base.\n\nOriginal Feedback: ${feedback}\n\nQ&A:\n${qa}\n\nKnowledge Base Context:\n${knowledgeBase}`;
                const summary = await callGemini([{ role: 'user', content: prompt }], 'You summarize feedback into actionable KB update proposals.');
                res.writeHead(200, { ...corsHeaders, 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ summary }));
            } catch(e) {
                res.writeHead(500, { ...corsHeaders, 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: e.message }));
            }
        });
        return;
    }

    // ── FEEDBACK QUEUE ────────────────────────────────────────────────────────
    if (cleanPath === '/api/feedback/queue') {
        if (req.method === 'GET') {
            res.writeHead(200, { ...corsHeaders, 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ queue: memState.feedbackQueue }));
            return;
        }
        if (req.method === 'POST') {
            let body = '';
            req.on('data', d => body += d);
            req.on('end', () => {
                try {
                    const item = JSON.parse(body);
                    memState.feedbackQueue.push({ ...item, status: 'pending', timestamp: new Date().toISOString() });
                } catch(e) {}
                res.writeHead(200, { ...corsHeaders, 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ status: 'ok' }));
            });
            return;
        }
    }

    // ── FEEDBACK QUEUE DELETE ─────────────────────────────────────────────────
    const feedbackDeleteMatch = cleanPath.match(/^\/api\/feedback\/queue\/(.+)$/);
    if (feedbackDeleteMatch && req.method === 'DELETE') {
        const id = feedbackDeleteMatch[1];
        memState.feedbackQueue = memState.feedbackQueue.filter(item => item.id !== id);
        res.writeHead(200, { ...corsHeaders, 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'ok' }));
        return;
    }

    // ── FEEDBACK APPLY ─────────────────────────────────────────────────────────
    if (cleanPath === '/api/feedback/apply' && req.method === 'POST') {
        let body = '';
        req.on('data', d => body += d);
        req.on('end', async () => {
            try {
                const { feedbackId } = JSON.parse(body);
                const item = memState.feedbackQueue.find(i => i.id === feedbackId);
                if (!item) throw new Error('Feedback item not found');
                const currentKB = fs.existsSync(KB_PATH) ? fs.readFileSync(KB_PATH, 'utf8') : '';
                const prompt = `Apply the following feedback proposal to update this knowledge base. Return only the updated knowledge base markdown.\n\nProposal: ${item.summary}\n\nCurrent KB:\n${currentKB}`;
                const updatedKB = await callGemini([{ role: 'user', content: prompt }], 'You update knowledge bases based on feedback proposals.');
                const ts = Date.now();
                const snapFile = `kb_snapshot_${ts}.md`;
                const prevFile = `kb_prev_${ts}.md`;
                if (!fs.existsSync(SNAPSHOTS_DIR)) fs.mkdirSync(SNAPSHOTS_DIR, { recursive: true });
                fs.writeFileSync(path.join(SNAPSHOTS_DIR, snapFile), updatedKB);
                fs.writeFileSync(path.join(SNAPSHOTS_DIR, prevFile), currentKB);
                if (fs.existsSync(path.dirname(KB_PATH))) fs.writeFileSync(KB_PATH, updatedKB);
                memState.kbVersions.unshift({ id: String(ts), timestamp: new Date().toISOString(), snapshotFile: snapFile, previousFile: prevFile, changes: [item.summary] });
                memState.feedbackQueue = memState.feedbackQueue.filter(i => i.id !== feedbackId);
                res.writeHead(200, { ...corsHeaders, 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true, content: updatedKB }));
            } catch(e) {
                res.writeHead(500, { ...corsHeaders, 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: e.message }));
            }
        });
        return;
    }

    // ── KB CONTENT ─────────────────────────────────────────────────────────────
    if (cleanPath === '/api/kb/content' && req.method === 'GET') {
        try {
            const versionId = new URL(req.url, 'http://localhost').searchParams.get('versionId');
            let content;
            if (versionId) {
                const ver = memState.kbVersions.find(v => v.id === versionId);
                if (ver && fs.existsSync(path.join(SNAPSHOTS_DIR, ver.snapshotFile))) {
                    content = fs.readFileSync(path.join(SNAPSHOTS_DIR, ver.snapshotFile), 'utf8');
                } else {
                    content = fs.existsSync(KB_PATH) ? fs.readFileSync(KB_PATH, 'utf8') : '';
                }
            } else {
                content = fs.existsSync(KB_PATH) ? fs.readFileSync(KB_PATH, 'utf8') : '';
            }
            res.writeHead(200, { ...corsHeaders, 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ content }));
        } catch(e) {
            res.writeHead(500, { ...corsHeaders, 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: e.message }));
        }
        return;
    }

    // ── KB VERSIONS ────────────────────────────────────────────────────────────
    if (cleanPath === '/api/kb/versions' && req.method === 'GET') {
        res.writeHead(200, { ...corsHeaders, 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ versions: memState.kbVersions }));
        return;
    }

    // ── KB SNAPSHOT ────────────────────────────────────────────────────────────
    const snapshotMatch = cleanPath.match(/^\/api\/kb\/snapshot\/(.+)$/);
    if (snapshotMatch && req.method === 'GET') {
        try {
            const content = fs.readFileSync(path.join(SNAPSHOTS_DIR, snapshotMatch[1]), 'utf8');
            res.writeHead(200, { ...corsHeaders, 'Content-Type': 'text/markdown' });
            res.end(content);
        } catch(e) {
            res.writeHead(404, corsHeaders);
            res.end('Not found');
        }
        return;
    }

    // ── KB UPDATE ──────────────────────────────────────────────────────────────
    if (cleanPath === '/api/kb/update' && req.method === 'POST') {
        let body = '';
        req.on('data', d => body += d);
        req.on('end', () => {
            try {
                const { content } = JSON.parse(body);
                if (fs.existsSync(path.dirname(KB_PATH))) fs.writeFileSync(KB_PATH, content);
                res.writeHead(200, { ...corsHeaders, 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ status: 'ok' }));
            } catch(e) {
                res.writeHead(500, corsHeaders);
                res.end(JSON.stringify({ error: e.message }));
            }
        });
        return;
    }

    // ── DEBUG PATHS ────────────────────────────────────────────────────────────
    if (cleanPath === '/debug-paths' && req.method === 'GET') {
        res.writeHead(200, { ...corsHeaders, 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            dataDir: DATA_DIR,
            exists: fs.existsSync(DATA_DIR),
            files: fs.existsSync(DATA_DIR) ? fs.readdirSync(DATA_DIR) : [],
            processCount: memState.processes.length,
            logKeys: Object.keys(memState.processLogs)
        }));
        return;
    }

    // ── STATIC FILES (videos, PDFs, images, etc.) ─────────────────────────────
    let filePath = path.join(PUBLIC_DIR, cleanPath === '/' ? 'index.html' : cleanPath);
    if (!fs.existsSync(filePath)) filePath = path.join(PUBLIC_DIR, 'index.html');
    if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) filePath = path.join(filePath, 'index.html');

    if (fs.existsSync(filePath) && !fs.statSync(filePath).isDirectory()) {
        const ext = path.extname(filePath);
        const contentType = mime[ext] || 'application/octet-stream';
        res.writeHead(200, { ...corsHeaders, 'Content-Type': contentType });
        fs.createReadStream(filePath).pipe(res);
    } else {

    // DEBUG endpoint
    if (method === 'GET' && urlPath === '/debug') {
        const summary = {
            simRunning,
            simLastError: global.__simLastError || null,
            processCount: memState.processes.length,
            logsCount: Object.keys(memState.processLogs).reduce((a, k) => a + (memState.processLogs[k]?.logs?.length || 0), 0),
            artifactsCount: Object.keys(memState.processLogs).reduce((a, k) => a + (memState.processLogs[k]?.sidebarArtifacts?.length || 0), 0),
            currentStatus: memState.processes[0]?.currentStatus || 'unknown',
            uptime: Math.round(process.uptime())
        };
        res.writeHead(200, { ...corsHeaders, 'Content-Type': 'application/json' });
        return res.end(JSON.stringify(summary, null, 2));
    }

        res.writeHead(404, corsHeaders);
        res.end('Not found');
    }
});

server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
    // Auto-start simulation on boot
    setTimeout(startSimulation, 1000);
});
