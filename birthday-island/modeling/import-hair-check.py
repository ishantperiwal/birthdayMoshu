"""Extract the static mesh from hairCheck.glb for the existing module asset pipeline."""
from pathlib import Path
import struct,json
assets=Path(__file__).resolve().parents[1]/'assets'
b=(assets/'hairCheck.glb').read_bytes();n=struct.unpack_from('<I',b,12)[0];g=json.loads(b[20:20+n]);start=20+n;binary=b[start+8:]
def read(i):
 a=g['accessors'][i];v=g['bufferViews'][a['bufferView']];fmt={5126:'f',5123:'H',5125:'I'}[a['componentType']];size=struct.calcsize(fmt);width={'VEC3':3,'SCALAR':1}[a['type']];stride=v.get('byteStride',width*size);offset=v.get('byteOffset',0)+a.get('byteOffset',0)
 return [round(x,7) if fmt=='f' else x for j in range(a['count']) for x in struct.unpack_from('<'+fmt*width,binary,offset+j*stride)]
p=g['meshes'][0]['primitives'][0]
mesh={'positions':read(p['attributes']['POSITION']),'normals':read(p['attributes']['NORMAL']),'indices':read(p['indices'])}
(assets/'male-hair.js').write_text('export const maleHairMesh='+json.dumps(mesh,separators=(',',':'))+';\n')
