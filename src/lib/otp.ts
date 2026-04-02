import bcrypt from "bcryptjs"

const OTP_LENGTH = 6
const OTP_EXPIRY_MINUTES = 10

/**
 * generarCodigoOtp: -> string
 *
 * Devuelve un string numérico aleatorio de exactamente 6 dígitos,
 * rellenando con ceros a la izquierda si el número generado es menor a 100000.
 * Existe para producir los códigos de un solo uso que se envían
 * por email al usuario durante el flujo de autenticación sin contraseña.
 *
 * Ejemplos:
 * generarCodigoOtp().length          === 6
 * /^\d{6}$/.test(generarCodigoOtp()) === true
 * generarCodigoOtp()                 // => ej: "042891" (siempre 6 dígitos numéricos)
 */
export function generarCodigoOtp(): string {
  const max = Math.pow(10, OTP_LENGTH)
  const num = Math.floor(Math.random() * max)
  return num.toString().padStart(OTP_LENGTH, "0")
}

/**
 * hashearCodigoOtp: string -> Promise<string>
 *
 * Dado un código OTP en texto plano, devuelve su hash bcrypt con 10 rondas de sal.
 * Existe para nunca almacenar códigos OTP en texto plano en la base de datos;
 * si la DB es comprometida, los códigos hasheados no son reversibles directamente.
 *
 * Ejemplos:
 * (await hashearCodigoOtp("042891")).startsWith("$2") === true
 * await hashearCodigoOtp("042891") !== "042891"       === true
 * await hashearCodigoOtp("000000") !== "000000"       === true
 */
export async function hashearCodigoOtp(codigo: string): Promise<string> {
  return bcrypt.hash(codigo, 10)
}

/**
 * verificarCodigoOtp: string string -> Promise<boolean>
 *
 * Dado el código ingresado por el usuario y el hash almacenado en la DB,
 * devuelve true si el código es correcto, false en caso contrario.
 * Existe para validar el OTP sin necesidad de desencriptar el hash,
 * completando el flujo de autenticación de forma segura.
 *
 * Ejemplos:
 * await verificarCodigoOtp("042891", await hashearCodigoOtp("042891")) === true
 * await verificarCodigoOtp("999999", await hashearCodigoOtp("042891")) === false
 * await verificarCodigoOtp("000000", await hashearCodigoOtp("000000")) === true
 */
export async function verificarCodigoOtp(codigo: string, hash: string): Promise<boolean> {
  return bcrypt.compare(codigo, hash)
}

/**
 * calcularExpiracionOtp: -> Date
 *
 * Devuelve la fecha exacta en que expirará el OTP,
 * calculada como el momento actual más OTP_EXPIRY_MINUTES (10) minutos.
 * Existe para persistir en la DB cuándo debe dejar de aceptarse el código,
 * impidiendo ataques de replay con códigos viejos interceptados.
 *
 * Ejemplos:
 * calcularExpiracionOtp() > new Date()                           === true
 * calcularExpiracionOtp().getTime() > Date.now()                 === true
 * calcularExpiracionOtp().getTime() - Date.now() <= 10 * 60000   === true
 */
export function calcularExpiracionOtp(): Date {
  const expira = new Date()
  expira.setMinutes(expira.getMinutes() + OTP_EXPIRY_MINUTES)
  return expira
}

/**
 * estaExpirado: Date -> boolean
 *
 * Dada la fecha de expiración almacenada en un registro OTP,
 * devuelve true si esa fecha ya pasó (el código expiró),
 * false si la fecha aún está en el futuro (el código sigue vigente).
 * Existe para rechazar intentos de autenticación con códigos vencidos
 * sin necesidad de lógica adicional en el caller.
 *
 * Ejemplos:
 * estaExpirado(new Date("2020-01-01"))            === true
 * estaExpirado(new Date(Date.now() + 600000))     === false
 * estaExpirado(new Date(Date.now() - 1))          === true
 */
export function estaExpirado(expiraEn: Date | string): boolean {
  return Date.now() > new Date(expiraEn).getTime()
}
