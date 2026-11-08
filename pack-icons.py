import struct, sys, os

ROOT = os.path.dirname(os.path.abspath(__file__))
BUILD = os.path.join(ROOT, 'build')

def read(name):
    with open(os.path.join(BUILD, name), 'rb') as f:
        return f.read()

# ---------- ICO ----------
ico_sizes = [16, 32, 48, 64, 128, 256]
ico_imgs = [(s, read(f'icon-{s}.png')) for s in ico_sizes]
n = len(ico_imgs)
header = struct.pack('<HHH', 0, 1, n)  # reserved, type=1 (icon), count
offset = 6 + n * 16
dirents = b''
blobs = b''
for size, img in ico_imgs:
    w = size if size < 256 else 0
    h = size if size < 256 else 0
    dirents += struct.pack('<BBBBHHII', w, h, 0, 0, 1, 32, len(img), offset)
    blobs += img
    offset += len(img)
with open(os.path.join(BUILD, 'icon.ico'), 'wb') as f:
    f.write(header + dirents + blobs)

# ---------- ICNS ----------
# ic07=128, ic08=256, ic09=512, ic10=1024 (1024x1024 PNG)
pairs = [('ic07', 128), ('ic08', 256), ('ic09', 512), ('ic10', 1024)]
body = b''
for ftype, size in pairs:
    img = read(f'icon-{size}.png')
    body += ftype.encode('ascii') + struct.pack('>I', 8 + len(img)) + img
with open(os.path.join(BUILD, 'icon.icns'), 'wb') as f:
    f.write(b'icns' + struct.pack('>I', 8 + len(body)) + body)

print('icon.ico and icon.icns written')
