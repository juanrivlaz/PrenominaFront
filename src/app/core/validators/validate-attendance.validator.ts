import { AbstractControl, ValidationErrors, ValidatorFn } from "@angular/forms";

export const ValidateAttendance: ValidatorFn = (group: AbstractControl): ValidationErrors | null => {
  const inputCheckEntry = group.get('checkEntry')?.value;
  const inputCheckOut = group.get('checkOut')?.value;

  if (!inputCheckEntry || !inputCheckOut) {
    return null;
  }

  const checkEntryTime = parseInt(inputCheckEntry.replace(':', ''), 10);
  const checkOutTime = parseInt(inputCheckOut.replace(':', ''), 10);

  if (checkOutTime <= checkEntryTime) {
    group.get('checkOut')?.setErrors({ errorAttendance: true });

    return {
      errorAttendance: true
    };
  }

  return null;
}