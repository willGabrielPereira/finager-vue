import { computed, ref } from 'vue'
import type { ZodType } from 'zod'

/**
 * Ponte entre um schema Zod e a UI de formulário (que hoje mostra um único
 * texto de erro por formulário, em `errorMsg`/`formError`/etc).
 *
 * `validate` roda o schema; se falhar, preenche `errors` (campo -> mensagem) e
 * retorna null. `firstError` dá a mensagem para o banner de erro já existente
 * em cada tela, sem precisar redesenhar os formulários campo a campo.
 */
export function useFormValidation<T>(schema: ZodType<T>) {
  const errors = ref<Record<string, string>>({})

  const clearErrors = () => {
    errors.value = {}
  }

  const validate = (data: unknown): T | null => {
    const result = schema.safeParse(data)
    if (result.success) {
      clearErrors()
      return result.data
    }
    const map: Record<string, string> = {}
    for (const issue of result.error.issues) {
      const path = issue.path.length ? issue.path.join('.') : '_form'
      if (!map[path]) map[path] = issue.message
    }
    errors.value = map
    return null
  }

  const firstError = computed(() => Object.values(errors.value)[0] ?? '')

  return { errors, firstError, validate, clearErrors }
}
