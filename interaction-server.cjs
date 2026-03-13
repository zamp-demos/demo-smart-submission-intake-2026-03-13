try { require('dotenv').config(); } catch(e) {}

const http = require('http');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const PORT = process.env.PORT || 3001;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.VITE_MODEL || 'gemini-2.5-flash';

const PUBLIC_DIR = path.join(__dirname, 'public');
const DATA_DIR = path.join(PUBLIC_DIR, 'data');
const PROCESSES_FILE = path.join(DATA_DIR, 'processes.json');
const SIGNALS_FILE = path.join(__dirname, 'interaction-signals.json');
const FEEDBACK_QUEUE_PATH = path.join(__dirname, 'feedbackQueue.json');
const KB_PATH = path.join(__dirname, 'src', 'data', 'knowledgeBase.md');
const KB_VERSIONS_PATH = path.join(DATA_DIR, 'kbVersions.json');
const SNAPSHOTS_DIR = path.join(DATA_DIR, 'snapshots');

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
};

let state = { sent: false, confirmed: false, signals: {} };
let runningProcesses = new Map();

// Initialize files
if (!fs.existsSync(PROCESSES_FILE)) {
    const base = path.join(DATA_DIR, 'base_processes.json');
    if (fs.existsSync(base)) fs.copyFileSync(base, PROCESSES_FILE);
}
if (!fs.existsSync(SIGNALS_FILE)) fs.writeFileSync(SIGNALS_FILE, JSON.stringify({ underwriter_approval: false }, null, 4));
if (!fs.existsSync(FEEDBACK_QUEUE_PATH)) fs.writeFileSync(FEEDBACK_QUEUE_PATH, '[]');
if (!fs.existsSync(KB_VERSIONS_PATH)) fs.writeFileSync(KB_VERSIONS_PATH, '[]');
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

