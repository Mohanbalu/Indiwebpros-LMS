export interface ICertificateService {
  generate(userId: string, courseId: string): Promise<Record<string, unknown>>;
  verify(verificationCode: string): Promise<Record<string, unknown>>;
  download(certificateId: string): Promise<string>;
  regenerate(certificateId: string): Promise<Record<string, unknown>>;
}
