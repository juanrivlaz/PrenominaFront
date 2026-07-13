export interface IConfirmAction {
    type: string;
    name: string;
    incident: string;
    date: string;
    note: string;
}

export interface IConfirmActionResult {
    /** Motivo del rechazo capturado en el diálogo (solo aplica al rechazar). */
    comment?: string;
}