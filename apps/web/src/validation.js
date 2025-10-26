import { z } from 'zod';
export const emailSchema = z.string().trim().email({ message: 'form.error.email' });
export const passwordSchema = z.string().min(8, { message: 'form.error.passwordWeak' }).regex(/[A-Za-z]/, { message: 'form.error.passwordWeak' }).regex(/[0-9]/, { message: 'form.error.passwordWeak' });
export const required = z.string().min(1, { message: 'form.error.required' });
export function parseZod(schema, data) {
    const result = schema.safeParse(data);
    if (result.success)
        return { success: true, data: result.data };
    const errors = [];
    for (const issue of result.error.issues) {
        const key = issue.path.join('.') || 'root';
        const messageKey = issue.message || 'form.error.required';
        errors.push({ key, messageKey });
    }
    return { success: false, errors };
}
