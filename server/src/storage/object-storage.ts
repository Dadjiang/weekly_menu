import { S3Storage } from 'coze-coding-dev-sdk';
import type { Readable } from 'stream';

const DEFAULT_EXPIRE_TIME = 86400 * 7;

let storageInstance: S3Storage | null = null;

function getStorage(): S3Storage {
  if (!storageInstance) {
    storageInstance = new S3Storage({ region: 'cn-beijing' });
  }
  return storageInstance;
}

export interface SaveFileInput {
  content: Buffer;
  fileName: string;
  contentType?: string;
  bucket?: string;
}

export interface SaveFileResult {
  key: string;
}

export type ListFilesResult = Awaited<ReturnType<S3Storage['listFiles']>>;

export async function saveFile(input: SaveFileInput): Promise<SaveFileResult> {
  const key = await getStorage().uploadFile({
    fileContent: input.content,
    fileName: input.fileName,
    contentType: input.contentType ?? 'application/octet-stream',
    bucket: input.bucket,
  });
  return { key };
}

export async function saveFileFromStream(
  stream: Readable,
  fileName: string,
  options?: { contentType?: string; bucket?: string },
): Promise<SaveFileResult> {
  const key = await getStorage().streamUploadFile({
    stream,
    fileName,
    contentType: options?.contentType ?? 'application/octet-stream',
    bucket: options?.bucket,
  });
  return { key };
}

export async function saveFileFromUrl(
  url: string,
  options?: { bucket?: string; timeout?: number },
): Promise<SaveFileResult> {
  const key = await getStorage().uploadFromUrl({
    url,
    bucket: options?.bucket,
    timeout: options?.timeout,
  });
  return { key };
}

export async function getSignedUrl(
  key: string,
  options?: { bucket?: string; expireTime?: number },
): Promise<string> {
  return getStorage().generatePresignedUrl({
    key,
    bucket: options?.bucket,
    expireTime: options?.expireTime ?? DEFAULT_EXPIRE_TIME,
  });
}

export async function readFile(key: string, options?: { bucket?: string }): Promise<Buffer> {
  return getStorage().readFile({ fileKey: key, bucket: options?.bucket });
}

export async function fileExists(key: string, options?: { bucket?: string }): Promise<boolean> {
  return getStorage().fileExists({ fileKey: key, bucket: options?.bucket });
}

export async function deleteFile(key: string, options?: { bucket?: string }): Promise<boolean> {
  return getStorage().deleteFile({ fileKey: key, bucket: options?.bucket });
}

export async function listFiles(options?: {
  prefix?: string;
  bucket?: string;
  maxKeys?: number;
  continuationToken?: string;
}): Promise<ListFilesResult> {
  return getStorage().listFiles(options);
}
