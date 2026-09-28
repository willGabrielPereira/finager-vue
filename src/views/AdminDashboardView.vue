<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAdminStore, extractErrorMessage, type AdminUser, type AdminInvite, type AdminCoupon } from '../stores/admin'
import { useAuthStore } from '../stores/auth'
import { showAlert, toast } from '../utils/feedback'
import {
  PhShieldCheck,
  PhUsersThree,
  PhTicket,
  PhPercent,
  PhPlus,
  PhCopy,
  PhCheck,
  PhTrash,
  PhCaretLeft,
  PhCaretRight,
  PhWarningCircle,
  PhChartPieSlice,
  PhToggleLeft,
  PhToggleRight
} from '@phosphor-icons/vue'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Doughnut } from 'vue-chartjs'
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  CategoryScale
} from 'chart.js'

ChartJS.register(Title, Tooltip, Legend, ArcElement, CategoryScale)

const adminStore = useAdminStore()
const authStore = useAuthStore()

type TabKey = 'overview' | 'admins' | 'invites' | 'coupons'
const tabs: Array<{ key: TabKey; label: string; icon: any }> = [
  { key: 'overview', label: 'Visão Geral', icon: PhChartPieSlice },
  { key: 'admins', label: 'Administradores', icon: PhShieldCheck },
  { key: 'invites', label: 'Convites', icon: PhTicket },
  { key: 'coupons', label: 'Cupons', icon: PhPercent },
]
const visibleTabs = computed(() => tabs.filter(t => t.key !== 'coupons' || authStore.isAdmin))
const activeTab = ref<TabKey>('overview')

onMounted(async () => {
  const tasks: Promise<any>[] = [
    adminStore.fetchStats(),
    adminStore.fetchActivity(1),
    adminStore.fetchAdmins(),
    adminStore.fetchInvites(),
  ]
  if (authStore.isAdmin) {
    tasks.push(adminStore.fetchCoupons())
  }
  await Promise.all(tasks)
})

// ---------- Visão Geral ----------
const planColors = ['#38bdf8', '#a78bfa', '#34d399', '#fbbf24', '#f472b6', '#64748b']

const chartData = computed(() => {
  const entries = Object.entries(adminStore.stats?.users_by_plan || {})
  return {
    labels: entries.map(([plan]) => plan),
    datasets: [{
      data: entries.map(([, count]) => count),
      backgroundColor: entries.map((_, i) => planColors[i % planColors.length]),
      borderWidth: 2,
      borderColor: '#0f172a',
    }]
  }
})

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'bottom' as const,
      labels: { color: 'rgba(255, 255, 255, 0.7)', font: { size: 11 }, boxWidth: 12, padding: 10 }
    }
  }
}

const activityTotalPages = computed(() => Math.max(1, Math.ceil(adminStore.activity.total / adminStore.activity.limit)))

const goToActivityPage = (page: number) => {
  if (page < 1 || page > activityTotalPages.value) return
  adminStore.fetchActivity(page)
}

