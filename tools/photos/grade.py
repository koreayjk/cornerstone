"""House colour grade for the school's real photos: one consistent, quiet, filmic look.
grade(img) -> img. Steps: partial grey-world white balance, gentle exposure normalise,
soft S-curve with lifted blacks (matte), reduced saturation, warm highlights / cool-neutral
shadows, subtle vignette, light sharpening."""
from PIL import Image, ImageFilter, ImageStat, ImageEnhance, ImageChops
import numpy as np

def grade(im, strength=1.0, vignette=0.38, sat=0.32, s_amt=0.55):
    a = np.asarray(im.convert('RGB')).astype(np.float32) / 255.0
    # 1. white balance: pull channel means 60% toward their average (removes flash/fluorescent casts)
    m = a.reshape(-1, 3).mean(0); g = m.mean()
    a = a * (1 + 0.6 * (g / np.maximum(m, 1e-3) - 1))
    # 2. exposure: aim mid-tones at ~0.46 (only nudge)
    lum = (a * [0.2126, 0.7152, 0.0722]).sum(-1)
    med = np.median(lum); a = a * np.clip(0.46 / max(med, 1e-3), 0.8, 1.25) ** 0.6
    a = np.clip(a, 0, 1)
    # 3. tone curve: soft S + matte blacks + rolled highlights
    def curve(x):
        s = x + s_amt * strength * (x - 0.5) * x * (1 - x) * 2   # S-curve
        return 0.045 + np.clip(s, 0, 1) * (0.94 - 0.045)                                       # lift blacks, roll whites
    a = curve(a)
    # 4. saturation down ~18%
    lum = (a * [0.2126, 0.7152, 0.0722]).sum(-1, keepdims=True)
    a = lum + (a - lum) * (1 - sat * strength)
    # 5. split tone: warm highlights, very slightly cool shadows
    w = np.clip((lum - 0.35) / 0.65, 0, 1)
    a = a + (w * np.array([0.045, 0.02, -0.035]) + (1 - w) * np.array([-0.012, 0.004, 0.018])) * strength
    # 6. vignette
    h, wd = a.shape[:2]
    yy, xx = np.mgrid[0:h, 0:wd]
    r = np.sqrt(((xx - wd / 2) / (wd / 2)) ** 2 + ((yy - h / 2) / (h / 2)) ** 2) / np.sqrt(2)
    a = a * (1 - vignette * np.clip(r - 0.35, 0, 1) ** 1.6 / 0.65 ** 1.6)[..., None]
    out = Image.fromarray((np.clip(a, 0, 1) * 255 + 0.5).astype(np.uint8))
    return out.filter(ImageFilter.UnsharpMask(radius=1.2, percent=40, threshold=2))
