// SpongeCheck Phase 6: zero-dependency Telegram intake. Node.js 20+.
// Telegram records are always unconfirmed until a qualified human reviews them.
import {createServer} from 'node:http';
import {readFile,writeFile,rename,mkdir} from 'node:fs/promises';
import path from 'node:path';
import {randomUUID,timingSafeEqual} from 'node:crypto';

export const ASSETS=Object.freeze([
  {id:'A-01',name:'Wetland Outlet'}, {id:'B-02',name:'Reed Habitat'},
  {id:'C-03',name:'Planted Swale'}, {id:'D-04',name:'Pond Inlet'},
  {id:'E-05',name:'Wetland Cell'}, {id:'F-06',name:'Detention Pond'}
]);
const ASSET_MAP=new Map(ASSETS.map(a=>[a.id,a]));
const MAX_FILE_BYTES=2*1024*1024;
const MAX_BODY_BYTES=256*1024;
const API_TIMEOUT_MS=12000;
const safeEqual=(a,b)=>{
  const x=Buffer.from(String(a||''));const y=Buffer.from(String(b||''));
  return x.length===y.length&&x.length>0&&timingSafeEqual(x,y);
};
const visibleName=(s)=>String(s||'').replace(/[\u0000-\u001f<>]/g,'').slice(0,60);
const safeNotes=(s)=>String(s||'').replace(/[\u0000-\u001f]/g,' ').trim().slice(0,500);
function allowedId(id,set){return set.has(String(id));}
export function configFromEnv(env=process.env){
  const token=(env.TELEGRAM_BOT_TOKEN||'').trim(),secret=(env.TELEGRAM_WEBHOOK_SECRET||'').trim();
  const key=(env.SPONGECHECK_DASHBOARD_KEY||'').trim();
  const users=new Set(String(env.TELEGRAM_ALLOWED_USER_IDS||'').split(',').map(x=>x.trim()).filter(x=>/^\d+$/.test(x)));
  if(key && key.length<24)throw new Error('SPONGECHECK_DASHBOARD_KEY must have at least 24 characters.');
  if(token && (!secret||secret.length<20||!users.size||!key))throw new Error('Bot token requires webhook secret, allowed user IDs, and dashboard key.');
  if(secret&&!/^[A-Za-z0-9_-]+$/.test(secret))throw new Error('Telegram webhook secret must contain A-Z, a-z, 0-9, underscore or hyphen only.');
  const origin=(env.SPONGECHECK_ALLOWED_ORIGIN||'').trim().replace(/\/$/,'');
  return {token,secret,key,users,managerChatId:(env.TELEGRAM_MANAGER_CHAT_ID||'').trim(),origin,
    publicAppUrl:(env.SPONGECHECK_PUBLIC_APP_URL||'').trim(),
    dbFile:path.resolve(env.SPONGECHECK_DATA_FILE||path.join(process.cwd(),'.private-spongebot','data.json')),
    port:Number(env.PORT||8787),botUsername:(env.TELEGRAM_BOT_USERNAME||'').replace(/^@/,'')};
}
export class Store {
  constructor(file){this.file=path.resolve(file);this.records={cases:[],seenUpdates:[],sessions:{}};this.queue=Promise.resolve();}
  async init(){try{const d=JSON.parse(await readFile(this.file,'utf8'));if(Array.isArray(d.cases)&&Array.isArray(d.seenUpdates)&&d.sessions&&typeof d.sessions==='object')this.records=d;}catch(e){if(e.code!=='ENOENT')throw e;}}
  async save(){await mkdir(path.dirname(this.file),{recursive:true,mode:0o700});const tmp=this.file+'.'+randomUUID()+'.tmp';await writeFile(tmp,JSON.stringify(this.records),{mode:0o600});await rename(tmp,this.file);}
  async mutate(fn){const step=this.queue.then(async()=>{const out=await fn(this.records);await this.save();return out;});this.queue=step.catch(()=>{});return step;}
  list(){return this.records.cases.map(x=>({...x})).reverse();}
  byId(id){return this.records.cases.find(c=>c.id===id);}
}
export function makeTelegramApi(token,{fetchFn=fetch}={}){
  const endpoint='https://api.telegram.org/bot'+token+'/';
  return {
    async call(method,body){const response=await fetchFn(endpoint+method,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body),signal:AbortSignal.timeout(API_TIMEOUT_MS)});const data=await response.json();if(!response.ok||!data.ok)throw new Error('Telegram API '+method+' failed');return data.result;},
    async download(fileId){const file=await this.call('getFile',{file_id:fileId});if(!file.file_path||file.file_size>MAX_FILE_BYTES)throw new Error('Attachment is too large');
      const url='https://api.telegram.org/file/bot'+token+'/'+file.file_path;
      const r=await fetchFn(url,{signal:AbortSignal.timeout(API_TIMEOUT_MS)});if(!r.ok)throw new Error('Telegram photo could not be downloaded');
      const len=Number(r.headers?.get?.('content-length')||0);if(len>MAX_FILE_BYTES)throw new Error('Attachment is too large');
      const b=Buffer.from(await r.arrayBuffer());if(b.byteLength>MAX_FILE_BYTES)throw new Error('Attachment is too large');
      if(!(b.length>=4&&b[0]===0xff&&b[1]===0xd8&&b[b.length-2]===0xff&&b[b.length-1]===0xd9))throw new Error('Unsupported photo content');
      return 'data:image/jpeg;base64,'+b.toString('base64');
    }
  };
}
export function createSpongeBot(config,store,api=makeTelegramApi(config.token)){
  const configured=Boolean(config.token&&config.secret&&config.key&&config.users.size);
  const send=async(chat_id,text)=>{try{await api.call('sendMessage',{chat_id,text,disable_web_page_preview:true});return true;}catch{return false;}};
  async function process(update){
    if(!configured)return {ignored:true,reason:'not_configured'};
    if(!Number.isSafeInteger(update?.update_id)||update.update_id<0)return {ignored:true,reason:'invalid_update'};
    if(store.records.seenUpdates.includes(update.update_id))return {duplicate:true};
    const msg=update.message;
    if(!msg?.from?.id||!msg?.chat?.id||msg.chat.type!=='private'||!allowedId(msg.from.id,config.users))return {ignored:true,reason:'unauthorized'};
    const userId=String(msg.from.id),chatId=String(msg.chat.id);
    const text=String(msg.text||'').trim();
    const session=store.records.sessions[userId]||{assetId:null};
    let response='',managerNotice='',newCase=null;
    if(/^\/start(?:@\w+)?(?:\s|$)/i.test(text))response='Welcome to SpongeBot. Send /inspect to report an issue. Only approved demo inspectors can use this bot. Please avoid including people or private details in photos.';
    else if(/^\/help(?:@\w+)?(?:\s|$)/i.test(text))response='Commands: /inspect, /asset A-01, /status SC-..., /cancel. Add a photo after choosing a place.';
    else if(/^\/cancel(?:@\w+)?(?:\s|$)/i.test(text)){session.assetId=null;response='Inspection cancelled. Send /inspect when ready.';}
    else if(/^\/inspect(?:@\w+)?(?:\s|$)/i.test(text)){session.assetId=null;response='Which place are you checking? Send /asset A-01 (or B-02, C-03, D-04, E-05, F-06). These are fictional demo places.';}
    else if(/^\/asset(?:@\w+)?\s+([a-z]-\d\d)\s*$/i.test(text)){
      const id=text.match(/^\/asset(?:@\w+)?\s+([a-z]-\d\d)/i)[1].toUpperCase();
      if(!ASSET_MAP.has(id))response='That place is not on the demo list. Choose A-01, B-02, C-03, D-04, E-05 or F-06.';
      else{session.assetId=id;response=`Selected ${ASSET_MAP.get(id).name} (${id}). Send one photo, with an optional caption. This is a sample inspection, not an AI diagnosis.`;}
    } else if(/^\/status(?:@\w+)?\s+(SC-[\w-]+)/i.test(text)){
      const id=text.match(/^\/status(?:@\w+)?\s+(SC-[\w-]+)/i)[1].toUpperCase();
      const item=store.byId(id);response=(item&&item.telegramUserId===userId)?`${item.id}: ${item.status}. Place: ${item.placeName}.`: 'No matching report belongs to this chat.';
    } else if(Array.isArray(msg.photo)&&msg.photo.length){
      if(!session.assetId)response='Please choose a place first: send /inspect, then /asset A-01.';
      else{
        const photo=msg.photo.filter(p=>p.file_id&&(!p.file_size||p.file_size<=MAX_FILE_BYTES)).sort((a,b)=>(b.file_size||0)-(a.file_size||0))[0];
        if(!photo){response='This photo is too large. Try sending a smaller image (under 2 MB).';}
        else{
          let photoData;try{photoData=await api.download(photo.file_id);}catch{response='The photo could not be saved. Try sending a smaller JPG image.';}
          if(photoData){
            const id='SC-TG-'+String(update.update_id).padStart(6,'0');const asset=ASSET_MAP.get(session.assetId);
            newCase={id,placeId:asset.id,placeName:asset.name,note:safeNotes(msg.caption)||'Photo inspection submitted through Telegram; observations need human confirmation.',
              createdAt:new Date((msg.date||Math.floor(Date.now()/1000))*1000).toISOString(),status:'Awaiting inspector review',source:'telegram',telegramUserId:userId,
              photoName:'Telegram inspection photo',photoData,observations:{debris:'unsure',sediment:'unsure',vegetation:'unsure',inspectorConfirmed:false,analysisMode:'manual_only'},
              events:[{id:'tg-event-'+update.update_id,atUtc:new Date().toISOString(),type:'telegram_photo_received',actor:'Telegram inspector',description:'Photo received from approved Telegram user. No automated analysis performed.'}]};
            session.assetId=null;response=`Report ${id} saved for ${asset.name}. A human inspector must confirm the photo observations. Use /status ${id} to check its status.`;
            managerNotice=`SpongeCheck: new Telegram inspection ${id}\nPlace: ${asset.name} (${asset.id})\nStatus: Awaiting inspector review\nOpen SpongeCheck to review the sample case.`;
          }
        }
      }
    } else response='Send /inspect to start a report, or /help for commands.';
    const accepted=await store.mutate(db=>{if(db.seenUpdates.includes(update.update_id))return false;db.seenUpdates.push(update.update_id);db.seenUpdates=db.seenUpdates.slice(-2000);db.sessions[userId]=session;db.lastUpdateAt=new Date().toISOString();
      if(newCase&&!db.cases.some(x=>x.id===newCase.id)){db.cases.push(newCase);db.cases=db.cases.slice(-100);}return true;});
    if(!accepted)return {duplicate:true};
    if(response)await send(chatId,response);
    if(managerNotice&&config.managerChatId)await send(config.managerChatId,managerNotice);
    return {ok:true,caseId:newCase?.id||null};
  }
  return {configured,process};
}
function json(res,status,body,origin=''){
  const headers={'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff',
    'Referrer-Policy':'no-referrer','X-Frame-Options':'DENY'};
  if(origin){headers['Access-Control-Allow-Origin']=origin;headers['Vary']='Origin';headers['Access-Control-Allow-Headers']='Authorization, Content-Type';headers['Access-Control-Allow-Methods']='GET, POST, OPTIONS';}
  res.writeHead(status,headers);res.end(JSON.stringify(body));
}
function readLimited(req){return new Promise((resolve,reject)=>{let chunks=[],len=0;req.on('data',d=>{len+=d.length;if(len>MAX_BODY_BYTES){reject(new Error('request too large'));req.destroy();return;}chunks.push(d);});req.on('end',()=>resolve(Buffer.concat(chunks).toString('utf8')));req.on('error',reject);});}
export function makeHandler(config,store,bot){
  return async function handler(req,res){
    const url=new URL(req.url||'/', 'http://localhost');
    const origin=String(req.headers.origin||'');
    const corsOrigin=(origin&&config.origin&&origin===config.origin)?origin:'';
    if(origin && origin!==config.origin){json(res,403,{error:'Origin not allowed'});return;}
    if(req.method==='OPTIONS'){json(res,corsOrigin?200:403,{ok:!!corsOrigin},corsOrigin);return;}
    if(req.method==='GET'&&url.pathname==='/api/telegram/status'){
      const last=store.records.lastUpdateAt||null;
      json(res,200,{configured:bot.configured,connected:bot.configured&&!!last,botUsername:bot.configured?config.botUsername:'',lastInboundAt:last,
        message:bot.configured?(last?'An allowed Telegram update reached this backend; current delivery still depends on the webhook.':'Bot configured; Telegram webhook delivery has not yet been verified.'):'No Telegram bot connected. This is a local sample.'},corsOrigin);return;}
    if(req.method==='GET'&&url.pathname==='/api/telegram/cases'){
      if(!config.key||!safeEqual(req.headers.authorization?.replace(/^Bearer\s+/i,''),config.key)){json(res,401,{error:'Enter a valid dashboard access key to view Telegram reports.'},corsOrigin);return;}
      json(res,200,{cases:store.list(),updatedAt:new Date().toISOString(),source:'telegram'},corsOrigin);return;}
    if(req.method==='POST'&&url.pathname==='/webhooks/telegram'){
      if(!bot.configured||!safeEqual(req.headers['x-telegram-bot-api-secret-token'],config.secret)){json(res,401,{error:'Invalid webhook secret'});return;}
      try{const data=JSON.parse(await readLimited(req));const result=await bot.process(data);json(res,200,result);}catch(e){json(res,400,{error:'Invalid Telegram update'});}return;
    }
    json(res,404,{error:'Not found'},corsOrigin);
  };
}
export async function startServer(config=configFromEnv(),api=null){
  const store=new Store(config.dbFile);await store.init();const bot=createSpongeBot(config,store,api||makeTelegramApi(config.token));
  const server=createServer(makeHandler(config,store,bot));await new Promise(resolve=>server.listen(config.port,'0.0.0.0',resolve));
  return {server,store,bot};
}
