# 새 리소스에서 얼굴 아이콘(128 원형) · 전신 그림을 만든다. python3 -I make_icons.py <res_in> <out>
import sys
from PIL import Image, ImageDraw
src, out = sys.argv[1], sys.argv[2]
FILES = {'hanato': '#Ud558#Ub098#Ud1a0.png', 'rito': '#Ub9ac#Ud1a0.png', 'ryuto': '#Ub958#Ud1a0.png', 'santo': '#Uc0b0#Ud1a0.png'}
# 얼굴 상자: (가운데 x, 가운데 y, 한 변) 그림 폭에 대한 비율
FACE = {'hanato': (0.50, 0.245, 0.24), 'rito': (0.48, 0.25, 0.24), 'ryuto': (0.45, 0.22, 0.24), 'santo': (0.53, 0.20, 0.22)}
for k, f in FILES.items():
    im = Image.open(f'{src}/{f}').convert('RGBA'); W = im.size[0]
    cx, cy, sd = FACE[k]
    box = (int((cx - sd / 2) * W), int((cy - sd / 2) * W), int((cx + sd / 2) * W), int((cy + sd / 2) * W))
    face = im.crop(box).resize((128, 128), Image.LANCZOS)
    bg = Image.new('RGBA', (128, 128), (0, 0, 0, 0))
    # 예전 아이콘처럼 원 안을 채운다 (투명한 곳은 연한 크림)
    fill = Image.new('RGBA', (128, 128), (250, 244, 236, 255)); fill.alpha_composite(face)
    mask = Image.new('L', (512, 512), 0); ImageDraw.Draw(mask).ellipse((0, 0, 511, 511), fill=255); mask = mask.resize((128, 128), Image.LANCZOS)
    bg.paste(fill, (0, 0), mask)
    bg.save(f'{out}/icon_{k}.webp', 'WEBP', quality=88, method=6)
    # 전신: 투명한 가장자리만 걷어 내고 높이 1040
    art = im.crop(im.getbbox())
    h = 1040; w = round(art.size[0] * h / art.size[1])
    art.resize((w, h), Image.LANCZOS).save(f'{out}/art_{k}.webp', 'WEBP', quality=86, method=6)
