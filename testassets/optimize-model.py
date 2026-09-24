import bpy, bmesh, math, json
from pathlib import Path
from mathutils import Vector

folder=Path(__file__).resolve().parent
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(folder/'tooptimize.glb'))
objects=[o for o in bpy.context.scene.objects if o.type=='MESH']
report={'source_bytes':(folder/'tooptimize.glb').stat().st_size,'meshes':[]}
originals=[]
for obj in objects:
    original=obj.copy();original.data=obj.data.copy();bpy.context.collection.objects.link(original);originals.append(original)
    original.hide_render=True;original.hide_set(True)
    mesh=obj.data;mesh.calc_loop_triangles()
    stats={'name':obj.name,'original_vertices':len(mesh.vertices),'original_triangles':len(mesh.loop_triangles)}
    bm=bmesh.new();bm.from_mesh(mesh)
    size=max(obj.dimensions)
    bmesh.ops.remove_doubles(bm,verts=list(bm.verts),dist=max(size*1e-8,1e-9))
    bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces))
    bm.to_mesh(mesh);bm.free();mesh.update();mesh.calc_loop_triangles()
    stats['clean_triangles']=len(mesh.loop_triangles)
    bpy.context.view_layer.objects.active=obj;obj.select_set(True)
    modifier=obj.modifiers.new('Preserve silhouette simplification','DECIMATE')
    modifier.ratio=min(1,40000/max(1,len(mesh.loop_triangles)))
    bpy.ops.object.modifier_apply(modifier=modifier.name)
    for face in mesh.polygons:face.use_smooth=True
    mesh.calc_loop_triangles()
    stats.update(vertices=len(mesh.vertices),triangles=len(mesh.loop_triangles))
    report['meshes'].append(stats)
bpy.ops.object.select_all(action='DESELECT')
for obj in objects:obj.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(folder/'tooptimize-optimized.glb'),export_format='GLB',use_selection=True,export_animations=False,export_materials='NONE',export_normals=True)
report['optimized_bytes']=(folder/'tooptimize-optimized.glb').stat().st_size
(folder/'tooptimize-optimization.json').write_text(json.dumps(report,indent=2))
print('OPTIMIZATION_RESULT='+json.dumps(report))

# Neutral comparison renders; display normalization never affects the exported GLB.
scene=bpy.context.scene
scene.render.engine='BLENDER_WORKBENCH'
scene.display.shading.light='STUDIO';scene.display.shading.studiolight_rotate_z=.4
scene.display.shading.color_type='SINGLE';scene.display.shading.single_color=(.36,.27,.20)
scene.display.shading.show_shadows=True;scene.display.shading.show_cavity=True
scene.display.shading.cavity_type='BOTH';scene.display.shading.show_specular_highlight=True
scene.display.shading.background_type='WORLD';scene.world=bpy.data.worlds.new('Comparison background');scene.world.color=(.15,.15,.15)
scene.render.resolution_x=1200;scene.render.resolution_y=900;scene.render.resolution_percentage=100
points=[o.matrix_world@Vector(p) for o in objects for p in o.bound_box]
low=Vector([min(p[i] for p in points) for i in range(3)]);high=Vector([max(p[i] for p in points) for i in range(3)])
center=(low+high)/2;extent=max(high-low)
camera_data=bpy.data.cameras.new('Comparison');camera=bpy.data.objects.new('Comparison',camera_data);scene.collection.objects.link(camera);scene.camera=camera;camera_data.type='ORTHO';camera_data.ortho_scale=extent*1.55;camera_data.clip_end=extent*20+100
for angle,direction in [('front',(0,-1,.12)),('quarter',(1,-1,.35)),('back',(0,1,.12))]:
    camera.location=center+Vector(direction).normalized()*extent*3
    camera.rotation_euler=(center-camera.location).to_track_quat('-Z','Y').to_euler()
    for label,visible,hidden in [('original',originals,objects),('optimized',objects,originals)]:
        for o in hidden:o.hide_render=True
        for o in visible:o.hide_render=False;o.hide_set(False)
        scene.render.filepath=str(folder/('tooptimize-'+label+'-'+angle+'.png'))
        bpy.ops.render.render(write_still=True)
