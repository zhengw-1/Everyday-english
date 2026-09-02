import json, re, hashlib, subprocess, base64, os, shutil
from pathlib import Path
root=Path('/mnt/data/v41_work')
phrases=[
'Hi, this is New China Restaurant.','What would you like?','Is that for pickup or delivery?','What is your address?',
'What is your phone number?','Small or large?','With vegetables or no vegetables?','How many would you like?',
'Anything else?','Please wait a moment.','What time will you pick it up?','Thank you for calling New China.',
"General Tso's Chicken",'Chicken with Broccoli','Beef Lo Mein','Shrimp Fried Rice','French Fries','Chicken Wings','Egg Roll','Pizza Roll']
words=[]
for phrase in phrases:
    for w in re.findall(r"[A-Za-z]+(?:'[A-Za-z]+)?", phrase):
        if w not in words: words.append(w)
out=root/'_new_china_audio_tmp'; out.mkdir(exist_ok=True)
assets={}
for text in phrases+words:
    digest=hashlib.md5(text.encode()).hexdigest()[:16]
    mp3=out/(digest+'.mp3')
    wav=out/(digest+'.wav')
    subprocess.run(['espeak','-v','en-us','-s','145','-w',str(wav),text],check=True,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
    subprocess.run(['ffmpeg','-y','-loglevel','error','-i',str(wav),'-codec:a','libmp3lame','-b:a','96k',str(mp3)],check=True)
    wav.unlink()
    assets[text]='data:audio/mpeg;base64,'+base64.b64encode(mp3.read_bytes()).decode()
items=list(assets.items())
chunks=[]; current=[]; size=0
for k,v in items:
    line=json.dumps(k,ensure_ascii=False)+':'+json.dumps(v,ensure_ascii=False)
    if current and size+len(line)+2>750_000:
        chunks.append(current); current=[]; size=0
    current.append((k,v)); size+=len(line)+2
if current: chunks.append(current)
for i,chunk in enumerate(chunks,1):
    obj='globalThis.__ELDER_ENGLISH_AUDIO_MANIFEST = Object.assign(globalThis.__ELDER_ENGLISH_AUDIO_MANIFEST || {}, '+json.dumps(dict(chunk),ensure_ascii=False,separators=(',',':'))+');\n'
    (root/f'new-china-audio-{i}.js').write_text(obj)
    print(i,len(chunk),(root/f'new-china-audio-{i}.js').stat().st_size)
shutil.rmtree(out)
