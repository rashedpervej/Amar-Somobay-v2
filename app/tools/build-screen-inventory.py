#!/usr/bin/env python3
"""
app/tools/build-screen-inventory.py
-----------------------------------
প্রোটোটাইপের `META` অ্যারে (prototype/assets/screens.js) থেকে **সত্যিকারের** স্ক্রিন-তালিকা
পড়ে `docs/plans/screen-inventory.csv` তৈরি/হালনাগাদ করে।

কেন: "কতটি পেজ হয়েছে" — হাতে লেখা সংখ্যা নয়, প্রোটোটাইপ থেকেই গণনা।
     পুরনো CSV থাকলে তার status / batch / route / note কলাম অক্ষত রাখা হয়,
     শুধু নতুন স্ক্রিন যোগ হয় বা নাম/কোড বদলালে সংশোধন হয়।

ব্যবহার:
    python3 app/tools/build-screen-inventory.py

কলাম: id, code, name, platform, module, roles, status, batch, react_route, note
      status ∈ done | partial | todo
"""

import csv
import json
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))          # <ws>/app/tools
WS = os.path.dirname(os.path.dirname(HERE))               # <ws>
PROTO = os.path.join(WS, 'prototype', 'assets', 'screens.js')
OUT = os.path.join(WS, 'docs', 'plans', 'screen-inventory.csv')


def read_meta(path):
    src = open(path, encoding='utf-8').read()
    i = src.index('const META =')
    j = src.index('[', i)
    depth = 0
    for k in range(j, len(src)):
        if src[k] == '[':
            depth += 1
        elif src[k] == ']':
            depth -= 1
            if depth == 0:
                block = src[j:k + 1]
                break
    else:
        raise ValueError('META শেষ পাওয়া যায়নি')

    starts = [m.start() for m in re.finditer(r"\{\s*\n?\s*id:\s*'[a-z]+\d+'", block)]
    starts.append(len(block))
    out = []
    for a, b in zip(starts, starts[1:]):
        e = block[a:b]

        def field(name):
            m = re.search(rf"{name}:\s*'([^']*)'", e)
            return m.group(1) if m else ''

        out.append({
            'id': field('id'),
            'code': field('code'),
            'name': field('name'),
            'role': field('role'),
            'nav': field('nav'),
        })
    return out


def platform_of(sid):
    if sid.startswith('am'):
        return 'Admin App'
    if sid.startswith('a'):
        return 'Admin Web'
    if sid.startswith('m'):
        return 'Member App'
    if sid.startswith('s'):
        return 'Shared'
    return 'Unknown'


def module_of(code):
    if code.startswith('S-'):
        return 'Shared'
    if code.startswith('RAM-') or code.startswith('RA-') or code.startswith('RM-'):
        return 'ROSCA'
    if code.startswith('JAM-') or code.startswith('JA-') or code.startswith('JM-'):
        return 'JointGoal'
    if code.startswith('QAM-') or code.startswith('QA-') or code.startswith('QM-'):
        return 'QardHasanah'
    return 'GeneralSavings'


def main():
    screens = read_meta(PROTO)
    if len(screens) == 0:
        sys.exit('প্রোটোটাইপে কোনো স্ক্রিন পাওয়া যায়নি')

    previous = {}
    if os.path.exists(OUT):
        with open(OUT, encoding='utf-8') as f:
            for row in csv.DictReader(f):
                previous[row['id']] = row

    rows = []
    for s in screens:
        sid = s['id']
        old = previous.get(sid, {})
        rows.append({
            'id': sid,
            'code': s['code'] or old.get('code', ''),
            'name': s['name'] or old.get('name', ''),
            'platform': platform_of(sid),
            'module': module_of(s['code']),
            'roles': s['role'],
            'status': old.get('status', 'todo'),
            'batch': old.get('batch', ''),
            'react_route': old.get('react_route', ''),
            'note': old.get('note', ''),
        })

    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, 'w', encoding='utf-8', newline='') as f:
        w = csv.DictWriter(f, fieldnames=['id', 'code', 'name', 'platform', 'module', 'roles',
                                          'status', 'batch', 'react_route', 'note'])
        w.writeheader()
        w.writerows(rows)

    # সারসংক্ষেপ ছাপা
    from collections import Counter
    print(f"স্ক্রিন: {len(rows)}  → {OUT}")
    for key in ('platform', 'module', 'status'):
        print(f"  {key:9s}", dict(Counter(r[key] for r in rows)))
    for p in sorted({r['platform'] for r in rows}):
        c = Counter(r['status'] for r in rows if r['platform'] == p)
        print(f"  {p:12s} done={c['done']:3d} partial={c['partial']:3d} todo={c['todo']:3d}")


if __name__ == '__main__':
    main()
