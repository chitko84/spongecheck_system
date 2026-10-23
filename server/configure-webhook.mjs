// Node 20+: node --env-file=.env server/configure-webhook.mjs
// Neither API token nor webhook secret are printed.
import {configFromEnv,makeTelegramApi} from './spongebot.mjs';
try{
 const config=configFromEnv();
 const url=(process.env.TELEGRAM_WEBHOOK_URL||'').trim();
 if(!config.token||!config.secret)throw new Error('Set TELEGRAM_BOT_TOKEN and TELEGRAM_WEBHOOK_SECRET in .env first.');
 if(!url||new URL(url).protocol!=='https:')throw new Error('TELEGRAM_WEBHOOK_URL must be a public HTTPS URL ending in /webhooks/telegram.');
 if(!new URL(url).pathname.endsWith('/webhooks/telegram'))throw new Error('Webhook path must end in /webhooks/telegram.');
 const api=makeTelegramApi(config.token);
 await api.call('setWebhook',{url,secret_token:config.secret,allowed_updates:['message'],drop_pending_updates:false});
 const info=await api.call('getWebhookInfo',{});
 console.log('Telegram webhook configured. URL:',info.url,'Pending updates:',info.pending_update_count,'Latest Telegram error:',info.last_error_message||'none');
}catch(e){console.error('Webhook configuration failed:',e.message);process.exit(1);}
