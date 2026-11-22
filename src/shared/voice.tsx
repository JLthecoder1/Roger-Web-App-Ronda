import {useState,type ReactNode} from 'react'
import type {RogerApi} from './roger-api'

type SpeechResult={results:{[index:number]:{[index:number]:{transcript:string}}}}
type Recognition={lang:string;interimResults:boolean;continuous:boolean;start:()=>void;onresult:(event:SpeechResult)=>void;onerror:()=>void;onend:()=>void}
type RecognitionConstructor=new()=>Recognition

export function VoiceButton({api:_api,className,idleLabel='Falar',icon}:{api:RogerApi;className?:string;idleLabel?:string;icon?:ReactNode}){
  const [listening,setListening]=useState(false)
  const [message,setMessage]=useState('')
  function start(){
    const voiceWindow=window as typeof window&{SpeechRecognition?:RecognitionConstructor;webkitSpeechRecognition?:RecognitionConstructor}
    const SpeechRecognition=voiceWindow.SpeechRecognition??voiceWindow.webkitSpeechRecognition
    if(!SpeechRecognition){setMessage('O reconhecimento de voz não é compatível com este navegador.');return}
    const recognition=new SpeechRecognition()
    recognition.lang='pt-BR';recognition.interimResults=false;recognition.continuous=false
    recognition.onresult=event=>setMessage(`Transcrição: ${event.results[0][0].transcript}`)
    recognition.onerror=()=>setMessage('Não foi possível acessar o microfone.')
    recognition.onend=()=>setListening(false)
    setMessage('');setListening(true)
    try{recognition.start()}catch{setListening(false);setMessage('Não foi possível iniciar o microfone.')}
  }
  return <><button className={className} type="button" onClick={start} disabled={listening} aria-pressed={listening} title="Falar com o ROGER">{icon}<span>{listening?'Ouvindo…':idleLabel}</span></button>{message&&<p className="roger-voice-feedback" role="status">{message}</p>}</>
}
