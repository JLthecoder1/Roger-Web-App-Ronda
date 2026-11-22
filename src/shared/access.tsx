import {useState,type FormEvent} from 'react'
import type {RogerApi} from './roger-api'

export function Access({api}:{api:RogerApi}){
  const [code,setCode]=useState('')
  const [connected,setConnected]=useState(api.connected)
  const [message,setMessage]=useState('')
  async function connect(event:FormEvent<HTMLFormElement>){
    event.preventDefault()
    api.setAccessCode(code)
    try{
      await api.request('/health')
      setConnected(true)
      setMessage('Acesso conectado.')
    }catch(error){
      api.clearAccessCode()
      setConnected(false)
      setMessage(error instanceof Error?error.message:'Não foi possível conectar à API.')
    }
    window.dispatchEvent(new Event('roger:credentials'))
  }
  return <form className="roger-access" onSubmit={connect}>
    <input aria-label="Código de acesso" type="password" value={code} onChange={event=>setCode(event.target.value)} placeholder="Código de acesso" autoComplete="off"/>
    <button type="submit">{connected?'Reconectar':'Conectar'}</button>
    {message&&<p role="status">{message}</p>}
  </form>
}
