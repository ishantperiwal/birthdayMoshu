"""Build editable molded hair; export one indexed mesh in Three.js coordinates.
Run: Blender --background --python birthday-island/modeling/build-hair.py
"""
import bpy, math, json
from mathutils import Vector
from pathlib import Path
OUT = Path(__file__).resolve().parents[1] / 'assets'
bpy.ops.object.select_all(action='SELECT'); bpy.ops.object.delete(use_global=False)

def xyz(p): return (p[0],-p[2],p[1])
def mesh(name, verts, faces):
    data=bpy.data.meshes.new(name); data.from_pydata([xyz(v) for v in verts],[],faces); data.update()
    obj=bpy.data.objects.new(name,data); bpy.context.collection.objects.link(obj)
    return obj
parts=[]
# Catmull-Rom samples provide editable paths with broad, flattened sections.
def sample(points,t):
    q=t*(len(points)-1);i=min(len(points)-2,int(q));u=q-i
    p0=Vector(points[max(0,i-1)]);p1=Vector(points[i]);p2=Vector(points[i+1]);p3=Vector(points[min(len(points)-1,i+2)])
    return .5*((2*p1)+(-p0+p2)*u+(2*p0-5*p1+4*p2-p3)*u*u+(-p0+3*p1-3*p2+p3)*u*u*u)
def lock(name,points,width,depth,forward=None,grooves=True,root_width=.86):
    verts=[];faces=[];steps=52;sides=24
    for j in range(steps+1):
        t=j/steps;c=sample(points,t)
        tangent=(sample(points,min(1,t+.002))-sample(points,max(0,t-.002))).normalized()
        # Surface-normal frames make each broad lock lie against the crown,
        # then turn outward as its path leaves the head. No central filler.
        out=Vector(forward) if forward else Vector((c.x,max(0,(c.y-1.58)*1.4),c.z)).normalized()
        axis=tangent.cross(out).normalized();normal=axis.cross(tangent).normalized()
        # Broad through its middle, flowing into a pointed terminal lock.
        taper=(root_width+(1-root_width)*math.sin(math.pi*t))*(1-.98*max(0,(t-.79)/.21)**1.35)
        for k in range(sides):
            a=k/sides*math.tau;s=math.cos(a);d=math.sin(a)
            channel=1
            if grooves and d>0:
                channel-=.16*math.exp(-((s-.40)/.13)**2)+.12*math.exp(-((s+.46)/.14)**2)
            p=c+axis*(width*s*taper)+normal*(depth*d*taper*channel)
            verts.append(tuple(p))
            if j<steps:
                n=j*sides+k;nn=j*sides+(k+1)%sides;faces.append((n,nn,nn+sides,n+sides))
    faces.append(tuple(reversed(range(sides))));faces.append(tuple(steps*sides+k for k in range(sides)))
    obj=mesh(name,verts,faces);parts.append(obj)

# Broad ribbon-shaped locks have a designed inner hairline and outer contour.
# This lets the wave hug the forehead instead of becoming a tubular arch.
def swept_ribbon(name,inside,outside):
    vertices=[];faces=[];steps=80;sides=40
    for j in range(steps+1):
        t=j/steps;lo=sample(inside,t);hi=sample(outside,t);centre=(lo+hi)*.5;across=(hi-lo)*.5
        for k in range(sides):
            angle=k/sides*math.tau;u=math.cos(angle);front=math.sin(angle)
            thickness=.040*(1-.75*t*t)
            channels=1
            if front>0:
                for ridge in [-.55,-.05,.47]:
                    channels-=.40*math.exp(-((u-ridge)/.075)**2)
            point=centre+across*u+Vector((0,0,-1))*thickness*front*channels
            vertices.append(tuple(point))
            if j<steps:
                q=j*sides+k;n=j*sides+(k+1)%sides;faces.append((q,n,n+sides,q+sides))
    faces.append(tuple(reversed(range(sides))));faces.append(tuple(steps*sides+k for k in range(sides)))
    parts.append(mesh(name,vertices,faces))

# Side part; every front section flows continuously from the scalp into curls.
swept_ribbon('Long sweep and cheek curls',
    [(.055,1.64,-.245),(-.095,1.67,-.238),(-.195,1.565,-.212),(-.24,1.465,-.15),
     (-.235,1.395,-.105),(-.28,1.315,-.105),(-.235,1.235,-.085),(-.30,1.10,-.005)],
    [(.055,1.86,-.075),(-.13,1.90,-.075),(-.31,1.77,-.03),(-.38,1.585,-.005),
     (-.37,1.465,-.035),(-.395,1.35,-.005),(-.345,1.23,.005),(-.32,1.115,.025)])
