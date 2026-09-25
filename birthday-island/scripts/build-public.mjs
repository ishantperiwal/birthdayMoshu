import {mkdir,copyFile,readdir,rm} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
const out=root+'server/public/';
// Rebuild from scratch so removed or renamed files never linger on the server.
await mkdir(out,{recursive:true});
for(const name of await readdir(out))await rm(out+name,{recursive:true,force:true,maxRetries:3});
for(const name of await readdir(root))if(/\.(js|css|html)$/.test(name))await copyFile(root+name,out+name);
// Every runtime asset the island loads: its modules and images. Blender files,
// GLB work files and notes stay local.
const runtime=/\.(js|png|jpe?g|webp)$/i;
for(const folder of ['assets','manualAssets']){
  await mkdir(out+folder,{recursive:true});
  for(const name of await readdir(root+folder))if(runtime.test(name))await copyFile(root+folder+'/'+name,out+folder+'/'+name);
}
console.log('Prepared island runtime assets only.');
