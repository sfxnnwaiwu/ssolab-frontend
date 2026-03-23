import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/**
 * Password strength validator
 * Requires: min 8 chars, uppercase, lowercase, digit, special char
 */
export function passwordStrengthValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
        const value = control.value;

        if (!value) {
            return null;
        }

        const errors: ValidationErrors = {};

        if (value.length < 8) {
            errors['minLength'] = { requiredLength: 8, actualLength: value.length };
        }

        if (!/[A-Z]/.test(value)) {
            errors['uppercase'] = true;
        }

        if (!/[a-z]/.test(value)) {
            errors['lowercase'] = true;
        }

        if (!/\d/.test(value)) {
            errors['number'] = true;
        }

        if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(value)) {
            errors['special'] = true;
        }

        return Object.keys(errors).length > 0 ? errors : null;
    };
}

/**
 * Password match validator
 * Compares password and confirmPassword fields
 */
export function passwordMatchValidator(
    passwordFieldName = 'newPassword',
    confirmFieldName = 'confirmPassword'
): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
        if (!control.get(passwordFieldName) || !control.get(confirmFieldName)) {
            return null;
        }

        const password = control.get(passwordFieldName)?.value;
        const confirmPassword = control.get(confirmFieldName)?.value;

        if (!password || !confirmPassword) {
            return null;
        }

        return password === confirmPassword ? null : { passwordMismatch: true };
    };
}

/**
 * Get password strength error messages
 */
export function getPasswordStrengthErrors(control: AbstractControl): string[] {
    const errors: string[] = [];

    if (control.hasError('minLength')) {
        errors.push('Password must be at least 8 characters long');
    }

    if (control.hasError('uppercase')) {
        errors.push('Password must contain at least one uppercase letter');
    }

    if (control.hasError('lowercase')) {
        errors.push('Password must contain at least one lowercase letter');
    }

    if (control.hasError('number')) {
        errors.push('Password must contain at least one digit');
    }

    if (control.hasError('special')) {
        errors.push('Password must contain at least one special character (!@#$%^&*)');
    }

    return errors;
}
