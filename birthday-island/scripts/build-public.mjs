import {mkdir,copyFile,readdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
const out=root+'server/public/';
await mkdir(out+'assets',{recursive:true});
for(const name of await readdir(root))if(/\.(js|css|html)$/.test(name))await copyFile(root+name,out+name);
for(const name of ['sculpted-hair.js','birthday-cake.js','moon-lroc.jpg'])await copyFile(root+'assets/'+name,out+'assets/'+name);
console.log('Prepared island runtime assets only.');
