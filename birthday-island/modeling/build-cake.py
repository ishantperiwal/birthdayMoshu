"""Editable birthday cake, with a compact baked mesh export for the island."""
import bpy, math, json
from pathlib import Path
from mathutils import Vector
OUT=Path(__file__).resolve().parents[1]/'assets'
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
MATS={}
def material(name,color,roughness):
    m=bpy.data.materials.new(name);m.use_nodes=True
    # Keep sRGB swatches in the web export; Blender preview uses linear values.
    rgb=[int(color[i:i+2],16)/255 for i in (0,2,4)]
    linear=[((c+.055)/1.055)**2.4 if c>.04045 else c/12.92 for c in rgb]
    m.diffuse_color=(*linear,1);bs=m.node_tree.nodes.get('Principled BSDF')
    bs.inputs['Base Color'].default_value=(*linear,1);bs.inputs['Roughness'].default_value=roughness
    MATS[name]={'color':'#'+color,'roughness':roughness};return m
rose=material('Strawberry buttercream','DFA4AC',.56)
cream=material('Vanilla piping','FFF0D7',.48)
berry=material('Fresh strawberries','BC4557',.42)
leaf=material('Strawberry leaves','779663',.72)
gold=material('Cake board and sugar pearls','E8C384',.42)
def finish(o,name,mat):
    o.name=name;o.data.materials.append(mat)
    for p in o.data.polygons:p.use_smooth=True
    return o
def mesh(name,v,f,mat):
    data=bpy.data.meshes.new(name);data.from_pydata(v,[],f);data.update();o=bpy.data.objects.new(name,data);bpy.context.collection.objects.link(o);return finish(o,name,mat)
def cylinder(name,r,h,z,mat):
    bpy.ops.mesh.primitive_cylinder_add(vertices=80,radius=r,depth=h,location=(0,0,z));o=finish(bpy.context.object,name,mat)
    b=o.modifiers.new('Soft hand-iced edge','BEVEL');b.width=.018;b.segments=3;bpy.context.view_layer.objects.active=o;bpy.ops.object.modifier_apply(modifier=b.name)
    return o
cylinder('Fine golden cake board',.655,.023,.687,gold)
cylinder('Lower strawberry tier',.585,.375,.891,rose)
cylinder('Upper vanilla tier',.408,.292,1.221,cream)
# Rounded icing sheets with softly varied scallops, continuous with each top.
for r,top,phase in [(.594,1.085,0),(.417,1.374,.8)]:
    v=[(0,0,top+.009)];f=[];n=120
    for row in range(4):
        for k in range(n):
            a=k/n*math.tau
            drip=(.5+.5*math.sin(a*10+phase+.28*math.sin(a*3)))**2
            z=[top+.009,top,top-.024-.044*drip,top-.028-.044*drip][row]
            rr=[r-.018,r,r+.002,r-.006][row]
            v.append((rr*math.cos(a),rr*math.sin(a),z))
    for k in range(n):
        j=(k+1)%n;f.append((0,1+k,1+j))
        for row in range(3):
            a=1+row*n+k;b=1+row*n+j;f.append((a,a+n,b+n,b))
    mesh('Scalloped vanilla icing',v,f,cream)
# Fluted, gently twisting piping instead of a row of plain spheres.
def dollop(name,x,y,z,r,h,phase=0):
    v=[];f=[];sides=12;rings=9
    for j in range(rings):
        t=j/(rings-1);radius=r*(1-t)**.65*(.82+.25*math.sin(t*math.pi))+.001
        for k in range(sides):
            a=k/sides*math.tau+t*1.6+phase;rr=radius*(1+.19*math.cos(k/sides*math.tau*6))
            v.append((x+rr*math.cos(a)+.012*t*t,y+rr*math.sin(a),z+t*h))
            if j<rings-1:
                q=j*sides+k;qn=j*sides+(k+1)%sides;f.append((q,qn,qn+sides,q+sides))
    mesh(name,v,f,cream)
for radius,z,n,r,h in [(.574,.705,40,.029,.047),(.373,1.382,20,.034,.054)]:
    for i in range(n):
        a=i/n*math.tau;dollop('Piped shell border',radius*math.cos(a),radius*math.sin(a),z,r,h,a)
for i in range(7):
    a=i/7*math.tau+.18;x=.492*math.cos(a);y=.492*math.sin(a)
    dollop('Cream rosette',x,y,1.087,.049,.055,a)
    bpy.ops.mesh.primitive_uv_sphere_add(segments=16,ring_count=10,radius=1,location=(x,y,1.161))
    o=finish(bpy.context.object,'Strawberry',berry)
    for vertex in o.data.vertices:
        p=vertex.co;t=(p.z+1)/2
        p.x*=.047*(1-.3*t);p.y*=.043*(1-.3*t);p.z*=.067
    # Small five-point calyx on each berry.
    v=[(x,y,1.218)];f=[]
    for k in range(10):
        ang=k/10*math.tau;rr=.032 if k%2==0 else .012;v.append((x+rr*math.cos(ang),y+rr*math.sin(ang),1.210))
    for k in range(10):f.append((0,1+k,1+(k+1)%10))
    mesh('Berry calyx',v,f,leaf)
# Delicate draped piping around the lower tier gives its side a handmade finish.
for arc in range(8):
    v=[];f=[];steps=20;sides=6
    for j in range(steps+1):
        t=j/steps;a=(arc+t)/8*math.tau
        z=.984-.065*math.sin(math.pi*t)
        for k in range(sides):
            b=k/sides*math.tau;r=.592+.009*math.cos(b)
            v.append((r*math.cos(a),r*math.sin(a),z+.009*math.sin(b)))
            if j<steps:
                q=j*sides+k;qn=j*sides+(k+1)%sides;f.append((q,qn,qn+sides,q+sides))
    mesh('Draped buttercream garland',v,f,cream)
# Bake objects into one indexed draw per material; retain all editable sources.
bpy.context.view_layer.update();batches={}
for o in list(bpy.context.scene.objects):
    if o.type!='MESH':continue
    m=o.data.materials[0];b=batches.setdefault(m.name,{'positions':[],'normals':[],'indices':[],**MATS[m.name]})
    geo=o.data;geo.calc_loop_triangles();base=len(b['positions'])//3
    normalmatrix=o.matrix_world.to_3x3().inverted().transposed()
    for vert in geo.vertices:
        p=o.matrix_world@vert.co;n=(normalmatrix@vert.normal).normalized()
        b['positions'] += [round(p.x,5),round(p.z,5),round(-p.y,5)]
        b['normals'] += [round(n.x,5),round(n.z,5),round(-n.y,5)]
    b['indices'] += [base+i for tri in geo.loop_triangles for i in tri.vertices]
(OUT/'birthday-cake.js').write_text('// Generated in Blender by modeling/build-cake.py.\nexport const cakeMeshes='+json.dumps(list(batches.values()),separators=(',',':'))+';\n')
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'birthday-cake.blend'))
bpy.ops.export_scene.gltf(filepath=str(OUT/'birthday-cake.glb'),export_format='GLB',export_cameras=False,export_lights=False)
print('CAKE_EXPORT',sum(len(b['indices'])//3 for b in batches.values()),'triangles',len(batches),'materials')