const formatDateTime = (value: string | null) => {
  if (!value) return '—'
  return new Date(value).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

const formatDateShort = (value: string | null) => {
  if (!value) return '—'
  return new Date(value).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

// ---------- Administradores ----------
const roleOptions: Array<{ value: 'user' | 'moderator' | 'admin'; label: string }> = [
  { value: 'user', label: 'Usuário' },
  { value: 'moderator', label: 'Moderador' },
  { value: 'admin', label: 'Admin' },
]

const changingRoleId = ref<string | null>(null)

const handleRoleChange = async (admin: AdminUser, role: string) => {
  if (role === admin.role) return
  const confirmed = await showAlert.confirm({
    title: 'Alterar permissão de usuário?',
    text: `O usuário "${admin.login}" passará a ter o papel "${role}". Esta ação afeta o acesso dele ao painel administrativo.`,
    confirmText: 'Confirmar alteração',
    cancelText: 'Cancelar',
    isDestructive: role === 'admin',
  })
  if (!confirmed) return

  changingRoleId.value = admin.id
  try {
    await adminStore.updateUserRole(admin.id, role)
    toast.success('Permissão atualizada com sucesso.')
  } catch (err: any) {
    toast.error('Erro ao atualizar permissão', extractErrorMessage(err, 'Falha ao atualizar permissão.'))
  } finally {
    changingRoleId.value = null
  }
}

// ---------- Convites ----------
const isInviteModalOpen = ref(false)
const inviteDays = ref(7)
const inviteLoading = ref(false)
const inviteError = ref('')
const generatedInvite = ref<{ link: string } | null>(null)

const openInviteModal = () => {
  inviteDays.value = 7
  inviteError.value = ''
  generatedInvite.value = null
  isInviteModalOpen.value = true
}

const handleCreateInvite = async () => {
  inviteError.value = ''
  inviteLoading.value = true
  try {
    const data = await adminStore.createInvite(inviteDays.value || undefined)
    generatedInvite.value = {
      link: `${window.location.origin}/register?invite=${data.token}`
    }
  } catch (err: any) {
    inviteError.value = extractErrorMessage(err, 'Falha ao gerar convite.')
  } finally {
    inviteLoading.value = false
  }
}

const copyInviteLink = async (link: string) => {
  try {
    await navigator.clipboard.writeText(link)
    toast.success('Copiado!')
  } catch {
    toast.error('Não foi possível copiar', 'Selecione o link e copie manualmente.')
  }
}

const inviteStatus = (invite: AdminInvite) => {
  if (invite.used_at) return { label: 'Usado', class: 'bg-white/10 text-white/60 border-white/15' }
  if (new Date(invite.expires_at).getTime() < Date.now()) return { label: 'Expirado', class: 'bg-rose-500/10 text-rose-300 border-rose-500/20' }
  return { label: 'Pendente', class: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' }
}

const handleRevokeInvite = async (invite: AdminInvite) => {
  const confirmed = await showAlert.confirm({
    title: 'Revogar convite?',
    text: 'O link deste convite deixará de funcionar. Esta ação não pode ser desfeita.',
    confirmText: 'Revogar convite',
    cancelText: 'Cancelar',
    isDestructive: true,
  })
  if (!confirmed) return

  try {
    await adminStore.revokeInvite(invite.id)
    toast.success('Convite revogado.')
  } catch (err: any) {
    toast.error('Erro ao revogar convite', extractErrorMessage(err, 'Falha ao revogar convite.'))
  }
}

// ---------- Cupons ----------
const isCouponModalOpen = ref(false)
const couponSubmitting = ref(false)
const couponError = ref('')
const couponForm = ref({
  code: '',
  discount_percent: 10,
  plan_granted: 'PRO' as 'PRO' | 'LIFETIME_FREE',
  max_uses: '' as number | '',
  expires_at: ''
})

const openCouponModal = () => {
  couponForm.value = { code: '', discount_percent: 10, plan_granted: 'PRO', max_uses: '', expires_at: '' }
  couponError.value = ''
  isCouponModalOpen.value = true
}

const handleCreateCoupon = async () => {
  couponError.value = ''
  if (!couponForm.value.code.trim()) {
    couponError.value = 'Informe o código do cupom.'
    return
  }

  couponSubmitting.value = true
  try {
    const payload: { code: string; discount_percent: number; plan_granted: string; max_uses?: number; expires_at?: string } = {
      code: couponForm.value.code.trim().toUpperCase(),
      discount_percent: Number(couponForm.value.discount_percent),
      plan_granted: couponForm.value.plan_granted,
    }
    if (couponForm.value.max_uses !== '') payload.max_uses = Number(couponForm.value.max_uses)
    if (couponForm.value.expires_at) payload.expires_at = couponForm.value.expires_at

    await adminStore.createCoupon(payload)
    toast.success('Cupom criado com sucesso.')
    isCouponModalOpen.value = false
  } catch (err: any) {
    couponError.value = extractErrorMessage(err, 'Falha ao criar cupom.')
  } finally {
    couponSubmitting.value = false
  }
}

const handleToggleCoupon = async (coupon: AdminCoupon) => {
  const wasActive = coupon.active
  try {
    await adminStore.updateCoupon(coupon.id, { active: !wasActive })
    toast.success(wasActive ? 'Cupom desativado.' : 'Cupom ativado.')
  } catch (err: any) {
    toast.error('Erro ao atualizar cupom', extractErrorMessage(err, 'Falha ao atualizar cupom.'))
  }
}
</script>

<template>
  <div class="max-w-5xl mx-auto flex flex-col gap-6">
    <!-- Header -->
    <div>
      <h1 class="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
        <PhShieldCheck :size="26" class="text-accent" weight="duotone" />
        <span>Painel Administrativo</span>
      </h1>
      <p class="text-white/50 text-xs sm:text-sm mt-1">
        Estatísticas de usuários, gestão de permissões, convites e cupons promocionais.
      </p>
    </div>

    <!-- Navegação por Abas -->
    <div class="flex items-center gap-1.5 border-b border-white/5 pb-1 overflow-x-auto">
      <button
        v-for="tab in visibleTabs"
        :key="tab.key"
        type="button"
        @click="activeTab = tab.key"
        class="flex items-center gap-1.5 py-2 px-3.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap"
        :class="activeTab === tab.key
          ? 'bg-accent/15 text-accent border border-accent/30'
          : 'text-white/50 hover:text-white hover:bg-white/5 border border-transparent'"
      >
        <component :is="tab.icon" :size="15" weight="bold" />
        <span>{{ tab.label }}</span>
      </button>
    </div>

    <!-- ==================== VISÃO GERAL ==================== -->
    <div v-if="activeTab === 'overview'" class="flex flex-col gap-5">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card class="p-5 flex items-center gap-3.5 shadow-sm">
          <div class="w-11 h-11 rounded-xl bg-accent/15 border border-accent/30 text-accent flex items-center justify-center">
            <PhUsersThree :size="22" weight="duotone" />
          </div>
          <div>
            <span class="text-[11px] text-white/50 font-medium">Total de Usuários</span>
            <p class="text-2xl font-bold text-white">{{ adminStore.stats?.total_users ?? '—' }}</p>
          </div>
        </Card>

        <Card class="md:col-span-2 p-5 flex flex-col gap-3 min-h-[220px]">
          <h2 class="text-sm font-bold text-white tracking-wide">Usuários por Plano</h2>
          <div class="relative flex-1 min-h-[160px] flex items-center justify-center">
            <div v-if="chartData.labels.length === 0" class="text-xs text-white/50">Sem dados de plano disponíveis.</div>
            <Doughnut v-else :data="chartData" :options="chartOptions" />
          </div>
        </Card>
      </div>

      <Card class="shadow-sm">
        <div class="p-5 pb-3 flex items-center justify-between">
          <h2 class="text-sm font-bold text-white tracking-wide">Atividade de Usuários</h2>
          <span class="text-[11px] text-white/50">{{ adminStore.activity.total }} usuários</span>
        </div>

        <div v-if="adminStore.loading" class="p-8 text-center text-white/50 text-sm">Carregando atividade...</div>
        <div v-else-if="adminStore.activity.items.length === 0" class="p-8 text-center text-white/50 text-sm">Nenhuma atividade registrada.</div>
        <table v-else class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-white/[0.02] text-[11px] font-semibold text-white/50 border-y border-white/5">
              <th class="p-3.5">Login</th>
              <th class="p-3.5">E-mail</th>
              <th class="p-3.5">Último Login</th>
              <th class="p-3.5">Última Transação</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-white/5 text-xs">
            <tr v-for="item in adminStore.activity.items" :key="item.user_id" class="hover:bg-white/[0.03] transition-colors">
              <td class="p-3.5 font-semibold text-white">{{ item.login }}</td>
              <td class="p-3.5 text-white/60">{{ item.email }}</td>
              <td class="p-3.5 text-white/60 whitespace-nowrap">{{ formatDateTime(item.last_login_at) }}</td>
              <td class="p-3.5 text-white/60 whitespace-nowrap">{{ formatDateTime(item.last_transaction_at) }}</td>
            </tr>
          </tbody>
        </table>

        <div v-if="activityTotalPages > 1" class="p-4 border-t border-white/5 flex items-center justify-between text-xs">
          <span class="text-white/50">Página {{ adminStore.activity.page }} de {{ activityTotalPages }}</span>
          <div class="flex gap-2">
            <button
              :disabled="adminStore.activity.page <= 1"
              @click="goToActivityPage(adminStore.activity.page - 1)"
              class="p-2 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 disabled:opacity-40 transition-colors cursor-pointer"
            >
              <PhCaretLeft :size="14" />
            </button>
            <button
              :disabled="adminStore.activity.page >= activityTotalPages"
              @click="goToActivityPage(adminStore.activity.page + 1)"
              class="p-2 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 disabled:opacity-40 transition-colors cursor-pointer"
            >
              <PhCaretRight :size="14" />
            </button>
          </div>
        </div>
      </Card>
    </div>

    <!-- ==================== ADMINISTRADORES ==================== -->
    <div v-else-if="activeTab === 'admins'" class="flex flex-col gap-5">
      <Card class="shadow-sm">
        <div v-if="adminStore.loading" class="p-8 text-center text-white/50 text-sm">Carregando administradores...</div>
        <div v-else-if="adminStore.admins.length === 0" class="p-8 text-center text-white/50 text-sm">Nenhum usuário encontrado.</div>
        <table v-else class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-white/[0.02] text-[11px] font-semibold text-white/50 border-y border-white/5">
              <th class="p-3.5">Login</th>
              <th class="p-3.5">E-mail</th>
              <th class="p-3.5">Permissão</th>
              <th v-if="authStore.isAdmin" class="p-3.5">Alterar Permissão</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-white/5 text-xs">
            <tr v-for="admin in adminStore.admins" :key="admin.id" class="hover:bg-white/[0.03] transition-colors">
              <td class="p-3.5 font-semibold text-white">{{ admin.login }}</td>
              <td class="p-3.5 text-white/60">{{ admin.email }}</td>
              <td class="p-3.5">
                <Badge variant="outline" class="capitalize">{{ admin.role }}</Badge>
              </td>
              <td v-if="authStore.isAdmin" class="p-3.5">
                <div class="flex items-center gap-1">
                  <button
                    v-for="opt in roleOptions"
                    :key="opt.value"
                    type="button"
                    :disabled="changingRoleId === admin.id"
                    @click="handleRoleChange(admin, opt.value)"
                    class="py-1.5 px-2.5 rounded-lg text-[11px] font-semibold border transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                    :class="admin.role === opt.value
                      ? 'bg-accent/20 border-accent text-white'
                      : 'bg-bg/60 border-white/5 text-white/60 hover:bg-white/5 hover:text-white'"
                  >
                    {{ opt.label }}
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </Card>
    </div>

    <!-- ==================== CONVITES ==================== -->
    <div v-else-if="activeTab === 'invites'" class="flex flex-col gap-5">
      <div class="flex justify-end">
        <Button size="sm" @click="openInviteModal" class="gap-2 font-bold shadow-lg shadow-accent/20">
          <PhPlus :size="16" weight="bold" />
          <span>Gerar Convite</span>
        </Button>
      </div>

      <Card class="shadow-sm">
        <div v-if="adminStore.loading" class="p-8 text-center text-white/50 text-sm">Carregando convites...</div>
        <div v-else-if="adminStore.invites.length === 0" class="p-8 text-center text-white/50 text-sm">Nenhum convite gerado.</div>
        <table v-else class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-white/[0.02] text-[11px] font-semibold text-white/50 border-y border-white/5">
              <th class="p-3.5">Status</th>
              <th class="p-3.5">Plano Concedido</th>
              <th class="p-3.5">Expira em</th>
              <th class="p-3.5 text-center">Ações</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-white/5 text-xs">
            <tr v-for="invite in adminStore.invites" :key="invite.id" class="hover:bg-white/[0.03] transition-colors">
              <td class="p-3.5">
                <Badge variant="outline" :class="inviteStatus(invite).class">{{ inviteStatus(invite).label }}</Badge>
              </td>
              <td class="p-3.5 text-white/60">{{ invite.plan_granted || '—' }}</td>
              <td class="p-3.5 text-white/60 whitespace-nowrap">{{ formatDateTime(invite.expires_at) }}</td>
              <td class="p-3.5 text-center">
                <button
                  v-if="!invite.used_at && inviteStatus(invite).label === 'Pendente'"
                  type="button"
                  @click="handleRevokeInvite(invite)"
                  class="p-2 rounded-lg text-rose-400/80 hover:text-rose-300 hover:bg-rose-500/10 transition-all cursor-pointer"
                  title="Revogar convite"
                  aria-label="Revogar convite"
                >
                  <PhTrash :size="15" />
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </Card>

      <!-- Modal Gerar Convite -->
      <Dialog v-model:open="isInviteModalOpen">
        <DialogContent class="sm:max-w-md">
          <DialogHeader>
            <DialogTitle class="flex items-center gap-2 text-sm font-bold text-white">
              <PhTicket :size="18" class="text-accent" />
              <span>Gerar Convite de Cadastro</span>
            </DialogTitle>
          </DialogHeader>

          <div v-if="!generatedInvite" class="flex flex-col gap-4">
            <div>
              <label for="invite-days" class="text-xs font-semibold text-white/80 mb-1.5 block">Validade (dias)</label>
              <Input id="invite-days" v-model.number="inviteDays" type="number" min="1" placeholder="7" />
            </div>

            <div v-if="inviteError" class="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
              <PhWarningCircle :size="15" />
              <span>{{ inviteError }}</span>
            </div>

            <div class="flex items-center justify-end gap-2 pt-2">
              <Button type="button" variant="outline" size="sm" @click="isInviteModalOpen = false">Cancelar</Button>
              <Button type="button" size="sm" :disabled="inviteLoading" @click="handleCreateInvite" class="gap-1.5 font-bold">
                <PhCheck :size="14" weight="bold" />
                <span>{{ inviteLoading ? 'Gerando...' : 'Gerar Convite' }}</span>
              </Button>
            </div>
          </div>

          <div v-else class="flex flex-col gap-4">
            <div class="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-2.5 text-emerald-400 text-xs">
              <PhCheck :size="18" weight="fill" />
              <span>Convite gerado com sucesso!</span>
            </div>

            <div>
              <label for="admin-invite-link" class="text-xs font-semibold text-white/80 mb-1.5 block">Link de convite</label>
              <div class="flex flex-wrap items-center gap-2">
                <Input id="admin-invite-link" :value="generatedInvite.link" readonly class="flex-1 min-w-0 font-mono text-xs truncate" />
                <Button type="button" size="sm" @click="copyInviteLink(generatedInvite.link)" class="gap-1.5 font-bold shadow-md shadow-accent/15">
                  <PhCopy :size="14" weight="bold" />
                  <span>Copiar</span>
                </Button>
              </div>
            </div>

            <div class="flex justify-end pt-1">
              <Button type="button" variant="secondary" size="sm" @click="isInviteModalOpen = false">Concluir</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>

    <!-- ==================== CUPONS ==================== -->
    <div v-else-if="activeTab === 'coupons' && authStore.isAdmin" class="flex flex-col gap-5">
      <div class="flex justify-end">
        <Button size="sm" @click="openCouponModal" class="gap-2 font-bold shadow-lg shadow-accent/20">
          <PhPlus :size="16" weight="bold" />
          <span>Criar Cupom</span>
        </Button>
      </div>

      <Card class="shadow-sm">
        <div v-if="adminStore.loading" class="p-8 text-center text-white/50 text-sm">Carregando cupons...</div>
        <div v-else-if="adminStore.coupons.length === 0" class="p-8 text-center text-white/50 text-sm">Nenhum cupom cadastrado.</div>
        <table v-else class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-white/[0.02] text-[11px] font-semibold text-white/50 border-y border-white/5">
              <th class="p-3.5">Código</th>
              <th class="p-3.5">Desconto</th>
              <th class="p-3.5">Plano</th>
              <th class="p-3.5">Usos</th>
              <th class="p-3.5">Expira em</th>
              <th class="p-3.5 text-center">Ativo</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-white/5 text-xs">
            <tr v-for="coupon in adminStore.coupons" :key="coupon.id" class="hover:bg-white/[0.03] transition-colors">
              <td class="p-3.5 font-mono font-semibold text-white">{{ coupon.code }}</td>
              <td class="p-3.5 text-white/60">{{ coupon.discount_percent }}%</td>
              <td class="p-3.5 text-white/60">{{ coupon.plan_granted }}</td>
              <td class="p-3.5 text-white/60">{{ coupon.times_used }}{{ coupon.max_uses ? ` / ${coupon.max_uses}` : '' }}</td>
              <td class="p-3.5 text-white/60 whitespace-nowrap">{{ formatDateShort(coupon.expires_at) }}</td>
              <td class="p-3.5 text-center">
                <button
                  type="button"
                  @click="handleToggleCoupon(coupon)"
                  class="p-1.5 rounded-lg transition-all cursor-pointer"
                  :class="coupon.active ? 'text-emerald-400 hover:bg-emerald-500/10' : 'text-white/30 hover:bg-white/5'"
                  :title="coupon.active ? 'Desativar cupom' : 'Ativar cupom'"
                >
                  <PhToggleRight v-if="coupon.active" :size="24" weight="fill" />
                  <PhToggleLeft v-else :size="24" />
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </Card>

      <!-- Modal Criar Cupom -->
      <Dialog v-model:open="isCouponModalOpen">
        <DialogContent class="sm:max-w-md">
          <DialogHeader>
            <DialogTitle class="flex items-center gap-2 text-sm font-bold text-white">
              <PhPercent :size="18" class="text-accent" />
              <span>Criar Cupom Promocional</span>
            </DialogTitle>
          </DialogHeader>

          <form @submit.prevent="handleCreateCoupon" class="flex flex-col gap-4">
            <div>
              <label for="coupon-code" class="text-xs font-semibold text-white/80 mb-1.5 block">Código</label>
              <Input id="coupon-code" v-model="couponForm.code" type="text" placeholder="ex: PROMO2026" required />
            </div>

            <div>
              <label for="coupon-discount" class="text-xs font-semibold text-white/80 mb-1.5 block">Desconto (%)</label>
              <Input id="coupon-discount" v-model.number="couponForm.discount_percent" type="number" min="1" max="100" required />
            </div>

            <div>
              <label class="text-xs font-semibold text-white/80 mb-1.5 block">Plano Concedido</label>
              <div class="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  @click="couponForm.plan_granted = 'PRO'"
                  class="p-2.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer"
                  :class="couponForm.plan_granted === 'PRO' ? 'bg-accent/20 border-accent text-white' : 'bg-bg/60 border-white/5 text-white/60 hover:bg-white/5'"
                >
                  PRO
                </button>
                <button
                  type="button"
                  @click="couponForm.plan_granted = 'LIFETIME_FREE'"
                  class="p-2.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer"
                  :class="couponForm.plan_granted === 'LIFETIME_FREE' ? 'bg-accent/20 border-accent text-white' : 'bg-bg/60 border-white/5 text-white/60 hover:bg-white/5'"
                >
                  LIFETIME_FREE
                </button>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label for="coupon-max-uses" class="text-xs font-semibold text-white/80 mb-1.5 block">Limite de usos</label>
                <Input id="coupon-max-uses" v-model.number="couponForm.max_uses" type="number" min="1" placeholder="Ilimitado" />
              </div>
              <div>
                <label for="coupon-expires-at" class="text-xs font-semibold text-white/80 mb-1.5 block">Expiração</label>
                <Input id="coupon-expires-at" v-model="couponForm.expires_at" type="date" />
              </div>
            </div>

            <div v-if="couponError" class="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
              <PhWarningCircle :size="15" />
              <span>{{ couponError }}</span>
            </div>

            <div class="flex items-center justify-end gap-2 pt-2">
              <Button type="button" variant="outline" size="sm" @click="isCouponModalOpen = false">Cancelar</Button>
              <Button type="submit" size="sm" :disabled="couponSubmitting" class="gap-1.5 font-bold">
                <PhCheck :size="14" weight="bold" />
                <span>{{ couponSubmitting ? 'Salvando...' : 'Criar Cupom' }}</span>
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  </div>
</template>
