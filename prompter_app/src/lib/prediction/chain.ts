export enum RunStatus {
    none = "none",
    success = "success",
    error = "error",
    skipped = "skipped",
    inProgress = "inProgress",
    onHold = "onHold"
}

export interface StepRunStatus {
    status: RunStatus,
    error: string | null
}

export function errorStatus(errorMessage: string): StepRunStatus {
    return {
        status: RunStatus.error,
        error: errorMessage
    }
}
