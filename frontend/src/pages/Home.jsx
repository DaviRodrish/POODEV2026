import { Link } from 'react-router-dom';

// Ajuste aqui se a rota da agência no seu router for diferente
const ROTA_CADASTRO_AGENCIA = '/cadastro-agencia';

/**
 * Cena ilustrada que ocupa o lado direito do hero.
 * Sem caixas: a ilustração "sangra" até a borda da tela e termina na estrada.
 * Para usar uma foto real, troque <CenaCidade /> por <img src="..." className="..." />.
 */
function CenaCidade() {
  return (
    <svg
      viewBox="0 0 800 520"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-auto block"
      role="img"
      aria-label="Cidade com um carro em uma estrada ao entardecer"
      preserveAspectRatio="xMidYMax slice"
    >
      <defs>
        <linearGradient id="sol" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fde9c8" />
          <stop offset="1" stopColor="#fde9c8" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="chao" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#d3e4f5" />
          <stop offset="1" stopColor="#c2d9ef" />
        </linearGradient>
      </defs>

      {/* Sol suave */}
      <circle cx="610" cy="150" r="120" fill="url(#sol)" />
      <circle cx="610" cy="150" r="52" fill="#fbd9a0" />

      {/* Prédios ao fundo */}
      <g fill="#dbe8f6">
        <rect x="30" y="250" width="70" height="170" rx="6" />
        <rect x="110" y="200" width="60" height="220" rx="6" />
        <rect x="560" y="230" width="80" height="190" rx="6" />
        <rect x="650" y="270" width="70" height="150" rx="6" />
        <rect x="730" y="210" width="70" height="210" rx="6" />
      </g>

      {/* Prédios da frente */}
      <g fill="#b9d3ee">
        <rect x="170" y="290" width="90" height="130" rx="8" />
        <rect x="270" y="240" width="76" height="180" rx="8" />
        <rect x="440" y="270" width="100" height="150" rx="8" />
      </g>
      <g fill="#ffffff" opacity="0.85">
        <rect x="184" y="306" width="12" height="12" rx="2" />
        <rect x="206" y="306" width="12" height="12" rx="2" />
        <rect x="228" y="306" width="12" height="12" rx="2" />
        <rect x="184" y="332" width="12" height="12" rx="2" />
        <rect x="228" y="332" width="12" height="12" rx="2" />
        <rect x="284" y="260" width="12" height="12" rx="2" />
        <rect x="308" y="260" width="12" height="12" rx="2" />
        <rect x="284" y="286" width="12" height="12" rx="2" />
        <rect x="308" y="312" width="12" height="12" rx="2" />
        <rect x="456" y="288" width="12" height="12" rx="2" />
        <rect x="482" y="288" width="12" height="12" rx="2" />
        <rect x="508" y="288" width="12" height="12" rx="2" />
        <rect x="482" y="314" width="12" height="12" rx="2" />
      </g>

      {/* Chão e estrada */}
      <rect x="0" y="410" width="800" height="110" fill="url(#chao)" />
      <rect x="0" y="440" width="800" height="80" fill="#334155" />
      <line x1="0" y1="480" x2="800" y2="480" stroke="#f8fafc" strokeWidth="4" strokeDasharray="34 26" opacity="0.9" />

      {/* Carro */}
      <g>
        <ellipse cx="400" cy="446" rx="92" ry="8" fill="#0f172a" opacity="0.25" />
        <path
          d="M310 430C310 418 318 410 330 408L352 372C358 362 366 358 378 358H430C442 358 452 362 460 372L478 404C490 408 496 416 496 428V436H310Z"
          fill="#0066cc"
        />
        <path d="M362 376H404V404H346Z" fill="#e6f0fa" />
        <path d="M414 376H440C444 376 447 378 449 381L462 404H414Z" fill="#e6f0fa" />
        <rect x="484" y="418" width="14" height="8" rx="3" fill="#fde9c8" />
        <circle cx="352" cy="438" r="18" fill="#1e293b" />
        <circle cx="352" cy="438" r="7" fill="#cbd5e1" />
        <circle cx="456" cy="438" r="18" fill="#1e293b" />
        <circle cx="456" cy="438" r="7" fill="#cbd5e1" />
      </g>
    </svg>
  );
}

