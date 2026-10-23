/** Phase 5 local-sandbox work order state machine. This is NOT a production authorization boundary. */
export type DemoRole = 'Inspector' | 'Manager' | 'Reviewer' | 'Guest';
export type WorkAction = 'remove_debris' | 'clear_vegetation' | 'inspect_only' | 'remove_sediment';
export type WorkCommand = 'propose' | 'approve' | 'reject' | 'assign' | 'start' | 'complete' | 'verify' | 'return';
export type WorkflowEvent = { id:string; atUtc:string; type:string; actor:DemoRole; description:string };
export type WorkRecord = {
  action?:WorkAction;
  requiresReview?:boolean;
  review?:{decision:'pending'|'approved'|'rejected';by?:DemoRole;atUtc?:string;reason?:string;action:WorkAction};
  assignedTo?:string;
  completion?:{by:DemoRole;atUtc:string;note:string;afterPhotoData:string};
  verification?:{by:DemoRole;atUtc:string;decision:'verified'|'returned';note:string};
};
export type WorkflowCase = {id:string;status:string;events?:WorkflowEvent[];workflow?:WorkRecord};
export type WorkParams={action?:WorkAction;requiresReview?:boolean;reason?:string;assignedTo?:string;note?:string;afterPhotoData?:string;atUtc?:string};
export class WorkflowError extends Error { constructor(message:string){super(message);this.name='WorkflowError';} }
const fail=(msg:string):never=>{throw new WorkflowError(msg)};
const clean=(s:string|undefined)=>s?.trim()||'';
export function advanceCase<T extends WorkflowCase>(input:T, command:WorkCommand, actor:DemoRole, params:WorkParams={}):T {
  const now=params.atUtc||new Date().toISOString();
  const previous=input.workflow||{};
  const next:WorkRecord={...previous};
  let status=input.status;
  let desc='';
  if(actor==='Guest')fail('Guests can browse but cannot change reports.');
  switch(command){
    case 'propose':{
      if(actor!=='Inspector'&&actor!=='Manager')fail('Only an inspector or manager can propose work.');
      if(!params.action||params.action==='inspect_only')fail('Choose a maintenance action to propose.');
      if(!['Reported — awaiting review','Needs changes','Ready to assign'].includes(status))fail('Work cannot be changed after it has been assigned.');
      if(params.requiresReview===undefined)fail('Review requirements must be evaluated first.');
      const action=params.action as WorkAction;
      next.action=action;
      next.requiresReview=params.requiresReview;
      next.review=params.requiresReview?{decision:'pending',action}:undefined;
      next.assignedTo=undefined;next.completion=undefined;next.verification=undefined;
      status=params.requiresReview?'Waiting for specialist review':'Ready to assign';
      desc=params.requiresReview?'Maintenance proposed. Specialist approval requested.':'Routine maintenance proposed; ready for manager assignment.';
      break;
    }
    case 'approve':case 'reject':{
      if(actor!=='Reviewer')fail('Only the nature reviewer demo role can make this decision.');
      if(status!=='Waiting for specialist review'||next.review?.decision!=='pending')fail('No pending specialist review was found.');
      if(clean(params.reason).length<8)fail('Please add a review reason (at least 8 characters).');
      next.review={action:next.review!.action,decision:command==='approve'?'approved':'rejected',by:actor,atUtc:now,reason:clean(params.reason)};
      status=command==='approve'?'Ready to assign':'Needs changes';
      desc=command==='approve'?'Specialist approved this proposed action.':'Specialist rejected this proposed action.';
      break;
    }
    case 'assign':{
      if(actor!=='Manager')fail('Only the operations manager can assign maintenance work.');
      if(status!=='Ready to assign'||!next.action)fail('Work must be ready for assignment first.');
      if(next.requiresReview&&(next.review?.decision!=='approved'||next.review.action!==next.action))fail('A matching specialist approval is required first.');
      if(clean(params.assignedTo).length<3)fail('Enter the responsible crew or inspector.');
      next.assignedTo=clean(params.assignedTo);status='Assigned';desc='Work assigned to '+next.assignedTo+'.';break;
    }
    case 'start':{
      if(actor!=='Inspector')fail('Only the inspector demo role can begin field work.');
      if(status!=='Assigned'||!next.assignedTo)fail('This case has not been assigned.');
      if(next.requiresReview&&next.review?.decision!=='approved')fail('Approval required before work begins.');
      status='In progress';desc='Field work started.';break;
    }
    case 'complete':{
      if(actor!=='Inspector')fail('Only the inspector demo role can submit completion evidence.');
      if(!['In progress','Needs rework'].includes(status))fail('Start the assigned work before submitting evidence.');
      if(!params.afterPhotoData?.startsWith('data:image/'))fail('Add an after-work photograph before submitting.');
      if(clean(params.note).length<12)fail('Explain the work done in at least 12 characters.');
      next.completion={by:actor,atUtc:now,note:clean(params.note),afterPhotoData:params.afterPhotoData as string};
      next.verification=undefined;status='Waiting for verification';desc='Completion evidence submitted for an independent check.';break;
    }
    case 'verify':case 'return':{
      if(actor!=='Manager')fail('Only the manager demo role can verify work.');
      if(status!=='Waiting for verification'||!next.completion)fail('No completion evidence is waiting for verification.');
      if(next.completion!.by===actor)fail('The same role that submitted completion cannot verify it.');
      if(clean(params.note).length<8)fail('Add a verification note of at least 8 characters.');
      next.verification={by:actor,atUtc:now,decision:command==='verify'?'verified':'returned',note:clean(params.note)};
      status=command==='verify'?'Work verified':'Needs rework';desc=command==='verify'?'Work evidence independently checked.':'Work returned for corrections and new evidence.';break;
    }
  }
  const event:WorkflowEvent={id:'ev-'+now.replace(/\D/g,'')+'-'+Math.random().toString(36).slice(2,8),atUtc:now,type:command,actor,description:desc};
  return {...input,status,workflow:next,events:[...(input.events||[]),event]};
}
