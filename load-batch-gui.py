"""Double-click launcher: pick a music folder + channel, then it builds, uploads and audits.
Run from the crate-app repo root:  python load-batch-gui.py
"""
import os, shutil, subprocess, sys, threading
from pathlib import Path
import tkinter as tk
from tkinter import filedialog, messagebox, ttk

ROOT = Path(__file__).resolve().parent
OUT = Path.home() / "Documents" / "crate-batch"
CHANNELS = {
    "Country & Folk (CH-13)": ("country-folk-wave-", "Country"),
    "Variety Mix (CH-03)": ("variety-wave-", ""),
    "Metal (CH-11)": ("metal-wave-", "Metal"),
    "Punk (CH-12)": ("punk-wave-", "Punk"),
}

root = tk.Tk()
root.title("Planet MP3 batch loader")
folder = tk.StringVar()
channel = tk.StringVar(value=list(CHANNELS)[0])
wave = tk.StringVar(value="1")

def pick():
    d = filedialog.askdirectory(title="Choose the music folder")
    if d:
        folder.set(d)

tk.Label(root, text="Music folder").grid(row=0, column=0, sticky="w", padx=8, pady=4)
tk.Entry(root, textvariable=folder, width=60).grid(row=0, column=1, padx=4)
tk.Button(root, text="Browse…", command=pick).grid(row=0, column=2, padx=8)
tk.Label(root, text="Channel").grid(row=1, column=0, sticky="w", padx=8)
ttk.Combobox(root, textvariable=channel, values=list(CHANNELS), state="readonly", width=30).grid(row=1, column=1, sticky="w", padx=4)
tk.Label(root, text="Wave #").grid(row=2, column=0, sticky="w", padx=8)
tk.Entry(root, textvariable=wave, width=6).grid(row=2, column=1, sticky="w", padx=4)
log = tk.Text(root, height=18, width=90)
log.grid(row=4, column=0, columnspan=3, padx=8, pady=8)

def say(msg):
    log.insert("end", msg + "\n"); log.see("end")

def run(cmd, shell=False):
    say("> " + (cmd if isinstance(cmd, str) else " ".join(cmd)))
    p = subprocess.Popen(cmd, cwd=ROOT, shell=shell, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, errors="replace")
    for line in p.stdout:
        root.after(0, say, line.rstrip())
    return p.wait() == 0

def work():
    prefix, genre = CHANNELS[channel.get()]
    batch = prefix + wave.get().strip()
    src = folder.get()
    steps = [
        [sys.executable, "-m", "pip", "install", "-q", "mutagen", "pillow", "requests"],
        [sys.executable, "build-crate-from-playlist.py", "--source", src, "--batch", batch,
         "--default-genre", genre, "--out", str(OUT)],
    ]
    for s in steps:
        if not run(s):
            return root.after(0, say, "FAILED — stopping.")
    if not (ROOT / "serviceAccountKey.json").exists():
        return root.after(0, say, "STOP: serviceAccountKey.json is missing from the repo folder. Built files are in " + str(OUT))
    for d in ("audio", "covers"):
        shutil.rmtree(ROOT / d, ignore_errors=True)
        shutil.copytree(OUT / d, ROOT / d)
    shutil.copy2(OUT / "tracks.csv", ROOT / "tracks.csv")
    for c in ("npm install --silent", "node upload-tracks.js",
              "npm run catalog:normalize-genres", "npm run catalog:audit-junk"):
        if not run(c, shell=True):
            return root.after(0, say, "FAILED — stopping.")
    root.after(0, say, "DONE. Review genres-review.csv and docs/audits before applying changes.")

def go():
    if not folder.get():
        return messagebox.showwarning("Pick a folder", "Choose a music folder first.")
    if not messagebox.askyesno("Confirm", "This replaces the repo's audio/ and covers/ folders and uploads to Firebase. Continue?"):
        return
    threading.Thread(target=work, daemon=True).start()

tk.Button(root, text="Start", command=go, width=12).grid(row=3, column=1, sticky="w", padx=4, pady=6)
root.mainloop()
