'use client'

import {useEffect,useId,useRef,useState} from 'react'

export function DevicePicker({kind,onClose,onSelect,defaultLabel='Padrão do navegador'}:{
 kind:'audioinput'|'videoinput'
 onClose:()=>void
 onSelect:(deviceId:string)=>void
 defaultLabel?:string
}){
 const dialog=useRef<HTMLDialogElement>(null)
 const title=useId()
 const [devices,setDevices]=useState<MediaDeviceInfo[]>([])
 const [selected,setSelected]=useState('')
 const [loading,setLoading]=useState(false)
 const [message,setMessage]=useState('')
 const label=kind==='audioinput'?'microfone':'câmera'
 useEffect(()=>{
  const element=dialog.current
  element?.showModal()
  let active=true
  void navigator.mediaDevices?.enumerateDevices()
   .then(list=>{if(active)setDevices(list.filter(device=>device.kind===kind&&device.deviceId))})
   .catch(()=>{})
  return ()=>{active=false;element?.close()}
 },[kind])

 async function listDevices(){
  setLoading(true)
  setMessage('')
  let stream:MediaStream|undefined
  try{
   if(!navigator.mediaDevices?.getUserMedia)throw new Error('media unavailable')
   stream=await navigator.mediaDevices.getUserMedia({audio:kind==='audioinput',video:kind==='videoinput'})
   const list=(await navigator.mediaDevices.enumerateDevices()).filter(device=>device.kind===kind&&device.deviceId)
   setDevices(list)
   if(!list.length)setMessage('Nenhum dispositivo foi encontrado.')
  }catch{
   setMessage('Não foi possível listar os dispositivos. Confira a permissão deste site.')
  }finally{
   stream?.getTracks().forEach(track=>track.stop())
   setLoading(false)
  }
 }

 return <dialog ref={dialog} className="roger-device-picker" aria-labelledby={title} onCancel={event=>{event.preventDefault();onClose()}}>
  <h2 id={title}>Escolha {kind==='audioinput'?'o microfone':'a câmera'}</h2>
  <label>{kind==='audioinput'?'Microfone':'Câmera'}
   <select value={selected} onChange={event=>setSelected(event.target.value)}>
    <option value="">{defaultLabel}</option>
    {devices.filter(device=>device.deviceId!=='default'&&device.deviceId!=='communications').map((device,index)=>
     <option key={device.deviceId} value={device.deviceId}>{device.label||`${label} ${index+1}`}</option>
    )}
   </select>
  </label>
  {message&&<p role="status">{message}</p>}
  <div>
   <button type="button" disabled={loading} onClick={()=>void listDevices()}>{loading?'Buscando…':'Mostrar dispositivos'}</button>
   <button type="button" onClick={onClose}>Cancelar</button>
   <button type="button" disabled={loading} onClick={()=>onSelect(selected)}>Usar este dispositivo</button>
  </div>
 </dialog>
}
