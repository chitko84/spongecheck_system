const RAIN_SCENARIOS = {
    dry: { name: 'Dry', amount: '0 mm', description: 'An illustrative period without rainfall.' },
    moderate: { name: 'Moderate', amount: '20 mm', description: 'An illustrative moderate rainfall period.' },
    heavy: { name: 'Heavy', amount: '65 mm', description: 'An illustrative heavy rainfall period.' }
};
const ACTION_LABELS = {
    inspect_only: 'Inspect only', remove_debris: 'Remove loose debris', remove_sediment: 'Remove sediment', clear_vegetation: 'Clear vegetation'
};
const RULE_VERSION = 'demo-v1.0';
function evaluateInspection(input) {
    const { observations: o, scenario, action } = input;
    const factors = [];
    const uncertainties = [];
    const add = (key, label, points, reason, origin = 'Sample inspection rules') => factors.push({ key, label, points, reason, origin });
    const evidenceOrigin = input.provenance === 'inspector_confirmed' ? 'Inspector-confirmed report' : 'Fictional example observation';
    const blocked = o.debris === 'visible' || o.sediment === 'visible';
    const missingCore = o.debris === 'unsure' && o.sediment === 'unsure';
    if (o.debris === 'visible')
        add('debris', 'Visible debris', 3, 'Debris is recorded at this location.', evidenceOrigin);
    if (o.sediment === 'visible')
        add('sediment', 'Visible sediment', 2, 'Sediment is recorded at this location.', evidenceOrigin);
    if (input.criticality === 'high')
        add('criticality', 'Priority waterway location', 2, 'This sample asset is tagged as a critical inlet or outlet.', 'Fictional asset profile');
    if (input.daysSinceInspection !== null && input.daysSinceInspection > 14)
        add('recency', 'Inspection follow-up', 1, 'The demonstration fixture marks the last inspection as older than 14 days.', 'Fictional inspection date');
    if (blocked && scenario === 'moderate')
        add('rain', 'Moderate rain scenario', 1, 'Sample rainfall adds urgency when visible debris or sediment is present.', 'Simulated rainfall');
    if (blocked && scenario === 'heavy')
        add('rain', 'Heavy rain scenario', 3, 'Sample rainfall adds extra urgency when visible debris or sediment is present.', 'Simulated rainfall');
    if (o.debris === 'unsure')
        uncertainties.push('Debris condition has not been confirmed.');
    if (o.sediment === 'unsure')
        uncertainties.push('Sediment condition has not been confirmed.');
    if (o.vegetation === 'unsure')
        uncertainties.push('Vegetation condition has not been confirmed.');
    if (input.daysSinceInspection === null)
        uncertainties.push('Last inspection date is unavailable.');
    const score = missingCore ? null : factors.reduce((sum, f) => sum + f.points, 0);
    const priority = score === null ? 'insufficient_evidence' : score >= 7 ? 'urgent' : score >= 3 ? 'elevated' : 'routine';
    let intervention = 'not_proposed';
    let reviewReason = 'Inspection does not authorize physical maintenance.';
    if (action !== 'inspect_only') {
        if (action === 'clear_vegetation' || action === 'remove_sediment' || o.vegetation === 'dense') {
            intervention = 'review_required';
            reviewReason = 'This proposed work may affect wetland habitat or sediment. Ask an authorized specialist to review the intervention before work begins.';
        }
        else {
            intervention = 'assessment_needed';
            reviewReason = 'A responsible manager must assess the proposed task and site conditions before work can start.';
        }
    }
    else if (o.vegetation === 'dense') {
        reviewReason = 'Dense vegetation is present. Any future vegetation clearance must be reviewed separately; inspection itself is permitted.';
    }
    const summary = priority === 'insufficient_evidence' ? 'More information is needed before assigning an inspection priority.' :
        priority === 'urgent' ? 'Check this place soon under the selected example conditions.' :
            priority === 'elevated' ? 'This place deserves a closer look.' : 'Continue with routine inspection planning.';
    return { priority, intervention, score, factors, uncertainties, scenario, action, ruleset: RULE_VERSION, summary, reviewReason, input };
}
/** The queue and Decision X-Ray must use evaluateInspection() for identical results. */
function sortDecisions(rows) {
    const weight = { urgent: 3, elevated: 2, insufficient_evidence: 1, routine: 0 };
    return [...rows].sort((a, b) => { var _a, _b; return weight[b.decision.priority] - weight[a.decision.priority] || ((_a = b.decision.score) !== null && _a !== void 0 ? _a : -1) - ((_b = a.decision.score) !== null && _b !== void 0 ? _b : -1) || a.id.localeCompare(b.id); });
}
class WorkflowError extends Error {
    constructor(message) { super(message); this.name = 'WorkflowError'; }
}
const fail = (msg) => { throw new WorkflowError(msg); };
const clean = (s) => (s === null || s === void 0 ? void 0 : s.trim()) || '';
function advanceCase(input, command, actor, params = {}) {
    var _a, _b, _c, _d;
    const now = params.atUtc || new Date().toISOString();
    const previous = input.workflow || {};
    const next = { ...previous };
    let status = input.status;
    let desc = '';
    if (actor === 'Guest')
        fail('Guests can browse but cannot change reports.');
    switch (command) {
        case 'propose': {
            if (actor !== 'Inspector' && actor !== 'Manager')
                fail('Only an inspector or manager can propose work.');
            if (!params.action || params.action === 'inspect_only')
                fail('Choose a maintenance action to propose.');
            if (!['Reported — awaiting review', 'Needs changes', 'Ready to assign'].includes(status))
                fail('Work cannot be changed after it has been assigned.');
            if (params.requiresReview === undefined)
                fail('Review requirements must be evaluated first.');
            const action = params.action;
            next.action = action;
            next.requiresReview = params.requiresReview;
            next.review = params.requiresReview ? { decision: 'pending', action } : undefined;
            next.assignedTo = undefined;
            next.completion = undefined;
            next.verification = undefined;
            status = params.requiresReview ? 'Waiting for specialist review' : 'Ready to assign';
            desc = params.requiresReview ? 'Maintenance proposed. Specialist approval requested.' : 'Routine maintenance proposed; ready for manager assignment.';
            break;
        }
        case 'approve':
        case 'reject': {
            if (actor !== 'Reviewer')
                fail('Only the nature reviewer demo role can make this decision.');
            if (status !== 'Waiting for specialist review' || ((_a = next.review) === null || _a === void 0 ? void 0 : _a.decision) !== 'pending')
                fail('No pending specialist review was found.');
            if (clean(params.reason).length < 8)
                fail('Please add a review reason (at least 8 characters).');
            next.review = { action: next.review.action, decision: command === 'approve' ? 'approved' : 'rejected', by: actor, atUtc: now, reason: clean(params.reason) };
            status = command === 'approve' ? 'Ready to assign' : 'Needs changes';
            desc = command === 'approve' ? 'Specialist approved this proposed action.' : 'Specialist rejected this proposed action.';
            break;
        }
        case 'assign': {
            if (actor !== 'Manager')
                fail('Only the operations manager can assign maintenance work.');
            if (status !== 'Ready to assign' || !next.action)
                fail('Work must be ready for assignment first.');
            if (next.requiresReview && (((_b = next.review) === null || _b === void 0 ? void 0 : _b.decision) !== 'approved' || next.review.action !== next.action))
                fail('A matching specialist approval is required first.');
            if (clean(params.assignedTo).length < 3)
                fail('Enter the responsible crew or inspector.');
            next.assignedTo = clean(params.assignedTo);
            status = 'Assigned';
            desc = 'Work assigned to ' + next.assignedTo + '.';
            break;
        }
        case 'start': {
            if (actor !== 'Inspector')
                fail('Only the inspector demo role can begin field work.');
            if (status !== 'Assigned' || !next.assignedTo)
                fail('This case has not been assigned.');
            if (next.requiresReview && ((_c = next.review) === null || _c === void 0 ? void 0 : _c.decision) !== 'approved')
                fail('Approval required before work begins.');
            status = 'In progress';
            desc = 'Field work started.';
            break;
        }
        case 'complete': {
            if (actor !== 'Inspector')
                fail('Only the inspector demo role can submit completion evidence.');
            if (!['In progress', 'Needs rework'].includes(status))
                fail('Start the assigned work before submitting evidence.');
            if (!((_d = params.afterPhotoData) === null || _d === void 0 ? void 0 : _d.startsWith('data:image/')))
                fail('Add an after-work photograph before submitting.');
            if (clean(params.note).length < 12)
                fail('Explain the work done in at least 12 characters.');
            next.completion = { by: actor, atUtc: now, note: clean(params.note), afterPhotoData: params.afterPhotoData };
            next.verification = undefined;
            status = 'Waiting for verification';
            desc = 'Completion evidence submitted for an independent check.';
            break;
        }
        case 'verify':
        case 'return': {
            if (actor !== 'Manager')
                fail('Only the manager demo role can verify work.');
            if (status !== 'Waiting for verification' || !next.completion)
                fail('No completion evidence is waiting for verification.');
            if (next.completion.by === actor)
                fail('The same role that submitted completion cannot verify it.');
            if (clean(params.note).length < 8)
                fail('Add a verification note of at least 8 characters.');
            next.verification = { by: actor, atUtc: now, decision: command === 'verify' ? 'verified' : 'returned', note: clean(params.note) };
            status = command === 'verify' ? 'Work verified' : 'Needs rework';
            desc = command === 'verify' ? 'Work evidence independently checked.' : 'Work returned for corrections and new evidence.';
            break;
        }
    }
    const event = { id: 'ev-' + now.replace(/\D/g, '') + '-' + Math.random().toString(36).slice(2, 8), atUtc: now, type: command, actor, description: desc };
    return { ...input, status, workflow: next, events: [...(input.events || []), event] };
}
const DEMO_NOTICE = 'DEMONSTRATION ONLY. Fictional assets and illustrative rainfall rules. Not an actual flood forecast, engineering assessment, maintenance authorization, or verified environmental outcome.';
const safeText = (v) => String(v !== null && v !== void 0 ? v : '').replace(/[\u0000-\u001f\u007f]/g, ' ').trim();
const exportFileName = (id, ext) => 'SpongeCheck_' + id.replace(/[^a-zA-Z0-9_-]/g, '_') + '.' + ext;
function htmlEsc(v) { return safeText(v).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] || c)); }
function pdfText(v) { return safeText(v).normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[—–−]/g, '-').replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/[^\x20-\x7e]/g, '?').replace(/[\\()]/g, '\\$&'); }
function encode(s) { return new TextEncoder().encode(s); }
function concat(parts) { const size = parts.reduce((n, a) => n + a.length, 0), out = new Uint8Array(size); let k = 0; for (const p of parts) {
    out.set(p, k);
    k += p.length;
} return out; }
function binaryFromBase64(s) { const raw = atob(s); const bytes = new Uint8Array(raw.length); for (let i = 0; i < raw.length; i++)
    bytes[i] = raw.charCodeAt(i); return bytes; }
