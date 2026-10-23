"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RULE_VERSION = exports.ACTION_LABELS = exports.RAIN_SCENARIOS = void 0;
exports.evaluateInspection = evaluateInspection;
exports.sortDecisions = sortDecisions;
exports.RAIN_SCENARIOS = {
    dry: { name: 'Dry', amount: '0 mm', description: 'An illustrative period without rainfall.' },
    moderate: { name: 'Moderate', amount: '20 mm', description: 'An illustrative moderate rainfall period.' },
    heavy: { name: 'Heavy', amount: '65 mm', description: 'An illustrative heavy rainfall period.' }
};
exports.ACTION_LABELS = {
    inspect_only: 'Inspect only', remove_debris: 'Remove loose debris', remove_sediment: 'Remove sediment', clear_vegetation: 'Clear vegetation'
};
exports.RULE_VERSION = 'demo-v1.0';
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
    return { priority, intervention, score, factors, uncertainties, scenario, action, ruleset: exports.RULE_VERSION, summary, reviewReason, input };
}
/** The queue and Decision X-Ray must use evaluateInspection() for identical results. */
function sortDecisions(rows) {
    const weight = { urgent: 3, elevated: 2, insufficient_evidence: 1, routine: 0 };
    return [...rows].sort((a, b) => weight[b.decision.priority] - weight[a.decision.priority] || (b.decision.score ?? -1) - (a.decision.score ?? -1) || a.id.localeCompare(b.id));
}
