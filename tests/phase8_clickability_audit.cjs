/* Source-level interaction inventory; supplements browser click-through tests.
   This cannot prove behavior, but catches unlabeled and inert buttons before release. */
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const ts=require('typescript');
const file=path.join(__dirname,'..','src','App.tsx');
const source=fs.readFileSync(file,'utf8');
const ast=ts.createSourceFile(file,source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
const all=[]; const missing=[]; let anchors=0;
function hasAttr(node,name){return node.attributes?.properties?.some(x=>ts.isJsxAttribute(x)&&x.name.text===name)}
function getAttr(node,name){return node.attributes?.properties?.find(x=>ts.isJsxAttribute(x)&&x.name.text===name)}
function visit(node){
 if(ts.isJsxOpeningElement(node)||ts.isJsxSelfClosingElement(node)){
  const tag=node.tagName.getText(ast);
  if(tag==='button'){
   const at=ast.getLineAndCharacterOfPosition(node.getStart(ast)).line+1;
   const click=hasAttr(node,'onClick');const disabled=hasAttr(node,'disabled');const submit=getAttr(node,'type')?.initializer?.getText(ast).includes('submit');
   const handled=click||submit;
   const entry={line:at,handled,disabled};all.push(entry);
   if(!handled&&!disabled)missing.push(at);
  }
  if(tag==='a'){
   anchors++;
   if(/href\s*=\s*["']#["']/.test(node.getText(ast))) missing.push('empty-link:'+(ast.getLineAndCharacterOfPosition(node.getStart(ast)).line+1));
  }
 }
 ts.forEachChild(node,visit);
}
visit(ast);
console.log(`Button elements: ${all.length}; handled: ${all.filter(x=>x.handled).length}; disabled-only: ${all.filter(x=>x.disabled&&!x.handled).length}; link elements: ${anchors}`);
if(missing.length)console.log('Missing explicit handler/disabled state at:',missing.join(', '));
assert.equal(missing.length,0,'Clickable elements missing handlers');
console.log('STATIC INTERACTION AUDIT PASSED (not a substitute for browser behavior tests)');
