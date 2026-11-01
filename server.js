import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const root=fileURLToPath(new URL('.',import.meta.url));
http.createServer(async(req,res)=>{try{const url=new URL(req.url,'http://localhost');const file=path.resolve(root,'.'+decodeURIComponent(url.pathname==='/'?'/index.html':url.pathname));if(!file.startsWith(root)){res.writeHead(403).end();return}const data=await readFile(file);res.setHeader('Content-Type',({'html':'text/html; charset=utf-8','css':'text/css','js':'text/javascript','png':'image/png'})[path.extname(file).slice(1)]||'application/octet-stream');res.end(data)}catch{res.writeHead(404).end('Not found')}}).listen(process.env.PORT||3000,'0.0.0.0',()=>console.log('BONBACKMAN running on port '+(process.env.PORT||3000)));
