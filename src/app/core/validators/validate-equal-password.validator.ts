import { AbstractControl, ValidationErrors, ValidatorFn } from "@angular/forms";

export const ValidateEqualPassword: ValidatorFn = (group: AbstractControl): ValidationErrors | null => {
    const inputPassword = group.get('password')?.value;
    const inputConfirmPassword = group.get('confirmPassword')?.value;

    if (!inputPassword || !inputConfirmPassword) {
        return null;
    }

    if (inputPassword !== inputConfirmPassword) {

        group.get('confirmPassword')?.setErrors({ errorEqualPassword: true });

        return {
            errorEqualPassword: true
        };
    }

    return null;
};