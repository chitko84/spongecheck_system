const fs=require('fs'),path=require('path');
// Prefer project dependencies; also support a global TypeScript installation for offline QA.
let ts;
try { ts = require('typescript'); }
catch {
  const globalTs = path.join(path.dirname(process.execPath), '..', 'lib', 'node_modules', 'typescript');
  try { ts = require(globalTs); }
  catch { throw new Error('TypeScript not found. Run npm install before building the offline preview.'); }
}
const root=__dirname, out=path.join(root,'offline-preview');
fs.mkdirSync(path.join(out,'assets'),{recursive:true});
let engine=fs.readFileSync(path.join(root,'src','decisionEngine.ts'),'utf8').replace(/\bexport /g,'');
let workflow=fs.readFileSync(path.join(root,'src','caseWorkflow.ts'),'utf8').replace(/\bexport /g,'');
let report=fs.readFileSync(path.join(root,'src','reportExport.ts'),'utf8').replace(/\bexport /g,'');
let source=engine+'\n'+workflow+'\n'+report+'\n'+fs.readFileSync(path.join(root,'src','App.tsx'),'utf8')
  .replace(/^import \* as React from 'react';\s*/m,'')
  .replace(/^import \{.*?\} from '\.\/decisionEngine';\s*/m,'')
  .replace(/^import \{.*?\} from '\.\/caseWorkflow';\s*/m,'')
  .replace(/^import \{.*?\} from '\.\/reportExport';\s*/m,'')
  .replace('export default class App extends React.Component', 'class App extends React.Component');
const compiled=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2019,module:ts.ModuleKind.None,jsx:ts.JsxEmit.React},reportDiagnostics:true});
const diagnostics=(compiled.diagnostics||[]).filter(d=>d.category===ts.DiagnosticCategory.Error);
if(diagnostics.length){for(const d of diagnostics)console.error(ts.flattenDiagnosticMessageText(d.messageText,'\n'));process.exit(1)}
fs.writeFileSync(path.join(out,'app.bundle.js'), compiled.outputText+"\nReactDOM.render(React.createElement(App,{}),document.getElementById('root'));\n");
fs.copyFileSync(path.join(root,'src','styles.css'),path.join(out,'styles.css'));
fs.cpSync(path.join(root,'public','assets'),path.join(out,'assets'),{recursive:true,force:true});
for(const [src,dst] of [['react','react.js'],['react-dom','react-dom.js']]){
  const shipped=path.join(out,dst);
  // Existing checked-in preview runtime is bundled with the project; do not require
  // non-portable Jupyter or system paths on a developer's laptop.
  if (!fs.existsSync(shipped)) {
    const local=path.join(root,'node_modules',src,'umd',src+'.production.min.js');
    if (!fs.existsSync(local)) throw new Error('Missing '+dst+'. Run npm install or restore the bundled offline-preview assets.');
    fs.copyFileSync(local,shipped);
  }
}
const html=`<!doctype html><html lang="en"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover"/><meta name="theme-color" content="#5B1E35"/><title>SpongeCheck — Phase 8 Offline Preview</title><link rel="stylesheet" href="/styles.css" /></head><body><div id="root"></div><script src="/react.js"></script><script src="/react-dom.js"></script><script src="/app.bundle.js"></script></body></html>`;
fs.writeFileSync(path.join(out,'index.html'),html);
console.log('Offline browser preview generated (Telegram API calls require a real backend).');
