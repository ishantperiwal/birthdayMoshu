import {readFile,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';

const here=path.dirname(fileURLToPath(import.meta.url));
const bytes=await readFile(path.join(here,'../../testassets/lego_hair.glb'));
if(bytes.readUInt32LE(0)!==0x46546c67||bytes.readUInt32LE(4)!==2)throw Error('Expected GLB 2');
let gltf,binary;
for(let offset=12;offset<bytes.length;){
  const length=bytes.readUInt32LE(offset),type=bytes.readUInt32LE(offset+4);
  const chunk=bytes.subarray(offset+8,offset+8+length);
  if(type===0x4e4f534a)gltf=JSON.parse(chunk.toString('utf8'));
  if(type===0x004e4942)binary=chunk;
  offset+=8+length;
}
const identity=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1];
const multiply=(a,b)=>Array.from({length:16},(_,i)=>{
  const row=i%4,col=Math.floor(i/4);let sum=0;
  for(let k=0;k<4;k++)sum+=a[k*4+row]*b[col*4+k];return sum;
});
function accessor(index){
  const a=gltf.accessors[index],v=gltf.bufferViews[a.bufferView];
  if(a.sparse||a.normalized||v.buffer!==0)throw Error('Unsupported accessor');
  const width={VEC3:3,SCALAR:1}[a.type];
  const format={5126:[4,'readFloatLE'],5125:[4,'readUInt32LE'],5123:[2,'readUInt16LE']}[a.componentType];
  if(!width||!format)throw Error('Unsupported component type');
  const [size,read]=format,stride=v.byteStride??width*size,start=(v.byteOffset??0)+(a.byteOffset??0);
  return Array.from({length:a.count*width},(_,i)=>binary[read](start+Math.floor(i/width)*stride+(i%width)*size));
}
const positions=[],normals=[],indices=[];
function visit(index,parent){
  const node=gltf.nodes[index];
  if(node.translation||node.rotation||node.scale)throw Error('TRS node requires conversion');
  const m=multiply(parent,node.matrix??identity);
  if(node.mesh!==undefined)for(const p of gltf.meshes[node.mesh].primitives){
    if((p.mode??4)!==4)throw Error('Expected triangles');
    const vertices=accessor(p.attributes.POSITION),sourceNormals=accessor(p.attributes.NORMAL),base=positions.length/3;
    const a=m[0],b=m[4],c=m[8],d=m[1],e=m[5],f=m[9],g=m[2],h=m[6],i=m[10];
    const cof=[e*i-f*h,f*g-d*i,d*h-e*g,c*h-b*i,a*i-c*g,b*g-a*h,b*f-c*e,c*d-a*f,a*e-b*d];
    const det=a*cof[0]+b*cof[1]+c*cof[2];
    for(let j=0;j<vertices.length;j+=3){
      const [x,y,z]=vertices.slice(j,j+3),[nx,ny,nz]=sourceNormals.slice(j,j+3);
      positions.push(m[0]*x+m[4]*y+m[8]*z+m[12],m[1]*x+m[5]*y+m[9]*z+m[13],m[2]*x+m[6]*y+m[10]*z+m[14]);
      const n=[(cof[0]*nx+cof[1]*ny+cof[2]*nz)/det,(cof[3]*nx+cof[4]*ny+cof[5]*nz)/det,(cof[6]*nx+cof[7]*ny+cof[8]*nz)/det];
      const length=Math.hypot(...n);normals.push(...n.map(v=>v/length));
    }
    const faces=accessor(p.indices);
    for(let j=0;j<faces.length;j+=3)indices.push(base+faces[j],base+faces[j+(det<0?2:1)],base+faces[j+(det<0?1:2)]);
  }
  for(const child of node.children??[])visit(child,m);
}
for(const node of gltf.scenes[gltf.scene??0].nodes)visit(node,identity);
// This source's triangles oppose its authored outward normals. Align winding
// to those normals so double-sided lighting does not shade the crown inward.
for(let i=0;i<indices.length;i+=3){
  const [a,b,c]=indices.slice(i,i+3).map(v=>v*3);
  const u=[0,1,2].map(k=>positions[b+k]-positions[a+k]);
  const v=[0,1,2].map(k=>positions[c+k]-positions[a+k]);
  const cross=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]];
  if(cross.reduce((sum,value,k)=>sum+value*normals[a+k],0)<0)[indices[i+1],indices[i+2]]=[indices[i+2],indices[i+1]];
}
const min=[Infinity,Infinity,Infinity],max=[-Infinity,-Infinity,-Infinity];
positions.forEach((v,i)=>{min[i%3]=Math.min(min[i%3],v);max[i%3]=Math.max(max[i%3],v);});
const scale=.63/(max[0]-min[0]),cx=(min[0]+max[0])/2,cz=(min[2]+max[2])/2;
for(let i=0;i<positions.length;i+=3){
  positions[i]=-(positions[i]-cx)*scale;
  positions[i+1]=1.95+(positions[i+1]-max[1])*scale;
  positions[i+2]=-(positions[i+2]-cz)*scale;
  normals[i]*=-1;normals[i+2]*=-1;
}
const mesh={positions:positions.map(v=>+v.toFixed(7)),normals:normals.map(v=>+v.toFixed(7)),indices};
if(!mesh.positions.every(Number.isFinite)||!mesh.normals.every(Number.isFinite)||!indices.every(i=>i>=0&&i<positions.length/3))throw Error('Invalid mesh');
const credit=gltf.asset.extras;
await writeFile(path.join(here,'../assets/lego-hair.js'),`// Converted from lego_hair.glb. ${credit.author}; ${credit.license}\n// ${credit.source}\nexport const legoHairMesh=${JSON.stringify(mesh)};\n`);
console.log(JSON.stringify({vertices:positions.length/3,triangles:indices.length/3,sourceBounds:{min,max},scale}));
