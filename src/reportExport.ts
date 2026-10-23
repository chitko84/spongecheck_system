/** Phase 7: dependency-free, client-side report exports. No data is sent to a server.
 * PDF files are genuine PDF 1.4 documents; HTML evidence packets retain the images.
 * Outputs clearly distinguish synthetic scenarios, human-confirmed observations, and local demo permissions.
 */
export type ExportObservation={debris:string;sediment:string;vegetation:string;inspectorConfirmed?:boolean;analysisMode?:string};
export type ExportEvent={atUtc:string;type:string;actor?:string;description:string};
export type ExportWorkflow={status?:string;action?:string;reason?:string;assignedTo?:string;review?:{decision?:string;reason?:string;by?:string;atUtc?:string};completion?:{note?:string;afterPhotoData?:string;afterPhotoName?:string;atUtc?:string};verification?:{decision?:string;note?:string;atUtc?:string};events?:ExportEvent[]};
export type ExportCase={id:string;placeId:string;placeName:string;createdAt:string;status:string;note:string;photoName?:string;photoData?:string;photoSource?:string;observations?:ExportObservation;events?:ExportEvent[];workflow?:ExportWorkflow};
export type ExportDecision={priority:string;summary:string;ruleset:string; factors?:Array<{label:string;value?:string;explanation?:string;source?:string}>; uncertainties?:string[]; interventionStatus?:string};
export type ExportBundle={case:ExportCase;scenario:string;decision?:ExportDecision;generatedAt:string;demoNotice:string;source:string};
export const DEMO_NOTICE='DEMONSTRATION ONLY. Fictional assets and illustrative rainfall rules. Not an actual flood forecast, engineering assessment, maintenance authorization, or verified environmental outcome.';

