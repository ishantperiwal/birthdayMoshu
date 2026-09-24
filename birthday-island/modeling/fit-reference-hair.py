"""Simplify the approved GLB and fit it to the female character's head."""
import bpy,json
from pathlib import Path
from mathutils import Vector
root=Path(__file__).resolve().parents[1]
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(root.parent/'testassets/tooptimize-optimized.glb'))
obj=next(o for o in bpy.context.scene.objects if o.type=='MESH')
bpy.context.view_layer.objects.active=obj
mod=obj.modifiers.new('Game hair 12k triangles','DECIMATE');mod.ratio=.3
bpy.ops.object.modifier_apply(modifier=mod.name)
for p in obj.data.polygons:p.use_smooth=True
bpy.ops.export_scene.gltf(filepath=str(root.parent/'testassets/tooptimize-game.glb'),export_format='GLB',export_materials='NONE',export_animations=False)
mesh=obj.data;mesh.calc_loop_triangles()
coords=[obj.matrix_world@v.co for v in mesh.vertices]
low=Vector([min(v[i] for v in coords) for i in range(3)]);high=Vector([max(v[i] for v in coords) for i in range(3)])
cx=(low.x+high.x)/2;cy=(low.y+high.y)/2
positions=[];normals=[]
for v,co in zip(mesh.vertices,coords):
    positions.extend([round(-(co.x-cx)*.52,6),round(1.87+(co.z-high.z)*.39,6),round((co.y-cy)*.45+.035,6)])
    n=Vector((-v.normal.x/.52,v.normal.z/.39,v.normal.y/.45)).normalized();normals.extend(round(a,6) for a in n)
indices=[i for t in mesh.loop_triangles for i in t.vertices]
(root/'assets/reference-hair.js').write_text('// Fitted by modeling/fit-reference-hair.py from the approved user GLB.\nexport const hairMesh='+json.dumps(dict(positions=positions,normals=normals,indices=indices),separators=(',',':'))+';\n')
print('FITTED_HAIR',len(coords),'vertices',len(indices)//3,'triangles')
