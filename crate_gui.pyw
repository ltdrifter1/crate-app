"""Crate Uploader - pick a folder, choose the channel, click Go.

  1. prep      reads tags, genres, art from the folder (nothing is copied or edited)
  2. preview   dedupes against Firebase and shows exactly where tracks will land
  3. upload    only after you confirm; then verifies every track

Channels come from the app itself (ingest/app-lib, synced from the app repo).
"""
import json
import os
import queue
import subprocess
import sys
import threading
import tkinter as tk
from tkinter import filedialog, messagebox, scrolledtext, ttk

ROOT = os.path.dirname(os.path.abspath(__file__))
INGEST = os.path.join(ROOT, "ingest")
PY = sys.executable.replace("pythonw.exe", "python.exe")
NO_WINDOW = getattr(subprocess, "CREATE_NO_WINDOW", 0)


def load_channels():
    p = subprocess.run(["node", os.path.join(INGEST, "classify.mjs"), "--list"], cwd=ROOT,
                       capture_output=True, text=True, encoding="utf-8", creationflags=NO_WINDOW)
    return json.loads(p.stdout)


class App(tk.Tk):
    def __init__(self):
        super().__init__()
        self.title("Crate Uploader")
        self.geometry("760x560")
        self.q = queue.Queue()
        self.folder = tk.StringVar()
        self.channel = tk.StringVar()
        self.art = tk.BooleanVar(value=False)
        try:
            chans = load_channels()
        except Exception as e:
            messagebox.showerror("Crate Uploader", f"Could not load channels (is Node installed?)\n{e}")
            raise SystemExit
        self.labels = {f"CH-{c['num']:02d}  {c['title']}": c["id"] for c in chans}

        f = ttk.Frame(self, padding=12)
        f.pack(fill="x")
        ttk.Label(f, text="Folder").grid(row=0, column=0, sticky="w")
        ttk.Entry(f, textvariable=self.folder).grid(row=0, column=1, sticky="ew", padx=6)
        ttk.Button(f, text="Browse...", command=self.browse).grid(row=0, column=2)
        ttk.Label(f, text="Channel").grid(row=1, column=0, sticky="w", pady=(8, 0))
        ttk.Combobox(f, textvariable=self.channel, state="readonly",
                     values=list(self.labels)).grid(row=1, column=1, sticky="ew", padx=6, pady=(8, 0))
        ttk.Checkbutton(f, text="Fetch missing album art first (this edits your original MP3 tags)",
                        variable=self.art).grid(row=2, column=1, sticky="w", pady=(8, 0))
        f.columnconfigure(1, weight=1)

        self.go = ttk.Button(self, text="Go", command=self.start)
        self.go.pack(pady=(0, 8))
        self.log = scrolledtext.ScrolledText(self, state="disabled", font=("Consolas", 9))
        self.log.pack(fill="both", expand=True, padx=12, pady=(0, 12))
        self.after(100, self.drain)

    def browse(self):
        d = filedialog.askdirectory(title="Select the folder of MP3s")
        if d:
            self.folder.set(os.path.normpath(d))

    def write(self, text):
        self.q.put(text)

    def drain(self):
        try:
            while True:
                text = self.q.get_nowait()
                if text is None:
                    self.go.config(state="normal")
                    continue
                self.log.config(state="normal")
                self.log.insert("end", text)
                self.log.see("end")
                self.log.config(state="disabled")
        except queue.Empty:
            pass
        self.after(100, self.drain)

    def start(self):
        folder = self.folder.get().strip()
        channel = self.labels.get(self.channel.get().strip(), "")
        if not os.path.isdir(folder):
            messagebox.showerror("Crate Uploader", "Pick a valid folder first.")
            return
        if not channel:
            messagebox.showerror("Crate Uploader", "Choose a channel.")
            return
        if not os.path.exists(os.path.join(ROOT, "serviceAccountKey.json")):
            messagebox.showerror("Crate Uploader", "serviceAccountKey.json is missing from the crate-app folder.")
            return
        self.go.config(state="disabled")
        self.log.config(state="normal")
        self.log.delete("1.0", "end")
        self.log.config(state="disabled")
        threading.Thread(target=self.run, args=(folder, channel), daemon=True).start()

    def step(self, label, cmd):
        """Run a command, stream its output, return its last RESULT/MANIFEST payload."""
        self.write(f"\n=== {label} ===\n")
        env = dict(os.environ, PYTHONIOENCODING="utf-8", PYTHONUNBUFFERED="1")
        p = subprocess.Popen(cmd, cwd=ROOT, env=env, stdout=subprocess.PIPE, stderr=subprocess.STDOUT,
                             text=True, encoding="utf-8", errors="replace", creationflags=NO_WINDOW)
        payload = None
        for line in p.stdout:
            if line.startswith("RESULT "):
                payload = json.loads(line[7:])
            elif line.startswith("MANIFEST "):
                payload = line[9:].strip()
            else:
                self.write(line)
        if p.wait() != 0:
            self.write(f"\nFAILED: {label} (exit {p.returncode}). Stopped. Nothing was uploaded.\n")
            return None
        return payload

    def ask(self, title, message):
        ev, ans = threading.Event(), {}

        def show():
            ans["ok"] = messagebox.askyesno(title, message)
            ev.set()

        self.after(0, show)
        ev.wait()
        return ans["ok"]

    @staticmethod
    def preview_text(s):
        t = [f"Channel: {s['channelTitle']}   (batch {s['batch']})",
             f"Folder tracks: {s['total']}    Already in Firebase: {s['skipped']}    Junk excluded: {s['excluded']}",
             f"NEW to upload: {s['new']}",
             f"  on the {s['channelTitle']} channel: {s['onTargetChannel']}",
             f"  on NO channel: {s['onNoChannel']}",
             f"  genre guessed from channel: {s['genreGuessed']}    no genre: {s['noGenre']}",
             f"  missing cover {s['missingCover']} | BPM {s['missingBpm']} | key {s['missingKey']} | energy {s['missingEnergy']}"]
        if s["byChannel"]:
            t.append("Lands on: " + ", ".join(f"{k} {v}" for k, v in sorted(s["byChannel"].items(), key=lambda kv: -kv[1])))
        if s["byGenre"]:
            t.append("Genres: " + ", ".join(f"{k} {v}" for k, v in sorted(s["byGenre"].items(), key=lambda kv: -kv[1])[:8]))
        if s["junk"]:
            t.append("\nJunk excluded (files untouched, listed in excluded.csv):\n  " + "\n  ".join(s["junk"][:12]))
        if s["noChannelSample"]:
            t.append("\nWon't play on any channel (sample):\n  " + "\n  ".join(s["noChannelSample"][:8]))
        return "\n".join(t)

    def run(self, folder, channel):
        try:
            if self.art.get():
                if self.step("Fetch album art", [PY, os.path.join("tools", "crate_art.py"), folder]) is None:
                    return
            manifest = self.step("Reading folder", [PY, os.path.join("ingest", "prep.py"), folder, channel])
            if not manifest:
                return
            s = self.step("Preview (checking Firebase)", ["node", os.path.join("ingest", "run.js"), "plan", manifest])
            if not s:
                return
            text = self.preview_text(s)
            self.write("\n" + text + "\n")
            if s["new"] == 0:
                self.write("\nNothing new to upload.\n")
                return
            if not self.ask("Upload?", text + f"\n\nUpload {s['new']} new track(s)?"):
                self.write("\nCancelled. Nothing was uploaded.\n")
                return
            r = self.step("Uploading + verifying", ["node", os.path.join("ingest", "run.js"), "upload", manifest])
            if not r:
                return
            self.write(f"\nDone: {r['uploaded']} uploaded, {r['failed']} failed, {r['verified']} verified.\n")
            if r["landed"]:
                self.write("Now playing on: " + ", ".join(f"{k} {v}" for k, v in r["landed"].items()) + "\n")
            for f in r["failures"]:
                self.write("  failed: " + f + "\n")
            if r["problems"]:
                self.write(f"WARNING: {len(r['problems'])} track(s) failed verification - re-run to check.\n")
        except Exception as e:
            self.write(f"\nError: {e}\n")
        finally:
            self.q.put(None)


if __name__ == "__main__":
    App().mainloop()
