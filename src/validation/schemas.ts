import { z } from 'zod'

/**
 * Estrutura única de validação do frontend (Zod).
 *
 * Objetivo: pegar erros óbvios (campo vazio, senha curta, valor inválido) antes de
 * chamar a API, em vez de esperar o backend responder 400. Isso NUNCA substitui a
 * validação do backend — só evita uma ida e volta de rede para erros previsíveis.
 *
 * Uso típico num componente:
 *   const schema = z.object({ login: usernameSchema, password: requiredText('Informe sua senha.') })
 *   const { validate, firstError } = useFormValidation(schema)
 *   const data = validate({ login: login.value, password: password.value })
 *   if (!data) { errorMsg.value = firstError.value; return }
 */

// ---- Blocos reutilizáveis --------------------------------------------------

export const requiredText = (message: string) => z.string().trim().min(1, message)

export const minLengthText = (min: number, message: string) => z.string().trim().min(min, message)

export const usernameSchema = minLengthText(4, 'O nome de usuário deve conter pelo menos 4 caracteres.')

export const emailSchema = z.string().trim().email('Informe um endereço de e-mail válido.')

// E-mail opcional: vazio passa, mas se preenchido precisa ter formato válido
export const optionalEmailSchema = z.union([z.literal(''), emailSchema])

export const passwordSchema = z.string().min(8, 'A senha deve conter no mínimo 8 caracteres.')

// Campo de valor do CurrencyInput: número positivo (o componente emite '' quando vazio)
export const positiveAmountSchema = z
  .union([z.number(), z.literal(''), z.null()])
  .refine((v): v is number => typeof v === 'number' && v > 0, {
    message: 'Informe um valor válido.',
  })

// ---- Schemas completos (usados em mais de um lugar ou com regras entre campos) --------

export const loginSchema = z.object({
  login: requiredText('Informe seu usuário ou e-mail.'),
  password: requiredText('Informe sua senha.'),
})

export const registerSchema = z
  .object({
    login: usernameSchema,
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'As senhas digitadas não coincidem.',
    path: ['confirmPassword'],
  })

export const profileInfoSchema = z.object({
  login: usernameSchema,
  email: optionalEmailSchema,
})

export const changePasswordSchema = z
  .object({
    currentPassword: requiredText('Preencha a senha atual e a nova senha.'),
    newPassword: minLengthText(8, 'A nova senha deve possuir pelo menos 8 caracteres.'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'A confirmação não confere com a nova senha digitada.',
    path: ['confirmPassword'],
  })
