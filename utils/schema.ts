// utils/schema.ts
import Ajv, { type ErrorObject } from 'ajv'

export interface SchemaValidationResult {
  valid: boolean
  errors: string[]
}

/** Validates a parsed JSON value against a JSON Schema given as raw text. */
export function validateAgainstSchema(data: unknown, schemaText: string): SchemaValidationResult {
  let schema: unknown
  try {
    schema = JSON.parse(schemaText)
  } catch (err) {
    return {
      valid: false,
      errors: [`Schema is not valid JSON: ${err instanceof Error ? err.message : String(err)}`],
    }
  }

  const ajv = new Ajv({ allErrors: true, strict: false })
  let validateFn
  try {
    validateFn = ajv.compile(schema as Record<string, unknown>)
  } catch (err) {
    return {
      valid: false,
      errors: [`Schema compile error: ${err instanceof Error ? err.message : String(err)}`],
    }
  }

  const valid = validateFn(data) as boolean
  if (valid) return { valid: true, errors: [] }

  const errors = (validateFn.errors ?? []).map(
    (e: ErrorObject) => `${e.instancePath || '/'} ${e.message ?? 'is invalid'}`
  )
  return { valid: false, errors }
}
