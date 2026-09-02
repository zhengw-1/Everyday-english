import json, re, hashlib, subprocess, base64, os
from pathlib import Path
root=Path('/mnt/data/v41_work')
phrases=[
'Hi, this is New China Restaurant.',
'What would you like?',
'Is that for pickup or delivery?',
'What is your address?',
'What is your phone number?',
'Small or large?',
'With vegetables or no vegetables?',
'How many would you like?',
'Anything else?',
'Please wait a moment.',
'What time will you pick it up?',
'Thank you for calling New China.',
"General Tso's Chicken",
'Chicken with Broccoli',
'Beef Lo Mein',
'Shrimp Fried Rice',
'French Fries',
'Chicken Wings',
'Egg Roll',
'Pizza Roll',
]
words=[]
for phrase in phrases:
    for w in re.findall(r"[A-Za-z]+(?:'[A-Za-z]+)?", phrase):
        if w not in words: words.append(w)
# Generate only new audio assets, keeping existing audio untouched.
out=root/'audio_new_china'
out.mkdir(exist_ok=True)
assets={}
for text in phrases+words:
    digest=hashlib.md5(text.encode()).hexdigest()[:16]
    wav=out/(digest+'.wav'); mp3=out/(digest+'.mp3')
    if not mp3.exists():
        subprocess.run(['espeak','-v','en-us+f3','-s','145','-w',str(wav),text],check=True,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
        subprocess.run(['ffmpeg','-y','-loglevel','error','-i',str(wav),'-codec:a','libmp3lame','-b:a','96k',str(mp3)],check=True)
        wav.unlink()
    b64=base64.b64encode(mp3.read_bytes()).decode('ascii')
    assets[text]='data:audio/mpeg;base64,'+b64
print('assets',len(assets),'bytes',sum(len(v) for v in assets.values()))
# Merge into existing manifest
mp=root/'audio-manifest.js'
s=mp.read_text()
obj=json.loads(s.split('=',1)[1].strip().rstrip(';'))
obj.update(assets)
mp.write_text('globalThis.__ELDER_ENGLISH_AUDIO_MANIFEST = '+json.dumps(obj,ensure_ascii=False,separators=(',',':'))+';\n')
# remove temporary audio folder because audio is embedded in manifest
import shutil; shutil.rmtree(out)
