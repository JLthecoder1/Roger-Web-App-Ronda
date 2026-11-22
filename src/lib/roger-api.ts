export type RogerApi = ReturnType<typeof createApi>

export function createApi(origin:string,role:string){
  let accessCode=''
  const configured=origin.trim()
  // Accept a Railway hostname pasted without the HTTPS scheme.
  const address=/^[a-z0-9.-]+\.up\.railway\.app\/?$/i.test(configured)?'https://'+configured:configured
  const baseUrl=address.replace(/\/$/,'')

  return {
    role,
    requiresAccessCode: !/^https?:\/\/(localhost|127\.0\.0\.1):4001$/i.test(baseUrl),
    get connected(){return Boolean(accessCode)},
    code(){return accessCode},
    setAccessCode(code:string){accessCode=code.trim()},
    clearAccessCode(){accessCode=''},
    async request<T>(path:string,init:RequestInit={}){
      const headers=new Headers(init.headers)
      if(accessCode) headers.set('Authorization',`Bearer ${accessCode}`)
      if(init.body&&!headers.has('Content-Type')) headers.set('Content-Type','application/json')
      const response=await fetch(`${baseUrl}${path}`,{...init,headers})
      const body=await response.json().catch(()=>null)
      if(!response.ok) throw new Error(body?.error??`A API respondeu com HTTP ${response.status}.`)
      return body as T
    }
  }
}
