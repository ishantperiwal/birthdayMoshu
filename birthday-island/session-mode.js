// Identity is independent of transport: localhost can preview either real UI
// without an invite. Hosted pages always retain authentication.
export function resolveSession(location){
  const params=new URLSearchParams(location.search);
  const raw=(params.get('user')||params.get('param')||'').toLowerCase();
  const user=['ishie','ishiee'].includes(raw)?'ISHIEE':['moshie','moshiee'].includes(raw)?'MOSHIEE':null;
  const local=['localhost','127.0.0.1','[::1]'].includes(location.hostname);
  const invited=new URLSearchParams((location.hash||'').slice(1)).has('invite');
  const online=!local||invited||params.get('online')==='1';
  return {user,online,roleUI:!!user,localRolePreview:local&&!!user&&!online};
}
