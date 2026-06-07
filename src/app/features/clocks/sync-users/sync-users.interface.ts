import { IClock } from "@core/models/clock.interface";

export type SyncUsersMode = 'db' | 'clock';

export interface ISyncUsersDialogData {
    /** Source of the users: 'db' (database) or 'clock' (another clock). */
    mode: SyncUsersMode;
    /** Current clock: target in 'db' mode, source in 'clock' mode. */
    clock: IClock;
    /** Available clocks as target. Required only when mode === 'clock'. */
    targets?: Array<IClock>;
}
