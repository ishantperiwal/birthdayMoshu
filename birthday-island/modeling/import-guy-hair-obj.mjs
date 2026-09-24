import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here=path.dirname(fileURLToPath(import.meta.url));
const source=path.resolve(process.argv[2]??path.join(here,'../../testassets/one hairstyle.obj'));
const target=path.resolve(process.argv[3]??path.join(here,'../assets/guy-hair.js'));
const lines=(await readFile(source,'utf8')).split(/\r?\n/);
const raw=[],indices=[];

for(const line of lines){
  const value=line.trim();
  if(value.startsWith('v '))raw.push(value.split(/\s+/).slice(1,4).map(Number));
  if(value.startsWith('f ')){
    const face=value.slice(2).trim().split(/\s+/).map(part=>Number(part.split('/')[0])-1);
    for(let i=1;i<face.length-1;i++)indices.push(face[0],face[i],face[i+1]);
  }
}

if(!raw.length||!indices.length)throw new Error(`No mesh geometry found in ${source}`);
const min=raw[0].slice(),max=raw[0].slice();
for(const vertex of raw)for(let axis=0;axis<3;axis++){
  min[axis]=Math.min(min[axis],vertex[axis]);max[axis]=Math.max(max[axis],vertex[axis]);
}

// The Blender sheet stores styles in display cells away from the origin.
// Fit the lower sides around the scalp shell while keeping the lowest fringe
// at 1.61, above the eyes. Reduce crown height without lifting the whole mesh.
const scaleX=3.05,scaleY=1.85,scaleZ=2.35;
const centerX=(min[0]+max[0])/2,centerZ=(min[2]+max[2])/2;
const positions=raw.flatMap(([x,y,z])=>{
  const height=(y-min[1])/(max[1]-min[1]);
  const rear=(z-min[2])/(max[2]-min[2]);
  // Lower side/rear locks overlap the shell, with the front and crown held.
  const drop=.10*rear*Math.pow(1-height,1.5);
  return [
    Number(((x-centerX)*scaleX).toFixed(6)),
    Number((1.61+(y-min[1])*scaleY-drop).toFixed(6)),
    Number(((z-centerZ)*scaleZ+.012).toFixed(6)),
  ];
});
const module=`// Generated from ${path.basename(source)} by modeling/import-guy-hair-obj.mjs.\nexport const guyHairMesh=${JSON.stringify({positions,indices})};\n`;
await writeFile(target,module);
console.log(`Wrote ${target} (${raw.length} vertices, ${indices.length/3} triangles)`);
