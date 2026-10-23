/** SpongeCheck Phase 4: deterministic, illustrative inspection decision support.
 * This is NOT a rainfall forecast, flood probability, engineering threshold, or authorization to work.
 */
export type RainScenario = 'dry'|'moderate'|'heavy';
export type InspectionPriority = 'routine'|'elevated'|'urgent'|'insufficient_evidence';
export type ProposedAction = 'inspect_only'|'remove_debris'|'remove_sediment'|'clear_vegetation';
export type InterventionStatus = 'not_proposed'|'review_required'|'assessment_needed';
export type VisualFlag = 'none'|'visible'|'unsure';
export type VegetationFlag = 'normal'|'dense'|'unsure';
export type DecisionObservation = {debris:VisualFlag;sediment:VisualFlag;vegetation:VegetationFlag};
export type DecisionInput = {
  assetId:string; assetType:string; criticality:'high'|'standard';
  daysSinceInspection:number|null; observations:DecisionObservation;
  scenario:RainScenario; action:ProposedAction;
  provenance:'sample_fixture'|'inspector_confirmed';
};
export type DecisionFactor={key:string;label:string;points:number;reason:string;origin:string};
export type DecisionResult={
  priority:InspectionPriority; intervention:InterventionStatus;
  score:number|null; factors:DecisionFactor[]; uncertainties:string[];
  scenario:RainScenario; action:ProposedAction; ruleset:'demo-v1.0';
  summary:string; reviewReason:string; input:DecisionInput;
};
export const RAIN_SCENARIOS:{[k in RainScenario]:{name:string;amount:string;description:string}}={
  dry:{name:'Dry',amount:'0 mm',description:'An illustrative period without rainfall.'},
  moderate:{name:'Moderate',amount:'20 mm',description:'An illustrative moderate rainfall period.'},
  heavy:{name:'Heavy',amount:'65 mm',description:'An illustrative heavy rainfall period.'}
};
export const ACTION_LABELS:{[k in ProposedAction]:string}={
  inspect_only:'Inspect only',remove_debris:'Remove loose debris',remove_sediment:'Remove sediment',clear_vegetation:'Clear vegetation'
};
export const RULE_VERSION='demo-v1.0' as const;
export function evaluateInspection(input:DecisionInput):DecisionResult {
  const {observations:o,scenario,action}=input;
  const factors:DecisionFactor[]=[]; const uncertainties:string[]=[];
  const add=(key:string,label:string,points:number,reason:string,origin='Sample inspection rules')=>factors.push({key,label,points,reason,origin});
  const evidenceOrigin=input.provenance==='inspector_confirmed'?'Inspector-confirmed report':'Fictional example observation';
  const blocked=o.debris==='visible'||o.sediment==='visible';
  const missingCore=o.debris==='unsure'&&o.sediment==='unsure';
  if(o.debris==='visible')add('debris','Visible debris',3,'Debris is recorded at this location.',evidenceOrigin);
  if(o.sediment==='visible')add('sediment','Visible sediment',2,'Sediment is recorded at this location.',evidenceOrigin);
  if(input.criticality==='high')add('criticality','Priority waterway location',2,'This sample asset is tagged as a critical inlet or outlet.','Fictional asset profile');
  if(input.daysSinceInspection!==null&&input.daysSinceInspection>14)add('recency','Inspection follow-up',1,'The demonstration fixture marks the last inspection as older than 14 days.','Fictional inspection date');
  if(blocked && scenario==='moderate')add('rain','Moderate rain scenario',1,'Sample rainfall adds urgency when visible debris or sediment is present.','Simulated rainfall');
  if(blocked && scenario==='heavy')add('rain','Heavy rain scenario',3,'Sample rainfall adds extra urgency when visible debris or sediment is present.','Simulated rainfall');
  if(o.debris==='unsure')uncertainties.push('Debris condition has not been confirmed.');
  if(o.sediment==='unsure')uncertainties.push('Sediment condition has not been confirmed.');
  if(o.vegetation==='unsure')uncertainties.push('Vegetation condition has not been confirmed.');
  if(input.daysSinceInspection===null)uncertainties.push('Last inspection date is unavailable.');
  const score=missingCore?null:factors.reduce((sum,f)=>sum+f.points,0);
  const priority:InspectionPriority=score===null?'insufficient_evidence':score>=7?'urgent':score>=3?'elevated':'routine';
  let intervention:InterventionStatus='not_proposed';
  let reviewReason='Inspection does not authorize physical maintenance.';
  if(action!=='inspect_only'){
    if(action==='clear_vegetation'||action==='remove_sediment'||o.vegetation==='dense'){
      intervention='review_required';reviewReason='This proposed work may affect wetland habitat or sediment. Ask an authorized specialist to review the intervention before work begins.';
    }else{
      intervention='assessment_needed';reviewReason='A responsible manager must assess the proposed task and site conditions before work can start.';
    }
  }else if(o.vegetation==='dense'){
    reviewReason='Dense vegetation is present. Any future vegetation clearance must be reviewed separately; inspection itself is permitted.';
  }
  const summary=priority==='insufficient_evidence'?'More information is needed before assigning an inspection priority.':
    priority==='urgent'?'Check this place soon under the selected example conditions.':
    priority==='elevated'?'This place deserves a closer look.':'Continue with routine inspection planning.';
  return {priority,intervention,score,factors,uncertainties,scenario,action,ruleset:RULE_VERSION,summary,reviewReason,input};
}
/** The queue and Decision X-Ray must use evaluateInspection() for identical results. */
export function sortDecisions<T extends {decision:DecisionResult;id:string}>(rows:T[]):T[]{
  const weight:Record<InspectionPriority,number>={urgent:3,elevated:2,insufficient_evidence:1,routine:0};
  return [...rows].sort((a,b)=>weight[b.decision.priority]-weight[a.decision.priority] || (b.decision.score??-1)-(a.decision.score??-1) || a.id.localeCompare(b.id));
}
