import * as THREE from 'three';
import {createBlinkTiming} from './blink-timing.js';
import {expressionIndex,EXPRESSION_MS} from './expressions.js?v=generated-decals-1';

const textures=new Map();
function loadFaceTexture(path){
  if(!textures.has(path)){
    const entry={texture:null,ready:false};textures.set(path,entry);
    entry.texture=new THREE.TextureLoader().load(new URL(path,import.meta.url).href,()=>{entry.ready=true;});
    entry.texture.colorSpace=THREE.SRGBColorSpace;
  }
  return textures.get(path);
}
export function addFaceBlink(mesh,male){
  const entry=loadFaceTexture(male?'./manualAssets/faceDecalguy-blink.png':'./manualAssets/faceDecal-blink.png');
  const kiss=male?loadFaceTexture('./manualAssets/faceDecalguy-kiss.png'):entry;
  const amazed=male?loadFaceTexture('./manualAssets/faceDecalguy-amazed.png'):entry;
  const amount={value:0},blink=createBlinkTiming();
  const expression={value:0};
  let preview=false,selected='normal',until=0;
  mesh.material.onBeforeCompile=shader=>{
    shader.uniforms.uBlinkMap={value:entry.texture};shader.uniforms.uBlink=amount;shader.uniforms.uExpression=expression;
    shader.uniforms.uKissMap={value:kiss.texture};shader.uniforms.uAmazedMap={value:amazed.texture};
    shader.fragmentShader='uniform sampler2D uBlinkMap;uniform sampler2D uKissMap;uniform sampler2D uAmazedMap;uniform float uBlink;uniform int uExpression;\n'+shader.fragmentShader;
    // Blinks replace the eye band; male kiss and amazed use generated full decals.
    shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',`
      vec2 faceUv=vMapUv;
      bool mouthBand=vMapUv.y>0.08&&vMapUv.y<0.37;
      float mouthY=${male?'.255':'.223'};
      if(mouthBand&&uExpression==4)faceUv.y=2.0*mouthY-faceUv.y;
      float browWeight=smoothstep(${male?'.67,.77':'.60,.74'},vMapUv.y);
      if(uExpression==3)faceUv.y-=0.035*browWeight;
      if(uExpression==4){
        float centre=vMapUv.x<0.49?0.27:0.70;
        faceUv.y-=(vMapUv.x-centre)*(vMapUv.x<0.49?0.22:-0.22)*browWeight;
      }
      // Explicit gradients avoid mip seams where an expression swaps artwork.
      vec4 facePrint=textureGrad(map,faceUv,dFdx(vMapUv),dFdy(vMapUv));
      if(${male?'true':'false'}&&uExpression==1){
        facePrint=textureGrad(uKissMap,vMapUv,dFdx(vMapUv),dFdy(vMapUv));
      }else if(mouthBand&&uExpression==1){
        vec2 q=(vMapUv-vec2(0.49,mouthY))/vec2(0.035,0.033);
        float lips=min(length((q-vec2(0.0,0.32))/vec2(1.0,0.70)),length((q+vec2(0.0,0.32))/vec2(0.90,0.70)));
        float crease=(1.0-smoothstep(0.06,0.17,abs(q.y)))*(1.0-smoothstep(0.45,0.8,abs(q.x)));
        vec3 ink=mix(vec3(0.42,0.045,0.07),vec3(0.055,0.018,0.018),crease);
        facePrint=vec4(ink,1.0-smoothstep(0.88,1.0,lips));
      }
      if(${male?'true':'false'}&&uExpression==3){
        facePrint=textureGrad(uAmazedMap,vMapUv,dFdx(vMapUv),dFdy(vMapUv));
      }else if(mouthBand&&uExpression==3){
        vec2 q=(vMapUv-vec2(0.49,mouthY))/vec2(0.044,0.066);
        float edge=length(q);
        facePrint=vec4(vec3(0.027,0.018,0.016),1.0-smoothstep(0.88,1.0,edge));
      }
      float eyeClose=uBlink;
      if(uExpression==1)eyeClose=${male?'0.0':'1.0'};
      if(eyeClose>0.001&&vMapUv.y>${male?'.44':'.38'}&&vMapUv.y<${male?'.71':'.665'}){
        vec4 closed=texture2D(uBlinkMap,vMapUv);
        float paper=max(closed.r,max(closed.g,closed.b));
        closed.a*=1.0-smoothstep(0.20,0.65,paper);
        // Mix premultiplied ink so transparent pixels do not darken the head.
        float a=mix(facePrint.a,closed.a,eyeClose);
        vec3 ink=mix(facePrint.rgb*facePrint.a,closed.rgb*closed.a,eyeClose);
        facePrint=vec4(ink/max(a,0.0001),a);
      }
      diffuseColor*=facePrint;
    `);
  };
  mesh.material.customProgramCacheKey=()=>`face-expressions-${male?'male':'female'}-generated-decals-1`;
  // Rendering also covers idle previews, remote characters and stargazing poses.
  mesh.onBeforeRender=()=>{
    const now=performance.now();amount.value=entry.ready?(preview?1:blink(now/1000)):0;
    const selectedIndex=expressionIndex(selected);
    const selectedReady=!male||(selectedIndex===1?kiss.ready:selectedIndex===3?amazed.ready:true);
    expression.value=entry.ready&&selectedReady&&now<until?selectedIndex:0;
  };
  return {setPreview(value){preview=!!value;},setExpression(value,duration=EXPRESSION_MS){selected=value;until=performance.now()+Math.max(0,duration);}};
}
