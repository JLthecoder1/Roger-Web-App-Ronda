import {useEffect,useRef,useState} from 'react'
import {encodeRoundPhoto} from './round-photo'

export function RoundCamera({onClose,onCapture,onNativeCapture}:{
 onClose:()=>void
 onCapture:(photo:Blob)=>void
 onNativeCapture:()=>void
}){
 const dialog=useRef<HTMLDialogElement>(null)
 const video=useRef<HTMLVideoElement>(null)
 const [ready,setReady]=useState(false)
 const [capturing,setCapturing]=useState(false)
 const [error,setError]=useState('')
 useEffect(()=>{
  dialog.current?.showModal()
  let closed=false
  let stream:MediaStream|undefined
  void (async()=>{
   try{
    if(!navigator.mediaDevices?.getUserMedia)throw new Error('camera')
    const camera=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:'environment'}},audio:false})
    if(closed){camera.getTracks().forEach(track=>track.stop());return}
    stream=camera
    if(video.current)video.current.srcObject=camera
   }catch{
    if(!closed)setError('Não foi possível abrir a prévia. Use a câmera do aparelho abaixo ou confira a permissão.')
   }
  })()
  return ()=>{closed=true;stream?.getTracks().forEach(track=>track.stop())}
 },[])
 async function capture(){
  const frame=video.current
  if(!frame||!frame.videoWidth||capturing)return
  setCapturing(true)
  try{
   onCapture(await encodeRoundPhoto(frame,frame.videoWidth,frame.videoHeight))
  }catch{
   setError('Não foi possível registrar a imagem. Tente novamente.')
   setCapturing(false)
  }
 }
 return <dialog ref={dialog} className="round-camera" aria-labelledby="round-camera-title" onCancel={event=>{event.preventDefault();onClose()}}>
  <h2 id="round-camera-title">Foto da ronda</h2>
  <video ref={video} autoPlay muted playsInline hidden={!ready} onLoadedData={()=>setReady(true)}/>
  {!ready&&!error&&<p role="status">Abrindo a câmera…</p>}
  {error&&<p role="status">{error}</p>}
  <div className="round-camera-actions">
   <button className="action" type="button" onClick={onClose}>Cancelar</button>
   {ready?<button className="action action-primary" type="button" disabled={capturing} onClick={()=>void capture()}>Capturar e enviar</button>:
    error&&<button className="action action-primary" type="button" onClick={onNativeCapture}>Usar câmera do celular</button>}
  </div>
 </dialog>
}
