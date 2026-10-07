<script setup lang="ts">
import { computed, ref } from 'vue'
import { CalendarDate, getLocalTimeZone, parseDate, today, type DateValue } from '@internationalized/date'
import {
  RangeCalendarRoot,
  RangeCalendarCell,
  RangeCalendarCellTrigger,
  RangeCalendarGrid,
  RangeCalendarGridBody,
  RangeCalendarGridHead,
  RangeCalendarGridRow,
  RangeCalendarHeadCell,
  RangeCalendarHeader,
  RangeCalendarHeading,
  RangeCalendarNext,
  RangeCalendarPrev,
} from 'radix-vue'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'
import { PhCalendarBlank, PhCaretDown, PhCaretLeft, PhCaretRight } from '@phosphor-icons/vue'
import { cn } from '@/lib/utils'

const props = withDefaults(defineProps<{ from?: string; to?: string; class?: string }>(), {
  from: '',
  to: '',
})

const emit = defineEmits<{
  (e: 'change', val: { from: string; to: string }): void
}>()

const isOpen = ref(false)

const iso = (d: DateValue) =>
  `${d.year}-${String(d.month).padStart(2, '0')}-${String(d.day).padStart(2, '0')}`

const fmt = (s: string) => s.split('-').reverse().join('/')

// Atalhos: datas locais (sem toISOString, que usa UTC)
const presets = computed(() => {
  const t = today(getLocalTimeZone())
  const monthStart = new CalendarDate(t.year, t.month, 1)
  const prev = monthStart.subtract({ months: 1 })
  return [
    { label: 'Mês atual', from: iso(monthStart), to: iso(monthStart.add({ months: 1 }).subtract({ days: 1 })) },
    { label: 'Mês anterior', from: iso(prev), to: iso(monthStart.subtract({ days: 1 })) },
    { label: 'Últimos 30 dias', from: iso(t.subtract({ days: 30 })), to: iso(t) },
    { label: 'Este ano', from: `${t.year}-01-01`, to: `${t.year}-12-31` },
    { label: 'Todo o histórico', from: '', to: '' },
  ]
})

const activePreset = computed(() => presets.value.find((p) => p.from === props.from && p.to === props.to))

const hasValue = computed(() => Boolean(props.from || props.to))

const displayLabel = computed(() => {
  if (activePreset.value) return activePreset.value.label
  if (props.from && props.to) return `${fmt(props.from)} – ${fmt(props.to)}`
  if (props.from) return `A partir de ${fmt(props.from)}`
  return `Até ${fmt(props.to)}`
})

const safeParse = (s: string) => {
  try {
    return s ? parseDate(s) : undefined
  } catch {
    return undefined
  }
}

const rangeValue = computed(() => ({ start: safeParse(props.from), end: safeParse(props.to) }))

const choose = (from: string, to: string) => {
  emit('change', { from, to })
  isOpen.value = false
}

// O radix emite a faixa parcial após o 1º clique; só aplica quando início e fim existem
const onRange = (r: { start?: DateValue; end?: DateValue }) => {
  if (r.start && r.end) choose(iso(r.start), iso(r.end))
}
</script>

<template>
  <Popover v-model:open="isOpen">
    <PopoverTrigger as-child>
      <button
        type="button"
        :class="
          cn(
            'flex items-center gap-2 px-3 h-9 rounded-xl text-xs font-medium border transition-all duration-200 cursor-pointer whitespace-nowrap shrink-0 w-full sm:w-auto',
            hasValue
              ? 'bg-accent/15 border-accent/50 text-accent'
              : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10',
            props.class
          )
        "
      >
        <PhCalendarBlank :size="15" />
        <span>{{ hasValue ? displayLabel : 'Período' }}</span>
        <PhCaretDown :size="12" class="opacity-60 ml-auto" />
      </button>
    </PopoverTrigger>

    <PopoverContent align="start" :side-offset="6" class="w-auto max-w-[calc(100vw-1rem)] p-0 rounded-2xl border-white/10 bg-surface shadow-2xl shadow-black/80">
      <div class="flex flex-col sm:flex-row">
        <div class="flex sm:flex-col gap-1 p-2 overflow-x-auto sm:overflow-visible border-b sm:border-b-0 sm:border-r border-white/10">
          <button
            v-for="p in presets"
            :key="p.label"
            type="button"
            class="px-3 py-1.5 rounded-lg text-xs text-left whitespace-nowrap transition-colors cursor-pointer"
            :class="activePreset?.label === p.label ? 'bg-accent/20 text-accent font-semibold' : 'text-white/70 hover:bg-white/5 hover:text-white'"
            @click="choose(p.from, p.to)"
          >
            {{ p.label }}
          </button>
        </div>

        <RangeCalendarRoot
          v-slot="{ grid, weekDays }"
          class="p-3"
          locale="pt-BR"
          weekday-format="short"
          :model-value="rangeValue"
          @update:model-value="onRange"
        >
          <RangeCalendarHeader class="flex items-center justify-between mb-3">
            <RangeCalendarPrev
              class="inline-flex items-center justify-center w-7 h-7 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <PhCaretLeft :size="14" weight="bold" />
            </RangeCalendarPrev>
            <RangeCalendarHeading class="text-sm font-semibold text-white capitalize" />
            <RangeCalendarNext
              class="inline-flex items-center justify-center w-7 h-7 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <PhCaretRight :size="14" weight="bold" />
            </RangeCalendarNext>
          </RangeCalendarHeader>

          <RangeCalendarGrid v-for="month in grid" :key="month.value.toString()" class="w-full border-collapse select-none">
            <RangeCalendarGridHead>
              <RangeCalendarGridRow class="flex w-full">
                <RangeCalendarHeadCell
                  v-for="day in weekDays"
                  :key="day"
                  class="flex-1 text-center text-[10px] font-semibold uppercase tracking-wide text-white/50 pb-2"
                >
                  {{ day }}
                </RangeCalendarHeadCell>
              </RangeCalendarGridRow>
            </RangeCalendarGridHead>
            <RangeCalendarGridBody>
              <RangeCalendarGridRow v-for="(weekDates, index) in month.rows" :key="`weekDate-${index}`" class="flex w-full mt-1">
                <RangeCalendarCell
                  v-for="weekDate in weekDates"
                  :key="weekDate.toString()"
                  :date="weekDate"
                  class="flex-1 text-center"
                >
                  <RangeCalendarCellTrigger
                    :day="weekDate"
                    :month="month.value"
                    class="inline-flex items-center justify-center w-8 h-8 rounded-lg text-xs text-white/80 transition-colors cursor-pointer hover:bg-white/10 data-[today]:border data-[today]:border-accent/50 data-[today]:text-accent data-[selected]:bg-accent/25 data-[selected]:text-white data-[selection-start]:bg-accent data-[selection-start]:!text-bg data-[selection-start]:font-bold data-[selection-end]:bg-accent data-[selection-end]:!text-bg data-[selection-end]:font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 data-[outside-view]:text-white/20 data-[disabled]:opacity-30 data-[disabled]:cursor-not-allowed"
                  />
                </RangeCalendarCell>
              </RangeCalendarGridRow>
            </RangeCalendarGridBody>
          </RangeCalendarGrid>
        </RangeCalendarRoot>
      </div>
    </PopoverContent>
  </Popover>
</template>
