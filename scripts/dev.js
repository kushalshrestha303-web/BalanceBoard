import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
if (existsSync('.env')) process.loadEnvFile('.env');
const npm=process.platform==='win32' ? 'npm.cmd' : 'npm';
const children=[['API',['--prefix','server','run','dev']],['Web',['run','web']]].map(([name,args])=>{
  const child=spawn(npm,args,{stdio:'inherit',shell:process.platform==='win32',env:{...process.env,APP_ORIGIN:process.env.APP_ORIGIN || 'http://localhost:5173'}});
  child.on('error',e=>console.error(`${name}: ${e.message}`));
  return child;
});
for(const signal of ['SIGINT','SIGTERM']) process.on(signal,()=>{
  children.forEach(child=>{ if(child.pid) child.kill(signal); });
  process.exit();
});