const safeText=(v:unknown)=>String(v??'').replace(/[\u0000-\u001f\u007f]/g,' ').trim();
export const exportFileName=(id:string,ext:string)=>'SpongeCheck_'+id.replace(/[^a-zA-Z0-9_-]/g,'_')+'.'+ext;
function htmlEsc(v:unknown){return safeText(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]||c));}
function pdfText(v:unknown){return safeText(v).normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[—–−]/g,'-').replace(/[‘’]/g,"'").replace(/[“”]/g,'"').replace(/[^\x20-\x7e]/g,'?').replace(/[\\()]/g,'\\$&');}
function encode(s:string):Uint8Array{return new TextEncoder().encode(s);}
function concat(parts:Uint8Array[]):Uint8Array{const size=parts.reduce((n,a)=>n+a.length,0),out=new Uint8Array(size);let k=0;for(const p of parts){out.set(p,k);k+=p.length;}return out;}
function binaryFromBase64(s:string):Uint8Array{const raw=atob(s);const bytes=new Uint8Array(raw.length);for(let i=0;i<raw.length;i++)bytes[i]=raw.charCodeAt(i);return bytes;}
class PdfWriter{
 private objects:(Uint8Array|null)[]=[];
 reserve(){this.objects.push(null);return this.objects.length;}
 set(n:number,s:string|Uint8Array){this.objects[n-1]=typeof s==='string'?encode(s):s;}
 obj(s:string|Uint8Array){const i=this.reserve();this.set(i,s);return i;}
 stream(dict:string,data:Uint8Array){return this.obj(concat([encode('<< '+dict+' /Length '+data.length+' >>\nstream\n'),data,encode('\nendstream')]));}
 finish(root:number){const out:Uint8Array[]=[encode('%PDF-1.4\n%\xC2\xA5\xC2\xA5\n')],offsets=[0];let pos=out[0].length;for(let i=0;i<this.objects.length;i++){offsets.push(pos);const b=concat([encode(`${i+1} 0 obj\n`),this.objects[i]||encode('null'),encode('\nendobj\n')]);out.push(b);pos+=b.length;}
  const xref=pos;out.push(encode('xref\n0 '+(this.objects.length+1)+'\n0000000000 65535 f \n'+offsets.slice(1).map(n=>String(n).padStart(10,'0')+' 00000 n \n').join('')+'trailer\n<< /Size '+(this.objects.length+1)+' /Root '+root+' 0 R >>\nstartxref\n'+xref+'\n%%EOF\n'));return new Blob(out as BlobPart[],{type:'application/pdf'});}
}
function splitLines(raw:string,max=91):string[]{const text=safeText(raw),lines:string[]=[];if(!text)return ['-'];for(const paragraph of text.split('\n')){const words=paragraph.split(/\s+/);let line='';for(const word of words){if(!word)continue;if((line+' '+word).trim().length>max){if(line){lines.push(line);line='';}if(word.length>max){for(let i=0;i<word.length;i+=max)lines.push(word.slice(i,i+max));}else line=word;}else line=(line+' '+word).trim();}if(line)lines.push(line);}return lines;}
type DrawPage={content:string[];y:number;images:Set<string>};
async function jpegImage(photo?:string):Promise<{width:number;height:number;bytes:Uint8Array}|null>{if(!photo||!/^data:image\/(jpeg|png|webp);base64,/.test(photo))return null;try{const img=await new Promise<HTMLImageElement>((res,rej)=>{const i=new Image();i.onload=()=>res(i);i.onerror=rej;i.src=photo;});const canvas=document.createElement('canvas');const scale=Math.min(1,940/Math.max(img.naturalWidth,img.naturalHeight));canvas.width=Math.round(img.naturalWidth*scale);canvas.height=Math.round(img.naturalHeight*scale);const ctx=canvas.getContext('2d');if(!ctx)return null;ctx.fillStyle='#FFFFFF';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(img,0,0,canvas.width,canvas.height);return {width:canvas.width,height:canvas.height,bytes:binaryFromBase64(canvas.toDataURL('image/jpeg',.75).split(',')[1])};}catch{return null;}}
export async function makePdf(title:string,sections:Array<{title:string;lines:string[]}>,photo?:string,afterPhoto?:string):Promise<Blob>{
 const pdf=new PdfWriter();const pages:DrawPage[]=[];const pageW=595,pageH=842,margin=48;
 let pg:DrawPage={content:[],y:740,images:new Set()};
 const next=()=>{pg={content:[],y:740,images:new Set()};pages.push(pg);pg.content.push('0.35 0.11 0.21 rg 0 796 595 46 re f');pg.content.push(`BT /F2 16 Tf 1 1 1 rg 48 811 Td (SPONGECHECK 2.0) Tj ET`);};next();
 const line=(s:string,{bold=false,size=10,color='#25222A',gap=15}:{bold?:boolean;size?:number;color?:string;gap?:number}={})=>{if(pg.y<92)next();const hex=color.replace('#','');let rgb='0.15 0.13 0.17';if(hex.length===6)rgb=[0,2,4].map(i=>(parseInt(hex.slice(i,i+2),16)/255).toFixed(3)).join(' ');pg.content.push(`BT /${bold?'F2':'F1'} ${size} Tf ${rgb} rg 48 ${pg.y} Td (${pdfText(s)}) Tj ET`);pg.y-=gap;};
 line(title,{bold:true,size:20,color:'#5B1E35',gap:31});
 line('Generated '+new Date().toLocaleString('en-MY'),{size:10,color:'#695F65',gap:26});
 for(const section of sections){pg.y-=7;line(section.title.toUpperCase(),{bold:true,size:11,color:'#5B1E35',gap:19});for(const entry of section.lines){for(const item of splitLines(entry)){line(item,{size:10,gap:14});}pg.y-=6;}}
 const images=await Promise.all([{label:'INITIAL INSPECTION PHOTO',src:photo},{label:'AFTER-WORK PHOTO',src:afterPhoto}].map(async (p,i)=>({label:p.label,id:'Im'+i,photo:await jpegImage(p.src)})));
 const imgObjects:Record<string,number>={};
 for(const image of images){const jpeg=image.photo;if(!jpeg)continue;
   if(pg.y<330)next();line(image.label,{bold:true,size:11,color:'#5B1E35',gap:20});
   const w=360,h=Math.min(235,w*jpeg.height/jpeg.width),y=pg.y-h;
   pg.content.push(`q ${w.toFixed(1)} 0 0 ${h.toFixed(1)} 48 ${y.toFixed(1)} cm /${image.id} Do Q`);
   pg.images.add(image.id);pg.y=y-25;
   line('Illustrative / inspector-supplied evidence - not verified flood performance.',{size:9,color:'#695F65',gap:17});
   imgObjects[image.id]=pdf.stream('/Type /XObject /Subtype /Image /Width '+jpeg.width+' /Height '+jpeg.height+' /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode',jpeg.bytes);
 }
 const font=pdf.obj('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');const boldFont=pdf.obj('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>');const pageRefs:number[]=[];
 const pageRoot=pdf.reserve();for(let idx=0;idx<pages.length;idx++){const item=pages[idx];item.content.push(`BT /F1 9 Tf 0.42 0.39 0.42 rg 48 44 Td (DEMO DATA - NOT AN OFFICIAL MAINTENANCE REPORT | Page ${idx+1} of ${pages.length}) Tj ET`);const content=pdf.stream('',encode(item.content.join('\n')+'\n'));const ref=pdf.obj(`<< /Type /Page /Parent ${pageRoot} 0 R /MediaBox [0 0 ${pageW} ${pageH}] /Resources << /Font << /F1 ${font} 0 R /F2 ${boldFont} 0 R >> ${item.images.size?'/XObject << '+[...item.images].map(i=>'/'+i+' '+imgObjects[i]+' 0 R').join(' ')+' >>':''} >> /Contents ${content} 0 R >>`);pageRefs.push(ref);}
 pdf.set(pageRoot,'<< /Type /Pages /Kids ['+pageRefs.map(n=>n+' 0 R').join(' ')+'] /Count '+pageRefs.length+' >>');const catalog=pdf.obj('<< /Type /Catalog /Pages '+pageRoot+' 0 R >>');return pdf.finish(catalog);
}
function eventLines(c:ExportCase):string[]{const evs=[...(c.events||[]),...(c.workflow?.events||[])];return evs.length?evs.map(e=>`${e.atUtc} | ${e.actor||'Demo user'} | ${e.description}`):['No recorded activity yet.'];}
export function caseSections(b:ExportBundle):Array<{title:string;lines:string[]}>{const c=b.case,o=c.observations,w=c.workflow;
 return [
  {title:'Report details',lines:[`Case: ${c.id} | Location: ${c.placeName} (${c.placeId})`,`Reported: ${c.createdAt} | Status: ${w?.status||c.status}`,`Source: ${b.source} | Photo: ${c.photoName||'Not provided'}`,`Notes: ${c.note}`]},
  {title:'Confirmed visual observations',lines:[o?`Debris: ${o.debris}; Sediment: ${o.sediment}; Vegetation: ${o.vegetation}`:'No structured observations.',o?.analysisMode==='simulated_labels'?'Prewritten sample image labels - not AI inference.': 'Inspector-recorded observations - no AI model used.']},
  {title:'Rainfall and inspection recommendation',lines:[`Scenario: ${b.scenario} (illustrative, not a live forecast)`,b.decision?`Suggested priority: ${b.decision.priority} | Rule set: ${b.decision.ruleset}`:'No decision snapshot available.',b.decision?.summary||'No recommendation.',...(b.decision?.factors||[]).map(f=>`Factor - ${f.label}: ${f.value||''} ${f.explanation||''} (${f.source||'demo rule'})`),...(b.decision?.uncertainties||[]).map(x=>'Uncertainty: '+x)]},
  {title:'Approval and maintenance',lines:[`Responsible crew: ${w?.assignedTo||'Not assigned'}`,`Proposed action: ${w?.action||'Not recorded'}`,`Reviewer decision: ${w?.review?.decision||'Not recorded'} ${w?.review?.reason||''}`,`Completion note: ${w?.completion?.note||'Not completed'}`,`Verification: ${w?.verification?.decision||'Not completed'} ${w?.verification?.note||''}`]},
  {title:'Activity history',lines:eventLines(c)},
  {title:'Scope and limitations',lines:[b.demoNotice,'Work verified in this demo refers to evidence documentation, not proven flooding prevention or ecological improvement.','Demo role selection is NOT production authentication.']},
 ];}
