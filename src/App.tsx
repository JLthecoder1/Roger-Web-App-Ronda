import { useState } from 'react'
import {
  CircleAlert,
  Check,
  Flag,
  MapPin,
  Mic,
  Play,
  Square,
  X,
} from 'lucide-react'

type RoundState = 'idle' | 'active'

const demoCheckpoints = [
  { id: 'portaria', name: 'Portaria principal', task: 'Primeiro ponto da ronda' },
  { id: 'doca', name: 'Doca de recebimento', task: 'Verificar se o portão está trancado' },
  { id: 'almoxarifado', name: 'Almoxarifado', task: 'Conferir acesso e iluminação' },
]

export function App() {
  const [roundState, setRoundState] = useState<RoundState>('idle')
  const [message, setMessage] = useState<string | null>(null)
  const [showCheckpoints, setShowCheckpoints] = useState(false)
  const [completedCheckpoints, setCompletedCheckpoints] = useState<string[]>([])
  const isActive = roundState === 'active'

  const showMessage = (text: string) => {
    setMessage(text)
    window.setTimeout(() => setMessage(null), 2600)
  }

  const startRound = () => {
    setRoundState('active')
    showMessage('Ronda iniciada. Siga para o primeiro checkpoint.')
  }

  const finishRound = () => {
    setRoundState('idle')
    showMessage('Ronda finalizada com segurança.')
  }

  const toggleCheckpoint = (checkpointId: string) => {
    setCompletedCheckpoints((current) =>
      current.includes(checkpointId)
        ? current.filter((id) => id !== checkpointId)
        : [...current, checkpointId],
    )
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
          <h1 id="screen-title">{isActive ? 'Ronda em andamento' : 'Ronda não iniciada'}</h1>
          {isActive && <p className="route">Próximo ponto: <strong>Doca</strong></p>}
        </div>

        <nav className="actions" aria-label="Ações da ronda">
          <button className="action action-primary" type="button" onClick={startRound} disabled={isActive}>
            {isActive ? <Square aria-hidden="true" /> : <Play aria-hidden="true" fill="currentColor" />}
            <span>{isActive ? 'Ronda iniciada' : 'Iniciar ronda'}</span>
          </button>

          <button className="action" type="button" onClick={() => setShowCheckpoints(true)}>
            <MapPin aria-hidden="true" />
            <span>Ver checkpoints</span>
          </button>

          <button className="action action-emergency" type="button" onClick={() => showMessage('Alerta de emergência enviado à portaria.') }>
            <CircleAlert aria-hidden="true" />
            <span>Emergência</span>
          </button>

          <button className="action" type="button" onClick={finishRound} disabled={!isActive}>
            <Flag aria-hidden="true" />
            <span>Finalizar ronda</span>
          </button>

          <button className="action" type="button" onClick={() => showMessage('Canal de voz pronto para falar.') }>
            <Mic aria-hidden="true" />
            <span>Falar</span>
          </button>
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
              {demoCheckpoints.map((checkpoint, index) => {
                const isComplete = completedCheckpoints.includes(checkpoint.id)
                const isNext = !isComplete && !demoCheckpoints.slice(0, index).some(({ id }) => !completedCheckpoints.includes(id))

                return (
                  <li className={`checkpoint ${isComplete ? 'complete' : ''} ${isNext ? 'current' : ''}`} key={checkpoint.id}>
                    <span className="checkpoint-icon"><MapPin aria-hidden="true" /></span>
                    <span className="checkpoint-content"><strong>{checkpoint.name}</strong><small>{checkpoint.task}</small></span>
                    <button
                      className="checkpoint-toggle"
                      type="button"
                      aria-pressed={isComplete}
                      aria-label={`${isComplete ? 'Desmarcar' : 'Marcar como concluído'}: ${checkpoint.name}`}
                      onClick={() => toggleCheckpoint(checkpoint.id)}
                    >
                      {isComplete ? <Check aria-hidden="true" /> : <span>{isNext ? 'Próximo' : index + 1}</span>}
                    </button>
                  </li>
                )
              })}
            </ol>

            <p className="sheet-note"><Check aria-hidden="true" /> Dados demonstrativos — em breve, sincronizados com a sua rota.</p>
          </section>
        </div>
      )}

      {message && <div className="toast" role="status">{message}</div>}
    </main>
  )
}
