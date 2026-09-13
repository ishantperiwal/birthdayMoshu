import * as THREE from 'three';

// A small scenic silhouette on the moon's bearing: no simulation or shadows.
export function buildDistantIsland(scene,horizon){
  const root=new THREE.Group();root.position.set(-.58*255,0,-.82*255);scene.add(root);
  const positions=[],colors=[],indices=[],rings=16,segments=80;
  const sand=new THREE.Color(0x819b9d),green=new THREE.Color(0x537d80),ridge=new THREE.Color(0x638e8f);
  for(let j=0;j<=rings;j++)for(let i=0;i<=segments;i++){
    const a=i/segments*Math.PI*2,r=j/rings;
    const edge=1+.08*Math.sin(a*3+.4)+.045*Math.sin(a*7);
    const x=Math.cos(a)*38*r*edge,z=Math.sin(a)*20*r*edge;
    const hills=7.4*Math.exp(-((x+10)**2/350+z*z/220))+5.5*Math.exp(-((x-15)**2/125+(z+2)**2/170));
    const y=-.65+(1-r*r)*hills;
    positions.push(x,y,z);
    const c=green.clone().lerp(ridge,Math.max(0,y/10)).lerp(sand,THREE.MathUtils.smoothstep(r,.83,1));colors.push(c.r,c.g,c.b);
  }
  for(let j=0;j<rings;j++)for(let i=0;i<segments;i++){
    const a=j*(segments+1)+i,b=a+segments+1;indices.push(a,a+1,b,a+1,b+1,b);
  }
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));geometry.setIndex(indices);geometry.computeVertexNormals();
  const material=new THREE.MeshStandardMaterial({vertexColors:true,roughness:1,side:THREE.DoubleSide,emissive:0x527e84,emissiveIntensity:.12});
  root.add(new THREE.Mesh(geometry,material));
  // A handful of tiny treetops breaks the ridge without adding distracting detail.
  const treeMat=new THREE.MeshStandardMaterial({color:0x476e75,roughness:1,emissive:0x527e84,emissiveIntensity:.12});
  const trees=new THREE.InstancedMesh(new THREE.ConeGeometry(1,3.2,6),treeMat,9),dummy=new THREE.Object3D();
  for(let i=0;i<9;i++){
    const x=-21+i*4.8,z=Math.sin(i*2.1)*3,r=Math.hypot(x/38,z/20);
    const h=-.65+(1-r*r)*(7.4*Math.exp(-((x+10)**2/350+z*z/220))+5.5*Math.exp(-((x-15)**2/125+(z+2)**2/170)));
    dummy.position.set(x,h+.9,z);dummy.scale.setScalar(.65+(i%3)*.16);dummy.updateMatrix();trees.setMatrixAt(i,dummy.matrix);
  }
  root.add(trees);
  // Additional aerial perspective uses the actual sky horizon, keeping the
  // silhouette quiet at night instead of mixing it toward the darker ground fog.
  for(const mat of [material,treeMat]){
    mat.onBeforeCompile=shader=>{
      shader.uniforms.uIslandHaze=horizon;
      shader.fragmentShader='uniform vec3 uIslandHaze;\n'+shader.fragmentShader;
      shader.fragmentShader=shader.fragmentShader.replace('#include <fog_fragment>',
        '#include <fog_fragment>\ngl_FragColor.rgb=mix(gl_FragColor.rgb,uIslandHaze,.48);');
    };
    mat.customProgramCacheKey=()=> 'island-horizon-haze-1';
  }
  // Smaller, more distant neighbours reuse the same geometry and materials.
  // Widely separated east and south-southwest bearings fill quiet water,
  // outside the celebration/moon view, fireplace, ship lane and aurora.
  for(const [x,z,sx,sy,sz,yaw] of [
    [330,-45,.50,.65,.60,.72],
    [-75,420,.62,.70,.50,-.95]
  ]){
    const neighbour=root.clone(true);
    neighbour.position.set(x,-.08,z);neighbour.scale.set(sx,sy,sz);
    neighbour.rotation.y=yaw;scene.add(neighbour);
  }
  return root;
}
