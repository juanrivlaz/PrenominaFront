import { AbstractControl, ValidationErrors, ValidatorFn } from "@angular/forms";

/**
 * Valida la coherencia entre hora de entrada y salida.
 * @param isNightShiftHint Señal afirmativa de turno nocturno. Cuando es true, basta con que la salida
 *   sea numéricamente menor que la entrada para aceptarla. Cuando es false/undefined se infiere por
 *   heurística: entrada >= 12:00 y salida numéricamente menor (o exactamente 00:00 = fin de jornada).
 */
export function createAttendanceValidator(isNightShiftHint?: boolean): ValidatorFn {
  return (group: AbstractControl): ValidationErrors | null => {
    const inputCheckEntry = group.get('checkEntry')?.value;
    const inputCheckOut = group.get('checkOut')?.value;

    if (!inputCheckEntry || !inputCheckOut) {
      return null;
    }

    const checkEntryTime = parseInt(inputCheckEntry.replace(':', ''), 10);
    const rawCheckOutTime = parseInt(inputCheckOut.replace(':', ''), 10);
    // 00:00 representa fin de jornada (medianoche del día siguiente), no inicio del día.
    const checkOutTime = rawCheckOutTime === 0 ? 2400 : rawCheckOutTime;

    // Aceptar turno nocturno si:
    // (a) el backend lo marca explícitamente, o
    // (b) la heurística lo sugiere (entrada desde mediodía y salida numéricamente menor o medianoche).
    // Nunca usamos isNightShiftHint=false para bloquear la heurística: un empleado sin horario
    // nocturno registrado todavía puede tener una jornada que cruza medianoche puntualmente.
    const heuristicNightShift = checkEntryTime >= 1200 && rawCheckOutTime < checkEntryTime;
    const isNightShift = isNightShiftHint === true || heuristicNightShift;

    if (!isNightShift && checkOutTime <= checkEntryTime) {
      group.get('checkOut')?.setErrors({ errorAttendance: true });

      return {
        errorAttendance: true
      };
    }

    if (isNightShift && rawCheckOutTime >= checkEntryTime) {
      group.get('checkOut')?.setErrors({ errorAttendance: true });

      return {
        errorAttendance: true
      };
    }

    return null;
  };
}

// Export legacy para compatibilidad con llamadas existentes que no pasan el flag
export const ValidateAttendance: ValidatorFn = createAttendanceValidator();
