import { AbstractControl, ValidationErrors, ValidatorFn } from "@angular/forms";

export function requiredIf(otherControlName: string): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
        const parent = control.parent;
        const value = control.value;

        if (!parent) {
            return null;
        }

        const otherControl = parent.get(otherControlName);

        if (!otherControl) {
            return null;
        }

        return otherControl.value && !value ? { required: true } : null;
    }
}