export function makeEvidenceHtml(bundle:ExportBundle):string {const c=bundle.case;const sections=caseSections(bundle);const photos=[{label:'Inspection image',src:c.photoData},{label:'After-work image',src:c.workflow?.completion?.afterPhotoData}].filter(p=>p.src&&/^data:image\//.test(p.src));return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${htmlEsc(c.id)} - SpongeCheck Evidence</title><style>body{background:#f8f5f2;color:#25222a;font:15px/1.6 system-ui,sans-serif;margin:0}.page{max-width:860px;margin:30px auto;padding:36px;background:#fff;box-shadow:0 8px 28px #33142616;border-radius:20px}h1{color:#5b1e35}h2{font-size:17px;color:#5b1e35;margin-top:28px;border-bottom:1px solid #e6dfe0;padding-bottom:8px}p{overflow-wrap:anywhere}.notice{background:#fff4eb;border-left:4px solid #d89b4a;padding:12px 16px}.gallery{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:15px}.gallery img{width:100%;max-height:340px;object-fit:contain;border-radius:12px;background:#f4f1f0}.gallery figure{margin:0}figcaption{font-size:12px;color:#69646b}@media print{body{background:#fff}.page{margin:0;padding:10px;box-shadow:none}.gallery img{max-height:250px}}@media(max-width:600px){.page{margin:0;padding:20px;border-radius:0}}</style></head><body><article class="page"><h1>SpongeCheck | Inspection evidence</h1><p class="notice">${htmlEsc(bundle.demoNotice)}</p>${sections.map(s=>`<section><h2>${htmlEsc(s.title)}</h2>${s.lines.map(x=>`<p>${htmlEsc(x)}</p>`).join('')}</section>`).join('')}<section><h2>Photographs</h2><div class="gallery">${photos.length?photos.map(x=>`<figure><img src="${x.src}" alt="${htmlEsc(x.label)}"><figcaption>${htmlEsc(x.label)} — demonstration data or inspector-supplied evidence</figcaption></figure>`).join(''):'<p>No photographs stored with this report.</p>'}</div></section><p class="notice">Created locally in your browser. Do not treat simulated sample photographs as verified records of actual maintenance.</p></article></body></html>`;}
export function summaryRows(cases:ExportCase[]):string[][]{return cases.map(c=>[c.id,c.placeId,c.placeName,c.createdAt,c.workflow?.status||c.status,c.observations?.debris||'',c.observations?.sediment||'',c.observations?.vegetation||'',c.workflow?.review?.decision||'',c.workflow?.verification?.decision||'']);}
export function makeSummaryCsv(cases:ExportCase[]):string {const rows=[['Case ID','Place ID','Place name','Created UTC','Status','Debris','Sediment','Vegetation','Review','Verification'],...summaryRows(cases)];return '\uFEFF'+rows.map(row=>row.map(v=>'"'+String(v??'').replace(/"/g,'""').replace(/^[=+@-]/,'\u0027$&')+'"').join(',')).join('\r\n');}
export function saveBlob(blob:Blob,filename:string){const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=filename;a.style.display='none';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),4500);}
export function textBlob(content:string,type:string){return new Blob([content],{type});}
