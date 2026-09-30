"""Copy the app's own channel/genre logic into ingest/app-lib so the uploader
classifies tracks with exactly the code the app runs.

  python ingest/sync_app_lib.py            # from origin/main
  python ingest/sync_app_lib.py <git-ref>

Re-run whenever the app's channels change. Read-only against git.
"""
import os
import re
import subprocess
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "ingest", "app-lib")
REF = sys.argv[1] if len(sys.argv) > 1 else "origin/main"
IMPORT_RE = re.compile(r'''(from\s+|require\()\s*(["'])\./([\w.\-]+)\2''')


def show(name):
    for ext in (".js", ".cjs", ""):
        p = subprocess.run(["git", "show", f"{REF}:src/lib/{name}{ext}"], cwd=ROOT,
                           capture_output=True, text=True, encoding="utf-8")
        if p.returncode == 0:
            return name + ext, p.stdout
    return None, None


def main():
    os.makedirs(OUT, exist_ok=True)
    todo, seen = ["sceneChannels"], set()
    while todo:
        name = todo.pop()
        base = re.sub(r"\.(c?js)$", "", name)
        if base in seen:
            continue
        seen.add(base)
        if base == "station":   # pulls in UI branding; only countdownScore is used
            with open(os.path.join(OUT, "station.mjs"), "w", encoding="utf-8") as fh:
                fh.write("export const countdownScore = () => 0;\n")
            print("stubbed station.mjs")
            continue
        fname, text = show(base if not name.endswith((".js", ".cjs")) else name)
        if text is None:
            print("missing:", name)
            continue
        is_cjs = fname.endswith(".cjs")
        for m in IMPORT_RE.finditer(text):
            todo.append(m.group(3))

        def fix(m):
            dep = m.group(3)
            if dep.endswith(".cjs"):
                return m.group(0)
            return f'{m.group(1)}{m.group(2)}./{dep}.mjs{m.group(2)}'
        if not is_cjs:
            text = IMPORT_RE.sub(fix, text)
            out_name = re.sub(r"\.js$", ".mjs", fname)
        else:
            out_name = fname
        with open(os.path.join(OUT, out_name), "w", encoding="utf-8", newline="\n") as fh:
            fh.write(text)
        print("synced", out_name)
    with open(os.path.join(OUT, "REF.txt"), "w") as fh:
        fh.write(subprocess.run(["git", "rev-parse", REF], cwd=ROOT, capture_output=True,
                                text=True).stdout)


main()

