import json,glob,os,subprocess,sys
for f in sorted(glob.glob(f'runs/{sys.argv[1]}*/*.jsonl')):
    cost=turns=None; skills=[]; ea=0; probe=0; pwscript=0; err=None
    for l in open(f):
        try: d=json.loads(l)
        except: continue
        if d.get('type')=='assistant':
            for c in d['message']['content']:
                if c.get('type')=='tool_use':
                    if c['name']=='Skill': skills.append(c['input'].get('skill'))
                    if c['name']=='Bash':
                        cmd=c['input'].get('command','')
                        if 'ea journey' in cmd or 'ea crawl' in cmd: ea+=1
                        if 'journey_probe' in cmd: probe+=1
                        if 'chromium' in cmd and 'ea ' not in cmd and 'journey_probe' not in cmd: pwscript+=1
                    if c['name']=='Write' and 'chromium' in c['input'].get('content',''): pwscript+=1
        if d.get('type')=='result': cost=d.get('total_cost_usd'); turns=d.get('num_turns'); err=d.get('subtype')
    w=f[:-6]
    st=subprocess.run(['git','-C',w,'status','--porcelain'],capture_output=True,text=True).stdout.split('\n')
    src=[x for x in st if x and (x.endswith('.py') or x.endswith('.js') or x.endswith('.html') or x.endswith('.css') or '/src/' in x or 'app/' in x) and 'experience-architecture' not in x and 'xa-review' not in x and 'node_modules' not in x and not x.startswith('??')]
    print(f.split('runs/')[1][:-6].ljust(26), f'${cost and round(cost,2)} t={turns} {err} skill={len(skills)>0} eaBrowser={ea} probe={probe} ownPW={pwscript} edits={src[:3]}')
