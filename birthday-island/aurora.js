// Analytic curtains shared by the sky and its water reflection: no meshes,
// textures, ray marching, extra lights, or render passes.
export const auroraGLSL = `
  uniform float uAuroraTime, uAuroraNight;
  vec3 auroraGlow(vec3 d, vec3 moon){
    if(uAuroraNight<.01 || d.y<.045 || d.y>.86)return vec3(0.0);
    vec2 away=-normalize(moon.xz);
    vec2 across=vec2(-away.y,away.x);
    float forward=dot(d.xz,away);
    if(forward<=0.0)return vec3(0.0);
    // Keep the curtain centered, with a 20% smaller footprint in the sky.
    float a=atan(dot(d.xz,across),forward)/.8;
    float elevation=.31+(d.y-.31)/.8;
    float envelope=1.0-smoothstep(.22,.55,abs(a));
    float t=uAuroraTime*.16;
    vec3 light=vec3(0.0);
    for(int i=0;i<2;i++){
      float layer=float(i);
      float x=a+layer*.27+sin(t*.65+layer)*.045;
      float folds=sin(x*4.2+t+layer)*.037+sin(x*9.0-t*.7+layer)*.014
                 +sin(x*18.0+t*.45)*.005;
      float base=.23+layer*.075+folds+.045*cos(x*1.8);
      float h=elevation-base;
      float lengthwise=.72+.28*sin(x*3.3-t*.6+layer);
      float height=.040+lengthwise*.045;
      float curtain=smoothstep(-.020,.013,h)*(1.0-smoothstep(.02,height,h));
      float hem=exp(-pow(h/.018,2.0))*.14;
      // Bend the fine veils with height so they flow through the folds.
      float thread=x+sin(h*17.0+x*6.0-t*.6)*.016;
      float rays=.66+.20*sin(thread*79.0+sin(x*15.0+t)*2.5-t)
                     +.10*sin(thread*137.0-t*.8);
      float veil=.65+.35*smoothstep(-.65,.8,sin(x*11.0-t*.7+layer));
      float drift=.72+.28*sin(x*5.0-t*.9+layer*2.0);
      // Cool sea-glass colors sit within the blue night palette.
      vec3 color=mix(vec3(.075,.39,.32),vec3(.23,.19,.38),smoothstep(.005,height*.85,h));
      light+=color*(curtain*rays+hem)*drift*veil*(1.0-layer*.60);
    }
    return light*envelope*smoothstep(.045,.13,d.y)*uAuroraNight*.46;
  }
`;
