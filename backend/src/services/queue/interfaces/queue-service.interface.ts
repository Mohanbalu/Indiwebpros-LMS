export interface IQueueService {
  dispatch(jobName: string, data: Record<string, unknown>, options?: Record<string, unknown>): Promise<Record<string, unknown>>;
  schedule(jobName: string, data: Record<string, unknown>, cronExpression: string, options?: Record<string, unknown>): Promise<Record<string, unknown>>;
  cancel(jobId: string): Promise<void>;
  retry(jobId: string): Promise<void>;
}
