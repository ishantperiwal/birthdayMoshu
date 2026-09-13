import * as THREE from 'three';

// One preallocated ribbon batch, rendered from startup to warm its shader.
// Only the age uniform changes when the candles are extinguished.
export function buildCandleSmoke(parent,roots){
  const positions=[],uvs=[],phases=[],indices=[],steps=32;
  roots.forEach((root,j)=>{
    const base=positions.length/3;
    for(let i=0;i<=steps;i++)for(let side=0;side<2;side++){
      positions.push(root.x,root.y-.045,root.z);uvs.push(side,i/steps);phases.push(j*1.73);
    }
    for(let i=0;i<steps;i++){const k=base+i*2;indices.push(k,k+1,k+2,k+2,k+1,k+3);}
  });
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));geometry.setAttribute('phase',new THREE.Float32BufferAttribute(phases,1));geometry.setIndex(indices);
  const age={value:-1};
  const material=new THREE.ShaderMaterial({transparent:true,depthWrite:false,side:THREE.DoubleSide,
    uniforms:{uAge:age},
    vertexShader:`uniform float uAge;attribute float phase;varying vec2 vUv;
      void main(){vUv=uv;float h=uv.y;
        vec3 p=position;float curl=h*h;
        p.y+=h*.78;
        p.x+=curl*(.095*sin(h*10.0-uAge*2.1+phase)+.045*uAge);
        p.z+=curl*.055*sin(h*8.0-uAge*1.5+phase);
        vec4 view=modelViewMatrix*vec4(p,1.0);
        view.x+=(uv.x-.5)*(.013+.038*h);
        gl_Position=projectionMatrix*view;}`,
    fragmentShader:`uniform float uAge;varying vec2 vUv;
      void main(){
        if(uAge<0.0||uAge>5.0)discard;
        float h=vUv.y,front=clamp(uAge*.55,0.0,1.25);
        float tail=max(0.0,(uAge-1.5)*.42);
        float rise=1.0-smoothstep(front-.14,front,h);
        float release=smoothstep(tail-.10,tail+.05,h);
        float edge=exp(-pow((vUv.x-.5)*3.8,2.0));
        float fade=(1.0-smoothstep(.55,1.0,h))*(1.0-smoothstep(3.0,4.6,uAge));
        gl_FragColor=vec4(vec3(.54,.56,.60),edge*rise*release*fade*.42);
      }`});
  const mesh=new THREE.Mesh(geometry,material);mesh.frustumCulled=false;parent.add(mesh);
  return {update(value){age.value=value;}};
}
