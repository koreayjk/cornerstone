import sys, os, json
from PIL import Image, ImageOps
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from grade import grade
src, out = sys.argv[1], sys.argv[2]
os.makedirs(out, exist_ok=True)
CATS = {
 'classroom': [4971, 4984, 4986, 5037, 5038, 5039, 5234, 5235, 5237, 5241, 5294, 5240, 4923, 4010, 4977],
 'athletics': [5350, 5282, 4638, 4822, 4828, 4821, 4637, 4548, 4550, 4636, 4634, 4635, 4832, 4833, 5187],
 'events':    [5351, 4989, 5034, 5035, 5169, 4987, 5236, 5233, 5238, 5239, 4925, 4551, 4552, 4000, 4001, 4004, 4005, 4008, 4009, 4011, 4012, 4013],
 'fieldday':  [3110, 3111, 3112, 3113, 3114, 3116, 3117, 3118, 3119, 3122, 3123, 3124, 3126, 3127, 3128, 3129, 3130],
}
ROT = {4011: 90, 4013: 90, 4551: 90, 4552: 90}
files = {int(f.split('.')[0]): f for f in os.listdir(src)}
manifest, n = [], 0
for cat, ids in CATS.items():
    for i in ids:
        n += 1
        im = ImageOps.exif_transpose(Image.open(os.path.join(src, files[i]))).convert('RGB')
        if i in ROT: im = im.rotate(ROT[i], expand=True)
        im.thumbnail((1000, 1000), Image.LANCZOS)
        im = grade(im, vignette=0.25)
        name = f'{n:02d}'
        im.save(f'{out}/{name}.avif', quality=55)          # no exif/metadata is written
        im.save(f'{out}/{name}.webp', quality=76, method=6)
        manifest.append({'n': name, 'cat': cat, 'w': im.width, 'h': im.height, 'src': i})
# json.dump(manifest, open(f'{out}/../manifest.json', 'w'), indent=0)
print(n)
