import { driver, type DriveStep } from 'driver.js'
import 'driver.js/dist/driver.css'
import '../assets/tour.css'
import type { Router } from 'vue-router'
import { nextTick } from 'vue'

export function startInteractiveTour(router?: Router, onComplete?: () => void) {
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768

  // Helper para buscar se o elemento existe no DOM atual com fallback seguro para #app
  const resolveTarget = (preferred: string, fallback?: string): string => {
    if (typeof document === 'undefined') return '#app'
    if (document.querySelector(preferred)) return preferred
    if (fallback && document.querySelector(fallback)) return fallback
    return '#app'
  }

  interface StepDef {
    route: string
    getElement: () => string
    title: string
    description: string
    side: 'top' | 'bottom' | 'right' | 'left'
    align: 'start' | 'center' | 'end'
  }

  const stepsDef: StepDef[] = [
    {
      route: '/',
      getElement: () => resolveTarget('[data-tour="brand"]', '[data-tour="brand-mobile"]'),
      title: 'Bem-vindo ao Finager!',
      description: isMobile
        ? 'Sua plataforma de gestão financeira familiar. Vamos fazer um tour guiado de 1 minuto para você conhecer cada recurso!'
        : 'Sua plataforma inteligente de gestão financeira pessoal e familiar. Vamos fazer um tour guiado de 1 minuto conhecendo cada tela!',
      side: isMobile ? 'bottom' : 'right',
      align: 'center'
    },
    {
      route: '/',
      getElement: () => isMobile 
        ? resolveTarget('[data-tour="kpi-card-primary"]', '[data-tour="kpi-cards"]')
        : resolveTarget('[data-tour="kpi-cards"]'),
      title: 'Painel Geral & Métricas',
      description: 'Aqui você acompanha instantaneamente o fluxo de caixa do mês: receitas confirmadas, despesas abatidas, saldo líquido real e projeção de gastos futuros.',
      side: 'bottom',
      align: 'center'
    },
    {
      route: '/accounts',
      getElement: () => resolveTarget('[data-tour="accounts-header"]', '[data-tour="accounts-new-btn"]'),
      title: 'Contas Bancárias',
      description: 'Nesta tela você cadastra suas contas correntes, cartões e investimentos. Cada conta pode ser compartilhada com a família ou mantida 100% privada.',
      side: isMobile ? 'bottom' : 'bottom',
      align: 'center'
    },
    {
      route: '/',
      getElement: () => resolveTarget(
        isMobile ? '[data-tour="mobile-action-btn"]' : '[data-tour="sidebar-import-btn"]'
      ),
      title: 'A Mágica do Extrato OFX',
      description: 'Segurança absoluta: não pedimos sua senha bancária. Basta baixar o extrato .OFX no seu banco (Nubank, Inter, Itaú, Bradesco, etc.) e importar aqui com 1 clique!',
      side: isMobile ? 'top' : 'right',
      align: 'center'
    },
    {
      route: '/transactions',
      getElement: () => resolveTarget('[data-tour="transactions-header"]'),
      title: 'Extrato & Categorias',
      description: 'Todas as movimentações ficam reunidas aqui com busca instantânea, conciliação e categorização automática inteligente que aprende com você.',
      side: 'bottom',
      align: 'center'
    },
    {
      route: '/profile',
      getElement: () => resolveTarget('[data-tour="profile-family-card"]'),
      title: 'Sua Família & Configurações',
      description: 'Convide quem divide as contas com você (cônjuge, filhos) para gerenciar em conjunto. Aqui você também acessa o Guia de Bancos sempre que precisar!',
      side: isMobile ? 'top' : 'top',
      align: 'center'
    }
  ]

  const steps: DriveStep[] = stepsDef.map(def => ({
    element: def.getElement(),
    popover: {
      title: def.title,
      description: def.description,
      side: def.side,
      align: def.align
    }
  }))

  let completedCalled = false
  const callOnCompleteOnce = () => {
    if (!completedCalled) {
      completedCalled = true
      if (onComplete) onComplete()
    }
  }

  const finishTour = async () => {
    callOnCompleteOnce()
    driverObj.destroy()
    if (router && router.currentRoute.value.path !== '/') {
      await router.push('/')
    }
  }

  const driverObj = driver({
    animate: true,
    smoothScroll: true,
    allowClose: true,
    showProgress: true,
    progressText: 'Passo {{current}} de {{total}}',
    nextBtnText: 'Próximo',
    prevBtnText: 'Anterior',
    doneBtnText: 'Concluir Tour',
    popoverClass: 'finager-tour-theme',
    stagePadding: 6,
    stageRadius: 14,
    overlayColor: '#020617',
    overlayOpacity: 0.4,
    steps,
    onHighlightStarted: (element) => {
      if (element && typeof (element as HTMLElement).scrollIntoView === 'function') {
        (element as HTMLElement).scrollIntoView({ behavior: 'instant', block: 'center', inline: 'nearest' })
      }
    },
    onNextClick: async () => {
      const currentIdx = driverObj.getActiveIndex()
      if (currentIdx === undefined) return

      if (driverObj.isLastStep()) {
        await finishTour()
        return
      }

      const nextIdx = currentIdx + 1
      const nextStep = stepsDef[nextIdx]
      if (!nextStep) return

      if (router && router.currentRoute.value.path !== nextStep.route) {
        await router.push(nextStep.route)
        await nextTick()
        setTimeout(() => {
          steps[nextIdx].element = nextStep.getElement()
          driverObj.drive(nextIdx)
        }, 180)
      } else {
        steps[nextIdx].element = nextStep.getElement()
        driverObj.drive(nextIdx)
      }
    },
    onPrevClick: async () => {
      const currentIdx = driverObj.getActiveIndex()
      if (currentIdx === undefined || driverObj.isFirstStep()) return

      const prevIdx = currentIdx - 1
      const prevStep = stepsDef[prevIdx]
      if (!prevStep) return

      if (router && router.currentRoute.value.path !== prevStep.route) {
        await router.push(prevStep.route)
        await nextTick()
        setTimeout(() => {
          steps[prevIdx].element = prevStep.getElement()
          driverObj.drive(prevIdx)
        }, 180)
      } else {
        steps[prevIdx].element = prevStep.getElement()
        driverObj.drive(prevIdx)
      }
    },
    onDoneClick: async () => {
      console.log('[Tour] Concluído no botão Concluir.')
      await finishTour()
    },
    onCloseClick: async () => {
      console.log('[Tour] Fechado no X pelo usuário.')
      await finishTour()
    },
    onDestroyed: () => {
      console.log('[Tour] Tour finalizado/destruído.')
      callOnCompleteOnce()
    }
  })

  driverObj.drive()
  return driverObj
}
