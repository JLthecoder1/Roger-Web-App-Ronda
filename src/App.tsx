import { useCallback,useEffect,useRef,useState } from 'react'
import { prepareRoundPhoto } from './lib/round-photo'
import { VoiceButton } from './lib/voice'
import { createApi } from './lib/roger-api'
import {
  Camera,
  CircleAlert,
  Check,
  Flag,
  MapPin,
  Play,
  Square,
  X,
} from 'lucide-react'

const api=createApi(import.meta.env.VITE_API_URL??'http://localhost:4001','ronda')
type Task={id:string;checkpoint_id:string;parent_id:string|null;title:string}
type State={
  officer?:string|null
  riskAlertId?:string|null
  round:{id:string;officer:string;finished_at:string|null}|null
  checkpoints:{id:string;name:string;task:string;location?:string|null}[]
  checks:{id:string}[]
  tasks?:Task[]
  latest_task_reports?:{task_id:string;done:boolean}[]
}

export function App() {
  const [state,setState]=useState<State|null>(null)
  const [officer,setOfficer]=useState('')
  const officerRef=useRef('')
  const getOfficer=useCallback(()=>officerRef.current,[])
  const voiceSession=useRef<string|null>(null)
  const setVoiceSession=useCallback((id:string|null)=>{voiceSession.current=id},[])
  function selectOfficer(name:string){
    officerRef.current=name
    setOfficer(name)
    window.sessionStorage.setItem('roger:rondista',name)
  }
  const [busy,setBusy]=useState(false)
  const [sendingPhoto,setSendingPhoto]=useState(false)
  const photoInput=useRef<HTMLInputElement>(null)
  const [message,setMessage]=useState<string|null>(null)
  const [showCheckpoints,setShowCheckpoints]=useState(false)
  const controller=useRef<AbortController|null>(null)
  const timer=useRef<ReturnType<typeof setTimeout>|null>(null)
  const activeRound=state?.round&&!state.round.finished_at?state.round:null
  const isActive=Boolean(activeRound)
  const riskActive=Boolean(state?.riskAlertId)
  const checkpoints=state?.checkpoints??[]
  const completed=new Set(isActive?state?.checks.map(check=>check.id):[])
  const next=checkpoints.find(point=>!completed.has(point.id))

  const results=new Map(activeRound?state?.latest_task_reports?.map(report=>[report.task_id,report.done]):[])
  function taskRow(task:Task){
    const result=results.get(task.id)
    return <>
      <span>{task.title}</span>
      <span className="task-result">{result===undefined?'Pendente':result?'Feito':'Não feito'}</span>
      <div className="task-actions">
        <button type="button" disabled={busy||!activeRound||result===true} onClick={()=>action('/api/task-reports',{taskId:task.id,roundId:activeRound?.id,done:true},'Tarefa registrada como feita.')}>Feito</button>
        <button type="button" disabled={busy||!activeRound||result===false} onClick={()=>action('/api/task-reports',{taskId:task.id,roundId:activeRound?.id,done:false},'Tarefa registrada como não feita.')}>Não feito</button>
      </div>
    </>
  }

  async function refresh(){
    controller.current?.abort()
    const request=controller.current=new AbortController()
    try{
      const query=new URLSearchParams()
      if(officerRef.current)query.set('officer',officerRef.current)
      if(voiceSession.current)query.set('voiceSession',voiceSession.current)
      const snapshot=await api.request<State>('/api/round?'+query,{signal:request.signal})
      if(!request.signal.aborted){
        if(snapshot.officer)selectOfficer(snapshot.officer)
        setState(snapshot)
      }
    }catch{
      if(!request.signal.aborted)setState(previous=>previous?.riskAlertId?previous:null)
    }
  }

  useEffect(()=>{
    selectOfficer(window.sessionStorage.getItem('roger:rondista')??'')
    const update=()=>void refresh()
    const polling=window.setInterval(update,2500)
    update()
    return ()=>{
      window.clearInterval(polling)
      controller.current?.abort()
      if(timer.current)clearTimeout(timer.current)
    }
  },[])

  function showMessage(text:string){
    setMessage(text)
    if(timer.current)clearTimeout(timer.current)
    timer.current=setTimeout(()=>setMessage(null),3500)
  }

  async function action(path:string,body:object,success:string){
    if(busy)return
    setBusy(true)
    try{
      await api.request(path,{method:'POST',body:JSON.stringify({...body,officer:officerRef.current})})
      showMessage(success)
      await refresh()
    }catch(error){showMessage(error instanceof Error?error.message:'Não foi possível concluir a ação.')}
    finally{setBusy(false)}
  }

  async function sendPhoto(file:File){
    if(!activeRound||sendingPhoto)return
    setSendingPhoto(true)
    try{
      const photo=await prepareRoundPhoto(file).catch(error=>{
        if(error instanceof DOMException)throw new Error('Não foi possível abrir essa imagem. Tente tirar outra foto.')
        throw error
      })
      await api.request('/api/rounds/'+activeRound.id+'/photos?officer='+encodeURIComponent(activeRound.officer),{
        method:'POST',headers:{'Content-Type':'image/jpeg'},body:photo
      })
      showMessage('Foto registrada nos logs do supervisor.')
    }catch(error){
      showMessage(error instanceof Error?error.message:'Não foi possível registrar a foto.')
    }finally{setSendingPhoto(false)}
  }

  async function emergency(){
    if(!officerRef.current){showMessage('Selecione Ewerton ou Marcos para enviar o alerta.');return}
    if(busy)return
    setBusy(true)
    try{
      const result=await api.request<{alertId:string}>('/api/alerts/risk',{
        method:'POST',body:JSON.stringify({officer:officerRef.current})
      })
      if(!result.alertId)throw new Error('A API não confirmou o protocolo. Atualize o backend.')
      controller.current?.abort()
      setState(previous=>({...previous,round:previous?.round??null,checkpoints:previous?.checkpoints??[],checks:previous?.checks??[],riskAlertId:result.alertId}))
      showMessage('Protocolo de risco acionado.')
    }catch(error){showMessage(error instanceof Error?error.message:'Não foi possível enviar o alerta.')}
    finally{setBusy(false)}
  }

  return (
    <main className="app-shell">
      <section className="ronda" aria-labelledby="screen-title">
        <header className="brand">
          <img src="/roger-logo.png" alt="ROGER" className="brand-logo" />
          <span><strong>Roger</strong> <i>/</i> Rondante</span>
        </header>

        <div className="divider" />

        <div className="status">
          <p className={isActive ? 'eyebrow live' : 'eyebrow'}>
            <span className="status-dot" />
            {isActive ? 'Em andamento' : 'Pronto para iniciar'}
          </p>
          {riskActive&&<section role="alert" className="risk-notice">
            <strong>EMERGÊNCIA · RISCO ATIVO</strong>
            <p>Alerta enviado ao painel do supervisor. Voz suspensa até uma nova ronda.</p>
          </section>}
          <h1 id="screen-title">{isActive ? 'Ronda em andamento' : 'Ronda não iniciada'}</h1>
          {isActive && <p className="route">{next?<>Próximo ponto: <strong>{next.name}</strong>{next.location?.trim() && <> · {next.location}</>}</>:"Todos os checkpoints foram concluídos."}</p>}
        </div>

        <div className="roger-access">
          <label htmlFor="officer">Rotina do rondista</label>
          <select id="officer" value={officer} disabled={isActive||riskActive||busy} onChange={event=>{selectOfficer(event.target.value);setState(null);void refresh()}}>
            <option value="">Diga seu nome ao Roger ou selecione</option>
            <option>Ewerton</option>
            <option>Marcos</option>
          </select>
        </div>
        <nav className="actions" aria-label="Ações da ronda">
          <button className="action action-primary" type="button" onClick={()=>action('/api/round/start',{officer},'Ronda iniciada.')} disabled={isActive||busy||!state||!officer.trim()}>
            {isActive ? <Square aria-hidden="true" /> : <Play aria-hidden="true" fill="currentColor" />}
            <span>{isActive ? 'Ronda iniciada' : 'Iniciar ronda'}</span>
          </button>

          <button className="action" type="button" onClick={() => setShowCheckpoints(true)}>
            <MapPin aria-hidden="true" />
            <span>Ver checkpoints</span>
          </button>

          <input ref={photoInput} type="file" accept="image/*" capture="environment" hidden onChange={event=>{
            const file=event.currentTarget.files?.[0]
            event.currentTarget.value=''
            if(file)void sendPhoto(file)
          }}/>
          <button className="action" type="button" disabled={!activeRound||sendingPhoto} onClick={()=>photoInput.current?.click()}>
            <Camera aria-hidden="true" />
            <span>{sendingPhoto?'Enviando foto…':'Tirar foto'}</span>
          </button>

          <button className="action action-emergency" type="button" disabled={busy||riskActive} onClick={emergency}>
            <CircleAlert aria-hidden="true" />
            <span>Emergência</span>
          </button>

          <button className="action" type="button" onClick={()=>action('/api/round/finish',{id:activeRound?.id},'Ronda finalizada.')} disabled={!isActive||busy}>
            <Flag aria-hidden="true" />
            <span>Finalizar ronda</span>
          </button>

          {!riskActive&&<VoiceButton autoStart api={api} onSession={setVoiceSession} getOfficer={getOfficer} className="action"/>}
        </nav>

        <footer className="app-footer" aria-label="Marca ROGER">
          <img src="/roger-logo.png" alt="ROGER" className="footer-logo" />
        </footer>
      </section>

      {showCheckpoints && (
        <div className="modal-backdrop" role="presentation" onMouseDown={() => setShowCheckpoints(false)}>
          <section
            className="checkpoints-sheet"
            role="dialog"
            aria-modal="true"
            aria-labelledby="checkpoints-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="sheet-handle" />
            <div className="sheet-header">
              <div>
                <p>ROTA DE HOJE</p>
                <h2 id="checkpoints-title">Checkpoints</h2>
              </div>
              <button className="close-button" type="button" onClick={() => setShowCheckpoints(false)} aria-label="Fechar checkpoints">
                <X aria-hidden="true" />
              </button>
            </div>

            <ol className="checkpoint-list">
              {checkpoints.map((checkpoint, index) => {
                const isComplete = completed.has(checkpoint.id)
                const isNext = isActive && next?.id===checkpoint.id

                const tasks=state?.tasks?.filter(task=>task.checkpoint_id===checkpoint.id)??[]
                return (
                  <li className={`checkpoint ${isComplete ? 'complete' : ''} ${isNext ? 'current' : ''}`} key={checkpoint.id}>
                    <span className="checkpoint-icon"><MapPin aria-hidden="true" /></span>
                    <div className="checkpoint-content">
                      <strong>{checkpoint.name}</strong>
                      {checkpoint.location&&<small>Local: {checkpoint.location}</small>}
                      <small>{checkpoint.task}</small>
                      {tasks.length>0&&<ul className="task-list">
                        {tasks.filter(task=>!task.parent_id).map(task=><li key={task.id}>
                          {taskRow(task)}
                          {tasks.some(child=>child.parent_id===task.id)&&<ul className="task-list">
                            {tasks.filter(child=>child.parent_id===task.id).map(child=><li key={child.id}>{taskRow(child)}</li>)}
                          </ul>}
                        </li>)}
                      </ul>}
                    </div>
                    <button
                      className="checkpoint-toggle"
                      type="button"
                      aria-pressed={isComplete}
                      aria-label={`${isComplete?'Concluído':'Registrar inspeção'}: ${checkpoint.name}`}
                      disabled={busy||isComplete||!isActive} onClick={()=>action('/api/checks',{id:checkpoint.id,roundId:activeRound?.id},'Inspeção registrada.')}
                    >
                      {isComplete ? <Check aria-hidden="true" /> : <span>{isNext ? 'Próximo' : index + 1}</span>}
                    </button>
                  </li>
                )
              })}
            </ol>

            <p className="sheet-note"><Check aria-hidden="true" /> {state?'Rota sincronizada com o painel.':'Conecte-se para consultar sua rota.'}</p>
          </section>
        </div>
      )}

      {message && <div className="toast" role="status">{message}</div>}
    </main>
  )
}