swept_ribbon('Short sweep and cheek curls',
    [(.015,1.64,-.245),(.14,1.645,-.233),(.22,1.55,-.20),(.25,1.44,-.13),
     (.235,1.365,-.10),(.285,1.29,-.09),(.26,1.205,-.055),(.30,1.10,.025)],
    [(.015,1.86,-.075),(.22,1.855,-.07),(.33,1.72,-.03),(.375,1.555,-.005),
     (.36,1.43,.01),(.395,1.32,.025),(.36,1.195,.015),(.31,1.11,.045)])
for sign in [-1,1]:
    def path(points):return [(sign*x,y,z) for x,y,z in points]
    lock(('Left' if sign>0 else 'Right')+' scalp to side curls',path([
        (.015,1.845,-.005),(.17,1.79,.005),(.295,1.61,.01),
        (.335,1.475,.025),(.30,1.35,.045),(.36,1.24,.055),(.315,1.105,.10)]),.103,.032)
    lock(('Left' if sign>0 else 'Right')+' scalp to rear curls',path([
        (.015,1.82,.125),(.17,1.76,.15),(.26,1.60,.205),
        (.295,1.465,.215),(.255,1.34,.215),(.30,1.225,.23),(.25,1.09,.255)]),.112,.032)
for i,side in enumerate([-.12,0,.12]):
    lock('Crown to back '+str(i),[
        (side*.4+.015,1.825,.12),(side*.85,1.755,.235),(side,1.58,.292),
        (side+.018,1.445+.024*math.sin(i*2),.32+.012*math.sin(i*2)),(side-.018,1.32+.022*math.cos(i*2),.285),(side+.015,1.195,.325),
        (side,1.08,.29)],.122,.030)
base=parts[0]

# Keep the sculpt sources editable in a hidden collection; runtime uses one mesh.
sources=bpy.data.collections.new('Editable hair sections');bpy.context.scene.collection.children.link(sources)
for obj in parts:
    copy=obj.copy();copy.data=obj.data.copy();sources.objects.link(copy);copy.hide_render=True;copy.hide_viewport=True
bpy.ops.object.select_all(action='DESELECT')
for obj in parts:obj.select_set(True)
bpy.context.view_layer.objects.active=base;bpy.ops.object.join();hair=bpy.context.object;hair.name='Sculpted storybook hair'
remesh=hair.modifiers.new('Fuse overlapping molded sections','REMESH');remesh.mode='VOXEL';remesh.voxel_size=.0045;remesh.use_smooth_shade=True
bpy.ops.object.modifier_apply(modifier=remesh.name)
smooth=hair.modifiers.new('Soften sculpt junctions','SMOOTH');smooth.factor=.45;smooth.iterations=3;bpy.ops.object.modifier_apply(modifier=smooth.name)
# Indent the surface gently along the part; do not cut through the locks.
for vertex in hair.data.vertices:
    x,y,z=vertex.co.x,vertex.co.z,-vertex.co.y
    front=max(0,min(1,(-z-.065)/.08))
    height=max(0,min(1,(y-1.69)/.06))*max(0,min(1,(1.88-y)/.04))
    vertex.co.y-=.005*math.exp(-((x-.035)/.009)**2)*front*height
dec=hair.modifiers.new('Lightweight island mesh','DECIMATE');dec.ratio=.050;bpy.ops.object.modifier_apply(modifier=dec.name)
for p in hair.data.polygons:p.use_smooth=True
mat=bpy.data.materials.new('Chestnut molded plastic');mat.diffuse_color=(.095,.034,.016,1);mat.use_nodes=True
bsdf=mat.node_tree.nodes.get('Principled BSDF');bsdf.inputs['Base Color'].default_value=(.095,.034,.016,1);bsdf.inputs['Roughness'].default_value=.28
hair.data.materials.append(mat)
hair.data.calc_loop_triangles()
positions=[];normals=[]
for p in hair.data.vertices:
    positions.extend([round(p.co.x,5),round(p.co.z,5),round(-p.co.y,5)])
    normals.extend([round(p.normal.x,5),round(p.normal.z,5),round(-p.normal.y,5)])
indices=[i for tri in hair.data.loop_triangles for i in tri.vertices]
(OUT/'sculpted-hair.js').write_text('// Generated by modeling/build-hair.py in Blender. One static, indexed mesh.\nexport const hairMesh='+json.dumps({'positions':positions,'normals':normals,'indices':indices},separators=(',',':'))+';\n')
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'sculpted-hair.blend'))
print('HAIR_EXPORT',len(positions)//3,'vertices',len(indices)//3,'triangles',(OUT/'sculpted-hair.js').stat().st_size,'bytes')
