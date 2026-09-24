// Lightweight horizontal collision; small substeps prevent sprint tunnelling.
export function moveAroundRocks(x,z,dx,dz,rocks,onIsland,playerRadius=.24){
  const steps=Math.max(1,Math.ceil(Math.hypot(dx,dz)/.10));
  for(let step=0;step<steps;step++){
    let nx=x+dx/steps,nz=z+dz/steps;
    for(let pass=0;pass<4;pass++)for(const rock of rocks){
      if(rock.halfWidth!==undefined){
        const c=Math.cos(rock.angle||0),s=Math.sin(rock.angle||0);
        const ox=nx-rock.x,oz=nz-rock.z;
        let lx=c*ox-s*oz,lz=s*ox+c*oz;
        const qx=Math.max(-rock.halfWidth,Math.min(rock.halfWidth,lx));
        const qz=Math.max(-rock.halfDepth,Math.min(rock.halfDepth,lz));
        const vx=lx-qx,vz=lz-qz,d=Math.hypot(vx,vz);
        if(d>1e-8&&d<playerRadius){lx=qx+vx/d*(playerRadius+.001);lz=qz+vz/d*(playerRadius+.001);}
        else if(d<=1e-8){
          if(rock.halfWidth-Math.abs(lx)<rock.halfDepth-Math.abs(lz))lx=(lx<0?-1:1)*(rock.halfWidth+playerRadius+.001);
          else lz=(lz<0?-1:1)*(rock.halfDepth+playerRadius+.001);
        }
        nx=rock.x+c*lx+s*lz;nz=rock.z-s*lx+c*lz;
        continue;
      }
      const ox=nx-rock.x,oz=nz-rock.z,r=rock.radius+playerRadius;
      const d=Math.hypot(ox,oz);
      if(d<r){
        // Recover gracefully even if an inspection view starts at the centre.
        const angle=d>1e-8?Math.atan2(oz,ox):Math.atan2(z-rock.z,x-rock.x);
        nx=rock.x+Math.cos(angle)*(r+.001);
        nz=rock.z+Math.sin(angle)*(r+.001);
      }
    }
    if(onIsland(nx,nz)){x=nx;z=nz;}
  }
  return {x,z};
}
