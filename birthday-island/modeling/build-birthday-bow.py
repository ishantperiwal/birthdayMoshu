"""Run inside Blender; build the waist lace and a softly folded ribbon bow."""
import bpy
import math
import json
from mathutils import Vector

scene = bpy.data.scenes.get('Birthday ribbon study') or bpy.data.scenes.new('Birthday ribbon study')
bpy.context.window.scene = scene
for obj in list(scene.objects):
    bpy.data.objects.remove(obj, do_unlink=True)
parts = []

def coords(p):
    # Character coordinates: Y up, front -Z. Blender: Z up, front -Y.
    return (p[0], p[2], p[1])

def material(name, color):
    mat = bpy.data.materials.get(name) or bpy.data.materials.new(name)
    mat.diffuse_color = (*color, 1)
    mat.use_nodes = True
    shader = mat.node_tree.nodes.get('Principled BSDF')
    shader.inputs['Base Color'].default_value = (*color, 1)
    shader.inputs['Roughness'].default_value = .48
    return mat

blush = material('Birthday blush ribbon', (.855, .58, .66))
ivory = material('Birthday ivory lace', (.97, .88, .73))

def surface(name, kind, side, nu, nv, closed=False):
    rows = nu if closed else nu + 1
    vertices = [coords(loop(i/nu,j/nv*2-1,side) if kind=='loop' else tail(i/nu,j/nv*2-1,side)) for i in range(rows) for j in range(nv+1)]
    faces = []
    for i in range(nu):
        for j in range(nv):
            a = i*(nv+1)+j
            b = ((i+1)%rows)*(nv+1)+j
            faces.append((a, a+1, b+1, b))
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(vertices, [], faces)
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    scene.collection.objects.link(obj)
    mesh.materials.append(blush)
    for polygon in mesh.polygons:
        polygon.use_smooth = True
    subdiv = obj.modifiers.new('Soft fabric curvature', 'SUBSURF')
    subdiv.levels = 1
    thick = obj.modifiers.new('Ribbon thickness', 'SOLIDIFY')
    thick.thickness = .0022
    thick.offset = 0
    parts.append((obj, 'ribbon'))
    return obj

origin = (-.11, .800, -.201)
def bow_point(x, y, z):
    return (origin[0]+x, origin[1]+y, origin[2]+z)

for side in [-1, 1]:
    def loop(u, v, side=side):
        angle = u*math.tau
        spread = math.sin(angle/2)
        width = .006+.030*spread
        x = side*(.010+.091*spread)
        y = .014*spread + v*width + side*.006*spread
        z = -.016-.026*math.sin(angle)+.004*v*v*spread
        return bow_point(x, y, z)
    surface('Left folded loop' if side<0 else 'Right folded loop', 'loop', side, 32, 4, True)

    def tail(t, v, side=side):
        width = .010+.006*t
        x = side*(.008+.029*t+.008*math.sin(t*math.pi)+v*width)
        # A V cut in each tail; asymmetric fall keeps the knot feeling tied.
        length = (.105 if side<0 else .093)-.018*(1-abs(v))*t**8
        y = -.009-t*length
        z = -.004-.060*t-.006*math.sin(t*math.tau)+.004*v*v
        return bow_point(x, y, z)
    surface('Left flowing tail' if side<0 else 'Right flowing tail', 'tail', side, 20, 6)

bpy.ops.mesh.primitive_uv_sphere_add(segments=24, ring_count=16, location=coords(bow_point(0, 0, -.022)))
knot = bpy.context.object
knot.name = 'Soft gathered ribbon center'
knot.scale = (.014, .019, .020)
knot.rotation_euler[1] = -.18
knot.data.materials.append(blush)
for poly in knot.data.polygons:
    poly.use_smooth = True
parts.append((knot, 'ribbon'))

# An actual open lace ribbon wraps the rounded waist, with scalloped borders
# and crossed threads; no solid rectangular sash underneath.
path = []
for cx, cz, start in [(.258,.139,0),(-.258,.139,90),(-.258,-.139,180),(.258,-.139,270)]:
    for j in range(17):
        a = math.radians(start+j/16*90)
        path.append(Vector((cx+.039*math.cos(a), cz+.039*math.sin(a))))
path.append(path[0])
lengths = [0.0]
for i in range(len(path)-1):
    lengths.append(lengths[-1]+(path[i+1]-path[i]).length)
def waist(s, y):
    distance = (s%1)*lengths[-1]
    for i in range(len(path)-1):
        if distance <= lengths[i+1]:
            t = (distance-lengths[i])/(lengths[i+1]-lengths[i])
            p = path[i].lerp(path[i+1],t)
            return (p.x,.798+y,p.y)

def thread(name, scallop, sign, radius):
    curve = bpy.data.curves.new(name, 'CURVE')
    curve.dimensions = '3D'
    curve.bevel_depth = radius
    curve.bevel_resolution = 0
    spline = curve.splines.new('POLY')
    count = 480
    spline.points.add(count-1)
    for i, p in enumerate(spline.points):
        s = i/count
        offset=sign*(.011+.0025*math.cos(s*math.tau*40)) if scallop else sign*.010*math.sin(s*math.tau*40)
        p.co = (*coords(waist(s,offset)),1)
    spline.use_cyclic_u = True
    obj = bpy.data.objects.new(name,curve)
    scene.collection.objects.link(obj)
    curve.materials.append(ivory)
    parts.append((obj,'lace'))

for sign in [-1,1]:
    thread('Scalloped lace edge', True, sign, .0014)
    thread('Crossed lace stitching', False, sign, .0011)

# Export the evaluated, smooth meshes in the game's native coordinate system.
# Reflection back to Y-up reverses winding, so flip triangle indices as well.
groups = {key:{'positions':[], 'normals':[], 'indices':[]} for key in ['ribbon','lace']}
depsgraph = bpy.context.evaluated_depsgraph_get()
for obj, key in parts:
    evaluated = obj.evaluated_get(depsgraph)
    mesh = evaluated.to_mesh()
    mesh.calc_loop_triangles()
    data = groups[key]
    base = len(data['positions'])//3
    normal_matrix = obj.matrix_world.to_3x3().inverted().transposed()
    for vertex in mesh.vertices:
        p = obj.matrix_world @ vertex.co
        n = (normal_matrix @ vertex.normal).normalized()
        data['positions'].extend(round(v,7) for v in (p.x,p.z,p.y))
        data['normals'].extend(round(v,7) for v in (n.x,n.z,n.y))
    for tri in mesh.loop_triangles:
        a,b,c = tri.vertices
        data['indices'].extend((base+a,base+c,base+b))
    evaluated.to_mesh_clear()

# Frame this detailed study when inspecting it through the Blender viewport.
for screen in bpy.data.screens:
    for area in screen.areas:
        if area.type == 'VIEW_3D':
            area.spaces.active.region_3d.view_distance = .86
            area.spaces.active.region_3d.view_location = Vector((0,-.03,.78))
            area.spaces.active.shading.color_type = 'MATERIAL'
bpy.ops.wm.save_as_mainfile(filepath=r'D:\Work\Plugins\someday\birthdayMoshu\birthday-island\assets\birthday-bow.blend')
print('BOW_ASSET_JSON='+json.dumps(groups,separators=(',',':')))
