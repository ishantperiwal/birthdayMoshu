import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
const require=createRequire('/Users/ishant.p/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/package.json');
const {chromium}=require('playwright');
const browser=await chromium.launch({headless:true,channel:'chrome'});
try{
 const page=await browser.newPage({viewport:{width:1100,height:850}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:4173/?inspect&view=treebase');
 await page.waitForFunction(()=>!document.querySelector('#enter').disabled);await page.click('#enter');await page.waitForTimeout(1800);
 const result=await page.evaluate(async()=>{
  const THREE=await import('three'),{referenceTreeGeometry}=await import('/reference-trees.js?v=solid-bases-2');
  let checked=0,minDot=1;
  for(let variant=0;variant<4;variant++){
   const g=referenceTreeGeometry(variant===3?'pine':'broadleaf',471+variant*137),p=g.attributes.position,n=g.attributes.normal,f=g.attributes.flx;
   const a=new THREE.Vector3(),b=new THREE.Vector3(),c=new THREE.Vector3(),normal=new THREE.Vector3(),expected=new THREE.Vector3();
   for(let j=0;j<g.index.count;j+=3){
    const ids=[g.index.getX(j),g.index.getX(j+1),g.index.getX(j+2)];
    if(ids.some(i=>f.getX(i)>.9))continue;
    a.fromBufferAttribute(p,ids[0]);b.fromBufferAttribute(p,ids[1]);c.fromBufferAttribute(p,ids[2]);
    normal.crossVectors(b.sub(a),c.sub(a)).normalize();expected.set(0,0,0);
    for(const i of ids)expected.add(new THREE.Vector3().fromBufferAttribute(n,i));
    minDot=Math.min(minDot,normal.dot(expected.normalize()));checked++;
   }
   g.dispose();
  }
  return {checked,minDot};
 });
 assert.ok(result.minDot>0,JSON.stringify(result));assert.equal(errors.length,0,errors.join('\n'));
 await page.screenshot({path:'/tmp/island-tree-base.png'});
 console.log('PASS: all trunk and branch faces point outward',result);
}finally{await browser.close();}