function Pino({ className = '', titulo, texto }) {
  return (
    <div
      className={`self-start bg-white/90 backdrop-blur rounded-full pl-3 pr-5 py-2.5 shadow-[0_8px_24px_-8px_rgba(15,23,42,0.25)] flex items-center gap-3 ${className}`}
    >
      <span className="h-8 w-8 rounded-full bg-[#e6f0fa] grid place-items-center">
        <span className="h-2.5 w-2.5 rounded-full bg-[#0066cc]" />
      </span>
      <span className="leading-tight">
        <span className="block text-sm font-semibold text-slate-900">{titulo}</span>
        <span className="block text-xs text-slate-500">{texto}</span>
      </span>
    </div>
  );
}

export function Home() {
  return (
    <div className="min-h-screen flex flex-col font-sans text-slate-900 bg-gradient-to-b from-[#e3eefa] via-[#f0f5fb] to-[#f4f6f9]">
      {/* Cabeçalho destacado: logo na extrema esquerda, menu na extrema direita */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-slate-200 shadow-[0_6px_20px_-12px_rgba(15,23,42,0.25)]">
        <div className="w-full px-5 sm:px-8 lg:px-12 py-4 flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="h-3 w-3 rounded-full bg-[#0066cc]" />
            <span className="text-xl font-bold tracking-tight">POODEV</span>
          </Link>

          <nav className="flex items-center gap-4 sm:gap-7 text-sm">
            <Link to="/login" className="text-slate-700 hover:text-slate-950 font-medium transition">
              Entrar
            </Link>
            <Link
              to="/cadastro"
              className="bg-[#0066cc] hover:bg-[#0052a3] text-white font-semibold px-5 py-2.5 rounded-full transition"
            >
              Criar conta
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col">
        <section className="relative flex-1 overflow-hidden">
          <div className="max-w-6xl mx-auto px-6 pt-6 pb-8 lg:pt-20 lg:pb-28 relative z-10">
            <div className="lg:w-[46%] space-y-6">
              <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-slate-950 leading-[1.1]">
                Um espaço direto para motoristas e agências operarem juntos.
              </h1>

              <p className="text-base sm:text-lg text-slate-600 max-w-md leading-relaxed">
                Entre com sua conta ou abra um novo perfil para organizar locações, cadastros e
                rotinas do dia a dia com clareza.
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Link
                  to="/login"
                  className="bg-[#0066cc] hover:bg-[#0052a3] text-white font-semibold px-6 py-3 rounded-full transition shadow-[0_10px_24px_-10px_rgba(0,102,204,0.7)]"
                >
                  Entrar na conta
                </Link>
                <Link
                  to="/cadastro"
                  className="bg-white/70 hover:bg-white text-slate-800 font-semibold px-6 py-3 rounded-full transition"
                >
                  Cadastrar
                </Link>
              </div>
              <Link
                to={ROTA_CADASTRO_AGENCIA}
                className="inline-block text-sm font-semibold text-[#0066cc] hover:underline"
              >
               
              </Link>
            </div>
          </div>

          {/* Cena: ocupa o lado direito no desktop e fica abaixo do texto no mobile */}
          <div className="relative lg:absolute lg:right-0 lg:bottom-0 lg:w-[58%] mt-4 lg:mt-0">
            <div className="[mask-image:linear-gradient(to_right,transparent,black_22%)]">
              <CenaCidade />
            </div>
            {/* Pílulas agrupadas e próximas, uma levemente deslocada da outra */}
            <div className="absolute top-[6%] left-[10%] sm:left-[22%] flex flex-col gap-3">
              <Pino titulo="Motorista" texto="Perfil e histórico da conta" />
              <Pino className="ml-10" titulo="Agência" texto="Gestão operacional da conta" />
            </div>
          </div>
        </section>

        {/* Faixa inferior tingida: quebra o branco sem criar caixas */}
        <section className="bg-[#dcebf9]">
          <div className="max-w-6xl mx-auto px-6 py-6 grid sm:grid-cols-2 gap-4 sm:gap-0 sm:divide-x divide-[#b9d3ee]">
            <p className="text-sm text-slate-700 sm:pr-8">
              <span className="font-semibold text-slate-950">Motoristas</span> acompanham perfil e
              histórico em um só lugar.
            </p>
            <p className="text-sm text-slate-700 sm:pl-8">
              <span className="font-semibold text-slate-950">Agências</span> gerenciam a operação da
              conta no dia a dia.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}

export default Home;