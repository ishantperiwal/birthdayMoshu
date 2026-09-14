// Lightweight horizontal collision; small substeps prevent sprint tunnelling.
export function moveAroundRocks(x,z,dx,dz,rocks,onIsland,playerRadius=.24){
  const steps=Math.max(1,Math.ceil(Math.hypot(dx,dz)/.10));
  for(let step=0;step<steps;step++){
    let nx=x+dx/steps,nz=z+dz/steps;
    for(let pass=0;pass<4;pass++)for(const rock of rocks){
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
