<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import {
  CalendarRoot,
  CalendarCell,
  CalendarCellTrigger,
  CalendarGrid,
  CalendarGridBody,
  CalendarGridHead,
  CalendarGridRow,
  CalendarHeadCell,
  CalendarHeader,
  CalendarHeading,
  CalendarNext,
  CalendarPrev,
  type CalendarRootEmits,
  type CalendarRootProps,
  useForwardPropsEmits,
} from 'radix-vue'
import { computed } from 'vue'
import { PhCaretLeft, PhCaretRight } from '@phosphor-icons/vue'
import { cn } from '@/lib/utils'

const props = withDefaults(defineProps<CalendarRootProps & { class?: HTMLAttributes['class'] }>(), {
  weekdayFormat: 'short',
})
const emits = defineEmits<CalendarRootEmits>()

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props
  return delegated
})

const forwarded = useForwardPropsEmits(delegatedProps, emits)
</script>

<template>
  <CalendarRoot
    v-slot="{ grid, weekDays }"
    :class="cn('p-3', props.class)"
    v-bind="forwarded"
  >
    <CalendarHeader class="flex items-center justify-between mb-3">
      <CalendarPrev
        class="inline-flex items-center justify-center w-7 h-7 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <PhCaretLeft :size="14" weight="bold" />
      </CalendarPrev>
      <CalendarHeading class="text-sm font-semibold text-white capitalize" />
      <CalendarNext
        class="inline-flex items-center justify-center w-7 h-7 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <PhCaretRight :size="14" weight="bold" />
      </CalendarNext>
    </CalendarHeader>

    <CalendarGrid v-for="month in grid" :key="month.value.toString()" class="w-full border-collapse select-none">
      <CalendarGridHead>
        <CalendarGridRow class="flex w-full">
          <CalendarHeadCell
            v-for="day in weekDays"
            :key="day"
            class="flex-1 text-center text-[10px] font-semibold uppercase tracking-wide text-white/40 pb-2"
          >
            {{ day }}
          </CalendarHeadCell>
        </CalendarGridRow>
      </CalendarGridHead>
      <CalendarGridBody>
        <CalendarGridRow v-for="(weekDates, index) in month.rows" :key="`weekDate-${index}`" class="flex w-full mt-1">
          <CalendarCell
            v-for="weekDate in weekDates"
            :key="weekDate.toString()"
            :date="weekDate"
            class="flex-1 text-center"
          >
            <CalendarCellTrigger
              :day="weekDate"
              :month="month.value"
              class="inline-flex items-center justify-center w-8 h-8 rounded-lg text-xs text-white/80 transition-colors cursor-pointer hover:bg-white/10 data-[today]:border data-[today]:border-accent/50 data-[today]:text-accent data-[selected]:bg-accent data-[selected]:text-bg data-[selected]:font-bold data-[selected]:hover:bg-accent data-[outside-view]:text-white/20 data-[disabled]:opacity-30 data-[disabled]:cursor-not-allowed data-[unavailable]:text-red-400 data-[unavailable]:line-through"
            />
          </CalendarCell>
        </CalendarGridRow>
      </CalendarGridBody>
    </CalendarGrid>
  </CalendarRoot>
</template>
