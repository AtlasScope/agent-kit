import json,glob,os,random,subprocess,sys
sc=sys.argv[1]; SP=os.path.dirname(os.path.abspath(__file__))
out=f'{SP}/judge2/{sc}'; os.makedirs(out,exist_ok=True)
runs=sorted(glob.glob(f'{SP}/runs/{sc}/*.jsonl')+glob.glob(f'{SP}/runs/{sc}-final/*.jsonl'))
random.seed(sc+'-2'); letters=[chr(65+i) for i in range(len(runs))]; random.shuffle(letters)
mapping={}
for f,L in zip(runs,letters):
    w=f[:-6]; name=os.path.basename(w); mapping[L]=os.path.basename(os.path.dirname(f))+'/'+name
    final=''
    for l in open(f):
        try: d=json.loads(l)
        except: continue
        if d.get('type')=='result': final=d.get('result','')
    st=subprocess.run(['git','-C',w,'status','--porcelain','-uall'],capture_output=True,text=True).stdout.split('\n')
    mds=[x[3:] for x in st if x.endswith('.md') and 'node_modules' not in x and '.claude/' not in x]
    txt=f'# Report {L}\n\n## Final chat message\n\n{final}\n'
    for m in mds:
        txt+=f'\n## File: {m.split("/")[-1]}\n\n'+open(os.path.join(w,m)).read()[:60000]+'\n'
    # neutralise arm-identifying paths
    for k in ['experience-architecture','.experience-architecture','xa-review','journey_probe.mjs','ea journey','ea map','ea brief','ea crawl']:
        pass
    open(f'{out}/report-{L}.md','w').write(txt)
json.dump(mapping,open(f'{SP}/judge2/{sc}.mapping.json','w'),indent=1)
print(out, len(runs), {k:len(open(f"{out}/report-{k}.md").read()) for k in sorted(mapping)})
