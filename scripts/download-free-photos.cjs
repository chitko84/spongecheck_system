/** Download curated Pexels free-use photos; patch source ONLY after all downloads are verified. */
const fs=require('node:fs'); const path=require('node:path'); const https=require('node:https');
const root=path.resolve(__dirname,'..');
const manifest=require(path.join(root,'free-photo-manifest.json'));
const out=path.join(root,'public','assets','photos');
const app=path.join(root,'src','App.tsx');
const staging=path.join(out,'.staging');
fs.mkdirSync(staging,{recursive:true});
function fetch(url,destination,redirects=0){
  if(redirects>5) return Promise.reject(new Error('Too many redirects'));
  const u=new URL(url);
  if(u.protocol!=='https:'||u.hostname!=='images.pexels.com')throw Error('Refusing unexpected image host');
  return new Promise((resolve,reject)=>{
    const req=https.get(u,{headers:{'User-Agent':'SpongeCheckDemoPhotoDownloader/1.0'}},res=>{
      if(res.statusCode>=300&&res.statusCode<400&&res.headers.location){res.resume();return fetch(new URL(res.headers.location,u).href,destination,redirects+1).then(resolve,reject);}
      if(res.statusCode!==200){res.resume();return reject(Error(`HTTP ${res.statusCode}`));}
      if(!String(res.headers['content-type']||'').toLowerCase().startsWith('image/')){res.resume();return reject(Error('Response was not an image'));}
      let bytes=0,head=Buffer.alloc(0),chunks=[];
      res.on('data',c=>{bytes+=c.length;if(bytes>10*1024*1024){req.destroy(Error('Image larger than 10 MB'));return;}chunks.push(c);if(head.length<32) head=Buffer.concat([head,c]).subarray(0,32);});
      res.on('end',()=>{
        const b=Buffer.concat(chunks);
        if(b.length<500||!(b[0]===0xFF&&b[1]===0xD8&&b[2]===0xFF))return reject(Error('Invalid JPEG image bytes'));
        fs.writeFileSync(destination,b);resolve(b.length);
      });res.on('error',reject);
    });req.setTimeout(25000,()=>req.destroy(Error('Image request timed out')));req.on('error',reject);
  });
}
async function main(){
 let total=0;const assets=Object.entries(manifest.photos);
 console.log(`Downloading ${assets.length} distinct free-use Pexels photographs.`);
 for(const [name,photo] of assets){
   const dest=path.join(staging,photo.file);
   const size=await fetch(photo.url,dest);
   total+=size;
   console.log(`✓ ${name}: ${(size/1024).toFixed(0)} KB (${photo.photographer})`);
 }
 let source=fs.readFileSync(app,'utf8');
 for(const [name,photo] of assets){
   const target=`/assets/photos/${photo.file}`;
   if(!source.includes(photo.url)&&!source.includes(target)) throw Error(`Missing expected image source: ${name}`);
   source=source.split(photo.url).join(target);
 }
 // Commit after successful downloads; no partial rewrite on failures.
 for(const [name,photo] of assets)fs.renameSync(path.join(staging,photo.file),path.join(out,photo.file));
 fs.writeFileSync(app,source);
 try{fs.rmdirSync(staging);}catch{}
 console.log(`\nAll ${assets.length} photos saved in public/assets/photos (${(total/1024/1024).toFixed(2)} MB).`);
 console.log('React source now loads LOCAL photos. Next: npm run dev (or npm run build).');
 console.log('To rebuild the standalone demo, run: npm run build:offline');
}
main().catch(err=>{console.error('\nDOWNLOAD FAILED: '+err.message);console.error('No React source URLs were changed. Try again when you have a stable internet connection.');process.exitCode=1;});
