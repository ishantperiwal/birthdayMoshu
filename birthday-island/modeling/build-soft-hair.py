"""Build editable molded hair; export one indexed mesh in Three.js coordinates.
Execute through Blender MCP. Saves the editable .blend and prints HAIR_ASSET_JSON
for the host exporter to write to assets/soft-hair.js.
"""
import bpy, math, json
from mathutils import Vector
scene=bpy.data.scenes.get('Soft hairstyle study') or bpy.data.scenes.new('Soft hairstyle study')
bpy.context.window.scene=scene
for obj in list(scene.objects):
    bpy.data.objects.remove(obj,do_unlink=True)

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
def lock(name,points,width,depth,forward=None,grooves=False,root_width=.86):
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
            # Three shallow swept channels follow the part into each temple.
            channels=1
            if front>0:
                for groove in [-.52,0,.52]:
                    channels-=.32*math.exp(-((u-groove)/.060)**2)
            point=centre+across*u+Vector((0,0,-1))*thickness*front*channels
            vertices.append(tuple(point))
            if j<steps:
                q=j*sides+k;n=j*sides+(k+1)%sides;faces.append((q,n,n+sides,q+sides))
    faces.append(tuple(reversed(range(sides))));faces.append(tuple(steps*sides+k for k in range(sides)))
    parts.append(mesh(name,vertices,faces))

# Centre part, swept away from the face into a tucked temple section.
swept_ribbon('Long sweep and cheek curls',
    [(.014,1.68,-.244),(-.095,1.665,-.247),(-.185,1.607,-.219),(-.257,1.56,-.13),(-.282,1.58,-.015),(-.266,1.59,.11)],
    [(.014,1.87,-.04),(-.13,1.86,-.06),(-.267,1.78,-.075),(-.329,1.66,-.02),(-.325,1.62,.06),(-.27,1.59,.13)])
swept_ribbon('Short sweep and cheek curls',
    [(-.009,1.68,-.244),(.10,1.665,-.245),(.19,1.613,-.214),(.26,1.565,-.13),(.284,1.585,-.01),(.268,1.595,.11)],
    [(-.009,1.866,-.04),(.14,1.86,-.06),(.27,1.78,-.07),(.33,1.66,-.015),(.325,1.625,.06),(.272,1.595,.13)])
for sign in [-1,1]:
    def path(points):return [(sign*x,y,z) for x,y,z in points]
    lock(('Left' if sign>0 else 'Right')+' scalp to side curls',path([
        (.015,1.845,-.005),(.17,1.79,.005),(.295,1.61,.01),
        (.285,1.475,.075),(.29,1.35,.10),(.32,1.24,.10),(.285,1.105,.13)]),.080,.034,grooves=True)
    lock(('Left' if sign>0 else 'Right')+' scalp to rear curls',path([
        (.015,1.82,.125),(.17,1.76,.15),(.26,1.60,.205),
        (.295,1.465,.215),(.255,1.34,.215),(.30,1.225,.23),(.25,1.09,.255)]),.128,.038)
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
remesh=hair.modifiers.new('Fuse overlapping molded sections','REMESH');remesh.mode='VOXEL';remesh.voxel_size=.003;remesh.use_smooth_shade=True
bpy.ops.object.modifier_apply(modifier=remesh.name)
smooth=hair.modifiers.new('Soften sculpt junctions','SMOOTH');smooth.factor=.50;smooth.iterations=4;bpy.ops.object.modifier_apply(modifier=smooth.name)
# Indent the surface gently along the part; do not cut through the locks.
for vertex in hair.data.vertices:
    x,y,z=vertex.co.x,vertex.co.z,-vertex.co.y
    front=max(0,min(1,(-z+.02)/.08))
    height=max(0,min(1,(y-1.65)/.035))
    part=math.exp(-((x-.003)/.011)**2)*height
    vertex.co.y-=.012*part*front
    vertex.co.z-=.009*part
dec=hair.modifiers.new('Lightweight island mesh','DECIMATE');dec.ratio=.065;bpy.ops.object.modifier_apply(modifier=dec.name)
for vertex in hair.data.vertices:
    if vertex.co.z>1.68:vertex.co.z=1.68+(vertex.co.z-1.68)*.85
hair.data.update()
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
bpy.ops.wm.save_as_mainfile(filepath=r'D:\Work\Plugins\someday\birthdayMoshu\birthday-island\assets\soft-hair.blend')
print('HAIR_ASSET_JSON='+json.dumps({'positions':positions,'normals':normals,'indices':indices},separators=(',',':')))
