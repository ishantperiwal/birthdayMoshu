// Shared procedural texture functions from the reference GLSL library.
export const GL_HASH = /* glsl */`
float hash11(float p){ p=fract(p*0.1031); p*=p+33.33; p*=p+p; return fract(p); }
float hash12(vec2 p){ vec3 p3=fract(vec3(p.xyx)*0.1031); p3+=dot(p3,p3.yzx+33.33);
  return fract((p3.x+p3.y)*p3.z); }
vec2 hash22(vec2 p){ vec3 p3=fract(vec3(p.xyx)*vec3(0.1031,0.1030,0.0973));
  p3+=dot(p3,p3.yzx+33.33); return fract((p3.xx+p3.yz)*p3.zy); }
vec3 hash32(vec2 p){ vec3 p3=fract(vec3(p.xyx)*vec3(0.1031,0.1030,0.0973));
  p3+=dot(p3,p3.yxz+33.33); return fract((p3.xxy+p3.yzz)*p3.zyx); }
float hash13(vec3 p){ p=fract(p*0.1031); p+=dot(p,p.zyx+31.32); return fract((p.x+p.y)*p.z); }
vec3 hash33(vec3 p){ p=fract(p*vec3(0.1031,0.1030,0.0973)); p+=dot(p,p.yxz+33.33);
  return fract((p.xxy+p.yxx)*p.zyx); }
`;

export const GL_NOISE = /* glsl */`
float vn2(vec2 p){ vec2 i=floor(p), f=fract(p); vec2 u=f*f*f*(f*(f*6.0-15.0)+10.0);
  return mix(mix(hash12(i),hash12(i+vec2(1,0)),u.x),
             mix(hash12(i+vec2(0,1)),hash12(i+vec2(1,1)),u.x),u.y); }
float vn3(vec3 p){ vec3 i=floor(p), f=fract(p); vec3 u=f*f*f*(f*(f*6.0-15.0)+10.0);
  float a=hash13(i+vec3(0,0,0)), b=hash13(i+vec3(1,0,0));
  float c=hash13(i+vec3(0,1,0)), d=hash13(i+vec3(1,1,0));
  float e=hash13(i+vec3(0,0,1)), g=hash13(i+vec3(1,0,1));
  float h=hash13(i+vec3(0,1,1)), k=hash13(i+vec3(1,1,1));
  return mix(mix(mix(a,b,u.x),mix(c,d,u.x),u.y), mix(mix(e,g,u.x),mix(h,k,u.x),u.y), u.z); }
vec2 grad2(vec2 i){ float a=hash12(i)*6.2831853; return vec2(cos(a),sin(a)); }
float pn2(vec2 p){ vec2 i=floor(p), f=fract(p); vec2 u=f*f*f*(f*(f*6.0-15.0)+10.0);
  float a=dot(grad2(i),f), b=dot(grad2(i+vec2(1,0)),f-vec2(1,0));
  float c=dot(grad2(i+vec2(0,1)),f-vec2(0,1)), d=dot(grad2(i+vec2(1,1)),f-vec2(1,1));
  return mix(mix(a,b,u.x),mix(c,d,u.x),u.y)*1.42; }
vec3 grad3(vec3 i){ return normalize(hash33(i)*2.0-1.0); }
float pn3(vec3 p){ vec3 i=floor(p), f=fract(p); vec3 u=f*f*f*(f*(f*6.0-15.0)+10.0);
  float n000=dot(grad3(i+vec3(0,0,0)),f-vec3(0,0,0));
  float n100=dot(grad3(i+vec3(1,0,0)),f-vec3(1,0,0));
  float n010=dot(grad3(i+vec3(0,1,0)),f-vec3(0,1,0));
  float n110=dot(grad3(i+vec3(1,1,0)),f-vec3(1,1,0));
  float n001=dot(grad3(i+vec3(0,0,1)),f-vec3(0,0,1));
  float n101=dot(grad3(i+vec3(1,0,1)),f-vec3(1,0,1));
  float n011=dot(grad3(i+vec3(0,1,1)),f-vec3(0,1,1));
  float n111=dot(grad3(i+vec3(1,1,1)),f-vec3(1,1,1));
  return mix(mix(mix(n000,n100,u.x),mix(n010,n110,u.x),u.y),
             mix(mix(n001,n101,u.x),mix(n011,n111,u.x),u.y),u.z)*1.35; }
float fbm2(vec2 p, int oct){ float a=0.5,s=0.0,n=0.0;
  for(int i=0;i<8;i++){ if(i>=oct)break; s+=a*pn2(p); n+=a; p*=2.02; p+=vec2(3.1,1.7); a*=0.5; }
  return s/n; }
float fbm3(vec3 p, int oct){ float a=0.5,s=0.0,n=0.0;
  for(int i=0;i<6;i++){ if(i>=oct)break; s+=a*pn3(p); n+=a; p*=2.03; p+=vec3(2.7,1.3,4.1); a*=0.5; }
  return s/n; }
`;
