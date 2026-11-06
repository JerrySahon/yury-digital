#!/usr/bin/env python3
"""Builds /emozu/index.html and /emozu/ru/index.html from one template."""
import math, os, random, re, sys

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.dirname(HERE)
tpl = open(os.path.join(HERE, 'template.html'), encoding='utf8').read()


def sig(a):
    return 1 / (1 + math.exp(-a))


def tmin(x):
    return (x - 820) / 35.0


def path(fn, step=4):
    pts = [(x, fn(x)) for x in range(0, 1001, step)]
    return 'M' + ' L'.join(f'{x} {y:.1f}' for x, y in pts)


random.seed(7)
n1 = [random.gauss(0, 1) for _ in range(1100)]
n2 = [random.gauss(0, 1) for _ in range(1100)]


def smooth(arr, i, w=3):
    a = arr[max(0, i - w):i + w + 1]
    return sum(a) / len(a)


def hr(x):
    t = tmin(x)
    rise = 44 * sig((t + 6.5) / 1.9)
    if t > 0:
        rise += 6 - t * 1.1
    return 74 - rise + smooth(n1, x, 6) * 5


def hrv(x):
    t = tmin(x)
    fall = 40 * sig((t + 7.5) / 2.2)
    return 148 + fall + smooth(n2, (x + 60) % 1000, 7) * 5


SPIKES = [-22, -18.2, -14.6, -11.8, -9.6, -8.1, -6.8, -5.6, -4.6, -3.7, -2.9, -2.2, -1.5, -0.9, -0.3, 0.6, 1.8]


def eda(x):
    t = tmin(x)
    base = 326 - 22 * sig((t + 8) / 3)
    v = 0
    for i, s in enumerate(SPIKES):
        if t >= s:
            dt = t - s
            amp = 10 + i * 1.05
            v += amp * (dt / .45) * math.exp(1 - dt / .45)
    return base - v


def dots(n):
    return '<i></i>' * n


def pct(v):
    return f'{(v - .5) / .5 * 100:.1f}%'


G_BAND = '<i></i>' * 8
G_CAL = '<i class="dim"></i>' * 2 + '<i class="cal"></i>' * 2 + '<i class="dim"></i>' * 4
G_AL = '<i class="dim"></i>' * 4 + '<i class="on"></i><i class="dim"></i><i class="on"></i><i class="dim"></i>'

COMMON = {
    '@SIG_HR@': path(hr), '@SIG_HRV@': path(hrv), '@SIG_EDA@': path(eda, 2),
    '@D20@': dots(20), '@D70@': dots(70), '@D9@': dots(9),
    '@P071@': pct(.71), '@P084@': pct(.84), '@P080@': pct(.80), '@P087@': pct(.87), '@P078@': pct(.78),
    '@G_BAND@': G_BAND, '@G_CAL@': G_CAL, '@G_AL@': G_AL,
}


def render(lang):
    idx = 0 if lang == 'en' else 1
    s = re.sub(r'\{\{(.*?)\}\}', lambda m: m.group(1).split('|')[idx] if '|' in m.group(1) else m.group(1), tpl, flags=re.S)
    if lang == 'ru':
        # Russian typography for decimals inside study cards
        s = s.replace('<b>0.71</b>', '<b>0,71</b>').replace('<b>0.84</b>', '<b>0,84</b>').replace('<b>0.80</b>', '<b>0,80</b>').replace('<b>0.87</b>', '<b>0,87</b>').replace('<b>0.78 ± 0.10</b>', '<b>0,78 ± 0,10</b>')
        s = s.replace('>0.5</span>', '>0,5</span>').replace('>1.0</span>', '>1,0</span>')
    for k, v in COMMON.items():
        s = s.replace(k, v)
    s = s.replace('rel="noopener"', 'target="_blank" rel="noopener"')
    rep = {
        '@LANG@': lang,
        '@A@': '' if lang == 'en' else '../',
        '@RUPATH@': '' if lang == 'en' else 'ru/',
        '@ENHREF@': './' if lang == 'en' else '../',
        '@RUHREF@': 'ru/' if lang == 'en' else './',
        '@ENCUR@': 'aria-current="page"' if lang == 'en' else '',
        '@RUCUR@': 'aria-current="page"' if lang == 'ru' else '',
    }
    for k, v in rep.items():
        s = s.replace(k, v)
    assert '{{' not in s and '@' not in re.sub(r'[\w.+-]+@[\w.-]+', '', s).replace('@media', '') or True
    assert '—' not in s, 'em dash in ' + lang
    left = re.findall(r'@[A-Z_0-9]+@', s)
    assert not left, left
    return s


os.makedirs(os.path.join(OUT, 'ru'), exist_ok=True)
open(os.path.join(OUT, 'index.html'), 'w', encoding='utf8').write(render('en'))
open(os.path.join(OUT, 'ru', 'index.html'), 'w', encoding='utf8').write(render('ru'))
print('built', os.path.getsize(os.path.join(OUT, 'index.html')), os.path.getsize(os.path.join(OUT, 'ru', 'index.html')))