class PdfWriter {
    constructor() {
        this.objects = [];
    }
    reserve() { this.objects.push(null); return this.objects.length; }
    set(n, s) { this.objects[n - 1] = typeof s === 'string' ? encode(s) : s; }
    obj(s) { const i = this.reserve(); this.set(i, s); return i; }
    stream(dict, data) { return this.obj(concat([encode('<< ' + dict + ' /Length ' + data.length + ' >>\nstream\n'), data, encode('\nendstream')])); }
    finish(root) {
        const out = [encode('%PDF-1.4\n%\xC2\xA5\xC2\xA5\n')], offsets = [0];
        let pos = out[0].length;
        for (let i = 0; i < this.objects.length; i++) {
            offsets.push(pos);
            const b = concat([encode(`${i + 1} 0 obj\n`), this.objects[i] || encode('null'), encode('\nendobj\n')]);
            out.push(b);
            pos += b.length;
        }
        const xref = pos;
        out.push(encode('xref\n0 ' + (this.objects.length + 1) + '\n0000000000 65535 f \n' + offsets.slice(1).map(n => String(n).padStart(10, '0') + ' 00000 n \n').join('') + 'trailer\n<< /Size ' + (this.objects.length + 1) + ' /Root ' + root + ' 0 R >>\nstartxref\n' + xref + '\n%%EOF\n'));
        return new Blob(out, { type: 'application/pdf' });
    }
}
function splitLines(raw, max = 91) { const text = safeText(raw), lines = []; if (!text)
    return ['-']; for (const paragraph of text.split('\n')) {
    const words = paragraph.split(/\s+/);
    let line = '';
    for (const word of words) {
        if (!word)
            continue;
        if ((line + ' ' + word).trim().length > max) {
            if (line) {
                lines.push(line);
                line = '';
            }
            if (word.length > max) {
                for (let i = 0; i < word.length; i += max)
                    lines.push(word.slice(i, i + max));
            }
            else
                line = word;
        }
        else
            line = (line + ' ' + word).trim();
    }
    if (line)
        lines.push(line);
} return lines; }
async function jpegImage(photo) { if (!photo || !/^data:image\/(jpeg|png|webp);base64,/.test(photo))
    return null; try {
    const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = photo; });
    const canvas = document.createElement('canvas');
    const scale = Math.min(1, 940 / Math.max(img.naturalWidth, img.naturalHeight));
    canvas.width = Math.round(img.naturalWidth * scale);
    canvas.height = Math.round(img.naturalHeight * scale);
    const ctx = canvas.getContext('2d');
    if (!ctx)
        return null;
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return { width: canvas.width, height: canvas.height, bytes: binaryFromBase64(canvas.toDataURL('image/jpeg', .75).split(',')[1]) };
}
catch {
    return null;
} }
async function makePdf(title, sections, photo, afterPhoto) {
    const pdf = new PdfWriter();
    const pages = [];
    const pageW = 595, pageH = 842, margin = 48;
    let pg = { content: [], y: 740, images: new Set() };
    const next = () => { pg = { content: [], y: 740, images: new Set() }; pages.push(pg); pg.content.push('0.35 0.11 0.21 rg 0 796 595 46 re f'); pg.content.push(`BT /F2 16 Tf 1 1 1 rg 48 811 Td (SPONGECHECK 2.0) Tj ET`); };
    next();
    const line = (s, { bold = false, size = 10, color = '#25222A', gap = 15 } = {}) => { if (pg.y < 92)
        next(); const hex = color.replace('#', ''); let rgb = '0.15 0.13 0.17'; if (hex.length === 6)
        rgb = [0, 2, 4].map(i => (parseInt(hex.slice(i, i + 2), 16) / 255).toFixed(3)).join(' '); pg.content.push(`BT /${bold ? 'F2' : 'F1'} ${size} Tf ${rgb} rg 48 ${pg.y} Td (${pdfText(s)}) Tj ET`); pg.y -= gap; };
    line(title, { bold: true, size: 20, color: '#5B1E35', gap: 31 });
    line('Generated ' + new Date().toLocaleString('en-MY'), { size: 10, color: '#695F65', gap: 26 });
    for (const section of sections) {
        pg.y -= 7;
        line(section.title.toUpperCase(), { bold: true, size: 11, color: '#5B1E35', gap: 19 });
        for (const entry of section.lines) {
            for (const item of splitLines(entry)) {
                line(item, { size: 10, gap: 14 });
            }
            pg.y -= 6;
        }
    }
    const images = await Promise.all([{ label: 'INITIAL INSPECTION PHOTO', src: photo }, { label: 'AFTER-WORK PHOTO', src: afterPhoto }].map(async (p, i) => ({ label: p.label, id: 'Im' + i, photo: await jpegImage(p.src) })));
    const imgObjects = {};
    for (const image of images) {
        const jpeg = image.photo;
        if (!jpeg)
            continue;
        if (pg.y < 330)
            next();
        line(image.label, { bold: true, size: 11, color: '#5B1E35', gap: 20 });
        const w = 360, h = Math.min(235, w * jpeg.height / jpeg.width), y = pg.y - h;
        pg.content.push(`q ${w.toFixed(1)} 0 0 ${h.toFixed(1)} 48 ${y.toFixed(1)} cm /${image.id} Do Q`);
        pg.images.add(image.id);
        pg.y = y - 25;
        line('Illustrative / inspector-supplied evidence - not verified flood performance.', { size: 9, color: '#695F65', gap: 17 });
        imgObjects[image.id] = pdf.stream('/Type /XObject /Subtype /Image /Width ' + jpeg.width + ' /Height ' + jpeg.height + ' /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode', jpeg.bytes);
    }
    const font = pdf.obj('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');
    const boldFont = pdf.obj('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>');
    const pageRefs = [];
    const pageRoot = pdf.reserve();
    for (let idx = 0; idx < pages.length; idx++) {
        const item = pages[idx];
        item.content.push(`BT /F1 9 Tf 0.42 0.39 0.42 rg 48 44 Td (DEMO DATA - NOT AN OFFICIAL MAINTENANCE REPORT | Page ${idx + 1} of ${pages.length}) Tj ET`);
        const content = pdf.stream('', encode(item.content.join('\n') + '\n'));
        const ref = pdf.obj(`<< /Type /Page /Parent ${pageRoot} 0 R /MediaBox [0 0 ${pageW} ${pageH}] /Resources << /Font << /F1 ${font} 0 R /F2 ${boldFont} 0 R >> ${item.images.size ? '/XObject << ' + [...item.images].map(i => '/' + i + ' ' + imgObjects[i] + ' 0 R').join(' ') + ' >>' : ''} >> /Contents ${content} 0 R >>`);
        pageRefs.push(ref);
    }
    pdf.set(pageRoot, '<< /Type /Pages /Kids [' + pageRefs.map(n => n + ' 0 R').join(' ') + '] /Count ' + pageRefs.length + ' >>');
    const catalog = pdf.obj('<< /Type /Catalog /Pages ' + pageRoot + ' 0 R >>');
    return pdf.finish(catalog);
}
function eventLines(c) { var _a; const evs = [...(c.events || []), ...(((_a = c.workflow) === null || _a === void 0 ? void 0 : _a.events) || [])]; return evs.length ? evs.map(e => `${e.atUtc} | ${e.actor || 'Demo user'} | ${e.description}`) : ['No recorded activity yet.']; }
function caseSections(b) {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    const c = b.case, o = c.observations, w = c.workflow;
    return [
        { title: 'Report details', lines: [`Case: ${c.id} | Location: ${c.placeName} (${c.placeId})`, `Reported: ${c.createdAt} | Status: ${(w === null || w === void 0 ? void 0 : w.status) || c.status}`, `Source: ${b.source} | Photo: ${c.photoName || 'Not provided'}`, `Notes: ${c.note}`] },
        { title: 'Confirmed visual observations', lines: [o ? `Debris: ${o.debris}; Sediment: ${o.sediment}; Vegetation: ${o.vegetation}` : 'No structured observations.', (o === null || o === void 0 ? void 0 : o.analysisMode) === 'simulated_labels' ? 'Prewritten sample image labels - not AI inference.' : 'Inspector-recorded observations - no AI model used.'] },
        { title: 'Rainfall and inspection recommendation', lines: [`Scenario: ${b.scenario} (illustrative, not a live forecast)`, b.decision ? `Suggested priority: ${b.decision.priority} | Rule set: ${b.decision.ruleset}` : 'No decision snapshot available.', ((_a = b.decision) === null || _a === void 0 ? void 0 : _a.summary) || 'No recommendation.', ...(((_b = b.decision) === null || _b === void 0 ? void 0 : _b.factors) || []).map(f => `Factor - ${f.label}: ${f.value || ''} ${f.explanation || ''} (${f.source || 'demo rule'})`), ...(((_c = b.decision) === null || _c === void 0 ? void 0 : _c.uncertainties) || []).map(x => 'Uncertainty: ' + x)] },
        { title: 'Approval and maintenance', lines: [`Responsible crew: ${(w === null || w === void 0 ? void 0 : w.assignedTo) || 'Not assigned'}`, `Proposed action: ${(w === null || w === void 0 ? void 0 : w.action) || 'Not recorded'}`, `Reviewer decision: ${((_d = w === null || w === void 0 ? void 0 : w.review) === null || _d === void 0 ? void 0 : _d.decision) || 'Not recorded'} ${((_e = w === null || w === void 0 ? void 0 : w.review) === null || _e === void 0 ? void 0 : _e.reason) || ''}`, `Completion note: ${((_f = w === null || w === void 0 ? void 0 : w.completion) === null || _f === void 0 ? void 0 : _f.note) || 'Not completed'}`, `Verification: ${((_g = w === null || w === void 0 ? void 0 : w.verification) === null || _g === void 0 ? void 0 : _g.decision) || 'Not completed'} ${((_h = w === null || w === void 0 ? void 0 : w.verification) === null || _h === void 0 ? void 0 : _h.note) || ''}`] },
        { title: 'Activity history', lines: eventLines(c) },
        { title: 'Scope and limitations', lines: [b.demoNotice, 'Work verified in this demo refers to evidence documentation, not proven flooding prevention or ecological improvement.', 'Demo role selection is NOT production authentication.'] },
    ];
}
function makeEvidenceHtml(bundle) { var _a, _b; const c = bundle.case; const sections = caseSections(bundle); const photos = [{ label: 'Inspection image', src: c.photoData }, { label: 'After-work image', src: (_b = (_a = c.workflow) === null || _a === void 0 ? void 0 : _a.completion) === null || _b === void 0 ? void 0 : _b.afterPhotoData }].filter(p => p.src && /^data:image\//.test(p.src)); return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${htmlEsc(c.id)} - SpongeCheck Evidence</title><style>body{background:#f8f5f2;color:#25222a;font:15px/1.6 system-ui,sans-serif;margin:0}.page{max-width:860px;margin:30px auto;padding:36px;background:#fff;box-shadow:0 8px 28px #33142616;border-radius:20px}h1{color:#5b1e35}h2{font-size:17px;color:#5b1e35;margin-top:28px;border-bottom:1px solid #e6dfe0;padding-bottom:8px}p{overflow-wrap:anywhere}.notice{background:#fff4eb;border-left:4px solid #d89b4a;padding:12px 16px}.gallery{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:15px}.gallery img{width:100%;max-height:340px;object-fit:contain;border-radius:12px;background:#f4f1f0}.gallery figure{margin:0}figcaption{font-size:12px;color:#69646b}@media print{body{background:#fff}.page{margin:0;padding:10px;box-shadow:none}.gallery img{max-height:250px}}@media(max-width:600px){.page{margin:0;padding:20px;border-radius:0}}</style></head><body><article class="page"><h1>SpongeCheck | Inspection evidence</h1><p class="notice">${htmlEsc(bundle.demoNotice)}</p>${sections.map(s => `<section><h2>${htmlEsc(s.title)}</h2>${s.lines.map(x => `<p>${htmlEsc(x)}</p>`).join('')}</section>`).join('')}<section><h2>Photographs</h2><div class="gallery">${photos.length ? photos.map(x => `<figure><img src="${x.src}" alt="${htmlEsc(x.label)}"><figcaption>${htmlEsc(x.label)} — demonstration data or inspector-supplied evidence</figcaption></figure>`).join('') : '<p>No photographs stored with this report.</p>'}</div></section><p class="notice">Created locally in your browser. Do not treat simulated sample photographs as verified records of actual maintenance.</p></article></body></html>`; }
function summaryRows(cases) { return cases.map(c => { var _a, _b, _c, _d, _e, _f, _g, _h; return [c.id, c.placeId, c.placeName, c.createdAt, ((_a = c.workflow) === null || _a === void 0 ? void 0 : _a.status) || c.status, ((_b = c.observations) === null || _b === void 0 ? void 0 : _b.debris) || '', ((_c = c.observations) === null || _c === void 0 ? void 0 : _c.sediment) || '', ((_d = c.observations) === null || _d === void 0 ? void 0 : _d.vegetation) || '', ((_f = (_e = c.workflow) === null || _e === void 0 ? void 0 : _e.review) === null || _f === void 0 ? void 0 : _f.decision) || '', ((_h = (_g = c.workflow) === null || _g === void 0 ? void 0 : _g.verification) === null || _h === void 0 ? void 0 : _h.decision) || '']; }); }
function makeSummaryCsv(cases) { const rows = [['Case ID', 'Place ID', 'Place name', 'Created UTC', 'Status', 'Debris', 'Sediment', 'Vegetation', 'Review', 'Verification'], ...summaryRows(cases)]; return '\uFEFF' + rows.map(row => row.map(v => '"' + String(v !== null && v !== void 0 ? v : '').replace(/"/g, '""').replace(/^[=+@-]/, '\u0027$&') + '"').join(',')).join('\r\n'); }
function saveBlob(blob, filename) { const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = filename; a.style.display = 'none'; document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 4500); }
function textBlob(content, type) { return new Blob([content], { type }); }
const PLACES = [
    { id: 'A-01', name: 'Wetland Outlet', type: 'Outlet', zone: 'North Basin', status: 'Needs checking', description: 'This is where water leaves the sample wetland area. An inspection example has been flagged for visible debris.', image: 'https://images.pexels.com/photos/18928152/pexels-photo-18928152.jpeg?auto=compress&cs=tinysrgb&w=1000', photo: 'https://images.pexels.com/photos/18928152/pexels-photo-18928152.jpeg?auto=compress&cs=tinysrgb&w=1000', position: { x: 23, y: 37 } },
    { id: 'B-02', name: 'Reed Habitat', type: 'Wetland', zone: 'West Garden', status: 'Review needed', description: 'A sample wetland habitat with vegetation that should be checked before any intervention is considered.', image: 'https://images.pexels.com/photos/13920251/pexels-photo-13920251.jpeg?auto=compress&cs=tinysrgb&w=1000', photo: 'https://images.pexels.com/photos/13920251/pexels-photo-13920251.jpeg?auto=compress&cs=tinysrgb&w=1000', position: { x: 49, y: 23 } },
    { id: 'C-03', name: 'Planted Swale', type: 'Swale', zone: 'Park Walk', status: 'On schedule', description: 'A planted channel designed to guide and filter runoff. No urgent sample issue is recorded here.', image: 'https://images.pexels.com/photos/6552179/pexels-photo-6552179.jpeg?auto=compress&cs=tinysrgb&w=1000', photo: 'https://images.pexels.com/photos/6552179/pexels-photo-6552179.jpeg?auto=compress&cs=tinysrgb&w=1000', position: { x: 74, y: 38 } },
    { id: 'D-04', name: 'Pond Inlet', type: 'Outlet', zone: 'East Catchment', status: 'Needs checking', description: 'A sample entry point to a detention pond, scheduled for a visual condition check.', image: 'https://images.pexels.com/photos/7807058/pexels-photo-7807058.jpeg?auto=compress&cs=tinysrgb&w=1000', photo: 'https://images.pexels.com/photos/7807058/pexels-photo-7807058.jpeg?auto=compress&cs=tinysrgb&w=1000', position: { x: 80, y: 70 } },
    { id: 'E-05', name: 'Wetland Cell', type: 'Wetland', zone: 'Central Park', status: 'On schedule', description: 'A sample vegetated wetland cell with routine monitoring planned.', image: 'https://images.pexels.com/photos/5998901/pexels-photo-5998901.jpeg?auto=compress&cs=tinysrgb&w=1000', photo: 'https://images.pexels.com/photos/5998901/pexels-photo-5998901.jpeg?auto=compress&cs=tinysrgb&w=1000', position: { x: 42, y: 70 } },
    { id: 'F-06', name: 'Detention Pond', type: 'Pond', zone: 'South Meadow', status: 'On schedule', description: 'A sample stormwater storage area shown for planning and demonstration only.', image: 'https://images.pexels.com/photos/31733893/pexels-photo-31733893.jpeg?auto=compress&cs=tinysrgb&w=1000', photo: 'https://images.pexels.com/photos/31733893/pexels-photo-31733893.jpeg?auto=compress&cs=tinysrgb&w=1000', position: { x: 20, y: 79 } },
];
const INITIAL_NOTICES = [
    { id: 'demo-01', title: 'Outlet A-01 needs a check', desc: 'A sample inspection is waiting to be reviewed.', date: 'Sample activity', read: false },
    { id: 'demo-02', title: 'Wetland B-02 needs a review', desc: 'Specialist review is suggested before any vegetation work.', date: 'Sample activity', read: false },
    { id: 'demo-03', title: 'Welcome to SpongeCheck', desc: 'Explore the sample township and create a practice report.', date: 'Getting started', read: true },
];
const ICONS = {
    waves: ['M2 6c2 0 2 2 4 2s2-2 4-2 2 2 4 2 2-2 4-2', 'M2 12c2 0 2 2 4 2s2-2 4-2 2 2 4 2 2-2 4-2', 'M2 18c2 0 2 2 4 2s2-2 4-2 2 2 4 2 2-2 4-2'],
    arrow: ['M5 12h14', 'm12 5 7 7-7 7'], up: ['M7 17 17 7', 'M7 7h10v10'], back: ['m15 18-6-6 6-6'],
    home: ['m3 10 9-7 9 7', 'M5 9v12h14V9', 'M9 21v-7h6v7'], pin: ['M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z', 'M12 10h.01'],
    plus: ['M12 5v14', 'M5 12h14'], bell: ['M18 8a6 6 0 0 0-12 0c0 7-3 8-3 9h18c0-1-3-2-3-9', 'M10 21h4'],
    menu: ['M4 7h16', 'M4 12h16', 'M4 17h16'], x: ['M18 6 6 18', 'm6 6 12 12'], chevron: ['m9 18 6-6-6-6'],
    search: ['M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16Z', 'm21 21-4.35-4.35'],
    cloud: ['M20 16.6a5 5 0 0 0-3.1-9.5A7 7 0 0 0 4.2 9.4 4 4 0 0 0 6 17h12'],
    shield: ['M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z', 'm9 12 2 2 4-4'],
    check: ['m20 6-11 11-5-5'], camera: ['M4 7h4l2-3h4l2 3h4v13H4Z', 'M12 11a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z'],
    clock: ['M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z', 'M12 6v6l4 2'],
    list: ['M9 6h12', 'M9 12h12', 'M9 18h12', 'M3 6h.01', 'M3 12h.01', 'M3 18h.01'],
    map: ['M3 6 9 3l6 3 6-3v15l-6 3-6-3-6 3V6Z', 'M9 3v15', 'M15 6v15'],
    grid: ['M3 3h8v8H3Z', 'M13 3h8v8h-8Z', 'M3 13h8v8H3Z', 'M13 13h8v8h-8Z'],
    info: ['M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z', 'M12 11v6', 'M12 7h.01'],
    send: ['m22 2-7 20-4-9-9-4Z', 'M22 2 11 13'],
    settings: ['M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z', 'M19.4 15a1.6 1.6 0 0 0 .3 1.8l-2 2-1.8-.3a1.6 1.6 0 0 0-1.5 1.4L14 22h-4l-.4-2.1a1.6 1.6 0 0 0-1.5-1.4l-1.8.3-2-2a1.6 1.6 0 0 0 .3-1.8L2.5 14v-4L4.6 9a1.6 1.6 0 0 0-.3-1.8l2-2 1.8.3a1.6 1.6 0 0 0 1.5-1.4L10 2h4l.4 2.1A1.6 1.6 0 0 0 16 5.5l1.7-.3 2 2a1.6 1.6 0 0 0-.3 1.8l2.1 1v4Z'],
    sun: ['M12 2v2', 'M12 20v2', 'M4.93 4.93l1.42 1.42', 'm17.65 17.65 1.42 1.42', 'M2 12h2', 'M20 12h2', 'm4.93 19.07 1.42-1.42', 'm17.65 6.35 1.42-1.42', 'M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z'],
    moon: ['M20.98 13A9 9 0 0 1 11 3.02 9 9 0 1 0 20.98 13Z'],
    refresh: ['M3 12a9 9 0 0 1 15.36-6.36L21 8', 'M21 3v5h-5', 'M21 12a9 9 0 0 1-15.36 6.36L3 16', 'M3 21v-5h5'],
    image: ['M3 3h18v18H3Z', 'M8.5 9a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z', 'm3 18 6-6 3 3 4-5 5 6'],
    sliders: ['M4 7h16', 'M4 17h16', 'M8 4v6', 'M16 14v6'],
    spark: ['m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8Z', 'M19 18v4', 'M17 20h4'],
    folder: ['M3 5h6l2 3h10v12H3Z'],
};
function Icon({ name, size = 20, className = '' }) {
    return React.createElement("svg", { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.7", strokeLinecap: "round", strokeLinejoin: "round", className: className, "aria-hidden": "true" }, (ICONS[name] || ICONS.info).map((d, i) => React.createElement("path", { d: d, key: i })));
}
function Logo({ dark = false }) { return React.createElement("span", { className: 'brand-lockup ' + (dark ? 'brand-light' : '') },
    React.createElement("span", { className: "brand-symbol" },
        React.createElement(Icon, { name: "waves", size: 18 })),
    React.createElement("span", null,
        "spongecheck",
        React.createElement("span", { className: "brand-dot" }, "."))); }
function PlacePhoto({ place, large = false }) { return React.createElement("img", { className: 'place-photo ' + (large ? 'place-photo-large' : ''), src: place.image, alt: 'Free stock photograph illustrating ' + place.name + '; not an actual sample township location', loading: "lazy", onError: e => { e.currentTarget.style.opacity = '0'; } }); }
function Status({ value }) { return React.createElement("span", { className: 'status-pill status-' + (value === 'Needs checking' ? 'attention' : value === 'Review needed' ? 'review' : 'normal') },
    React.createElement("span", { className: "status-dot" }),
    value); }
const EMPTY_OBSERVATIONS = { debris: 'unsure', sediment: 'unsure', vegetation: 'unsure' };
// Prewritten sample observations are not produced by AI; they accompany specific fictional examples.
const SAMPLE_OBSERVATIONS = {
    'A-01': { debris: 'visible', sediment: 'unsure', vegetation: 'normal' },
    'B-02': { debris: 'none', sediment: 'visible', vegetation: 'dense' },
    'C-03': { debris: 'none', sediment: 'none', vegetation: 'normal' },
    'D-04': { debris: 'visible', sediment: 'visible', vegetation: 'normal' },
    'E-05': { debris: 'none', sediment: 'unsure', vegetation: 'dense' },
    'F-06': { debris: 'unsure', sediment: 'none', vegetation: 'normal' },
};
function fmtDate(input) { try {
    return new Date(input).toLocaleString('en-MY', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}
catch {
    return input;
} }
function priorityName(p) { return p === 'urgent' ? 'Urgent inspection' : p === 'elevated' ? 'Check soon' : p === 'routine' ? 'Routine check' : 'More information needed'; }
function readLocal(key, fallback) { try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
}
catch {
    return fallback;
} }
function writeLocal(key, value) { try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
}
catch {
    return false;
} }
function removeLocal(key) { try {
    localStorage.removeItem(key);
    return true;
}
catch {
    return false;
} }
class App extends React.Component {
    constructor(props) {
        super(props);
        this.onPop = () => this.setState({ route: window.location.pathname, showMenu: false });
        this.nav = (route) => { if (this.state.showIntro)
            this.dismissIntro(); window.history.pushState({}, '', route); this.setState({ route, showMenu: false, showHelp: false, showSource: false }); window.scrollTo(0, 0); };
        this.notify = (message) => { this.setState({ toast: message }); window.clearTimeout(this.dismissTimer); this.dismissTimer = window.setTimeout(() => this.setState({ toast: '' }), 3500); };
        this.dismissIntro = () => { if (this.state.showIntro) {
            this.setState({ showIntro: false });
            writeLocal('sc-intro-seen', true);
        } };
        this.telegramUrl = (path) => this.state.telegramApiBase.trim().replace(/\/$/, '') + path;
        this.apiBaseChanged = (value) => { this.setState({ telegramApiBase: value, telegramStatus: null, telegramError: '', telegramCases: [], telegramDashboardKey: '', telegramSyncedAt: '' }); };
        this.validApiBase = () => {
            const raw = this.state.telegramApiBase.trim();
            if (!raw)
                return true;
            try {
                const u = new URL(raw);
                return u.protocol === 'https:' || (u.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(u.hostname));
            }
            catch {
                return false;
            }
        };
        this.refreshTelegramStatus = async () => {
            if (!this.validApiBase()) {
                this.setState({ telegramError: 'Use an HTTPS backend address (or localhost for testing).' });
                return;
            }
            // Standalone file previews are offline by design and cannot access the API.
            if (!this.state.telegramApiBase && !/^https?:$/.test(location.protocol)) {
                this.setState({ telegramStatus: { configured: false, connected: false, botUsername: '', message: 'Standalone demo: no backend is connected.' } });
                return;
            }
            this.setState({ telegramBusy: true, telegramError: '' });
            try {
                const r = await fetch(this.telegramUrl('/api/telegram/status'), { cache: 'no-store', signal: AbortSignal.timeout(4500) });
                if (!r.ok)
                    throw new Error('No SpongeBot backend was found at this address.');
                const data = await r.json();
                this.setState({ telegramStatus: data, telegramBusy: false });
            }
            catch (e) {
                this.setState({ telegramBusy: false, telegramStatus: { configured: false, connected: false, botUsername: '', message: 'Backend not reachable.' }, telegramError: e instanceof Error ? e.message : 'Backend could not be reached.' });
            }
        };
        this.refreshTelegramCases = async (silent = false) => {
            const key = this.state.telegramDashboardKey.trim();
            if (!key) {
                this.setState({ telegramError: 'Enter your dashboard access key first.' });
                return;
            }
            if (!this.validApiBase()) {
                this.setState({ telegramError: 'Enter a valid HTTPS backend address.' });
                return;
            }
            if (!silent)
                this.setState({ telegramBusy: true, telegramError: '' });
            try {
                const r = await fetch(this.telegramUrl('/api/telegram/cases'), { headers: { Authorization: 'Bearer ' + key }, cache: 'no-store', signal: AbortSignal.timeout(6000) });
                if (!r.ok)
                    throw new Error(r.status === 401 ? 'Access key not accepted. Check your backend key.' : 'Unable to load Telegram reports.');
                const data = await r.json();
                if (!Array.isArray(data.cases))
                    throw new Error('Unexpected backend response.');
                this.setState({ telegramCases: data.cases, telegramBusy: false, telegramError: '', telegramSyncedAt: new Date().toISOString() });
            }
            catch (e) {
                this.setState({ telegramBusy: false, telegramError: e instanceof Error ? e.message : 'Unable to retrieve reports.' });
            }
        };
        this.disconnectTelegram = () => this.setState({ telegramDashboardKey: '', telegramCases: [], telegramSyncedAt: '', telegramError: '', telegramMockVisible: false });
        this.setRole = (role) => { this.setState({ role }); writeLocal('sc-role', role); };
        this.setTheme = (theme) => { this.setState({ theme }); document.documentElement.dataset.theme = theme; writeLocal('sc-theme', theme); };
        this.setMotion = (reduceMotion) => { this.setState({ reduceMotion }); writeLocal('sc-reduced-motion', reduceMotion); };
        this.setScenario = (scenario) => { this.setState({ scenario }); writeLocal('sc-scenario', scenario); };
        this.latestReport = (assetId) => this.state.reports.find(r => { var _a; return r.placeId === assetId && ((_a = r.observations) === null || _a === void 0 ? void 0 : _a.inspectorConfirmed); });
        this.decisionFor = (assetId, scenario = this.state.scenario, action = 'inspect_only', reportId) => {
            var _a, _b, _c;
            const place = this.getPlace(assetId);
            const report = reportId ? this.state.reports.find(r => r.id === reportId) : this.latestReport(assetId);
            const obs = (_b = (_a = report === null || report === void 0 ? void 0 : report.observations) !== null && _a !== void 0 ? _a : SAMPLE_OBSERVATIONS[assetId]) !== null && _b !== void 0 ? _b : EMPTY_OBSERVATIONS;
            const criticality = (place.type === 'Outlet') ? 'high' : 'standard';
            const days = { 'A-01': 21, 'B-02': 12, 'C-03': 7, 'D-04': 18, 'E-05': 8, 'F-06': 10 };
            return evaluateInspection({ assetId, assetType: place.type, criticality, daysSinceInspection: (_c = days[assetId]) !== null && _c !== void 0 ? _c : null,
                observations: { debris: obs.debris, sediment: obs.sediment, vegetation: obs.vegetation }, scenario, action,
                provenance: report ? 'inspector_confirmed' : 'sample_fixture' });
        };
        this.decisionQueue = (scenario = this.state.scenario) => sortDecisions(PLACES.map(p => ({ id: p.id, place: p, decision: this.decisionFor(p.id, scenario) })));
        this.openDecision = (assetId, reportId) => { this.setState({ proposedAction: 'inspect_only' }); this.nav(reportId ? '/app/decisions/case/' + reportId : '/app/decisions/' + assetId); };
        this.openPlace = (id) => { this.setState({ selectedPlace: id }); this.nav('/app/places/' + id); };
        this.startReport = (id) => {
            this.setState({
                reportPlace: id || this.state.selectedPlace, reportNote: '', reportPhotoName: '', reportPhotoData: '',
                reportStep: 1, reportMode: 'manual_only', reportPhotoSource: null, observations: { ...EMPTY_OBSERVATIONS },
                observationConfirmed: false, reportError: '', reportPhotoError: ''
            });
            this.nav('/app/report');
        };
        this.chooseReportPlace = (id) => {
            const wasSample = this.state.reportPhotoSource === 'sample';
            this.setState({ reportPlace: id, reportError: '', ...(wasSample ? {
                    reportPhotoName: '', reportPhotoData: '', reportPhotoSource: null, reportMode: 'manual_only',
                    observations: { ...EMPTY_OBSERVATIONS }, observationConfirmed: false
                } : {}) });
        };
        this.useExamplePhoto = () => {
            const place = this.getPlace(this.state.reportPlace);
            this.setState({ reportPhotoName: 'Example image — ' + place.name, reportPhotoData: place.image,
                reportPhotoSource: 'sample', reportMode: 'simulated_labels',
                observations: { ...SAMPLE_OBSERVATIONS[place.id] }, observationConfirmed: false,
                reportPhotoError: '', reportError: '' });
            this.notify('Example photo added. The findings are prewritten demo labels.');
        };
        this.removeReportPhoto = () => {
            this.setState({ reportPhotoName: '', reportPhotoData: '', reportPhotoSource: null,
                reportMode: 'manual_only', observations: { ...EMPTY_OBSERVATIONS }, observationConfirmed: false, reportPhotoError: '', reportError: '' });
            const input = document.getElementById('report-photo');
            if (input)
                input.value = '';
        };
        this.changeObservation = (key, value) => {
            this.setState(s => ({ observations: { ...s.observations, [key]: value }, observationConfirmed: false, reportError: '' }));
        };
        this.nextReportStep = () => {
            if (this.state.reportStep === 1) {
                if (!this.state.reportPlace) {
                    this.setState({ reportError: 'Choose a place to continue.' });
                    return;
                }
                if (!this.state.reportPhotoData) {
                    this.setState({ reportError: 'Add a photo or select an example photo to continue.' });
                    return;
                }
                this.setState({ reportStep: 2, reportError: '' });
                window.scrollTo(0, 0);
                return;
            }
            if (this.state.reportStep === 2) {
                if (!this.state.observationConfirmed) {
                    this.setState({ reportError: 'Please confirm that you reviewed the observations.' });
                    return;
                }
                this.setState({ reportStep: 3, reportError: '' });
                window.scrollTo(0, 0);
            }
        };
        this.previousReportStep = () => { this.setState(s => ({ reportStep: Math.max(1, s.reportStep - 1), reportError: '' })); window.scrollTo(0, 0); };
        this.markAllRead = () => { const notices = this.state.notices.map(n => ({ ...n, read: true })); this.setState({ notices }); writeLocal('sc-notices', notices); this.notify('All updates marked as read.'); };
        this.openNotice = (n) => { const notices = this.state.notices.map(m => m.id === n.id ? { ...m, read: true } : m); this.setState({ notices }); writeLocal('sc-notices', notices); this.nav(n.caseId ? '/app/reports/' + n.caseId : '/app/updates'); };
        this.resetDemo = () => { ['sc-reports', 'sc-notices', 'sc-scenario'].forEach(removeLocal); this.setState({ reports: [], notices: INITIAL_NOTICES, showReset: false, scenario: 'dry', compareRain: false, decisionFilter: 'all', proposedAction: 'inspect_only', workAction: 'remove_debris', workReason: '', workCrew: 'Field team A', workNote: '', workAfterData: '', workAfterName: '', workPhotoBusy: false, workError: '', workSlider: 50, reportNote: '', reportPhotoName: '', reportPhotoData: '', reportStep: 1, reportMode: 'manual_only', reportPhotoSource: null, observations: { ...EMPTY_OBSERVATIONS }, observationConfirmed: false, reportError: '', reportPhotoError: '', filter: 'All', search: '' }); this.notify('Sample data restored.'); this.nav('/app/overview'); };
        this.onPhoto = async (e) => {
            var _a;
            const file = (_a = e.target.files) === null || _a === void 0 ? void 0 : _a[0];
            if (!file)
                return;
            if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
                this.setState({ reportPhotoError: 'Choose a JPG, PNG or WebP image.', reportError: '' });
                e.target.value = '';
                return;
            }
            if (file.size > 6 * 1024 * 1024) {
                this.setState({ reportPhotoError: 'This photo is too large. Choose one under 6 MB.' });
                e.target.value = '';
                return;
            }
            this.setState({ reportBusy: true, reportPhotoError: '', reportError: '' });
            try {
                const data = await new Promise((resolve, reject) => {
                    const fr = new FileReader();
                    fr.onload = () => {
                        const img = new Image();
                        img.onload = () => {
                            const c = document.createElement('canvas');
                            const scale = Math.min(1, 1280 / Math.max(img.width, img.height));
                            c.width = Math.max(1, Math.round(img.width * scale));
                            c.height = Math.max(1, Math.round(img.height * scale));
                            const ctx = c.getContext('2d');
                            if (!ctx) {
                                reject(new Error('canvas unavailable'));
                                return;
                            }
                            ctx.drawImage(img, 0, 0, c.width, c.height);
                            resolve(c.toDataURL('image/jpeg', .70));
                        };
                        img.onerror = () => reject(new Error('Cannot read image'));
                        img.src = String(fr.result);
                    };
                    fr.onerror = () => reject(new Error('Cannot open file'));
                    fr.readAsDataURL(file);
                });
                this.setState({ reportPhotoName: file.name, reportPhotoData: data, reportPhotoSource: 'uploaded',
                    reportMode: 'manual_only', observations: { ...EMPTY_OBSERVATIONS }, observationConfirmed: false,
                    reportBusy: false, reportPhotoError: '', reportError: '' });
                this.notify('Photo added. Describe what you can see in the next step.');
            }
            catch {
                this.setState({ reportBusy: false, reportPhotoError: 'Could not open the photo. Please try another file.' });
            }
        };
        this.createReport = (e) => {
            e.preventDefault();
            if (this.state.role === 'Guest') {
                this.setState({ reportError: 'Switch to an inspector, manager or reviewer demo role to save a report.' });
                return;
            }
            if (this.state.reportStep !== 3) {
                this.setState({ reportError: 'Finish the inspection steps before saving.' });
                return;
            }
            if (!this.state.reportPhotoData || !this.state.reportPlace || !this.state.observationConfirmed) {
                this.setState({ reportError: 'This inspection is missing required information. Go back and review it.' });
                return;
            }
            if (this.state.reportNote.trim().length < 12) {
                this.setState({ reportError: 'Add at least 12 characters explaining what you noticed.' });
                return;
            }
            const createdAt = new Date().toISOString();
            const report = { id: 'SC-' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).slice(2, 5).toUpperCase(),
                placeId: this.state.reportPlace, note: this.state.reportNote.trim(), photoName: this.state.reportPhotoName,
                photoData: this.state.reportPhotoData, createdAt, status: 'Reported — awaiting review', schemaVersion: 3,
                photoSource: this.state.reportPhotoSource || 'uploaded',
                observations: { ...this.state.observations, inspectorConfirmed: true, analysisMode: this.state.reportMode },
                events: [{ id: 'event-' + Date.now(), atUtc: createdAt, type: 'report_created', actor: this.state.role,
                        description: 'Inspection submitted with a reviewed photo and confirmed observations.' }] };
            const reports = [report, ...this.state.reports];
            const place = PLACES.find(p => p.id === report.placeId);
            const notice = { id: 'notice-' + report.id, title: 'Report ' + report.id + ' created',
                desc: 'Your inspection for ' + ((place === null || place === void 0 ? void 0 : place.name) || 'this place') + ' was saved.', date: fmtDate(report.createdAt), read: false, caseId: report.id };
            const notices = [notice, ...this.state.notices];
            try {
                localStorage.setItem('sc-reports', JSON.stringify(reports));
                localStorage.setItem('sc-notices', JSON.stringify(notices));
                this.setState({ reports, notices, reportPhotoData: '', reportPhotoName: '', reportNote: '', reportStep: 1,
                    reportMode: 'manual_only', reportPhotoSource: null, observations: { ...EMPTY_OBSERVATIONS }, observationConfirmed: false, reportError: '' });
                this.notify('Your practice inspection was saved.');
                this.nav('/app/reports/' + report.id);
            }
            catch {
                this.setState({ reportError: 'We could not save the report on this device. Storage may be full. Your form is still here; try another browser or smaller photo.' });
            }
        };
        this.openWork = (reportId) => { this.setState({ workAction: 'remove_debris', workReason: '', workNote: '', workCrew: 'Field team A', workAfterData: '', workAfterName: '', workError: '', workSlider: 50 }); this.nav('/app/work/' + reportId); };
        this.openVerify = (reportId) => { this.setState({ workSlider: 50, workNote: '', workError: '' }); this.nav('/app/verify/' + reportId); };
        this.updateCase = (id, command, params = {}) => {
            const found = this.state.reports.find(r => r.id === id);
            if (!found) {
                this.setState({ workError: 'This report could not be found.' });
                return;
            }
            try {
                const updated = advanceCase(found, command, this.state.role, params);
                const reports = this.state.reports.map(r => r.id === id ? updated : r);
                const place = this.getPlace(updated.placeId);
                const notice = { id: 'notice-' + Date.now() + '-' + command, title: place.name + ' — ' + updated.status, desc: 'Case ' + id + ' updated: ' + command + '.', date: fmtDate(new Date().toISOString()), read: false, caseId: id };
                const notices = [notice, ...this.state.notices];
                localStorage.setItem('sc-reports', JSON.stringify(reports));
                localStorage.setItem('sc-notices', JSON.stringify(notices));
                this.setState({ reports, notices, workError: '', workReason: '', workNote: '', workAfterData: '', workAfterName: '' });
                this.notify(command === 'propose' ? 'Maintenance proposal saved.' : command === 'complete' ? 'Evidence sent for verification.' : command === 'verify' ? 'Work evidence verified.' : 'Case updated successfully.');
            }
            catch (e) {
                this.setState({ workError: e instanceof WorkflowError ? e.message : 'Could not save your change. Check device storage and try again.' });
            }
        };
        this.proposeWork = (id) => {
            const report = this.state.reports.find(r => r.id === id);
            if (!report) {
                return;
            }
            const decision = this.decisionFor(report.placeId, this.state.scenario, this.state.workAction, id);
            if (decision.intervention === 'not_proposed') {
                this.setState({ workError: 'Choose a type of maintenance work first.' });
                return;
            }
            this.updateCase(id, 'propose', { action: this.state.workAction, requiresReview: decision.intervention === 'review_required' });
        };
        this.onAfterPhoto = async (e) => {
            var _a;
            const file = (_a = e.target.files) === null || _a === void 0 ? void 0 : _a[0];
            if (!file)
                return;
            if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
                this.setState({ workError: 'Choose a JPG, PNG or WebP photograph.' });
                e.target.value = '';
                return;
            }
            if (file.size > 6 * 1024 * 1024) {
                this.setState({ workError: 'Please choose a photo smaller than 6 MB.' });
                e.target.value = '';
                return;
            }
            this.setState({ workPhotoBusy: true, workError: '' });
            try {
                const result = await new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onerror = reject;
                    reader.onload = () => {
                        const img = new Image();
                        img.onerror = reject;
                        img.onload = () => {
                            const c = document.createElement('canvas');
                            const scale = Math.min(1, 1100 / Math.max(img.width, img.height));
                            c.width = Math.max(1, Math.round(img.width * scale));
                            c.height = Math.max(1, Math.round(img.height * scale));
                            const ctx = c.getContext('2d');
                            if (!ctx) {
                                reject(new Error('canvas'));
                                return;
                            }
                            ctx.drawImage(img, 0, 0, c.width, c.height);
                            resolve(c.toDataURL('image/jpeg', 0.68));
                        };
                        img.src = String(reader.result);
                    };
                    reader.readAsDataURL(file);
                });
                this.setState({ workAfterData: result, workAfterName: file.name, workPhotoBusy: false });
            }
            catch {
                this.setState({ workPhotoBusy: false, workError: 'Could not read the photo. Try a different image.' });
            }
        };
        this.bundleFor = (r) => {
            const p = this.getPlace(r.placeId), d = this.decisionFor(r.placeId, this.state.scenario, 'inspect_only', r.id);
            const c = { id: r.id, placeId: r.placeId, placeName: p.name, createdAt: r.createdAt, status: r.status,
                note: r.note, photoName: r.photoName, photoData: r.photoData, photoSource: r.photoSource, observations: r.observations,
                events: r.events || [], workflow: r.workflow };
            return { case: c, scenario: RAIN_SCENARIOS[this.state.scenario].name,
                decision: { priority: priorityName(d.priority), summary: d.summary, ruleset: d.ruleset,
                    factors: d.factors.map(f => ({ label: f.label, value: String(f.points) + ' sample points', explanation: f.reason, source: f.origin })),
                    uncertainties: d.uncertainties, interventionStatus: d.intervention },
                generatedAt: new Date().toISOString(), demoNotice: DEMO_NOTICE, source: r.photoSource === 'sample' ? 'Example photograph / confirmed sample labels' : 'Browser-stored inspector demonstration' };
        };
        this.doExport = async (action, success) => {
            if (this.state.exportBusy)
                return;
            this.setState({ exportBusy: true, exportError: '', exportSuccess: '' });
            try {
                await action();
                this.setState({ exportBusy: false, exportError: '', exportSuccess: success });
                this.notify(success);
            }
            catch (err) {
                this.setState({ exportBusy: false, exportSuccess: '', exportError: 'Could not create the download. Please check available browser storage or try again.' });
            }
        };
        this.downloadCase = async (id, format) => {
            const r = this.state.reports.find(r => r.id === id);
            if (!r) {
                this.setState({ exportError: 'That report is no longer available.' });
                return;
            }
            const b = this.bundleFor(r);
            await this.doExport(async () => {
                var _a, _b;
                if (format === 'pdf')
                    saveBlob(await makePdf('Inspection & evidence report', caseSections(b), r.photoData, (_b = (_a = r.workflow) === null || _a === void 0 ? void 0 : _a.completion) === null || _b === void 0 ? void 0 : _b.afterPhotoData), exportFileName(id, 'pdf'));
                else if (format === 'html')
                    saveBlob(textBlob(makeEvidenceHtml(b), 'text/html;charset=utf-8'), exportFileName(id, 'html'));
                else
                    saveBlob(textBlob(JSON.stringify(b, null, 2), 'application/json'), exportFileName(id, 'json'));
            }, 'Report downloaded.');
        };
        this.filteredReports = () => { const since = this.state.insightsPeriod === 'week' ? Date.now() - 7 * 86400000 : this.state.insightsPeriod === 'month' ? Date.now() - 30 * 86400000 : 0; return this.state.reports.filter(r => !since || (Date.parse(r.createdAt) || 0) >= since); };
        this.downloadSummary = async (format) => {
            const filtered = this.filteredReports(), data = filtered.map(r => this.bundleFor(r).case);
            await this.doExport(async () => {
                if (format === 'csv')
                    saveBlob(textBlob(makeSummaryCsv(data), 'text/csv;charset=utf-8'), 'SpongeCheck_Sample_Cases.csv');
                else {
                    const sections = [{ title: 'Prototype scope', lines: [DEMO_NOTICE, 'Time filter: ' + this.state.insightsPeriod, 'Generated from ' + data.length + ' saved cases on this browser. Telegram cases are not included.'] },
                        { title: 'Overview', lines: [`Cases: ${data.length}`, `Awaiting nature review: ${data.filter(c => { var _a, _b; return ((_b = (_a = c.workflow) === null || _a === void 0 ? void 0 : _a.review) === null || _b === void 0 ? void 0 : _b.decision) === 'pending'; }).length}`, `Work verified: ${data.filter(c => { var _a, _b; return ((_b = (_a = c.workflow) === null || _a === void 0 ? void 0 : _a.verification) === null || _b === void 0 ? void 0 : _b.decision) === 'verified'; }).length}`, `Reports with photos: ${data.filter(c => !!c.photoData).length}`] },
                        { title: 'Individual case status', lines: data.length ? data.map(c => { var _a; return `${c.id} | ${c.placeName} | ${((_a = c.workflow) === null || _a === void 0 ? void 0 : _a.status) || c.status}`; }) : ['No saved cases in this period.'] }];
                    saveBlob(await makePdf('Operations summary (demo)', sections), 'SpongeCheck_Operations_Summary.pdf');
                }
            }, 'Summary downloaded.');
        };
        this.exportControls = (id) => React.createElement("div", { className: "download-actions", "aria-label": "Download this report" },
            React.createElement("button", { type: "button", className: "btn btn-primary", disabled: this.state.exportBusy, onClick: () => this.downloadCase(id, 'pdf') },
                React.createElement(Icon, { name: "folder", size: 17 }),
                " ",
                this.state.exportBusy ? 'Preparing…' : 'Download PDF'),
            React.createElement("button", { type: "button", className: "btn btn-secondary", disabled: this.state.exportBusy, onClick: () => this.downloadCase(id, 'html') },
                React.createElement(Icon, { name: "image", size: 17 }),
                " Evidence with photos"),
            React.createElement("button", { type: "button", className: "btn btn-secondary", disabled: this.state.exportBusy, onClick: () => this.downloadCase(id, 'json') },
                React.createElement(Icon, { name: "folder", size: 17 }),
                " Export case data"));
        this.exportFeedback = () => React.createElement("div", { className: "export-feedback", "aria-live": "polite" },
            this.state.exportSuccess && React.createElement("p", { className: "export-success", role: "status" },
                React.createElement(Icon, { name: "check", size: 16 }),
                this.state.exportSuccess),
            this.state.exportError && React.createElement("p", { className: "field-error", role: "alert" }, this.state.exportError));
        this.state = {
            route: window.location.pathname, role: readLocal('sc-role', 'Inspector'), theme: readLocal('sc-theme', 'light'),
            showMenu: false, showIntro: !readLocal('sc-intro-seen', false), showHelp: false, showSource: false, toast: '', filter: 'All', search: '', viewMode: 'map',
            selectedPlace: 'A-01', notices: readLocal('sc-notices', INITIAL_NOTICES), reports: readLocal('sc-reports', []), reportPlace: 'A-01',
            reportNote: '', reportPhotoName: '', reportPhotoData: '', reportBusy: false, reportStep: 1, reportMode: 'manual_only', reportPhotoSource: null, observations: { ...EMPTY_OBSERVATIONS }, observationConfirmed: false, reportError: '', reportPhotoError: '', showReset: false, reduceMotion: readLocal('sc-reduced-motion', false), demoTour: 0, showFeatured: true, scenario: readLocal('sc-scenario', 'dry'), compareRain: false, decisionFilter: 'all', proposedAction: 'inspect_only', workAction: 'remove_debris', workReason: '', workCrew: 'Field team A', workNote: '', workAfterData: '', workAfterName: '', workPhotoBusy: false, workError: '', workSlider: 50, telegramApiBase: '', telegramDashboardKey: '', telegramBusy: false, telegramError: '', telegramStatus: null, telegramCases: [], telegramSyncedAt: '', telegramMockVisible: false, exportBusy: false, exportError: '', exportSuccess: '', insightsPeriod: 'all'
        };
    }
    componentDidMount() { window.addEventListener('popstate', this.onPop); this.refreshTelegramStatus(); this.telegramPoll = window.setInterval(() => { if (this.state.telegramDashboardKey && !document.hidden)
        this.refreshTelegramCases(true); }, 15000); document.documentElement.dataset.theme = this.state.theme; if (this.state.showIntro) {
        this.introTimer = window.setTimeout(() => this.dismissIntro(), 2200);
    } }
    componentWillUnmount() { window.removeEventListener('popstate', this.onPop); window.clearTimeout(this.dismissTimer); window.clearTimeout(this.introTimer); window.clearInterval(this.telegramPoll); }
    demoRolePicker() { return React.createElement("label", { className: "workflow-role-switch" },
        "Demo role ",
        React.createElement("select", { "aria-label": "Demo role", value: this.state.role, onChange: e => this.setRole(e.target.value) },
            React.createElement("option", { value: "Inspector" }, "Field inspector"),
            React.createElement("option", { value: "Manager" }, "Operations manager"),
            React.createElement("option", { value: "Reviewer" }, "Nature reviewer"),
            React.createElement("option", { value: "Guest" }, "Guest \u2014 read only")),
        React.createElement("small", null, "Practice permissions only; not secure login.")); }
    getPlace(id) { return PLACES.find(p => p.id === id) || PLACES[0]; }
    render() {
        const s = this.state;
        const publicPage = ['/', '/sign-in', '/demo', '/about'].includes(s.route);
        return React.createElement("div", { className: 'app ' + (publicPage ? 'public-app' : 'internal-app') + (s.reduceMotion ? ' reduce-motion' : '') },
            publicPage ? this.renderPublic() : this.renderApp(),
            s.showIntro && s.route === '/' && !s.reduceMotion && React.createElement("div", { className: "splash-stage", "aria-label": "SpongeCheck introduction" },
                React.createElement("div", { className: "splash-orbit splash-orbit-one" }),
                React.createElement("div", { className: "splash-orbit splash-orbit-two" }),
                React.createElement("div", { className: "splash-content" },
                    React.createElement(Logo, { dark: true }),
                    React.createElement("p", null, "Every drop. Every decision.")),
                React.createElement("button", { type: "button", className: "splash-skip", onClick: this.dismissIntro },
                    "Skip intro ",
                    React.createElement(Icon, { name: "arrow", size: 16 }))),
            s.toast && React.createElement("div", { className: "toast", role: "status" },
                React.createElement(Icon, { name: "check", size: 17 }),
                s.toast,
                React.createElement("button", { type: "button", "aria-label": "Dismiss notification", onClick: () => this.setState({ toast: '' }) },
                    React.createElement(Icon, { name: "x", size: 15 }))),
            s.showHelp && this.modal('Need a hand?', React.createElement(React.Fragment, null,
                React.createElement("p", null,
                    "This is a sample SpongeCheck project. Choose ",
                    React.createElement("b", null, "Explore demo"),
                    " to see six example places, create a practice report and browse updates."),
                React.createElement("p", null, "No real township infrastructure is monitored in this prototype. Report photos are stored in this browser only."),
                React.createElement("button", { type: "button", className: "btn btn-primary", onClick: () => this.setState({ showHelp: false }) }, "Got it")), () => this.setState({ showHelp: false })),
            s.showSource && this.modal('About this demonstration', React.createElement(React.Fragment, null,
                React.createElement("p", null, "All locations, statuses, zones and seeded updates are fictional. Sample photographs are illustrative stock images and must not be interpreted as evidence from real sites."),
                React.createElement("p", null,
                    "Brand design: Crimson Current. Source image links and photographer credits are listed in ",
                    React.createElement("code", null, "image-credits.md"),
                    "."),
                React.createElement("p", null, "Phase 4 adds a deterministic rain simulator and decision explanations. Rainfall inputs, asset priority rules and sample inspection dates are illustrative, not live forecasts or validated engineering assessments. Demo ecological approvals are local and model inference is not connected. Telegram integration requires a configured BotFather token, deployed backend, and authenticated read-only dashboard."),
                React.createElement("button", { type: "button", className: "btn btn-primary", onClick: () => this.setState({ showSource: false }) }, "Close")), () => this.setState({ showSource: false })),
            s.showReset && this.modal('Reset sample data?', React.createElement(React.Fragment, null,
                React.createElement("p", null, "This removes reports you created in this browser, resets the rainfall scenario and restores the original sample updates. You cannot undo this."),
                React.createElement("div", { className: "modal-actions" },
                    React.createElement("button", { type: "button", className: "btn btn-secondary", onClick: () => this.setState({ showReset: false }) }, "Keep my reports"),
                    React.createElement("button", { type: "button", className: "btn btn-danger", onClick: this.resetDemo }, "Reset demo"))), () => this.setState({ showReset: false })));
    }
    modal(title, body, onClose) { return React.createElement("div", { className: "modal-backdrop", role: "presentation", onMouseDown: e => { if (e.target === e.currentTarget)
            onClose(); } },
        React.createElement("section", { role: "dialog", "aria-modal": "true", "aria-label": title, className: "modal" },
            React.createElement("button", { type: "button", className: "icon-button modal-close", "aria-label": "Close dialog", onClick: onClose },
                React.createElement(Icon, { name: "x" })),
            React.createElement("h2", null, title),
            body)); }
    renderPublic() {
        const route = this.state.route;
        return React.createElement(React.Fragment, null,
            React.createElement("header", { className: "public-header" },
                React.createElement("button", { type: "button", className: "brand-button", "aria-label": "SpongeCheck home", onClick: () => this.nav('/') },
                    React.createElement(Logo, null)),
                React.createElement("nav", { className: "public-links", "aria-label": "Main navigation" },
                    React.createElement("button", { type: "button", onClick: () => this.nav('/about') }, "Our approach"),
                    React.createElement("button", { type: "button", onClick: () => this.setState({ showSource: true }) }, "About the demo"),
                    React.createElement("button", { type: "button", className: "btn btn-outline-dark btn-small", onClick: () => this.nav('/sign-in') },
                        "Explore demo ",
                        React.createElement(Icon, { name: "arrow", size: 16 }))),
                React.createElement("button", { type: "button", className: "icon-button public-mobile-menu", "aria-label": "Open menu", onClick: () => this.setState({ showMenu: !this.state.showMenu }) },
                    React.createElement(Icon, { name: this.state.showMenu ? 'x' : 'menu' }))),
            this.state.showMenu && React.createElement("div", { className: "mobile-popup-menu" },
                React.createElement("button", { onClick: () => this.nav('/about') }, "Our approach"),
                React.createElement("button", { onClick: () => this.setState({ showSource: true, showMenu: false }) }, "About this demo"),
                React.createElement("button", { onClick: () => this.nav('/sign-in') }, "Explore demo")),
            route === '/sign-in' ? this.accessPage() : route === '/demo' ? this.tourPage() : route === '/about' ? this.aboutPage() : this.landingPage(),
            route === '/' && React.createElement("footer", { className: "public-footer" },
                React.createElement(Logo, null),
                React.createElement("span", null, "Thoughtful decisions for the places we share."),
                React.createElement("button", { onClick: () => this.setState({ showSource: true }) },
                    "Image credits & limitations ",
                    React.createElement(Icon, { name: "arrow", size: 14 }))));
    }
    landingPage() {
        return React.createElement("main", { className: "landing landing-phase2" },
            React.createElement("section", { className: "hero hero-phase2" },
                React.createElement("div", { className: "hero-visual" },
                    React.createElement("img", { src: "https://images.pexels.com/photos/33327189/pexels-photo-33327189.jpeg?auto=compress&cs=tinysrgb&w=1800", onError: e => { e.currentTarget.style.opacity = "0"; }, alt: "Illustrative aerial wetland photograph; not a SpongeCheck site" }),
                    React.createElement("div", { className: "hero-image-overlay" })),
                React.createElement("div", { className: "hero-copy" },
                    React.createElement("div", { className: "eyebrow eyebrow-light" },
                        React.createElement("span", { className: "eyebrow-line" }),
                        " BUILT FOR THE PLACES WE SHARE"),
                    React.createElement("h1", null,
                        "Every drop.",
                        React.createElement("br", null),
                        React.createElement("em", null, "Every decision.")),
                    React.createElement("p", null, "Spot issues sooner. Understand what needs attention. Care for the wetlands and waterways that protect our neighborhoods."),
                    React.createElement("div", { className: "hero-actions" },
                        React.createElement("button", { type: "button", className: "btn btn-white", onClick: () => this.nav('/sign-in') },
                            "Explore the demo ",
                            React.createElement(Icon, { name: "up", size: 19 })),
                        React.createElement("button", { type: "button", className: "hero-text-link", onClick: () => { var _a; return (_a = document.getElementById('how-it-works')) === null || _a === void 0 ? void 0 : _a.scrollIntoView({ behavior: 'smooth' }); } },
                            "See how it works ",
                            React.createElement(Icon, { name: "arrow", size: 17 }))),
                    React.createElement("span", { className: "hero-disclaimer" }, "Fictional township \u00B7 Practice reports \u00B7 No live weather data")),
                React.createElement("div", { className: "hero-floating", "aria-label": "Example sample workflow" },
                    React.createElement("span", { className: "hf-label" },
                        React.createElement("span", { className: "hf-live" }),
                        " SAMPLE EXPERIENCE"),
                    React.createElement("div", { className: "hf-divider" }),
                    React.createElement("div", { className: "hf-row" },
                        React.createElement("span", { className: "hf-icon" },
                            React.createElement(Icon, { name: "camera", size: 19 })),
                        React.createElement("span", null,
                            React.createElement("b", null, "A clearer way to report"),
                            React.createElement("small", null, "Photo \u00B7 Place \u00B7 Simple notes"))),
                    React.createElement("div", { className: "hf-timeline" },
                        React.createElement("span", null),
                        React.createElement("span", null),
                        React.createElement("span", null)),
                    React.createElement("div", { className: "hf-footer" },
                        "From first report to next action ",
                        React.createElement(Icon, { name: "arrow", size: 15 }))),
                React.createElement("div", { className: "hero-side-note" },
                    React.createElement("span", null, "DESIGNED FOR THE TOWNSHIP OF TOMORROW"),
                    React.createElement("span", null, "DISCOVER / 2026"))),
            React.createElement("section", { className: "marquee-strip", "aria-label": "Product values" },
                React.createElement("span", null, "Simple reporting"),
                React.createElement("i", null),
                " ",
                React.createElement("span", null, "Clear priorities"),
                React.createElement("i", null),
                " ",
                React.createElement("span", null, "Careful decisions"),
                React.createElement("i", null),
                " ",
                React.createElement("span", null, "One shared view")),
            React.createElement("section", { className: "intro-verse", id: "how-it-works" },
                React.createElement("div", null,
                    React.createElement("span", { className: "eyebrow" }, "DESIGNED FOR REAL PEOPLE"),
                    React.createElement("h2", null,
                        "Easy to start.",
                        React.createElement("br", null),
                        React.createElement("span", null, "Thoughtful by design."))),
                React.createElement("div", { className: "intro-verse-right" },
                    React.createElement("p", null, "For people checking the field. For people coordinating the work. We make important information feel clear, calm, and easy to act on."),
                    React.createElement("button", { type: "button", className: "text-cta", onClick: () => this.nav('/demo') },
                        "Take the three-step tour ",
                        React.createElement(Icon, { name: "arrow", size: 17 })))),
            React.createElement("section", { className: "journey-steps", "aria-label": "See how it works" }, [{ no: '01', title: 'Notice something?', text: 'Choose a place and share what you see.', icon: 'camera', route: '/sign-in' }, { no: '02', title: 'See the bigger picture.', text: 'Find example places and review what needs attention.', icon: 'map', route: '/sign-in' }, { no: '03', title: 'Keep everyone in the loop.', text: 'Follow updates and save a clear record of your report.', icon: 'bell', route: '/demo' }].map(item => React.createElement("button", { type: "button", className: "journey-step", key: item.no, onClick: () => this.nav(item.route) },
                React.createElement("span", { className: "journey-step-top" },
                    React.createElement("span", null,
                        item.no,
                        " / THE EXPERIENCE"),
                    React.createElement(Icon, { name: "up", size: 18 })),
                React.createElement("span", { className: "journey-icon" },
                    React.createElement(Icon, { name: item.icon, size: 23 })),
                React.createElement("strong", null, item.title),
                React.createElement("small", null, item.text)))),
            React.createElement("section", { className: "editorial-showcase" },
                React.createElement("div", { className: "editorial-image" },
                    React.createElement("img", { src: "https://images.pexels.com/photos/39921710/pexels-photo-39921710.jpeg?auto=compress&cs=tinysrgb&w=1400", onError: e => { e.currentTarget.style.opacity = "0"; }, alt: "Free stock photograph of wetlands; not a project inspection location", loading: "lazy" }),
                    React.createElement("span", { className: "photo-caption" }, "FREE-LICENSED EDITORIAL PHOTOGRAPH \u00B7 NOT A DEMO SITE")),
                React.createElement("div", { className: "editorial-copy" },
                    React.createElement("span", { className: "eyebrow" }, "WHY IT MATTERS"),
                    React.createElement("h2", null,
                        "Nature isn't",
                        React.createElement("br", null),
                        React.createElement("em", null, "an afterthought.")),
                    React.createElement("p", null, "Wetlands are living systems. A good inspection process should help teams see what needs checking while respecting the environment around it."),
                    React.createElement("button", { type: "button", className: "btn btn-primary", onClick: () => this.nav('/about') },
                        "Explore our approach ",
                        React.createElement(Icon, { name: "arrow", size: 18 })))),
            React.createElement("section", { className: "feature-grid", "aria-label": "Explore SpongeCheck" },
                React.createElement("button", { type: "button", className: "feature-card feature-primary", onClick: () => this.nav('/sign-in') },
                    React.createElement("div", { className: "feature-icon" },
                        React.createElement(Icon, { name: "camera", size: 23 })),
                    React.createElement("div", null,
                        React.createElement("span", null, "01 / EASY REPORTING"),
                        React.createElement("h3", null,
                            "See something?",
                            React.createElement("br", null),
                            "Share it."),
                        React.createElement("p", null, "Choose a place, add a photo and create a report without complicated forms.")),
                    React.createElement("div", { className: "feature-footer" },
                        "Try a practice report ",
                        React.createElement(Icon, { name: "up", size: 19 }))),
                React.createElement("button", { type: "button", className: "feature-card feature-image", onClick: () => this.nav('/sign-in') },
                    React.createElement("img", { src: "https://images.pexels.com/photos/8383683/pexels-photo-8383683.jpeg?auto=compress&cs=tinysrgb&w=1000", onError: e => { e.currentTarget.style.opacity = "0"; }, alt: "Free stock photograph of a wetland boardwalk", loading: "lazy" }),
                    React.createElement("div", { className: "feature-gradient" }),
                    React.createElement("div", { className: "feature-image-copy" },
                        React.createElement("span", null, "02 / PLACES THAT MATTER"),
                        React.createElement("h3", null,
                            "Every place",
                            React.createElement("br", null),
                            "has a story."),
                        React.createElement("div", null,
                            "Browse example places ",
                            React.createElement(Icon, { name: "up", size: 18 })))),
                React.createElement("button", { type: "button", className: "feature-card feature-dark", onClick: () => this.nav('/about') },
                    React.createElement("div", { className: "feature-icon" },
                        React.createElement(Icon, { name: "shield", size: 23 })),
                    React.createElement("div", null,
                        React.createElement("span", null, "03 / RESPONSIBLE CARE"),
                        React.createElement("h3", null,
                            "Look closer.",
                            React.createElement("br", null),
                            "Act thoughtfully."),
                        React.createElement("p", null, "Better records help teams make decisions with more context and care.")),
                    React.createElement("div", { className: "feature-footer" },
                        "Learn our approach ",
                        React.createElement(Icon, { name: "up", size: 19 })))),
            React.createElement("section", { className: "closing-cta closing-phase2" },
                React.createElement("div", { className: "closing-mark" },
                    React.createElement(Icon, { name: "waves", size: 28 })),
                React.createElement("span", { className: "eyebrow" }, "YOUR NEXT STEP"),
                React.createElement("h2", null,
                    "Ready to explore",
                    React.createElement("br", null),
                    "a better way?"),
                React.createElement("p", null, "Take a guided look around SpongeCheck. No account or installation needed."),
                React.createElement("button", { type: "button", className: "btn btn-primary", onClick: () => this.nav('/sign-in') },
                    "Open the demo ",
                    React.createElement(Icon, { name: "arrow", size: 18 }))));
    }
    accessPage() { return React.createElement("main", { className: "access-layout" },
        React.createElement("div", { className: "access-media" },
            React.createElement("img", { src: "https://images.pexels.com/photos/10569068/pexels-photo-10569068.jpeg?auto=compress&cs=tinysrgb&w=1300", onError: e => { e.currentTarget.style.opacity = "0"; }, alt: "Free stock photograph of rainy weather, not a SpongeCheck inspection" }),
            React.createElement("div", { className: "access-media-overlay" }),
            React.createElement("div", { className: "access-quote" },
                React.createElement("span", null, "THE FIELD, CONNECTED."),
                React.createElement("h2", null, "Great care starts with clearer information."))),
        React.createElement("div", { className: "access-form-column" },
            React.createElement("div", { className: "access-panel" },
                React.createElement("span", { className: "eyebrow" }, "EXPLORE THE EXPERIENCE"),
                React.createElement("h1", null,
                    "Make yourself",
                    React.createElement("br", null),
                    "at home."),
                React.createElement("p", null, "Choose a sample role to see how SpongeCheck feels for different people. This is a demonstration, not a real account."),
                React.createElement("div", { className: "role-options", role: "group", "aria-label": "Choose demo role" }, ['Inspector', 'Manager', 'Reviewer', 'Guest'].map(role => React.createElement("button", { key: role, type: "button", "aria-pressed": this.state.role === role, className: 'role-option ' + (this.state.role === role ? 'selected' : ''), onClick: () => this.setRole(role) },
                    React.createElement("span", { className: "role-avatar" }, role.charAt(0)),
                    React.createElement("span", null,
                        React.createElement("b", null, role === 'Inspector' ? 'Field inspector' : role === 'Reviewer' ? 'Nature reviewer' : role === 'Guest' ? 'Just exploring' : 'Operations manager'),
                        React.createElement("small", null, role === 'Inspector' ? 'Reports and inspections' : role === 'Reviewer' ? 'Reviews and checks' : role === 'Guest' ? 'Browse sample information' : 'Manage sample places')),
                    React.createElement("span", { className: "role-radio" })))),
                React.createElement("button", { type: "button", className: "btn btn-primary btn-block", onClick: () => this.nav('/app/overview') },
                    "Continue as ",
                    this.state.role === 'Guest' ? 'guest' : this.state.role.toLowerCase(),
                    " ",
                    React.createElement(Icon, { name: "arrow", size: 19 })),
                React.createElement("div", { className: "access-foot" },
                    React.createElement(Icon, { name: "info", size: 17 }),
                    "Demo role only. Real account security will be added in a later phase."),
                React.createElement("button", { type: "button", className: "quiet-link", onClick: () => this.setState({ showHelp: true }) }, "What can I do in the demo?")))); }
    aboutPage() { return React.createElement("main", { className: "simple-public" },
        React.createElement("span", { className: "eyebrow" }, "OUR APPROACH"),
        React.createElement("h1", null,
            "Clear information.",
            React.createElement("br", null),
            React.createElement("em", null, "Thoughtful action.")),
        React.createElement("p", null, "SpongeCheck is a prototype for keeping track of drainage and wetland inspections. We want reporting issues to feel familiar and decisions to remain understandable."),
        React.createElement("div", { className: "approach-list" },
            React.createElement("article", null,
                React.createElement(Icon, { name: "camera", size: 25 }),
                React.createElement("h3", null, "See and report"),
                React.createElement("p", null, "Select a sample place, add a photo, and explain what you noticed.")),
            React.createElement("article", null,
                React.createElement(Icon, { name: "cloud", size: 25 }),
                React.createElement("h3", null, "Understand the context"),
                React.createElement("p", null, "Try sample rainfall scenarios and inspect why the suggested inspection order changes.")),
            React.createElement("article", null,
                React.createElement(Icon, { name: "shield", size: 25 }),
                React.createElement("h3", null, "Care before acting"),
                React.createElement("p", null, "Sensitive work should receive appropriate human review before any physical intervention."))),
        React.createElement("button", { type: "button", className: "btn btn-primary", onClick: () => this.nav('/sign-in') },
            "Explore the sample township ",
            React.createElement(Icon, { name: "arrow", size: 18 }))); }
    tourPage() { return React.createElement("main", { className: "simple-public" },
        React.createElement("span", { className: "eyebrow" }, "GUIDED TOUR"),
        React.createElement("h1", null,
            "Three little steps.",
            React.createElement("br", null),
            React.createElement("em", null, "One clear picture.")),
        React.createElement("div", { className: "tour-tabs" }, ['Find a place', 'Create a report', 'Review updates'].map((v, i) => React.createElement("button", { key: i, "aria-pressed": this.state.demoTour === i, className: this.state.demoTour === i ? 'active' : '', onClick: () => this.setState({ demoTour: i }) },
            i + 1,
            ". ",
            v))),
        React.createElement("div", { className: "tour-card" },
            React.createElement("span", null,
                "STEP ",
                this.state.demoTour + 1,
                " OF 3"),
            React.createElement("h2", null, ['Find the places we monitor', 'Tell us what you noticed', 'Stay in the loop'][this.state.demoTour]),
            React.createElement("p", null, ['Look through six example wetland and drainage locations using a map or simple cards.', 'Use the easy reporting form to select a place, add a photo, and save a practice report.', 'Open Updates to see sample activity and the report you just created.'][this.state.demoTour]),
            React.createElement("button", { type: "button", className: "btn btn-primary", onClick: () => this.state.demoTour < 2 ? this.setState({ demoTour: this.state.demoTour + 1 }) : this.nav('/sign-in') },
                this.state.demoTour < 2 ? 'Next step' : 'Explore demo',
                " ",
                React.createElement(Icon, { name: "arrow", size: 17 })))); }
    renderApp() {
        return React.createElement("div", { className: "workspace" },
            React.createElement("aside", { className: "sidebar" },
                React.createElement("button", { type: "button", className: "sidebar-logo", onClick: () => this.nav('/app/overview'), "aria-label": "Go to home" },
                    React.createElement(Logo, { dark: true })),
                React.createElement("span", { className: "nav-caption" }, "WORKSPACE"),
                this.sideNav(),
                React.createElement("div", { className: "sidebar-bottom" },
                    React.createElement("div", { className: "sidebar-note" },
                        React.createElement(Icon, { name: "info", size: 17 }),
                        React.createElement("span", null,
                            "Sample township",
                            React.createElement("br", null),
                            React.createElement("strong", null, "Demo data only"))),
                    React.createElement("button", { type: "button", className: "side-profile", onClick: () => this.nav('/sign-in') },
                        React.createElement("span", { className: "avatar" }, this.state.role.charAt(0)),
                        React.createElement("span", null,
                            React.createElement("b", null, this.state.role === 'Reviewer' ? 'Nature reviewer' : this.state.role === 'Guest' ? 'Guest' : this.state.role),
                            React.createElement("small", null, "Switch demo role")),
                        React.createElement(Icon, { name: "chevron", size: 17 })))),
            React.createElement("div", { className: "workspace-main" },
                React.createElement("header", { className: "topbar" },
                    React.createElement("button", { type: "button", className: "mobile-app-logo", "aria-label": "Go to Home", onClick: () => this.nav('/app/overview') },
                        React.createElement(Logo, null)),
                    React.createElement("div", { className: "breadcrumb" },
                        "SpongeCheck ",
                        React.createElement("span", null, "/"),
                        " ",
                        this.routeName()),
                    React.createElement("div", { className: "topbar-right" },
                        React.createElement("span", { className: "demo-badge" },
                            React.createElement("span", null),
                            " SAMPLE DATA"),
                        React.createElement("button", { type: "button", className: "icon-button", "aria-label": "See updates", onClick: () => this.nav('/app/updates') },
                            React.createElement(Icon, { name: "bell" }),
                            this.state.notices.some(n => !n.read) && React.createElement("span", { className: "unread-mark" })),
                        React.createElement("button", { type: "button", className: "profile-avatar", title: "Switch demo role", onClick: () => this.nav('/sign-in') }, this.state.role.charAt(0)))),
                React.createElement("main", { className: "page-content" },
                    React.createElement("div", { key: this.state.route, className: this.state.reduceMotion ? "page-stage no-anim" : "page-stage" }, this.renderRoute()))),
            React.createElement("nav", { className: "bottom-nav", "aria-label": "Mobile navigation" }, [
                ['/app/overview', 'Home', 'home'], ['/app/places', 'Places', 'pin'], ['/app/report', 'Report', 'plus'], ['/app/updates', 'Updates', 'bell'], ['/app/more', 'More', 'menu']
            ].map(([route, label, icon]) => React.createElement("button", { type: "button", key: route, className: 'bottom-item ' + (this.state.route === route || this.state.route.startsWith(route + '/') ? 'active' : '') + ' ' + (label === 'Report' ? 'report-nav' : ''), "aria-current": this.state.route === route ? 'page' : undefined, onClick: () => label === 'Report' ? this.startReport() : this.nav(route) },
                React.createElement("span", { className: "bottom-icon" },
                    React.createElement(Icon, { name: icon, size: 21 })),
                React.createElement("small", null, label)))));
    }
    sideNav() {
        return React.createElement("nav", { className: "side-links", "aria-label": "Desktop navigation" }, [
            ['/app/overview', 'Overview', 'home'], ['/app/places', 'Places', 'pin'], ['/app/rain', 'Rain simulator', 'cloud'], ['/app/decisions', 'Why this matters', 'sliders'], ['/app/reviews', 'Approvals', 'shield'], ['/app/activity', 'Activity history', 'clock'], ['/app/report', 'Report an issue', 'plus'], ['/app/updates', 'Updates', 'bell'], ['/app/reports', 'My reports', 'folder'], ['/app/insights', 'Reports & insights', 'grid'], ['/app/telegram', 'Telegram', 'send'], ['/app/more', 'Settings & help', 'settings']
        ].map(([route, label, icon]) => React.createElement("button", { type: "button", key: route, className: (this.state.route === route || this.state.route.startsWith(route + '/') ? 'active ' : ''), onClick: () => label === 'Report an issue' ? this.startReport() : this.nav(route) },
            React.createElement(Icon, { name: icon, size: 18 }),
            React.createElement("span", null, label),
            label === 'Updates' && this.state.notices.some(n => !n.read) && React.createElement("i", { className: "sidebar-unread" }))));
    }
    routeName() { const r = this.state.route; return r.startsWith('/app/places/') ? 'Place details' : r.startsWith('/app/reports/') ? 'Report details' : r.startsWith('/app/decisions/') ? 'Why this matters' : r.startsWith('/app/work/') ? 'Manage work' : r.startsWith('/app/verify/') ? 'Before & after' : r === '/app/reviews' ? 'Approvals' : r === '/app/activity' ? 'Activity history' : r === '/app/places' ? 'Places' : r === '/app/rain' ? 'Rain simulator' : r === '/app/decisions' ? 'Why this matters' : r === '/app/report' ? 'Report an issue' : r === '/app/updates' ? 'Updates' : r === '/app/more' ? 'Settings & help' : r === '/app/reports' ? 'My reports' : r === '/app/insights' ? 'Reports & insights' : r === '/app/telegram' ? 'Telegram' : 'Overview'; }
    renderRoute() { const r = this.state.route; if (r.startsWith('/app/work/'))
        return this.workPage(r.split('/').pop() || ''); if (r.startsWith('/app/verify/'))
        return this.verificationPage(r.split('/').pop() || ''); if (r.startsWith('/app/decisions/case/'))
        return this.decisionDetailsPage('', r.split('/').pop() || ''); if (r.startsWith('/app/decisions/'))
        return this.decisionDetailsPage(r.split('/').pop() || 'A-01'); if (r.startsWith('/app/telegram/case/'))
        return this.telegramCasePage(r.split('/').pop() || ''); if (r.startsWith('/app/places/'))
        return this.placeDetail(r.split('/').pop() || 'A-01'); if (r.startsWith('/app/reports/'))
        return this.reportDetail(r.split('/').pop() || ''); switch (r) {
        case '/app/places': return this.placesPage();
        case '/app/rain': return this.rainPage();
        case '/app/decisions': return this.decisionsPage();
        case '/app/report': return this.reportPage();
        case '/app/updates': return this.updatesPage();
        case '/app/insights': return this.insightsPage();
        case '/app/reports': return this.reportsPage();
        case '/app/telegram': return this.telegramPage();
        case '/app/reviews': return this.approvalsPage();
        case '/app/activity': return this.activityPage();
        case '/app/more': return this.morePage();
        case '/app/overview': return this.overviewPage();
        default: return this.notFoundPage();
    } }
    pageHeader(eyebrow, title, desc, right) { return React.createElement("div", { className: "page-header" },
        React.createElement("div", null,
            React.createElement("span", { className: "eyebrow" }, eyebrow),
            React.createElement("h1", null, title),
            React.createElement("p", null, desc)),
        right && React.createElement("div", { className: "page-header-action" }, right)); }
    overviewPage() { const flags = PLACES.filter(p => p.status !== 'On schedule'); const nUnread = this.state.notices.filter(n => !n.read).length; return React.createElement("div", { className: "dashboard-page dashboard-phase2" },
        React.createElement("div", { className: "hello-row" }, this.pageHeader('YOUR WORKSPACE', 'Here’s what needs attention.', 'A quick look at our sample township. Everything here is for demonstration.', React.createElement("button", { className: "btn btn-primary", onClick: () => this.startReport() },
            React.createElement(Icon, { name: "plus", size: 19 }),
            " New report"))),
        React.createElement("section", { className: "dash-feature-row" },
            React.createElement("div", { className: "dashboard-highlight" },
                React.createElement("div", { className: "highlight-deco" }),
                React.createElement("div", { className: "highlight-content" },
                    React.createElement("span", { className: "highlight-label" },
                        React.createElement(Icon, { name: "cloud", size: 16 }),
                        " YOUR NEXT STEP"),
                    React.createElement("h2", null,
                        "A little clarity",
                        React.createElement("br", null),
                        "goes a long way."),
                    React.createElement("p", null, "See the places around your sample township, share what you notice, and keep track of every update."),
                    React.createElement("button", { type: "button", onClick: () => this.setState({ showSource: true }) },
                        "How this works ",
                        React.createElement(Icon, { name: "arrow", size: 17 })))),
            React.createElement("div", { className: "welcome-widget" },
                React.createElement("div", { className: "welcome-widget-top" },
                    React.createElement("span", null, "WELCOME TO YOUR DEMO"),
                    React.createElement(Icon, { name: "spark", size: 20 })),
                React.createElement("h3", null,
                    "Hello, ",
                    this.state.role === 'Guest' ? 'explorer' : this.state.role.toLowerCase(),
                    "."),
                React.createElement("p", null, "Start with a place, add a practice report, and see the updates appear here."),
                React.createElement("button", { type: "button", className: "btn btn-secondary", onClick: () => this.nav('/demo') },
                    "Take a quick tour ",
                    React.createElement(Icon, { name: "arrow", size: 17 })))),
        React.createElement("section", { className: "dashboard-action-band", "aria-label": "Quick ways to start" },
            React.createElement("div", null,
                React.createElement("span", { className: "action-eyebrow" }, "JUST THREE SIMPLE STEPS"),
                React.createElement("h2", null, "One place for the whole story."),
                React.createElement("p", null, "Explore the sample area, share a practice report and see the updates appear.")),
            React.createElement("div", { className: "action-band-links" },
                React.createElement("button", { type: "button", onClick: () => this.nav('/app/places') },
                    React.createElement("span", null,
                        React.createElement(Icon, { name: "map", size: 18 })),
                    " Browse places ",
                    React.createElement(Icon, { name: "arrow", size: 16 })),
                React.createElement("button", { type: "button", onClick: () => this.startReport() },
                    React.createElement("span", null,
                        React.createElement(Icon, { name: "camera", size: 18 })),
                    " Add a report ",
                    React.createElement(Icon, { name: "arrow", size: 16 })))),
        React.createElement("section", { className: "storm-teaser", "aria-label": "Explore rainfall scenarios" },
            React.createElement("div", { className: "storm-teaser-icon" },
                React.createElement(Icon, { name: "cloud", size: 24 })),
            React.createElement("div", null,
                React.createElement("span", { className: "eyebrow" }, "NEW \u00B7 INTERACTIVE SAMPLE"),
                React.createElement("h2", null, "What if heavy rain arrives?"),
                React.createElement("p", null, "Try a rainfall scenario and see which places deserve attention first. No live weather is used.")),
            React.createElement("button", { className: "btn btn-secondary", type: "button", onClick: () => this.nav('/app/rain') },
                "Try the rain simulator ",
                React.createElement(Icon, { name: "arrow", size: 17 }))),
        React.createElement("section", { className: "telegram-home-card" },
            React.createElement("div", { className: "telegram-home-icon" },
                React.createElement(Icon, { name: "send", size: 22 })),
            React.createElement("div", null,
                React.createElement("span", { className: "eyebrow" }, "FIELD REPORTING \u00B7 TELEGRAM"),
                React.createElement("h2", null, this.state.telegramCases.length ? this.state.telegramCases.length + ' Telegram ' + (this.state.telegramCases.length === 1 ? 'report' : 'reports') + ' received' : 'SpongeBot field reports'),
                React.createElement("p", null, this.state.telegramCases.length ? 'New reports are waiting for human inspection.' : 'Connect an authorized test bot to receive photo inspections from Telegram.')),
            React.createElement("button", { type: "button", className: "btn btn-secondary", onClick: () => this.nav('/app/telegram') },
                this.state.telegramCases.length ? 'View reports' : 'Set up Telegram',
                " ",
                React.createElement(Icon, { name: "arrow", size: 17 }))),
        React.createElement("section", { className: "stats-grid", "aria-label": "Township snapshot" },
            React.createElement("button", { type: "button", className: "stat-card", onClick: () => this.nav('/app/places') },
                React.createElement("div", { className: "stat-heading" },
                    React.createElement("span", null, "Places to explore"),
                    React.createElement(Icon, { name: "pin", size: 20 })),
                React.createElement("strong", null, PLACES.length.toString().padStart(2, '0')),
                React.createElement("small", null,
                    "Example locations ",
                    React.createElement(Icon, { name: "arrow", size: 15 }))),
            React.createElement("button", { type: "button", className: "stat-card", onClick: () => { this.setState({ filter: 'Needs checking' }); this.nav('/app/places'); } },
                React.createElement("div", { className: "stat-heading" },
                    React.createElement("span", null, "Needs checking"),
                    React.createElement(Icon, { name: "info", size: 20 })),
                React.createElement("strong", null, PLACES.filter(p => p.status === 'Needs checking').length.toString().padStart(2, '0')),
                React.createElement("small", null,
                    "Sample inspection flags ",
                    React.createElement(Icon, { name: "arrow", size: 15 }))),
            React.createElement("button", { type: "button", className: "stat-card", onClick: () => this.nav('/app/reports') },
                React.createElement("div", { className: "stat-heading" },
                    React.createElement("span", null, "Your reports"),
                    React.createElement(Icon, { name: "folder", size: 20 })),
                React.createElement("strong", null, this.state.reports.length.toString().padStart(2, '0')),
                React.createElement("small", null,
                    "Saved in this browser ",
                    React.createElement(Icon, { name: "arrow", size: 15 }))),
            React.createElement("button", { type: "button", className: "stat-card", onClick: () => this.nav('/app/updates') },
                React.createElement("div", { className: "stat-heading" },
                    React.createElement("span", null, "Unread updates"),
                    React.createElement(Icon, { name: "bell", size: 20 })),
                React.createElement("strong", null, nUnread.toString().padStart(2, '0')),
                React.createElement("small", null,
                    "See what\u2019s new ",
                    React.createElement(Icon, { name: "arrow", size: 15 })))),
        React.createElement("section", { className: "lower-grid" },
            React.createElement("div", { className: "dash-panel" },
                React.createElement("div", { className: "section-title-row" },
                    React.createElement("div", null,
                        React.createElement("span", { className: "eyebrow" }, "SAMPLE INSPECTIONS"),
                        React.createElement("h2", null, "Places to keep an eye on")),
                    React.createElement("button", { type: "button", className: "subtle-action", onClick: () => { this.setState({ filter: 'All' }); this.nav('/app/places'); } },
                        "View all ",
                        React.createElement(Icon, { name: "arrow", size: 16 }))),
                flags.map(p => React.createElement("button", { type: "button", key: p.id, className: "priority-row", onClick: () => this.openPlace(p.id) },
                    React.createElement("div", { className: "priority-thumb" },
                        React.createElement(PlacePhoto, { place: p })),
                    React.createElement("div", { className: "priority-copy" },
                        React.createElement("b", null,
                            p.name,
                            " ",
                            React.createElement("span", null,
                                "\u00B7 ",
                                p.id)),
                        React.createElement("small", null,
                            p.zone,
                            " \u00B7 Sample asset")),
                    React.createElement(Status, { value: p.status }),
                    React.createElement(Icon, { name: "chevron", size: 18 })))),
            React.createElement("div", { className: "dash-panel explore-panel" },
                React.createElement("div", { className: "section-title-row" },
                    React.createElement("div", null,
                        React.createElement("span", { className: "eyebrow" }, "START HERE"),
                        React.createElement("h2", null, "Find your way around"))),
                React.createElement("div", { className: "quick-cards" },
                    React.createElement("button", { type: "button", onClick: () => this.nav('/app/places') },
                        React.createElement("span", { className: "quick-icon" },
                            React.createElement(Icon, { name: "map", size: 20 })),
                        React.createElement("span", null,
                            React.createElement("b", null, "Explore places"),
                            React.createElement("small", null, "Browse the sample township.")),
                        React.createElement(Icon, { name: "up", size: 17 })),
                    React.createElement("button", { type: "button", onClick: () => this.startReport() },
                        React.createElement("span", { className: "quick-icon" },
                            React.createElement(Icon, { name: "camera", size: 20 })),
                        React.createElement("span", null,
                            React.createElement("b", null, "Report an issue"),
                            React.createElement("small", null, "Tell us what you noticed.")),
                        React.createElement(Icon, { name: "up", size: 17 })),
                    React.createElement("button", { type: "button", onClick: () => this.nav('/app/updates') },
                        React.createElement("span", { className: "quick-icon" },
                            React.createElement(Icon, { name: "bell", size: 20 })),
                        React.createElement("span", null,
                            React.createElement("b", null, "Check updates"),
                            React.createElement("small", null, "Everything in one place.")),
                        React.createElement(Icon, { name: "up", size: 17 })))))); }
    placesPage() { const q = this.state.search.toLowerCase().trim(); const shown = PLACES.filter(p => (this.state.filter === 'All' || p.status === this.state.filter || p.type === this.state.filter) && (!q || [p.name, p.id, p.zone, p.type, p.status].join(' ').toLowerCase().includes(q))); return React.createElement("div", null,
        this.pageHeader('SAMPLE TOWNSHIP', 'Explore places', 'Browse six fictional locations using a map or simple cards.', React.createElement("button", { className: "btn btn-primary", onClick: () => this.startReport() },
            React.createElement(Icon, { name: "plus", size: 17 }),
            " New report")),
        React.createElement("div", { className: "place-types", "aria-label": "Explore by type" }, [{ label: 'Wetlands', type: 'Wetland', icon: 'waves', desc: 'Living water habitats' }, { label: 'Outlets', type: 'Outlet', icon: 'pin', desc: 'Where water enters or leaves' }, { label: 'Planted swales', type: 'Swale', icon: 'cloud', desc: 'Shallow planted channels' }, { label: 'Ponds', type: 'Pond', icon: 'map', desc: 'Stormwater storage areas' }].map(c => React.createElement("button", { type: "button", key: c.type, "aria-pressed": this.state.filter === c.type, className: 'place-type-card ' + (this.state.filter === c.type ? 'selected' : ''), onClick: () => { this.setState({ filter: c.type, search: '' }); } },
            React.createElement("span", { className: "place-type-icon" },
                React.createElement(Icon, { name: c.icon, size: 21 })),
            React.createElement("span", null,
                React.createElement("strong", null, c.label),
                React.createElement("small", null, c.desc)),
            React.createElement(Icon, { name: "arrow", size: 15 })))),
        React.createElement("div", { className: "filter-panel" },
            React.createElement("label", { className: "search-box" },
                React.createElement(Icon, { name: "search", size: 18 }),
                React.createElement("input", { value: this.state.search, onChange: e => this.setState({ search: e.target.value }), placeholder: "Search places, zones or IDs", "aria-label": "Search places" }),
                this.state.search && React.createElement("button", { type: "button", "aria-label": "Clear search", onClick: () => this.setState({ search: '' }) },
                    React.createElement(Icon, { name: "x", size: 17 }))),
            React.createElement("div", { className: "filter-bottom" },
                React.createElement("div", { className: "chips", "aria-label": "Filter places" }, ['All', 'Needs checking', 'Review needed', 'On schedule', 'Wetland', 'Outlet', 'Swale', 'Pond'].map(f => React.createElement("button", { type: "button", key: f, "aria-pressed": this.state.filter === f, className: 'chip ' + (this.state.filter === f ? 'chip-active' : ''), onClick: () => this.setState({ filter: f }) }, f))),
                React.createElement("div", { className: "view-switch", role: "group", "aria-label": "Choose map or list view" },
                    React.createElement("button", { type: "button", className: this.state.viewMode === 'map' ? 'active' : '', "aria-pressed": this.state.viewMode === 'map', onClick: () => this.setState({ viewMode: 'map' }) },
                        React.createElement(Icon, { name: "map", size: 17 }),
                        " Map"),
                    React.createElement("button", { type: "button", className: this.state.viewMode === 'list' ? 'active' : '', "aria-pressed": this.state.viewMode === 'list', onClick: () => this.setState({ viewMode: 'list' }) },
                        React.createElement(Icon, { name: "list", size: 17 }),
                        " List")))),
        shown.length === 0 ? React.createElement("div", { className: "empty-panel" },
            React.createElement(Icon, { name: "search", size: 30 }),
            React.createElement("h2", null, "No places found"),
            React.createElement("p", null, "Try another search or clear your filters."),
            React.createElement("button", { className: "btn btn-secondary", onClick: () => this.setState({ filter: 'All', search: '' }) }, "Clear filters")) : React.createElement("div", { className: 'places-layout ' + (this.state.viewMode === 'list' ? 'list-only' : '') },
            this.state.viewMode === 'map' && React.createElement("div", { className: "sample-map" },
                React.createElement("div", { className: "map-heading" },
                    React.createElement("span", null,
                        React.createElement(Icon, { name: "map", size: 17 }),
                        " Sample township map"),
                    React.createElement("small", null, "SCHEMATIC \u00B7 NOT REAL COORDINATES")),
                React.createElement("div", { className: "map-body" },
                    React.createElement("svg", { viewBox: "0 0 500 340", "aria-hidden": "true", preserveAspectRatio: "xMidYMid slice" },
                        React.createElement("rect", { width: "500", height: "340", fill: "#E9E9E1" }),
                        React.createElement("path", { d: "M-35 255Q105 199 184 256t174 12q83-55 164-30", fill: "none", stroke: "#B4D7D7", strokeWidth: "76" }),
                        React.createElement("path", { d: "M-40 250Q105 194 184 251t174 12q83-55 164-30", fill: "none", stroke: "#D4E9E6", strokeWidth: "27" }),
                        React.createElement("path", { d: "M-20 81 500 76M-13 157l515-6M150-20l10 380M334-10l28 360", stroke: "#FBFBF8", strokeWidth: "19", fill: "none" }),
                        React.createElement("path", { d: "m0 81 500-5M0 157l500-6M152 0l9 340M334 0l26 340", stroke: "#D5D5CF", strokeWidth: "1.5", fill: "none" }),
                        React.createElement("path", { d: "M220 15q60 9 84 55l-23 24-67-16Z", fill: "#CAD4C4" }),
                        React.createElement("path", { d: "M43 177l90-14 20 52-91 19Z", fill: "#D0D8C8" }),
                        React.createElement("path", { d: "m378 171 89-12v45l-83 13Z", fill: "#C9D3C6" }),
                        React.createElement("path", { d: "m225 280 80-18 48 43-112 30Z", fill: "#C2D0C6" })),
                    shown.map(p => React.createElement("button", { type: "button", key: p.id, className: 'map-marker ' + (p.status === 'Needs checking' ? 'marker-alert' : p.status === 'Review needed' ? 'marker-review' : 'marker-normal'), style: { left: p.position.x + '%', top: p.position.y + '%' }, title: 'Open ' + p.name, "aria-label": 'Open ' + p.name, onClick: () => this.openPlace(p.id) },
                        React.createElement(Icon, { name: "pin", size: 16 }),
                        React.createElement("span", null, p.id)))),
                React.createElement("div", { className: "map-footer" },
                    React.createElement("span", null,
                        React.createElement("i", { className: "legend-dot legend-urgent" }),
                        " Needs checking"),
                    React.createElement("span", null,
                        React.createElement("i", { className: "legend-dot legend-review" }),
                        " Review needed"),
                    React.createElement("span", null,
                        React.createElement("i", { className: "legend-dot legend-normal" }),
                        " On schedule"))),
            React.createElement("div", { className: "place-list" },
                React.createElement("div", { className: "section-title-row compact" },
                    React.createElement("h2", null,
                        shown.length,
                        " ",
                        shown.length === 1 ? 'place' : 'places'),
                    React.createElement("span", { className: "mini-demo-label" }, "Sample information")),
                shown.map(p => React.createElement("button", { key: p.id, className: "place-card", type: "button", onClick: () => this.openPlace(p.id) },
                    React.createElement("div", { className: "place-card-photo" },
                        React.createElement(PlacePhoto, { place: p })),
                    React.createElement("div", { className: "place-card-body" },
                        React.createElement("small", null,
                            p.zone,
                            " \u00B7 ",
                            p.id),
                        React.createElement("h3", null, p.name),
                        React.createElement(Status, { value: p.status })),
                    React.createElement(Icon, { name: "chevron", className: "place-card-chevron", size: 18 })))))); }
    placeDetail(id) { const place = PLACES.find(p => p.id === id); if (!place)
        return this.notFoundPage(); const matching = this.state.reports.filter(r => r.placeId === id); return React.createElement("div", { className: "detail-page" },
        React.createElement("button", { type: "button", className: "back-link", onClick: () => this.nav('/app/places') },
            React.createElement(Icon, { name: "back", size: 18 }),
            " All places"),
        React.createElement("div", { className: "detail-hero" },
            React.createElement(PlacePhoto, { place: place, large: true }),
            React.createElement("div", { className: "detail-badge" }, "SAMPLE LOCATION \u2014 NOT AN ACTUAL SITE")),
        React.createElement("div", { className: "detail-layout" },
            React.createElement("div", null,
                this.pageHeader(place.zone.toUpperCase() + ' · ' + place.id, place.name, place.description),
                React.createElement("div", { className: "detail-intro-line" },
                    React.createElement("span", null,
                        React.createElement(Icon, { name: "info", size: 15 }),
                        " Illustrative sample location"),
                    React.createElement("button", { type: "button", onClick: () => { const idx = PLACES.findIndex(p => p.id === place.id); this.openPlace(PLACES[(idx + 1) % PLACES.length].id); } },
                        "Next place ",
                        React.createElement(Icon, { name: "arrow", size: 17 }))),
                React.createElement("div", { className: "detail-action-rain" },
                    React.createElement("button", { type: "button", className: "btn btn-secondary", onClick: () => this.openDecision(place.id) },
                        "Why this needs attention ",
                        React.createElement(Icon, { name: "arrow", size: 17 })),
                    React.createElement("button", { type: "button", className: "btn btn-secondary", onClick: () => this.nav('/app/rain') },
                        "Try a rain scenario ",
                        React.createElement(Icon, { name: "cloud", size: 17 }))),
                React.createElement("div", { className: "detail-facts" },
                    React.createElement("div", null,
                        React.createElement("small", null, "Place type"),
                        React.createElement("strong", null, place.type)),
                    React.createElement("div", null,
                        React.createElement("small", null, "Sample status"),
                        React.createElement(Status, { value: place.status })),
                    React.createElement("div", null,
                        React.createElement("small", null, "Location"),
                        React.createElement("strong", null, "Fictional township zone"))),
                React.createElement("section", { className: "dash-panel detail-reports" },
                    React.createElement("div", { className: "section-title-row" },
                        React.createElement("h2", null, "Reports for this place"),
                        React.createElement("button", { type: "button", className: "subtle-action", onClick: () => this.startReport(place.id) },
                            "Add report ",
                            React.createElement(Icon, { name: "plus", size: 16 }))),
                    matching.length ? matching.map(r => React.createElement("button", { className: "report-list-row", key: r.id, onClick: () => this.nav('/app/reports/' + r.id) },
                        React.createElement(Icon, { name: "folder", size: 21 }),
                        React.createElement("span", null,
                            React.createElement("b", null, r.id),
                            React.createElement("small", null, fmtDate(r.createdAt))),
                        React.createElement(Icon, { name: "chevron", size: 18 }))) : React.createElement("div", { className: "soft-empty" }, "No reports created for this place yet. You can add one below."))),
            React.createElement("aside", { className: "detail-aside" },
                React.createElement("h3", null, "Noticed an issue?"),
                React.createElement("p", null, "Tell the team what you saw. You can add a photo and save a sample report."),
                React.createElement("button", { className: "btn btn-primary btn-block", onClick: () => this.startReport(place.id) },
                    "Report an issue ",
                    React.createElement(Icon, { name: "arrow", size: 18 })),
                React.createElement("div", { className: "aside-info" },
                    React.createElement(Icon, { name: "info", size: 17 }),
                    " Photos and asset statuses are illustrative, not verified inspections.")))); }
    reportPage() {
        const s = this.state, place = this.getPlace(s.reportPlace);
        const stageNames = ['Choose a place', 'Check what you see', 'Review & save'];
        const advice = s.reportPhotoSource === 'sample'
            ? 'EXAMPLE PHOTO ANALYSIS — These suggested labels are prewritten for this sample image. No AI model ran.'
            : 'MANUAL PHOTO REVIEW — No AI model has analyzed your upload. Set the observations yourself.';
        return React.createElement("div", { className: "inspection-page" },
            this.pageHeader('PHOTO INSPECTION', 'Report an issue', 'Three easy steps. Choose a place, check a photo, then save your practice report.'),
            React.createElement("div", { className: "inspection-notice" },
                React.createElement(Icon, { name: "info", size: 18 }),
                React.createElement("span", null, "Sample township only. Reports stay on this device and are not sent to a real team.")),
            React.createElement("div", { className: "inspection-progress", "aria-label": 'Step ' + s.reportStep + ' of 3' }, stageNames.map((label, i) => React.createElement("div", { key: label, className: 'inspection-stage ' + (i + 1 === s.reportStep ? 'current' : i + 1 < s.reportStep ? 'done' : ''), "aria-current": i + 1 === s.reportStep ? 'step' : undefined },
                React.createElement("span", null, i + 1 < s.reportStep ? React.createElement(Icon, { name: "check", size: 14 }) : i + 1),
                React.createElement("small", null, label)))),
            React.createElement("div", { className: "inspection-layout" },
                React.createElement("form", { className: "inspection-form", onSubmit: this.createReport, noValidate: true },
                    s.reportStep === 1 && React.createElement("section", { className: "inspection-step-content" },
                        React.createElement("span", { className: "eyebrow" }, "STEP 01 / 03"),
                        React.createElement("h2", null, "Where did you notice it?"),
                        React.createElement("p", null, "Pick a sample place and add the photo you want to check."),
                        React.createElement("label", { className: "field-label", htmlFor: "report-place" }, "Choose a place"),
                        React.createElement("select", { id: "report-place", className: "form-control", value: s.reportPlace, onChange: e => this.chooseReportPlace(e.target.value) }, PLACES.map(p => React.createElement("option", { value: p.id, key: p.id },
                            p.name,
                            " \u00B7 ",
                            p.id))),
                        React.createElement("div", { className: "selected-place-preview" },
                            React.createElement(PlacePhoto, { place: place }),
                            React.createElement("div", null,
                                React.createElement("strong", null, place.name),
                                React.createElement("span", null,
                                    place.zone,
                                    " \u00B7 Example location"))),
                        React.createElement("label", { className: "field-label", htmlFor: "report-photo" }, "Add a photo"),
                        React.createElement("label", { htmlFor: "report-photo", className: 'inspection-upload ' + (s.reportPhotoData ? 'has-image' : '') }, s.reportPhotoData ? React.createElement("img", { src: s.reportPhotoData, alt: 'Selected inspection photo for ' + place.name }) : React.createElement(React.Fragment, null,
                            React.createElement(Icon, { name: "camera", size: 32 }),
                            React.createElement("strong", null, "Take a photo or choose one"),
                            React.createElement("span", null, "JPG, PNG or WebP \u00B7 Max 6 MB"))),
                        React.createElement("input", { id: "report-photo", className: "sr-only", type: "file", accept: "image/jpeg,image/png,image/webp", capture: "environment", onChange: this.onPhoto, disabled: s.reportBusy }),
                        s.reportBusy && React.createElement("div", { role: "status", className: "upload-state" }, "Preparing your photo\u2026"),
                        s.reportPhotoError && React.createElement("p", { className: "field-error", role: "alert" }, s.reportPhotoError),
                        s.reportPhotoData && React.createElement("div", { className: "image-actions" },
                            React.createElement("span", null,
                                React.createElement(Icon, { name: "check", size: 16 }),
                                " ",
                                s.reportPhotoName),
                            React.createElement("button", { type: "button", className: "quiet-link", onClick: this.removeReportPhoto }, "Remove photo")),
                        React.createElement("div", { className: "example-photo-option" },
                            React.createElement("div", null,
                                React.createElement("strong", null, "Just exploring?"),
                                React.createElement("p", null, "Try one of our clearly labeled sample photos.")),
                            React.createElement("button", { type: "button", className: "btn btn-secondary", disabled: s.reportBusy, onClick: this.useExamplePhoto },
                                "Use example photo ",
                                React.createElement(Icon, { name: "arrow", size: 16 }))),
                        s.reportPhotoSource === 'sample' && React.createElement("div", { className: "sample-warning" },
                            React.createElement(Icon, { name: "info", size: 17 }),
                            " Illustrative picture and fictional example findings, not real site evidence.")),
                    s.reportStep === 2 && React.createElement("section", { className: "inspection-step-content" },
                        React.createElement("span", { className: "eyebrow" }, "STEP 02 / 03"),
                        React.createElement("h2", null, "What can you see?"),
                        React.createElement("p", null, "Check the photo carefully. You can change every answer before saving."),
                        React.createElement("div", { className: "inspection-small-preview" },
                            React.createElement("img", { src: s.reportPhotoData, alt: "Inspection image selected in the previous step" }),
                            React.createElement("div", null,
                                React.createElement("strong", null, place.name),
                                React.createElement("span", null, s.reportPhotoName))),
                        React.createElement("div", { className: 'analysis-banner ' + (s.reportMode === 'simulated_labels' ? 'simulated' : 'manual') },
                            React.createElement(Icon, { name: s.reportMode === 'simulated_labels' ? 'spark' : 'info', size: 21 }),
                            React.createElement("div", null,
                                React.createElement("strong", null, s.reportMode === 'simulated_labels' ? 'Example photo analysis · demo only' : 'Your own observations'),
                                React.createElement("p", null, advice))),
                        React.createElement("div", { className: "observation-fields" },
                            React.createElement("div", null,
                                React.createElement("label", { className: "field-label", htmlFor: "observation-debris" }, "Any leaves, litter or debris?"),
                                React.createElement("select", { id: "observation-debris", className: "form-control", value: s.observations.debris, onChange: e => this.changeObservation('debris', e.target.value) },
                                    React.createElement("option", { value: "unsure" }, "Not sure"),
                                    React.createElement("option", { value: "none" }, "No visible debris"),
                                    React.createElement("option", { value: "visible" }, "Debris is visible"))),
                            React.createElement("div", null,
                                React.createElement("label", { className: "field-label", htmlFor: "observation-sediment" }, "Any mud or sediment build-up?"),
                                React.createElement("select", { id: "observation-sediment", className: "form-control", value: s.observations.sediment, onChange: e => this.changeObservation('sediment', e.target.value) },
                                    React.createElement("option", { value: "unsure" }, "Not sure"),
                                    React.createElement("option", { value: "none" }, "No visible build-up"),
                                    React.createElement("option", { value: "visible" }, "Build-up is visible"))),
                            React.createElement("div", null,
                                React.createElement("label", { className: "field-label", htmlFor: "observation-vegetation" }, "How does the vegetation look?"),
                                React.createElement("select", { id: "observation-vegetation", className: "form-control", value: s.observations.vegetation, onChange: e => this.changeObservation('vegetation', e.target.value) },
                                    React.createElement("option", { value: "unsure" }, "Not sure"),
                                    React.createElement("option", { value: "normal" }, "Appears typical"),
                                    React.createElement("option", { value: "dense" }, "Dense vegetation visible")))),
                        React.createElement("label", { className: "confirm-observations" },
                            React.createElement("input", { type: "checkbox", checked: s.observationConfirmed, onChange: e => this.setState({ observationConfirmed: e.target.checked, reportError: '' }) }),
                            React.createElement("span", null, "I've reviewed these answers. They describe only what can be seen in the photo.")),
                        React.createElement("div", { className: "sample-warning" },
                            React.createElement(Icon, { name: "shield", size: 16 }),
                            " Photos cannot confirm drainage capacity, flood risk or ecological safety.")),
                    s.reportStep === 3 && React.createElement("section", { className: "inspection-step-content" },
                        React.createElement("span", { className: "eyebrow" }, "STEP 03 / 03"),
                        React.createElement("h2", null, "Ready to save?"),
                        React.createElement("p", null, "Add a short note and check your information one last time."),
                        React.createElement("div", { className: "inspection-review-card" },
                            React.createElement("img", { src: s.reportPhotoData, alt: "Your reviewed inspection photo" }),
                            React.createElement("div", null,
                                React.createElement("b", null,
                                    place.name,
                                    " \u00B7 ",
                                    place.id),
                                React.createElement("span", null, s.reportMode === 'simulated_labels' ? 'Example photo labels (not AI)' : 'Inspector-entered observations'),
                                React.createElement("small", null,
                                    "Debris: ",
                                    s.observations.debris,
                                    " \u00B7 Mud: ",
                                    s.observations.sediment,
                                    " \u00B7 Plants: ",
                                    s.observations.vegetation))),
                        React.createElement("label", { className: "field-label", htmlFor: "report-notes" }, "What did you notice?"),
                        React.createElement("textarea", { id: "report-notes", className: "form-control report-textarea", value: s.reportNote, onChange: e => this.setState({ reportNote: e.target.value, reportError: '' }), placeholder: "Example: I noticed leaves and litter near the sample wetland outlet.", minLength: 12, maxLength: 1200 }),
                        React.createElement("small", { className: "field-hint" }, "At least 12 characters. Avoid names, faces or private information."),
                        React.createElement("div", { className: "review-disclaimer" },
                            React.createElement(Icon, { name: "info", size: 17 }),
                            " This saves a practice case with a unique ID, photo, observations, timestamp and history. No real alert will be sent."),
                        s.role === 'Guest' && React.createElement("div", { className: "warning-box" },
                            "Guest mode is read-only. ",
                            React.createElement("button", { type: "button", onClick: () => this.nav('/sign-in') }, "Switch to inspector mode"),
                            " to save an inspection.")),
                    s.reportError && React.createElement("div", { className: "field-error inspection-error", role: "alert" }, s.reportError),
                    React.createElement("div", { className: "inspection-actions" },
                        React.createElement("button", { type: "button", className: "btn btn-secondary", onClick: () => s.reportStep === 1 ? this.nav('/app/places') : this.previousReportStep() },
                            React.createElement(Icon, { name: "back", size: 17 }),
                            s.reportStep === 1 ? 'Cancel' : 'Back'),
                        s.reportStep < 3 ? React.createElement("button", { type: "button", className: "btn btn-primary", onClick: this.nextReportStep, disabled: s.reportBusy },
                            "Continue ",
                            React.createElement(Icon, { name: "arrow", size: 17 })) :
                            React.createElement("button", { type: "submit", className: "btn btn-primary", disabled: s.role === 'Guest' || s.reportBusy },
                                React.createElement(Icon, { name: "check", size: 17 }),
                                " Save practice report"))),
                React.createElement("aside", { className: "inspection-aside" },
                    React.createElement("div", { className: "inspection-aside-media" },
                        React.createElement("img", { src: "https://images.pexels.com/photos/17226557/pexels-photo-17226557.jpeg?auto=compress&cs=tinysrgb&w=900", onError: e => { e.currentTarget.style.opacity = "0"; }, alt: "Free stock photograph of wetlands; not a real inspection" })),
                    React.createElement("span", { className: "eyebrow" }, "SIMPLE BY DESIGN"),
                    React.createElement("h3", null, "One photo. A clearer record."),
                    React.createElement("p", null, "Your practice report will show up in My reports and Updates so you can open it again later."),
                    React.createElement("div", { className: "aside-info" },
                        React.createElement(Icon, { name: "shield", size: 18 }),
                        " All information is for this demonstration only."))));
    }
    rainPage() {
        const scenario = this.state.scenario, queue = this.decisionQueue(), base = this.decisionQueue('dry');
        const rows = this.state.decisionFilter === 'attention' ? queue.filter(r => r.decision.priority !== 'routine') : queue;
        return React.createElement("div", { className: "rain-page" },
            this.pageHeader('INTERACTIVE SAMPLE', 'Rain simulator', 'See how inspection priorities may change when the example rainfall conditions change.', React.createElement("button", { type: "button", className: "btn btn-secondary", onClick: () => { this.setScenario('dry'); this.setState({ compareRain: false, decisionFilter: 'all' }); } },
                " ",
                React.createElement(Icon, { name: "refresh", size: 17 }),
                " Reset")),
            React.createElement("div", { className: "rain-disclaimer" },
                React.createElement(Icon, { name: "info", size: 19 }),
                React.createElement("div", null,
                    React.createElement("strong", null, "Demo rainfall only \u2014 not a weather forecast"),
                    React.createElement("span", null, "Amounts, conditions and rules are illustrative. Priority means who to inspect first, not flood probability or permission to do work."))),
            React.createElement("div", { className: "rain-layout" },
                React.createElement("section", { className: "rain-control-panel" },
                    React.createElement("div", { className: "rain-control-visual" },
                        React.createElement("span", { className: "rain-small-label" }, "STORMSHIFT \u00B7 SAMPLE"),
                        React.createElement(Icon, { name: scenario === 'dry' ? 'sun' : 'cloud', size: 48 }),
                        React.createElement("h2", null,
                            RAIN_SCENARIOS[scenario].name,
                            " conditions"),
                        React.createElement("p", null,
                            RAIN_SCENARIOS[scenario].amount,
                            " / sample period")),
                    React.createElement("h3", null, "Choose a rain scenario"),
                    React.createElement("div", { className: "rain-toggle", role: "group", "aria-label": "Rain scenario" }, ['dry', 'moderate', 'heavy'].map(k => React.createElement("button", { type: "button", key: k, "aria-pressed": scenario === k, className: scenario === k ? 'selected' : '', onClick: () => this.setScenario(k) }, RAIN_SCENARIOS[k].name))),
                    React.createElement("p", { className: "rain-scenario-desc" }, RAIN_SCENARIOS[scenario].description),
                    React.createElement("label", { className: "rain-compare-control" },
                        React.createElement("input", { type: "checkbox", checked: this.state.compareRain, onChange: e => this.setState({ compareRain: e.target.checked }) }),
                        React.createElement("span", null, "Compare with dry conditions")),
                    React.createElement("div", { className: "rain-facts" },
                        React.createElement("span", null,
                            React.createElement("b", null, queue.filter(x => x.decision.priority === 'urgent').length),
                            " urgent checks"),
                        React.createElement("span", null,
                            React.createElement("b", null, queue.filter(x => x.decision.priority === 'elevated').length),
                            " worth reviewing"))),
                React.createElement("section", { className: "rain-priority-panel" },
                    React.createElement("div", { className: "rain-panel-heading" },
                        React.createElement("div", null,
                            React.createElement("span", { className: "eyebrow" }, "RECALCULATED FROM RULES"),
                            React.createElement("h2", null, "What needs attention first?"),
                            React.createElement("p", null, "Sorted from the same rules you can open below.")),
                        React.createElement("div", { className: "rain-filter", role: "group", "aria-label": "Filter inspection priorities" },
                            React.createElement("button", { type: "button", "aria-pressed": this.state.decisionFilter === 'all', onClick: () => this.setState({ decisionFilter: 'all' }) }, "All places"),
                            React.createElement("button", { type: "button", "aria-pressed": this.state.decisionFilter === 'attention', onClick: () => this.setState({ decisionFilter: 'attention' }) }, "Needs attention"))),
                    React.createElement("div", { className: "rain-queue" },
                        rows.map((entry, index) => { const old = base.find(x => x.id === entry.id).decision; return React.createElement("button", { type: "button", className: "rain-queue-card", key: entry.id, onClick: () => this.openDecision(entry.id) },
                            React.createElement("span", { className: "rain-position" }, String(index + 1).padStart(2, '0')),
                            React.createElement("span", { className: "rain-place-photo" },
                                React.createElement(PlacePhoto, { place: entry.place })),
                            React.createElement("span", { className: "rain-place-text" },
                                React.createElement("b", null,
                                    entry.place.name,
                                    " \u00B7 ",
                                    entry.id),
                                React.createElement("small", null, entry.decision.summary),
                                this.state.compareRain && React.createElement("span", { className: "rain-comparison" },
                                    "Dry: ",
                                    priorityName(old.priority),
                                    " \u2192 ",
                                    RAIN_SCENARIOS[scenario].name,
                                    ": ",
                                    priorityName(entry.decision.priority))),
                            React.createElement("span", { className: 'rain-priority-chip ' + entry.decision.priority }, priorityName(entry.decision.priority)),
                            React.createElement(Icon, { name: "chevron", size: 18 })); }),
                        rows.length === 0 && React.createElement("div", { className: "soft-empty" }, "No example places match this filter. Choose All places to see every location.")),
                    React.createElement("div", { className: "rain-legend" },
                        React.createElement(Icon, { name: "info", size: 17 }),
                        " Priority rules version ",
                        this.decisionFor('A-01').ruleset,
                        ". Click any place to see its actual calculation."))));
    }
    decisionsPage() { const queue = this.decisionQueue(); return React.createElement("div", null,
        this.pageHeader('EXPLAINABLE RECOMMENDATIONS', 'Why this matters', 'Open any example location to see what influenced its suggested inspection priority.', React.createElement("button", { className: "btn btn-secondary", onClick: () => this.nav('/app/rain') },
            React.createElement(Icon, { name: "cloud", size: 17 }),
            " Try rain simulator")),
        React.createElement("div", { className: "rain-disclaimer" },
            React.createElement(Icon, { name: "info", size: 19 }),
            React.createElement("div", null,
                React.createElement("strong", null, "Explanations use sample rules, not engineering assessments."),
                React.createElement("span", null,
                    "The weather scenario is ",
                    RAIN_SCENARIOS[this.state.scenario].name.toLowerCase(),
                    "; open the rain simulator to change it."))),
        React.createElement("div", { className: "decisions-gallery" }, queue.map(({ id, place, decision }) => React.createElement("button", { type: "button", className: "decision-tile", onClick: () => this.openDecision(id), key: id },
            React.createElement("div", { className: "decision-tile-photo" },
                React.createElement(PlacePhoto, { place: place })),
            React.createElement("div", null,
                React.createElement("small", null,
                    id,
                    " \u00B7 ",
                    place.zone),
                React.createElement("h3", null, place.name),
                React.createElement("span", { className: 'rain-priority-chip ' + decision.priority }, priorityName(decision.priority)),
                React.createElement("p", null, decision.summary),
                React.createElement("span", { className: "decision-link" },
                    "Show why ",
                    React.createElement(Icon, { name: "arrow", size: 16 }))))))); }
    decisionDetailsPage(assetId, caseId) {
        const report = caseId ? this.state.reports.find(r => r.id === caseId) : undefined;
        if (caseId && !report)
            return this.notFoundPage();
        const id = (report === null || report === void 0 ? void 0 : report.placeId) || assetId;
        if (!PLACES.some(p => p.id === id))
            return this.notFoundPage();
        const place = this.getPlace(id);
        const decision = this.decisionFor(id, this.state.scenario, this.state.proposedAction, caseId);
        const dry = this.decisionFor(id, 'dry', this.state.proposedAction, caseId);
        return React.createElement("div", { className: "decision-detail-page" },
            React.createElement("button", { type: "button", className: "back-link", onClick: () => this.nav(caseId ? '/app/reports/' + caseId : '/app/decisions') },
                React.createElement(Icon, { name: "back", size: 18 }),
                " ",
                caseId ? 'Back to report' : 'All decisions'),
            this.pageHeader('DECISION EXPLAINER · ' + id, 'Why this needs attention', 'Understand the example rules behind this inspection suggestion, in plain language.'),
            React.createElement("div", { className: "rain-disclaimer" },
                React.createElement(Icon, { name: "info", size: 19 }),
                React.createElement("div", null,
                    React.createElement("strong", null, "Illustrative calculation \u2014 not a flood prediction"),
                    React.createElement("span", null, "Sample conditions and rules are not calibrated or professionally approved. No work is authorized here."))),
            React.createElement("div", { className: "decision-layout" },
                React.createElement("div", { className: "decision-main" },
                    React.createElement("div", { className: "decision-place-banner" },
                        React.createElement("div", null,
                            React.createElement("span", null,
                                "EXAMPLE LOCATION \u00B7 ",
                                place.id),
                            React.createElement("h2", null, place.name),
                            React.createElement("p", null,
                                place.zone,
                                report ? ' · Inspection ' + report.id : ' · Fictional baseline observations')),
                        React.createElement("img", { src: place.image, alt: "Illustrative free stock photograph, not a real township asset" })),
                    React.createElement("div", { className: "twinrisk-grid" },
                        React.createElement("article", { className: "risk-result" },
                            React.createElement("span", { className: "eyebrow" }, "INSPECTION PRIORITY"),
                            React.createElement("span", { className: 'rain-priority-chip ' + decision.priority }, priorityName(decision.priority)),
                            React.createElement("h3", null, decision.summary),
                            React.createElement("p", null, decision.score === null ? 'Not enough confirmed condition information to calculate a priority.' : 'Demo priority points: ' + decision.score + ' · 7+ urgent / 3–6 elevated / 0–2 routine.')),
                        React.createElement("article", { className: "risk-result" },
                            React.createElement("span", { className: "eyebrow" }, "PROPOSED WORK"),
                            React.createElement("span", { className: 'rain-priority-chip ' + (decision.intervention === 'review_required' ? 'elevated' : 'routine') }, decision.intervention === 'review_required' ? 'Specialist review needed' : decision.intervention === 'assessment_needed' ? 'Manager assessment needed' : 'No work proposed'),
                            React.createElement("h3", null, decision.reviewReason),
                            React.createElement("p", null, "Inspection urgency never grants permission to carry out maintenance."))),
                    React.createElement("section", { className: "decision-factors" },
                        React.createElement("div", { className: "section-title-row" },
                            React.createElement("div", null,
                                React.createElement("span", { className: "eyebrow" }, "DECISION X-RAY"),
                                React.createElement("h2", null, "What affected this suggestion?")),
                            React.createElement("small", null, decision.ruleset)),
                        decision.factors.length ? decision.factors.map(f => React.createElement("div", { className: "decision-factor", key: f.key },
                            React.createElement("span", { className: "factor-points" },
                                "+",
                                f.points),
                            React.createElement("div", null,
                                React.createElement("b", null, f.label),
                                React.createElement("p", null, f.reason),
                                React.createElement("small", null,
                                    "Source: ",
                                    f.origin)))) : React.createElement("div", { className: "soft-empty" }, "No extra urgency factors were found in these example conditions."),
                        decision.uncertainties.length > 0 && React.createElement("div", { className: "decision-uncertainties" },
                            React.createElement("b", null, "What we still need to check"),
                            decision.uncertainties.map(t => React.createElement("p", { key: t }, t))),
                        React.createElement("p", { className: "decision-method" },
                            "The same ",
                            React.createElement("b", null, decision.ruleset),
                            " engine generates these factors, the total, and the Rain Simulator ranking. These are illustrative rules, not validated thresholds."))),
                React.createElement("aside", { className: "decision-aside" },
                    React.createElement("h3", null, "Try changing the conditions"),
                    React.createElement("p", null, "These choices update the recommendation immediately."),
                    React.createElement("div", { className: "mini-scenarios" }, ['dry', 'moderate', 'heavy'].map(k => React.createElement("button", { key: k, type: "button", "aria-pressed": this.state.scenario === k, onClick: () => this.setScenario(k) }, RAIN_SCENARIOS[k].name))),
                    React.createElement("div", { className: "decision-compare-mini" },
                        React.createElement("span", null, "Dry inspection priority"),
                        React.createElement("b", null, priorityName(dry.priority)),
                        React.createElement("span", null, "Selected rain scenario"),
                        React.createElement("b", null, priorityName(decision.priority))),
                    React.createElement("label", { htmlFor: "proposed-action" }, "What kind of action is being considered?"),
                    React.createElement("select", { id: "proposed-action", value: this.state.proposedAction, onChange: e => this.setState({ proposedAction: e.target.value }) }, Object.keys(ACTION_LABELS).map(k => React.createElement("option", { key: k, value: k }, ACTION_LABELS[k]))),
                    decision.intervention === 'review_required' && React.createElement("div", { className: "approval-info" },
                        React.createElement(Icon, { name: "shield", size: 18 }),
                        React.createElement("span", null, "This action would need specialist review before any maintenance starts. Save an inspection report, then choose Manage work to request specialist review and track the approval.")),
                    React.createElement("button", { type: "button", className: "btn btn-primary btn-block", onClick: () => this.startReport(id) },
                        React.createElement(Icon, { name: "camera", size: 17 }),
                        " Start a new inspection"),
                    React.createElement("button", { type: "button", className: "btn btn-secondary btn-block", onClick: () => this.nav('/app/rain') },
                        React.createElement(Icon, { name: "cloud", size: 17 }),
                        " Open rain simulator"))));
    }
    approvalsPage() {
        const cases = this.state.reports.filter(r => { var _a; return (_a = r.workflow) === null || _a === void 0 ? void 0 : _a.review; });
        const pending = cases.filter(r => { var _a, _b; return ((_b = (_a = r.workflow) === null || _a === void 0 ? void 0 : _a.review) === null || _b === void 0 ? void 0 : _b.decision) === 'pending'; }).length;
        return React.createElement("div", { className: "workflow-page" },
            this.pageHeader('CARE BEFORE ACTION', 'Approvals', 'Some work needs a specialist to review it first. All decisions here are in a sample workspace.', React.createElement("button", { type: "button", className: "btn btn-secondary", onClick: () => this.nav('/app/reports') },
                React.createElement(Icon, { name: "folder", size: 17 }),
                " My reports")),
            React.createElement("div", { className: "workflow-banner" },
                React.createElement(Icon, { name: "shield", size: 23 }),
                React.createElement("div", null,
                    React.createElement("b", null,
                        pending,
                        " ",
                        pending === 1 ? 'request' : 'requests',
                        " awaiting review"),
                    React.createElement("p", null, "Inspecting a place is different from approving physical work. These permissions are demonstrations only."))),
            this.demoRolePicker(),
            React.createElement("section", { className: "workflow-card-list" }, cases.length ? cases.map(r => { var _a, _b; const place = this.getPlace(r.placeId), rev = (_a = r.workflow) === null || _a === void 0 ? void 0 : _a.review; return React.createElement("button", { type: "button", className: "workflow-case-card", key: r.id, onClick: () => this.openWork(r.id) },
                React.createElement("span", { className: "workflow-case-icon" },
                    React.createElement(Icon, { name: "shield", size: 20 })),
                React.createElement("span", null,
                    React.createElement("small", null,
                        r.id,
                        " \u00B7 ",
                        place.name),
                    React.createElement("b", null, ACTION_LABELS[(((_b = r.workflow) === null || _b === void 0 ? void 0 : _b.action) || 'inspect_only')]),
                    React.createElement("span", null,
                        (rev === null || rev === void 0 ? void 0 : rev.decision) === 'pending' ? 'Waiting for nature reviewer' : (rev === null || rev === void 0 ? void 0 : rev.decision) === 'approved' ? 'Specialist approved' : 'Changes requested',
                        " \u00B7 ",
                        r.status)),
                React.createElement(Icon, { name: "chevron", size: 18 })); }) : React.createElement("div", { className: "empty-panel" },
                React.createElement(Icon, { name: "shield", size: 32 }),
                React.createElement("h2", null, "No reviews requested yet"),
                React.createElement("p", null, "Save a practice inspection, propose habitat-sensitive work, and its review will appear here."),
                React.createElement("button", { type: "button", className: "btn btn-primary", onClick: () => this.nav('/app/reports') },
                    "Open my reports ",
                    React.createElement(Icon, { name: "arrow", size: 17 })))));
    }
    activityPage() {
        const rows = this.state.reports.flatMap(r => (r.events || []).map(ev => ({ report: r, event: ev }))).sort((a, b) => b.event.atUtc.localeCompare(a.event.atUtc));
        const filter = this.state.search.trim().toLowerCase();
        const filtered = rows.filter(({ report: r, event: e }) => !filter || [r.id, this.getPlace(r.placeId).name, e.description, e.type].join(' ').toLowerCase().includes(filter));
        return React.createElement("div", { className: "workflow-page" },
            this.pageHeader('EVERY STEP RECORDED', 'Activity history', 'Follow reports, decisions, work and verification in one place. This is a local demo log.'),
            React.createElement("div", { className: "workflow-search" },
                React.createElement(Icon, { name: "search", size: 18 }),
                React.createElement("input", { type: "search", "aria-label": "Search activity", placeholder: "Search reports or updates", value: this.state.search, onChange: e => this.setState({ search: e.target.value }) })),
            filtered.length ? React.createElement("div", { className: "timeline-list" }, filtered.map(({ report: r, event: e }) => React.createElement("button", { type: "button", className: "timeline-row", key: r.id + '-' + e.id, onClick: () => this.openWork(r.id) },
                React.createElement("span", { className: "timeline-mark" },
                    React.createElement(Icon, { name: e.type === 'approve' || e.type === 'verify' ? 'check' : e.type === 'reject' || e.type === 'return' ? 'info' : 'clock', size: 18 })),
                React.createElement("span", null,
                    React.createElement("small", null,
                        fmtDate(e.atUtc),
                        " \u00B7 ",
                        r.id,
                        " \u00B7 Demo ",
                        e.actor),
                    React.createElement("b", null, e.description),
                    React.createElement("span", null,
                        this.getPlace(r.placeId).name,
                        " \u00B7 ",
                        r.status)),
                React.createElement(Icon, { name: "chevron", size: 18 })))) : React.createElement("div", { className: "empty-panel" },
                React.createElement(Icon, { name: "clock", size: 27 }),
                React.createElement("h2", null, filter ? 'No matching activity' : 'No activity yet'),
                React.createElement("p", null, filter ? 'Try another search or reset your filters.' : 'New inspections and changes will appear here.'),
                filter ? React.createElement("button", { type: "button", className: "btn btn-secondary", onClick: () => this.setState({ search: '' }) }, "Clear search") : React.createElement("button", { type: "button", className: "btn btn-primary", onClick: () => this.startReport() },
                    "Create a report ",
                    React.createElement(Icon, { name: "arrow", size: 16 }))));
    }
    workPage(id) {
        var _a;
        const r = this.state.reports.find(r => r.id === id);
        if (!r)
            return this.notFoundPage();
        const place = this.getPlace(r.placeId), w = r.workflow || {}, role = this.state.role;
        const actionable = ['Reported — awaiting review', 'Needs changes', 'Ready to assign'].includes(r.status);
        const proposedDecision = this.decisionFor(r.placeId, this.state.scenario, this.state.workAction, id);
        const canPropose = (role === 'Manager' || role === 'Inspector') && actionable;
        const canReview = role === 'Reviewer' && r.status === 'Waiting for specialist review' && ((_a = w.review) === null || _a === void 0 ? void 0 : _a.decision) === 'pending';
        const canAssign = role === 'Manager' && r.status === 'Ready to assign';
        const canStart = role === 'Inspector' && r.status === 'Assigned';
        const canComplete = role === 'Inspector' && ['In progress', 'Needs rework'].includes(r.status);
        return React.createElement("div", { className: "workflow-page" },
            React.createElement("button", { type: "button", className: "back-link", onClick: () => this.nav('/app/reports/' + id) },
                React.createElement(Icon, { name: "back", size: 18 }),
                " Back to report"),
            this.pageHeader('CASE ' + r.id, 'Manage work', 'Keep inspection, review and maintenance decisions connected to the same report.'),
            React.createElement("div", { className: "workflow-banner" },
                React.createElement(Icon, { name: "info", size: 21 }),
                React.createElement("div", null,
                    React.createElement("b", null,
                        place.name,
                        " \u00B7 ",
                        r.status),
                    React.createElement("p", null, "Sample data. Demo roles illustrate a review process; they are not real user authentication or legally valid permits."))),
            this.demoRolePicker(),
            React.createElement("div", { className: "workflow-columns" },
                React.createElement("div", null,
                    React.createElement("section", { className: "workflow-panel" },
                        React.createElement("span", { className: "eyebrow" }, "CURRENT REPORT"),
                        React.createElement("h2", null,
                            place.name,
                            " ",
                            React.createElement("small", null, place.id)),
                        React.createElement("p", null, r.note),
                        React.createElement("div", { className: "workflow-photo-info" },
                            r.photoData ? React.createElement("img", { src: r.photoData, alt: "Initial practice inspection" }) : React.createElement("img", { src: place.image, alt: "Illustrative free stock photograph of drainage or wetland infrastructure" }),
                            React.createElement("span", null,
                                React.createElement("b", null, "Original observation"),
                                React.createElement("small", null, r.photoSource === 'sample' ? 'Example image; not a real field photograph' : 'Uploaded practice image'))),
                        React.createElement("button", { className: "btn btn-secondary", type: "button", onClick: () => this.openDecision(place.id, id) },
                            "Why this needs attention ",
                            React.createElement(Icon, { name: "arrow", size: 16 }))),
                    actionable && React.createElement("section", { className: "workflow-panel" },
                        React.createElement("span", { className: "eyebrow" }, "1 \u00B7 DECIDE THE NEXT STEP"),
                        React.createElement("h2", null, "Propose maintenance"),
                        React.createElement("p", null, "Select the work being considered. An independent engine checks whether specialist review is required."),
                        React.createElement("label", { htmlFor: "work-action" }, "What work is being considered?"),
                        React.createElement("select", { id: "work-action", value: this.state.workAction, onChange: e => this.setState({ workAction: e.target.value, workError: '' }) }, Object.keys(ACTION_LABELS).filter(x => x !== 'inspect_only').map(k => React.createElement("option", { value: k, key: k }, ACTION_LABELS[k]))),
                        React.createElement("div", { className: "work-preview" },
                            React.createElement(Icon, { name: "shield", size: 19 }),
                            React.createElement("span", null, proposedDecision.intervention === 'review_required' ? 'Specialist must review this action before work can be assigned.' : 'Manager assessment and assignment required before work begins.')),
                        canPropose ? React.createElement("button", { type: "button", className: "btn btn-primary", onClick: () => this.proposeWork(id) },
                            "Save maintenance proposal ",
                            React.createElement(Icon, { name: "arrow", size: 16 })) : React.createElement("p", { className: "work-role-hint" }, "Switch to an inspector or manager demo role to propose work.")),
                    w.review && React.createElement("section", { className: "workflow-panel" },
                        React.createElement("span", { className: "eyebrow" }, "2 \u00B7 ECOLOGICAL SAFEGUARD"),
                        React.createElement("h2", null, "Nature review"),
                        React.createElement("p", null,
                            "Proposed: ",
                            React.createElement("b", null, ACTION_LABELS[(w.action || 'inspect_only')])),
                        React.createElement("div", { className: "work-preview" },
                            React.createElement(Icon, { name: "shield", size: 18 }),
                            React.createElement("span", null, w.review.decision === 'pending' ? 'Specialist decision required before work starts.' : w.review.decision === 'approved' ? 'Approved for this proposed action only.' : 'Proposal rejected. Change the plan before proceeding.')),
                        w.review.reason && React.createElement("p", null,
                            React.createElement("b", null, "Reviewer explanation:"),
                            " ",
                            w.review.reason),
                        canReview && React.createElement(React.Fragment, null,
                            React.createElement("label", { htmlFor: "review-reason" }, "Why are you approving or rejecting?"),
                            React.createElement("textarea", { id: "review-reason", rows: 3, value: this.state.workReason, placeholder: "Explain what was checked and why", onChange: e => this.setState({ workReason: e.target.value, workError: '' }) }),
                            React.createElement("div", { className: "workflow-buttons" },
                                React.createElement("button", { type: "button", className: "btn btn-primary", onClick: () => this.updateCase(id, 'approve', { reason: this.state.workReason }) }, "Approve this action"),
                                React.createElement("button", { type: "button", className: "btn btn-secondary", onClick: () => this.updateCase(id, 'reject', { reason: this.state.workReason }) }, "Request changes"))),
                        w.review.decision === 'pending' && !canReview && React.createElement("p", { className: "work-role-hint" }, "Only the nature reviewer demo role can approve or reject this request.")),
                    ['Ready to assign', 'Assigned', 'In progress', 'Needs rework', 'Waiting for verification', 'Work verified'].includes(r.status) && React.createElement("section", { className: "workflow-panel" },
                        React.createElement("span", { className: "eyebrow" }, "3 \u00B7 FIELD WORK"),
                        React.createElement("h2", null, "Assign and complete"),
                        React.createElement("p", null,
                            "Selected work: ",
                            React.createElement("b", null, ACTION_LABELS[(w.action || 'inspect_only')])),
                        w.assignedTo && React.createElement("p", null,
                            React.createElement("b", null, "Assigned to:"),
                            " ",
                            w.assignedTo),
                        canAssign && React.createElement(React.Fragment, null,
                            React.createElement("label", { htmlFor: "assign-crew" }, "Who will do the work?"),
                            React.createElement("input", { id: "assign-crew", value: this.state.workCrew, onChange: e => this.setState({ workCrew: e.target.value, workError: '' }) }),
                            React.createElement("button", { type: "button", className: "btn btn-primary", onClick: () => this.updateCase(id, 'assign', { assignedTo: this.state.workCrew }) }, "Assign work")),
                        canStart && React.createElement("button", { type: "button", className: "btn btn-primary", onClick: () => this.updateCase(id, 'start') }, "Mark work as started"),
                        canComplete && React.createElement(React.Fragment, null,
                            React.createElement("label", { htmlFor: "work-after" }, "Photo after the work (required)"),
                            React.createElement("input", { id: "work-after", type: "file", accept: "image/jpeg,image/png,image/webp", onChange: this.onAfterPhoto }),
                            this.state.workAfterData && React.createElement("img", { className: "work-after-preview", src: this.state.workAfterData, alt: "New after-work evidence" }),
                            this.state.workPhotoBusy && React.createElement("p", null, "Preparing your photo\u2026"),
                            React.createElement("label", { htmlFor: "completion-note" }, "Describe the work completed"),
                            React.createElement("textarea", { id: "completion-note", rows: 3, placeholder: "What was done and what still needs checking?", value: this.state.workNote, onChange: e => this.setState({ workNote: e.target.value, workError: '' }) }),
                            React.createElement("button", { type: "button", className: "btn btn-primary", disabled: this.state.workPhotoBusy, onClick: () => this.updateCase(id, 'complete', { afterPhotoData: this.state.workAfterData, note: this.state.workNote }) }, "Submit for verification")),
                        r.status === 'Waiting for verification' && React.createElement("p", { className: "work-role-hint" }, "A manager must check the new evidence before this work can be marked verified."),
                        r.status === 'Work verified' && React.createElement("p", { className: "workflow-success" },
                            React.createElement(Icon, { name: "check", size: 18 }),
                            " Maintenance evidence was reviewed and verified in this demo."),
                        w.completion && React.createElement("button", { type: "button", className: "btn btn-secondary", onClick: () => this.openVerify(id) },
                            "Compare before & after ",
                            React.createElement(Icon, { name: "arrow", size: 17 }))),
                    this.state.workError && React.createElement("p", { className: "inspection-error", role: "alert" }, this.state.workError)),
                React.createElement("aside", { className: "workflow-aside" },
                    React.createElement("section", { className: "workflow-panel" },
                        React.createElement("span", { className: "eyebrow" }, "CASE HISTORY"),
                        React.createElement("h2", null, "Activity history"),
                        React.createElement("div", { className: "workflow-event-list" }, (r.events || []).map(e => React.createElement("div", { className: "workflow-event", key: e.id },
                            React.createElement("span", { className: "work-dot" }),
                            React.createElement("div", null,
                                React.createElement("b", null, e.description),
                                React.createElement("small", null,
                                    fmtDate(e.atUtc),
                                    " \u00B7 Demo ",
                                    e.actor))))),
                        React.createElement("button", { className: "btn btn-secondary btn-block", type: "button", onClick: () => this.nav('/app/activity') },
                            "See all activity ",
                            React.createElement(Icon, { name: "arrow", size: 16 }))))));
    }
    verificationPage(id) {
        var _a;
        const r = this.state.reports.find(r => r.id === id);
        if (!r)
            return this.notFoundPage();
        const w = r.workflow || {};
        const ready = r.status === 'Waiting for verification' && !!w.completion;
        return React.createElement("div", { className: "workflow-page" },
            React.createElement("button", { className: "back-link", type: "button", onClick: () => this.openWork(id) },
                React.createElement(Icon, { name: "back", size: 18 }),
                " Manage work"),
            this.pageHeader('PROOF OF COMPLETION', 'Before & after', 'Look at the photographic evidence and record whether the work was documented correctly.'),
            React.createElement("div", { className: "workflow-banner" },
                React.createElement(Icon, { name: "info", size: 21 }),
                React.createElement("div", null,
                    React.createElement("b", null,
                        r.status,
                        " \u00B7 ",
                        r.id),
                    React.createElement("p", null, "Comparing images does not prove flooding was prevented or that ecological outcomes improved."))),
            this.demoRolePicker(),
            ((_a = w.completion) === null || _a === void 0 ? void 0 : _a.afterPhotoData) && r.photoData ? React.createElement("div", { className: "verify-layout" },
                React.createElement("section", { className: "workflow-panel" },
                    React.createElement("span", { className: "eyebrow" }, "PHOTO COMPARISON"),
                    React.createElement("h2", null, "See what changed"),
                    React.createElement("div", { className: "photo-comparison", "aria-label": "Before and after photo comparison" },
                        React.createElement("img", { src: w.completion.afterPhotoData, alt: "After-work evidence" }),
                        React.createElement("img", { className: "comparison-before", src: r.photoData, alt: "Initial inspection evidence", style: { clipPath: `inset(0 ${100 - this.state.workSlider}% 0 0)` } }),
                        React.createElement("span", { className: "compare-center", style: { left: this.state.workSlider + '%' } })),
                    React.createElement("input", { className: "comparison-range", "aria-label": "Compare before and after photos", type: "range", min: 0, max: 100, value: this.state.workSlider, onChange: e => this.setState({ workSlider: Number(e.target.value) }) }),
                    React.createElement("div", { className: "comparison-labels" },
                        React.createElement("span", null, "Before \u00B7 initial inspection"),
                        React.createElement("span", null, "After \u00B7 work submitted")),
                    r.photoSource === 'sample' && React.createElement("p", { className: "work-role-hint" }, "The initial image is a fictional example. The comparison demonstrates evidence collection, not a verified same-location change."),
                    React.createElement("p", null,
                        React.createElement("b", null, "Field note:"),
                        " ",
                        w.completion.note)),
                React.createElement("section", { className: "workflow-panel" },
                    React.createElement("span", { className: "eyebrow" }, "INDEPENDENT CHECK"),
                    React.createElement("h2", null, "Confirm the work"),
                    React.createElement("p", null, ready ? 'An operations manager can record whether the submitted work is adequately documented.' : 'This case is not currently waiting for verification.'),
                    w.verification && React.createElement("div", { className: "work-preview" },
                        React.createElement(Icon, { name: "check", size: 18 }),
                        React.createElement("span", null,
                            w.verification.decision === 'verified' ? 'Evidence verified' : 'Returned for rework',
                            ": ",
                            w.verification.note)),
                    ready && this.state.role === 'Manager' && React.createElement(React.Fragment, null,
                        React.createElement("label", { htmlFor: "verification-note" }, "Verification note (required)"),
                        React.createElement("textarea", { id: "verification-note", rows: 3, placeholder: "Confirm what was checked, or explain what is missing", value: this.state.workNote, onChange: e => this.setState({ workNote: e.target.value, workError: '' }) }),
                        React.createElement("div", { className: "workflow-buttons" },
                            React.createElement("button", { type: "button", className: "btn btn-primary", onClick: () => this.updateCase(id, 'verify', { note: this.state.workNote }) }, "Verify documented work"),
                            React.createElement("button", { type: "button", className: "btn btn-secondary", onClick: () => this.updateCase(id, 'return', { note: this.state.workNote }) }, "Return for rework"))),
                    ready && this.state.role !== 'Manager' && React.createElement("p", { className: "work-role-hint" }, "Switch to the operations manager demo role to verify or return this work."),
                    this.state.workError && React.createElement("p", { className: "inspection-error", role: "alert" }, this.state.workError))) : React.createElement("section", { className: "workflow-panel" },
                React.createElement("div", { className: "soft-empty" },
                    React.createElement(Icon, { name: "image", size: 25 }),
                    React.createElement("h2", null, "Waiting for after-work evidence"),
                    React.createElement("p", null, "Complete and photograph the work first, then come back to compare both images."),
                    React.createElement("button", { type: "button", className: "btn btn-primary", onClick: () => this.openWork(id) },
                        "Manage this work ",
                        React.createElement(Icon, { name: "arrow", size: 16 })))));
    }
    insightsPage() {
        const reports = this.filteredReports(), hasPhoto = reports.filter(r => r.photoData).length, review = reports.filter(r => { var _a, _b; return ((_b = (_a = r.workflow) === null || _a === void 0 ? void 0 : _a.review) === null || _b === void 0 ? void 0 : _b.decision) === 'pending'; }).length, done = reports.filter(r => { var _a, _b; return ((_b = (_a = r.workflow) === null || _a === void 0 ? void 0 : _a.verification) === null || _b === void 0 ? void 0 : _b.decision) === 'verified'; }).length, scenarios = this.state.scenario;
        return React.createElement("div", { className: "insights-page" },
            this.pageHeader('SAVED DEMO RECORDS', 'Reports & insights', 'See what has been documented in this browser. These numbers describe practice activity, not real environmental outcomes.'),
            React.createElement("section", { className: "insights-hero" },
                React.createElement("div", null,
                    React.createElement("span", { className: "eyebrow" }, "YOUR SAMPLE WORKSPACE"),
                    React.createElement("h2", null, "Every report tells a clearer story."),
                    React.createElement("p", null, "Follow inspection progress, spot unfinished reviews and download your evidence in a format that is easy to share.")),
                React.createElement("div", { className: "insights-hero-mark" },
                    React.createElement(Icon, { name: "folder", size: 36 }))),
            React.createElement("div", { className: "insights-toolbar" },
                React.createElement("div", null,
                    React.createElement("label", { htmlFor: "insights-period", className: "field-label" }, "Show activity from"),
                    React.createElement("select", { id: "insights-period", value: this.state.insightsPeriod, onChange: e => this.setState({ insightsPeriod: e.target.value, exportError: '', exportSuccess: '' }) },
                        React.createElement("option", { value: "all" }, "All time"),
                        React.createElement("option", { value: "week" }, "Last 7 days"),
                        React.createElement("option", { value: "month" }, "Last 30 days"))),
                React.createElement("div", { className: "insights-download" },
                    React.createElement("button", { type: "button", className: "btn btn-primary", disabled: this.state.exportBusy, onClick: () => this.downloadSummary('pdf') },
                        React.createElement(Icon, { name: "folder", size: 17 }),
                        this.state.exportBusy ? 'Preparing…' : 'Download summary PDF'),
                    React.createElement("button", { type: "button", className: "btn btn-secondary", disabled: this.state.exportBusy, onClick: () => this.downloadSummary('csv') }, "Download CSV"))),
            this.exportFeedback(),
            React.createElement("div", { className: "insights-stats" }, [
                { label: 'Saved reports', value: reports.length, icon: 'folder' },
                { label: 'Photos attached', value: hasPhoto, icon: 'camera' },
                { label: 'Waiting for review', value: review, icon: 'shield' },
                { label: 'Work evidence verified', value: done, icon: 'check' }
            ].map(item => React.createElement("div", { className: "insight-stat", key: item.label },
                React.createElement("span", { className: "insight-stat-icon" },
                    React.createElement(Icon, { name: item.icon, size: 21 })),
                React.createElement("b", null, item.value),
                React.createElement("small", null, item.label)))),
            React.createElement("div", { className: "insights-columns" },
                React.createElement("section", { className: "insights-list" },
                    React.createElement("div", { className: "section-title-row" },
                        React.createElement("div", null,
                            React.createElement("span", { className: "eyebrow" }, "CASE EXPORTS"),
                            React.createElement("h2", null, "Your saved inspections")),
                        React.createElement("button", { type: "button", className: "subtle-action", onClick: () => this.startReport() },
                            "Add report ",
                            React.createElement(Icon, { name: "arrow", size: 16 }))),
                    reports.length ? reports.map(r => React.createElement("div", { className: "insight-case", key: r.id },
                        React.createElement("div", null,
                            React.createElement("small", null,
                                r.id,
                                " \u00B7 ",
                                fmtDate(r.createdAt)),
                            React.createElement("strong", null, this.getPlace(r.placeId).name),
                            React.createElement("p", null, r.status)),
                        React.createElement("div", { className: "insight-case-buttons" },
                            React.createElement("button", { type: "button", className: "btn btn-secondary", onClick: () => this.nav('/app/reports/' + r.id) }, "Open"),
                            React.createElement("button", { type: "button", className: "btn btn-primary", onClick: () => this.downloadCase(r.id, 'pdf'), disabled: this.state.exportBusy }, "PDF")))) : React.createElement("div", { className: "soft-empty" }, "No reports in this time range. Try All time or create a new practice report.")),
                React.createElement("aside", { className: "insights-aside" },
                    React.createElement("span", { className: "eyebrow" }, "HOW TO READ THESE NUMBERS"),
                    React.createElement("h2", null, "Only real demo activity."),
                    React.createElement("p", null, "Every count comes from reports saved on this device. Changing the period changes the records used to calculate the cards."),
                    React.createElement("p", null,
                        React.createElement("b", null, "Current simulator:"),
                        " ",
                        RAIN_SCENARIOS[scenarios].name,
                        " (sample, not a forecast)."),
                    React.createElement("div", { className: "sample-warning" },
                        React.createElement(Icon, { name: "info", size: 17 }),
                        " No claims of floods prevented, carbon saved or biodiversity gains are made."),
                    React.createElement("button", { className: "btn btn-secondary", onClick: () => this.nav('/app/telegram') },
                        "Telegram records are separate ",
                        React.createElement(Icon, { name: "arrow", size: 16 })))));
    }
    updatesPage() { const unread = this.state.notices.filter(n => !n.read).length; return React.createElement("div", null,
        this.pageHeader('STAY INFORMED', 'Your updates', 'The latest activity from your sample township.', React.createElement("button", { type: "button", className: "btn btn-secondary", disabled: unread === 0, onClick: this.markAllRead },
            React.createElement(Icon, { name: "check", size: 18 }),
            " Mark all as read")),
        React.createElement("div", { className: "updates-box" }, this.state.notices.length ? this.state.notices.map(n => React.createElement("button", { type: "button", className: 'update-row ' + (!n.read ? 'unread' : ''), key: n.id, onClick: () => this.openNotice(n) },
            React.createElement("div", { className: "update-symbol" },
                React.createElement(Icon, { name: n.caseId ? 'folder' : 'bell', size: 20 })),
            React.createElement("div", null,
                React.createElement("b", null, n.title),
                React.createElement("p", null, n.desc),
                React.createElement("small", null, n.date)),
            !n.read && React.createElement("span", { className: "unread-dot" }),
            React.createElement(Icon, { name: "chevron", size: 17 }))) : React.createElement("div", { className: "soft-empty" }, "You\u2019re all caught up."))); }
    reportsPage() { return React.createElement("div", null,
        this.pageHeader('YOUR ACTIVITY', 'My reports', 'Practice reports you have saved on this device.', React.createElement("button", { type: "button", className: "btn btn-primary", onClick: () => this.startReport() },
            React.createElement(Icon, { name: "plus", size: 17 }),
            " Add report")),
        React.createElement("div", { className: "report-summary-banner" },
            React.createElement("div", null,
                React.createElement("span", { className: "eyebrow" }, "YOUR RECORDS"),
                React.createElement("h2", null, "See progress at a glance"),
                React.createElement("p", null, "Download a sample operations summary or open any report for its full evidence.")),
            React.createElement("button", { type: "button", className: "btn btn-primary", onClick: () => this.nav('/app/insights') },
                "Reports & insights ",
                React.createElement(Icon, { name: "arrow", size: 17 }))),
        React.createElement("div", { className: "reports-list" }, this.state.reports.length ? this.state.reports.map(r => { const p = this.getPlace(r.placeId); return React.createElement("button", { type: "button", className: "report-card", key: r.id, onClick: () => this.nav('/app/reports/' + r.id) },
            React.createElement("span", { className: "report-card-icon" },
                React.createElement(Icon, { name: "folder", size: 22 })),
            React.createElement("span", null,
                React.createElement("small", null,
                    r.id,
                    " \u00B7 ",
                    fmtDate(r.createdAt)),
                React.createElement("b", null, p.name),
                React.createElement("span", { className: "report-summary" }, r.note)),
            React.createElement(Icon, { name: "chevron", size: 19 })); }) : React.createElement("div", { className: "empty-panel" },
            React.createElement(Icon, { name: "folder", size: 30 }),
            React.createElement("h2", null, "Nothing here yet"),
            React.createElement("p", null, "Create your first practice report to see it in this list."),
            React.createElement("button", { className: "btn btn-primary", onClick: () => this.startReport() },
                "Report an issue ",
                React.createElement(Icon, { name: "arrow", size: 17 })))),
        React.createElement("section", { className: "telegram-linked-reports" },
            React.createElement("div", { className: "section-title-row" },
                React.createElement("div", null,
                    React.createElement("span", { className: "eyebrow" }, "SECURE BACKEND \u00B7 SEPARATE DATA"),
                    React.createElement("h2", null, "Reports from Telegram"),
                    React.createElement("p", null, "These reports live on the SpongeBot server, not this device.")),
                React.createElement("button", { type: "button", className: "btn btn-secondary", onClick: () => this.nav('/app/telegram') },
                    "Telegram settings ",
                    React.createElement(Icon, { name: "arrow", size: 16 }))),
            this.state.telegramCases.length ? this.state.telegramCases.map(c => React.createElement("button", { type: "button", key: c.id, className: "report-card", onClick: () => this.nav('/app/telegram/case/' + c.id) },
                React.createElement("span", { className: "report-card-icon" },
                    React.createElement(Icon, { name: "send", size: 22 })),
                React.createElement("span", null,
                    React.createElement("small", null,
                        c.id,
                        " \u00B7 ",
                        fmtDate(c.createdAt)),
                    React.createElement("b", null, c.placeName),
                    React.createElement("span", { className: "report-summary" }, "Telegram photo \u00B7 Awaiting human review")),
                React.createElement(Icon, { name: "chevron", size: 19 }))) : React.createElement("div", { className: "soft-empty" }, this.state.telegramDashboardKey ? 'No Telegram reports have arrived yet.' : 'Connect your authorized Telegram dashboard to see incoming reports.'))); }
    reportDetail(id) { const r = this.state.reports.find(m => m.id === id); if (!r)
        return this.notFoundPage(); const p = this.getPlace(r.placeId); return React.createElement("div", null,
        React.createElement("button", { className: "back-link", onClick: () => this.nav('/app/reports') },
            React.createElement(Icon, { name: "back", size: 18 }),
            " My reports"),
        this.pageHeader('PRACTICE REPORT · ' + r.id, 'Report saved', 'Your report is stored in this browser and has not been sent to a real operations team.'),
        React.createElement("div", { className: "saved-report" },
            React.createElement("div", { className: "save-icon" },
                React.createElement(Icon, { name: "check", size: 28 })),
            React.createElement("div", null,
                React.createElement("h2", null, "Report created"),
                React.createElement("p", null,
                    React.createElement("strong", null, "Place:"),
                    " ",
                    p.name,
                    " (",
                    p.id,
                    ")"),
                React.createElement("p", null,
                    React.createElement("strong", null, "Created:"),
                    " ",
                    fmtDate(r.createdAt)),
                React.createElement("p", null,
                    React.createElement("strong", null, "Status:"),
                    " ",
                    r.status)),
            React.createElement("div", { className: "report-note" },
                React.createElement("span", null, "WHAT YOU NOTICED"),
                React.createElement("p", null, r.note)),
            r.photoData && React.createElement("div", { className: "report-image" },
                React.createElement("span", null, "YOUR PHOTO"),
                React.createElement("img", { src: r.photoData, alt: "Photo attached to your report" })),
            r.observations && React.createElement("div", { className: "case-findings" },
                React.createElement("span", { className: "eyebrow" }, "CONFIRMED OBSERVATIONS"),
                React.createElement("h3", null, "What the inspector recorded"),
                React.createElement("div", { className: "case-observation-grid" },
                    React.createElement("div", null,
                        React.createElement("span", null, "Debris"),
                        React.createElement("strong", null, r.observations.debris === 'visible' ? 'Visible' : r.observations.debris === 'none' ? 'Not visible' : 'Not sure')),
                    React.createElement("div", null,
                        React.createElement("span", null, "Mud or sediment"),
                        React.createElement("strong", null, r.observations.sediment === 'visible' ? 'Visible' : r.observations.sediment === 'none' ? 'Not visible' : 'Not sure')),
                    React.createElement("div", null,
                        React.createElement("span", null, "Vegetation"),
                        React.createElement("strong", null, r.observations.vegetation === 'dense' ? 'Dense' : r.observations.vegetation === 'normal' ? 'Appears typical' : 'Not sure'))),
                React.createElement("p", { className: "case-origin" }, r.observations.analysisMode === 'simulated_labels' ? 'Prewritten example labels reviewed by the user — not AI inference.' : 'Observations entered and confirmed by the user — no AI analysis.')),
            r.events && React.createElement("div", { className: "case-history" },
                React.createElement("span", { className: "eyebrow" }, "ACTIVITY HISTORY"),
                React.createElement("h3", null, "What happened"),
                r.events.map(ev => React.createElement("div", { className: "case-event", key: ev.id },
                    React.createElement(Icon, { name: "clock", size: 17 }),
                    React.createElement("div", null,
                        React.createElement("strong", null, ev.description),
                        React.createElement("small", null,
                            fmtDate(ev.atUtc),
                            " \u00B7 Demo ",
                            ev.actor.toLowerCase()))))),
            !r.photoData && React.createElement("p", { className: "subtle-note" }, "No photo was attached to this report."),
            React.createElement("section", { className: "report-download-box" },
                React.createElement("span", { className: "eyebrow" }, "KEEP A COPY"),
                React.createElement("h3", null, "Download this inspection"),
                React.createElement("p", null, "Get a PDF summary, a complete photo evidence packet, or structured data to review later. Each file identifies all sample assumptions."),
                this.exportControls(r.id),
                this.exportFeedback()),
            React.createElement("button", { type: "button", className: "btn btn-secondary", onClick: () => this.openWork(r.id) },
                "Manage work ",
                React.createElement(Icon, { name: "arrow", size: 17 })),
            React.createElement("button", { type: "button", className: "btn btn-secondary", onClick: () => this.openVerify(r.id) },
                "Before & after ",
                React.createElement(Icon, { name: "arrow", size: 17 })),
            React.createElement("button", { type: "button", className: "btn btn-secondary", onClick: () => this.openDecision(p.id, r.id) },
                "Why this needs attention ",
                React.createElement(Icon, { name: "arrow", size: 17 })),
            React.createElement("button", { type: "button", className: "btn btn-primary", onClick: () => this.openPlace(p.id) },
                "View this place ",
                React.createElement(Icon, { name: "arrow", size: 17 })))); }
    telegramCasePage(id) {
        const c = this.state.telegramCases.find(c => c.id === id);
        if (!c)
            return React.createElement("div", { className: "workflow-page" },
                React.createElement("button", { className: "back-link", onClick: () => this.nav('/app/telegram') },
                    React.createElement(Icon, { name: "back", size: 18 }),
                    " Back to Telegram"),
                React.createElement("div", { className: "empty-panel" },
                    React.createElement("h2", null, "Report not available"),
                    React.createElement("p", null, "Connect and refresh your authorized Telegram dashboard to load this record.")));
        return React.createElement("div", { className: "workflow-page" },
            React.createElement("button", { type: "button", className: "back-link", onClick: () => this.nav('/app/telegram') },
                React.createElement(Icon, { name: "back", size: 18 }),
                " Telegram reports"),
            this.pageHeader('TELEGRAM CASE · ' + c.id, c.placeName, 'Photo sent through the authorized test bot. This case is kept on the shared backend.'),
            React.createElement("div", { className: "telegram-case-layout" },
                React.createElement("div", { className: "integration-card" },
                    React.createElement("span", { className: "telegram-case-label" }, "UNCONFIRMED OBSERVATIONS \u00B7 REAL TELEGRAM PHOTO"),
                    React.createElement("img", { className: "telegram-case-photo", src: c.photoData, alt: 'Telegram inspection photograph for ' + c.placeName }),
                    React.createElement("h3", null, "What the inspector sent"),
                    React.createElement("p", null, c.note),
                    React.createElement("p", null,
                        React.createElement("b", null, "Status:"),
                        " ",
                        c.status),
                    React.createElement("p", null,
                        React.createElement("b", null, "Submitted:"),
                        " ",
                        fmtDate(c.createdAt))),
                React.createElement("div", { className: "integration-card" },
                    React.createElement("h3", null, "What happens next?"),
                    React.createElement("p", null,
                        "This photograph has ",
                        React.createElement("b", null, "not"),
                        " been checked by a trained inspector or AI model. Debris, sediment and habitat conditions are unknown."),
                    React.createElement("div", { className: "sample-warning" },
                        React.createElement(Icon, { name: "shield", size: 18 }),
                        " Telegram cases are read-only here until production-grade identity and synchronized approval permissions are implemented."),
                    React.createElement("button", { type: "button", className: "btn btn-secondary", onClick: () => this.openPlace(c.placeId) },
                        "Explore this place ",
                        React.createElement(Icon, { name: "arrow", size: 16 })),
                    React.createElement("button", { type: "button", className: "btn btn-secondary", onClick: () => this.nav('/app/telegram') },
                        "Back to Telegram ",
                        React.createElement(Icon, { name: "arrow", size: 16 })))));
    }
    telegramPage() {
        var _a, _b, _c;
        const s = this.state, connected = !!((_a = s.telegramStatus) === null || _a === void 0 ? void 0 : _a.configured);
        return React.createElement("div", { className: "telegram-page" },
            this.pageHeader('SPONGEBOT · FIELD REPORTING', 'Telegram updates', 'Send inspection photos from an authorized Telegram account and view incoming reports here.'),
            React.createElement("div", { className: "integration-grid" },
                React.createElement("section", { className: "integration-card" },
                    React.createElement("div", { className: "telegram-symbol" },
                        React.createElement(Icon, { name: "send", size: 31 })),
                    React.createElement("div", { className: 'connection-status ' + (connected ? 'connection-ready' : '') },
                        React.createElement("span", { className: "connection-offline" }),
                        " ",
                        connected ? 'Bot backend configured' : 'Not connected'),
                    React.createElement("h2", null, "Meet SpongeBot."),
                    React.createElement("p", null, "Field inspectors can send /inspect, choose a sample place and attach a photo. The backend assigns a case ID and logs the photo for a human to review."),
                    React.createElement("div", { className: "sample-warning" },
                        React.createElement(Icon, { name: "info", size: 18 }),
                        " ",
                        ((_b = s.telegramStatus) === null || _b === void 0 ? void 0 : _b.message) || 'Checking backend configuration…',
                        " Bot configuration alone does not confirm the Telegram webhook is delivering messages."),
                    connected && ((_c = s.telegramStatus) === null || _c === void 0 ? void 0 : _c.botUsername) && React.createElement("a", { className: "btn btn-primary", href: 'https://t.me/' + encodeURIComponent(s.telegramStatus.botUsername), target: "_blank", rel: "noopener noreferrer" },
                        "Open SpongeBot in Telegram ",
                        React.createElement(Icon, { name: "up", size: 16 })),
                    React.createElement("div", { className: "telegram-connect-form" },
                        React.createElement("label", { className: "field-label", htmlFor: "telegram-base" }, "Backend address (optional)"),
                        React.createElement("input", { className: "form-control", id: "telegram-base", type: "text", placeholder: "Same website, or https://your-api.example", value: s.telegramApiBase, onChange: e => this.apiBaseChanged(e.target.value) }),
                        React.createElement("p", { className: "field-hint" }, "Leave empty when the app and API share the same domain. Use HTTPS for deployed servers or localhost while testing."),
                        React.createElement("button", { className: "btn btn-secondary", type: "button", onClick: this.refreshTelegramStatus, disabled: s.telegramBusy },
                            "Check connection ",
                            React.createElement(Icon, { name: "refresh", size: 16 }))),
                    React.createElement("div", { className: "telegram-connect-form" },
                        React.createElement("label", { className: "field-label", htmlFor: "telegram-key" }, "Dashboard access key"),
                        React.createElement("input", { className: "form-control", id: "telegram-key", type: "password", autoComplete: "off", placeholder: "Paste private dashboard key", value: s.telegramDashboardKey, onChange: e => this.setState({ telegramDashboardKey: e.target.value, telegramError: '' }) }),
                        React.createElement("p", { className: "field-hint" }, "Stored only in this open page\u2019s memory; never embedded in the app or saved in local storage."),
                        React.createElement("div", { className: "telegram-actions" },
                            React.createElement("button", { className: "btn btn-primary", type: "button", onClick: () => this.refreshTelegramCases(), disabled: s.telegramBusy || !s.telegramDashboardKey.trim() },
                                s.telegramBusy ? 'Checking…' : 'Load Telegram reports',
                                " ",
                                React.createElement(Icon, { name: "refresh", size: 16 })),
                            s.telegramDashboardKey && React.createElement("button", { className: "btn btn-secondary", type: "button", onClick: this.disconnectTelegram }, "Disconnect"))),
                    s.telegramError && React.createElement("div", { className: "field-error", role: "alert" }, s.telegramError),
                    React.createElement("div", { className: "telegram-demo-link" },
                        React.createElement("button", { type: "button", className: "subtle-action", onClick: () => this.setState({ telegramMockVisible: !s.telegramMockVisible }) },
                            s.telegramMockVisible ? 'Hide example conversation' : 'See example conversation',
                            " ",
                            React.createElement(Icon, { name: "chevron", size: 17 })),
                        s.telegramMockVisible && React.createElement("div", { className: "example-chat" },
                            React.createElement("p", null,
                                React.createElement("b", null, "Example only \u2014 not a Telegram message")),
                            React.createElement("p", null, "Inspector: /inspect"),
                            React.createElement("p", null, "Bot: Send /asset A-01"),
                            React.createElement("p", null, "Inspector: /asset A-01"),
                            React.createElement("p", null, "Bot: Send a photo with an optional note."),
                            React.createElement("p", null, "Inspector: [sample photo]"),
                            React.createElement("p", null, "Bot: Report SC-TG-... saved. Awaiting review.")))),
                React.createElement("section", { className: "integration-steps" },
                    React.createElement("div", { className: "section-title-row" },
                        React.createElement("div", null,
                            React.createElement("span", { className: "eyebrow" }, "AUTHORIZED TEST MESSAGES ONLY"),
                            React.createElement("h3", null, "Reports from Telegram")),
                        React.createElement("button", { type: "button", className: "subtle-action", onClick: () => this.refreshTelegramCases(), disabled: !s.telegramDashboardKey.trim() || s.telegramBusy },
                            "Refresh ",
                            React.createElement(Icon, { name: "refresh", size: 16 }))),
                    s.telegramSyncedAt && React.createElement("p", { className: "telegram-sync-note" },
                        "Last checked: ",
                        fmtDate(s.telegramSyncedAt),
                        " \u00B7 Backend records \u00B7 Read only"),
                    s.telegramCases.length ? s.telegramCases.map(c => React.createElement("button", { type: "button", className: "telegram-incoming-card", key: c.id, onClick: () => this.nav('/app/telegram/case/' + c.id) },
                        React.createElement("img", { src: c.photoData, alt: "Telegram inspection photo" }),
                        React.createElement("span", null,
                            React.createElement("small", null,
                                c.id,
                                " \u00B7 ",
                                fmtDate(c.createdAt)),
                            React.createElement("b", null, c.placeName),
                            React.createElement("em", null, c.status)),
                        React.createElement(Icon, { name: "chevron", size: 17 }))) : React.createElement("div", { className: "soft-empty" }, s.telegramDashboardKey ? 'No Telegram reports loaded yet. Send /inspect to the configured bot and refresh.' : 'Enter your dashboard access key to see Telegram photos and case updates.'),
                    React.createElement("h3", null, "How to send a report"),
                    ['Start the real SpongeBot in Telegram', 'Send /inspect, then /asset A-01', 'Send a photo and optional notes', 'Receive case ID, then refresh this page'].map((t, i) => React.createElement("div", { className: "integration-step", key: t },
                        React.createElement("span", null, String(i + 1).padStart(2, '0')),
                        React.createElement("p", null, t))),
                    React.createElement("p", { className: "telegram-privacy-note" }, "Photo messages pass through Telegram and the SpongeCheck test server. Use non-sensitive demo photos. Telegram-origin cases are not AI-analyzed and cannot automatically authorize maintenance."))));
    }
    morePage() { return React.createElement("div", null,
        this.pageHeader('YOUR EXPERIENCE', 'Settings & help', 'Make the demo comfortable to use and find helpful information.'),
        React.createElement("div", { className: "settings-grid" },
            React.createElement("section", { className: "settings-card" },
                React.createElement("h2", null, "Appearance"),
                React.createElement("p", null, "Choose the look that feels right to you."),
                React.createElement("div", { className: "setting-row" },
                    React.createElement("span", null,
                        React.createElement(Icon, { name: "sun", size: 20 }),
                        " Color theme"),
                    React.createElement("div", { className: "segmented" },
                        React.createElement("button", { "aria-pressed": this.state.theme === 'light', className: this.state.theme === 'light' ? 'active' : '', onClick: () => this.setTheme('light') }, "Light"),
                        React.createElement("button", { "aria-pressed": this.state.theme === 'dark', className: this.state.theme === 'dark' ? 'active' : '', onClick: () => this.setTheme('dark') }, "Dark"))),
                React.createElement("div", { className: "setting-row" },
                    React.createElement("span", null,
                        React.createElement(Icon, { name: "spark", size: 20 }),
                        " Reduced movement"),
                    React.createElement("button", { type: "button", className: 'toggle ' + (this.state.reduceMotion ? 'on' : ''), role: "switch", "aria-checked": this.state.reduceMotion, "aria-label": "Reduce motion", onClick: () => this.setMotion(!this.state.reduceMotion) },
                        React.createElement("span", null)))),
            React.createElement("section", { className: "settings-card" },
                React.createElement("h2", null, "Your demo"),
                React.createElement("p", null, "Simple tools to keep your sample workspace organized."),
                React.createElement("button", { className: "setting-link", onClick: () => this.nav('/app/insights') },
                    React.createElement(Icon, { name: "grid", size: 20 }),
                    " Reports & insights ",
                    React.createElement(Icon, { name: "chevron", size: 17 })),
                React.createElement("button", { className: "setting-link", onClick: () => this.nav('/app/reports') },
                    React.createElement(Icon, { name: "folder", size: 20 }),
                    " My reports ",
                    React.createElement(Icon, { name: "chevron", size: 17 })),
                React.createElement("button", { className: "setting-link", onClick: () => this.nav('/app/rain') },
                    React.createElement(Icon, { name: "cloud", size: 20 }),
                    " Rain simulator ",
                    React.createElement(Icon, { name: "chevron", size: 17 })),
                React.createElement("button", { className: "setting-link", onClick: () => this.nav('/app/decisions') },
                    React.createElement(Icon, { name: "sliders", size: 20 }),
                    " Why this matters ",
                    React.createElement(Icon, { name: "chevron", size: 17 })),
                React.createElement("button", { className: "setting-link", onClick: () => this.nav('/app/reviews') },
                    React.createElement(Icon, { name: "shield", size: 20 }),
                    " Approvals ",
                    React.createElement(Icon, { name: "chevron", size: 17 })),
                React.createElement("button", { className: "setting-link", onClick: () => this.nav('/app/activity') },
                    React.createElement(Icon, { name: "clock", size: 20 }),
                    " Activity history ",
                    React.createElement(Icon, { name: "chevron", size: 17 })),
                React.createElement("button", { className: "setting-link", onClick: () => this.nav('/app/telegram') },
                    React.createElement(Icon, { name: "send", size: 20 }),
                    " Telegram updates ",
                    React.createElement(Icon, { name: "chevron", size: 17 })),
                React.createElement("button", { className: "setting-link", onClick: () => this.nav('/sign-in') },
                    React.createElement(Icon, { name: "settings", size: 20 }),
                    " Switch demo role ",
                    React.createElement(Icon, { name: "chevron", size: 17 })),
                React.createElement("button", { className: "setting-link danger-text", onClick: () => this.setState({ showReset: true }) },
                    React.createElement(Icon, { name: "refresh", size: 20 }),
                    " Reset sample data ",
                    React.createElement(Icon, { name: "chevron", size: 17 }))),
            React.createElement("section", { className: "settings-card" },
                React.createElement("h2", null, "Help & information"),
                React.createElement("button", { className: "setting-link", onClick: () => this.setState({ showHelp: true }) },
                    React.createElement(Icon, { name: "info", size: 20 }),
                    " How to use the demo ",
                    React.createElement(Icon, { name: "chevron", size: 17 })),
                React.createElement("button", { className: "setting-link", onClick: () => this.setState({ showSource: true }) },
                    React.createElement(Icon, { name: "image", size: 20 }),
                    " Images & data sources ",
                    React.createElement(Icon, { name: "chevron", size: 17 })),
                React.createElement("button", { className: "setting-link", onClick: () => this.nav('/about') },
                    React.createElement(Icon, { name: "waves", size: 20 }),
                    " About SpongeCheck ",
                    React.createElement(Icon, { name: "chevron", size: 17 }))))); }
    notFoundPage() { return React.createElement("div", { className: "empty-panel not-found" },
        React.createElement(Icon, { name: "info", size: 30 }),
        React.createElement("h2", null, "We couldn't find that page"),
        React.createElement("p", null, "That link may be outdated. Head back to the main dashboard."),
        React.createElement("button", { className: "btn btn-primary", onClick: () => this.nav('/app/overview') },
            "Go to Home ",
            React.createElement(Icon, { name: "arrow", size: 17 }))); }
}

ReactDOM.render(React.createElement(App,{}),document.getElementById('root'));
