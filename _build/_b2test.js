const fs=require('fs');
const env=fs.readFileSync('C:/Users/Bioootak/Desktop/FinancialMarket/.env.local','utf8');
const get=k=>{const m=env.match(new RegExp('^'+k+'="?([^"\n]*)"?','m'));return m?m[1]:null;};
const keyId=get('BACKUP_S3_PRIMARY_ACCESS_KEY'), appKey=get('BACKUP_S3_PRIMARY_SECRET_KEY');
const auth=Buffer.from(keyId+':'+appKey).toString('base64');
(async()=>{
  const r=await fetch('https://api.backblazeb2.com/b2api/v4/b2_authorize_account',{
    headers:{Authorization:'Basic '+auth}});
  const j=await r.json();
  if(j.code){console.log('AUTH FAIL',j.code,j.message);process.exit(1);}
  console.log('accountId:',j.accountId);
  console.log('allowed:',JSON.stringify(j.allowed).slice(0,300));
  console.log('apiUrl:',j.apiUrl,'downloadUrl:',j.downloadUrl);
  const t=j.authorizationToken;
  const b=await fetch(j.apiUrl+'/b2api/v4/b2_list_buckets?accountId='+j.accountId,{headers:{Authorization:t}});
  const bj=await b.json();
  for(const bk of bj.buckets||[]) console.log('bucket:',bk.bucketName,'|',bk.bucketType,'|',bk.bucketId);
})().catch(e=>console.log('ERR',e.message));