const server = http.createServer(async (req, res) => {
    const cleanPath = req.url.split('?')[0];

    if (req.method === 'OPTIONS') {
        res.writeHead(204, corsHeaders);
        res.end();
        return;
    }

    // RESET
    if (cleanPath === '/reset' && req.method === 'GET') {
        state = { sent: false, confirmed: false, signals: {} };
        fs.writeFileSync(SIGNALS_FILE, JSON.stringify({ underwriter_approval: false }, null, 4));
        runningProcesses.forEach((proc) => { try { process.kill(-proc.pid, 'SIGKILL'); } catch(e){} });
        runningProcesses.clear();
        exec('pkill -9 -f "node(.*)simulation_scripts" || true', (err) => {
            setTimeout(() => {
                const cases = [
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
                fs.writeFileSync(PROCESSES_FILE, JSON.stringify(cases, null, 4));
                const emptyLog = { logs: [], keyDetails: {}, sidebarArtifacts: [] };
                fs.writeFileSync(path.join(DATA_DIR, 'process_SUB-2025-0310-PCBK-FI-0042.json'), JSON.stringify(emptyLog, null, 4));
                fs.writeFileSync(FEEDBACK_QUEUE_PATH, '[]');
                fs.writeFileSync(KB_VERSIONS_PATH, '[]');
                const scriptPath = path.join(__dirname, 'simulation_scripts', 'pinnacle_submission.cjs');
                const child = exec(`node "${scriptPath}" > "${scriptPath}.log" 2>&1`, (error) => {
                    if (error && error.code !== 0) console.error('pinnacle_submission error:', error.message);
                    runningProcesses.delete('SUB-2025-0310-PCBK-FI-0042');
                });
                if (child.pid) runningProcesses.set('SUB-2025-0310-PCBK-FI-0042', child);
            }, 1000);
        });
        res.writeHead(200, { ...corsHeaders, 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'ok' }));
        return;
    }

    // EMAIL STATUS
    if (cleanPath === '/email-status') {
        if (req.method === 'GET') {
            res.writeHead(200, { ...corsHeaders, 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ sent: state.sent }));
        } else if (req.method === 'POST') {
            let body = '';
            req.on('data', d => body += d);
            req.on('end', () => {
                try { const p = JSON.parse(body); state.sent = p.sent; } catch(e) {}
                res.writeHead(200, { ...corsHeaders, 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ status: 'ok' }));
            });
        }
        return;
    }

    // SIGNAL STATUS
    if (cleanPath === '/signal-status' && req.method === 'GET') {
        try {
            const signals = fs.existsSync(SIGNALS_FILE) ? JSON.parse(fs.readFileSync(SIGNALS_FILE, 'utf8')) : {};
            res.writeHead(200, { ...corsHeaders, 'Content-Type': 'application/json' });
            res.end(JSON.stringify(signals));
        } catch(e) {
            res.writeHead(200, { ...corsHeaders, 'Content-Type': 'application/json' });
            res.end(JSON.stringify({}));
        }
        return;
    }

    // SIGNAL POST
    if (cleanPath === '/signal' && req.method === 'POST') {
        let body = '';
        req.on('data', d => body += d);
        req.on('end', () => {
            try {
                const p = JSON.parse(body);
                const signals = fs.existsSync(SIGNALS_FILE) ? JSON.parse(fs.readFileSync(SIGNALS_FILE, 'utf8')) : {};
                signals[p.signalId] = true;
                fs.writeFileSync(SIGNALS_FILE, JSON.stringify(signals, null, 4));
            } catch(e) {}
            res.writeHead(200, { ...corsHeaders, 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ status: 'ok' }));
        });
        return;
    }

    // UPDATE STATUS
    if (cleanPath === '/api/update-status' && req.method === 'POST') {
        let body = '';
        req.on('data', d => body += d);
        req.on('end', () => {
            try {
                const p = JSON.parse(body);
                if (fs.existsSync(PROCESSES_FILE)) {
                    const procs = JSON.parse(fs.readFileSync(PROCESSES_FILE, 'utf8'));
                    const idx = procs.findIndex(x => x.id === String(p.id));
                    if (idx !== -1) {
                        procs[idx].status = p.status;
                        procs[idx].currentStatus = p.currentStatus;
                        fs.writeFileSync(PROCESSES_FILE, JSON.stringify(procs, null, 4));
                    }
                }
            } catch(e) {}
            res.writeHead(200, { ...corsHeaders, 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ status: 'ok' }));
        });
        return;
    }

    // CHAT
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

    // FEEDBACK QUESTIONS
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

    // FEEDBACK SUMMARIZE
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

    // FEEDBACK QUEUE
    if (cleanPath === '/api/feedback/queue') {
        if (req.method === 'GET') {
            const queue = fs.existsSync(FEEDBACK_QUEUE_PATH) ? JSON.parse(fs.readFileSync(FEEDBACK_QUEUE_PATH, 'utf8')) : [];
            res.writeHead(200, { ...corsHeaders, 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ queue }));
            return;
        }
        if (req.method === 'POST') {
            let body = '';
            req.on('data', d => body += d);
            req.on('end', () => {
                try {
                    const item = JSON.parse(body);
                    const queue = fs.existsSync(FEEDBACK_QUEUE_PATH) ? JSON.parse(fs.readFileSync(FEEDBACK_QUEUE_PATH, 'utf8')) : [];
                    queue.push({ ...item, status: 'pending', timestamp: new Date().toISOString() });
                    fs.writeFileSync(FEEDBACK_QUEUE_PATH, JSON.stringify(queue, null, 4));
                } catch(e) {}
                res.writeHead(200, { ...corsHeaders, 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ status: 'ok' }));
            });
            return;
        }
    }

    // FEEDBACK QUEUE DELETE
    const feedbackDeleteMatch = cleanPath.match(/^\/api\/feedback\/queue\/(.+)$/);
    if (feedbackDeleteMatch && req.method === 'DELETE') {
        const id = feedbackDeleteMatch[1];
        try {
            const queue = fs.existsSync(FEEDBACK_QUEUE_PATH) ? JSON.parse(fs.readFileSync(FEEDBACK_QUEUE_PATH, 'utf8')) : [];
            const filtered = queue.filter(item => item.id !== id);
            fs.writeFileSync(FEEDBACK_QUEUE_PATH, JSON.stringify(filtered, null, 4));
        } catch(e) {}
        res.writeHead(200, { ...corsHeaders, 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'ok' }));
        return;
    }

    // FEEDBACK APPLY
    if (cleanPath === '/api/feedback/apply' && req.method === 'POST') {
        let body = '';
        req.on('data', d => body += d);
        req.on('end', async () => {
            try {
                const { feedbackId } = JSON.parse(body);
                const queue = fs.existsSync(FEEDBACK_QUEUE_PATH) ? JSON.parse(fs.readFileSync(FEEDBACK_QUEUE_PATH, 'utf8')) : [];
                const item = queue.find(i => i.id === feedbackId);
                if (!item) throw new Error('Feedback item not found');
                const currentKB = fs.readFileSync(KB_PATH, 'utf8');
                const prompt = `Apply the following feedback proposal to update this knowledge base. Return only the updated knowledge base markdown.\n\nProposal: ${item.summary}\n\nCurrent KB:\n${currentKB}`;
                const updatedKB = await callGemini([{ role: 'user', content: prompt }], 'You update knowledge bases based on feedback proposals.');
                const ts = Date.now();
                const snapFile = `kb_snapshot_${ts}.md`;
                const prevFile = `kb_prev_${ts}.md`;
                fs.writeFileSync(path.join(SNAPSHOTS_DIR, snapFile), updatedKB);
                fs.writeFileSync(path.join(SNAPSHOTS_DIR, prevFile), currentKB);
                fs.writeFileSync(KB_PATH, updatedKB);
                const versions = fs.existsSync(KB_VERSIONS_PATH) ? JSON.parse(fs.readFileSync(KB_VERSIONS_PATH, 'utf8')) : [];
                versions.unshift({ id: String(ts), timestamp: new Date().toISOString(), snapshotFile: snapFile, previousFile: prevFile, changes: [item.summary] });
                fs.writeFileSync(KB_VERSIONS_PATH, JSON.stringify(versions, null, 4));
                const updatedQueue = queue.filter(i => i.id !== feedbackId);
                fs.writeFileSync(FEEDBACK_QUEUE_PATH, JSON.stringify(updatedQueue, null, 4));
                res.writeHead(200, { ...corsHeaders, 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true, content: updatedKB }));
            } catch(e) {
                res.writeHead(500, { ...corsHeaders, 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: e.message }));
            }
        });
        return;
    }

    // KB CONTENT
    if (cleanPath === '/api/kb/content' && req.method === 'GET') {
        try {
            const versionId = new URL(req.url, 'http://localhost').searchParams.get('versionId');
            let content;
            if (versionId) {
                const versions = fs.existsSync(KB_VERSIONS_PATH) ? JSON.parse(fs.readFileSync(KB_VERSIONS_PATH, 'utf8')) : [];
                const ver = versions.find(v => v.id === versionId);
                if (ver) content = fs.readFileSync(path.join(SNAPSHOTS_DIR, ver.snapshotFile), 'utf8');
                else content = fs.readFileSync(KB_PATH, 'utf8');
            } else {
                content = fs.readFileSync(KB_PATH, 'utf8');
            }
            res.writeHead(200, { ...corsHeaders, 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ content }));
        } catch(e) {
            res.writeHead(500, { ...corsHeaders, 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: e.message }));
        }
        return;
    }

    // KB VERSIONS
    if (cleanPath === '/api/kb/versions' && req.method === 'GET') {
        const versions = fs.existsSync(KB_VERSIONS_PATH) ? JSON.parse(fs.readFileSync(KB_VERSIONS_PATH, 'utf8')) : [];
        res.writeHead(200, { ...corsHeaders, 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ versions }));
        return;
    }

    // KB SNAPSHOT
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

    // KB UPDATE
    if (cleanPath === '/api/kb/update' && req.method === 'POST') {
        let body = '';
        req.on('data', d => body += d);
        req.on('end', () => {
            try {
                const { content } = JSON.parse(body);
                fs.writeFileSync(KB_PATH, content);
                res.writeHead(200, { ...corsHeaders, 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ status: 'ok' }));
            } catch(e) {
                res.writeHead(500, corsHeaders);
                res.end(JSON.stringify({ error: e.message }));
            }
        });
        return;
    }

    // DEBUG PATHS
    if (cleanPath === '/debug-paths' && req.method === 'GET') {
        res.writeHead(200, { ...corsHeaders, 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ dataDir: DATA_DIR, exists: fs.existsSync(DATA_DIR), files: fs.existsSync(DATA_DIR) ? fs.readdirSync(DATA_DIR) : [] }));
        return;
    }

    // STATIC FILES
    let filePath = path.join(PUBLIC_DIR, cleanPath === '/' ? 'index.html' : cleanPath);
    if (!fs.existsSync(filePath)) filePath = path.join(PUBLIC_DIR, 'index.html');
    if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) filePath = path.join(filePath, 'index.html');

    if (fs.existsSync(filePath) && !fs.statSync(filePath).isDirectory()) {
        const ext = path.extname(filePath);
        const contentType = mime[ext] || 'application/octet-stream';
        res.writeHead(200, { ...corsHeaders, 'Content-Type': contentType });
        fs.createReadStream(filePath).pipe(res);
    } else {
        res.writeHead(404, corsHeaders);
        res.end('Not found');
    }
});

server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});
