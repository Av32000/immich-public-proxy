import { Request } from "express-serve-static-core";

export enum AssetType {
  image = "IMAGE",
  video = "VIDEO",
}

export enum KeyType {
  key = "key",
  slug = "slug",
}
export const allowedExifKeys: (keyof ExifInfo)[] = [
  "make",
  "model",
  "exifImageWidth",
  "exifImageHeight",
  "fileSizeInByte",
  "dateTimeOriginal",
  "timezone",
  "lensModel",
  "fNumber",
  "focalLength",
  "iso",
  "exposureTime",
  "rating",
  "description",
];
export interface ExifInfo {
  make?: string;
  model?: string;
  exifImageWidth?: number;
  exifImageHeight?: number;
  fileSizeInByte?: number;
  dateTimeOriginal?: string;
  timezone?: string;
  lensModel?: string;
  fNumber?: number;
  focalLength?: number;
  iso?: number;
  exposureTime?: string;
  rating?: number;
  description?: string;
}

export enum AlbumType {
  album = "ALBUM",
  individual = "INDIVIDUAL",
}

export interface Asset {
  id: string;
  key: string;
  keyType: KeyType;
  originalFileName?: string;
  originalMimeType: string;
  password?: string;
  fileCreatedAt?: string; // May not exist - see https://github.com/alangrainger/immich-public-proxy/issues/61
  type: AssetType;
  isTrashed: boolean;
  exifInfo?: ExifInfo;
}

export interface Album {
  id: string;
  assets: Asset[];
}

export interface SharedLink {
  key: string;
  keyType: KeyType;
  type: string;
  description?: string;
  embed: {
    color?: string;
    cover?: string;
  };
  assets: Asset[];
  allowDownload?: boolean;
  password?: string;
  album?: {
    id: string;
    albumName?: string;
    order?: string;
    description?: string;
  };
  expiresAt: string | null;
  showMetadata?: boolean;
}

export interface SharedLinkResult {
  valid: boolean;
  key?: string;
  passwordRequired?: boolean;
  link?: SharedLink;
}

export enum ImageSize {
  thumbnail = "thumbnail",
  preview = "preview",
  original = "original",
}

export interface IncomingShareRequest {
  req: Request;
  key: string;
  keyType?: KeyType;
  password?: string;
  mode?: string;
  size?: ImageSize;
  range?: string;
}

export enum DownloadAll {
  disabled,
  perImmich,
  always,
}
