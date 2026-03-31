import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class BunnyCdnService {
  private readonly logger = new Logger(BunnyCdnService.name);
  private readonly apiKey: string;
  private readonly storageZoneName: string;
  private readonly region: string;
  private readonly pullZoneDomain: string;

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>('BUNNY_STORAGE_API_KEY') || '';
    this.storageZoneName = this.configService.get<string>('BUNNY_STORAGE_ZONE_NAME') || '';
    this.region = this.configService.get<string>('BUNNY_STORAGE_REGION') || '';
    this.pullZoneDomain = this.configService.get<string>('BUNNY_CDN_DOMAIN') || '';
  }

  /**
   * Constructs the base URL for the BunnyCDN Storage API.
   * If region is provided, it typically looks like "ny.", "la.", "sg.".
   * If empty, it defaults to the main EU storage zone.
   */
  private get baseStorageUrl(): string {
    const regionPrefix = this.region ? `${this.region}.` : '';
    return `https://${regionPrefix}storage.bunnycdn.com/${this.storageZoneName}`;
  }

  /**
   * Uploads a Buffer to BunnyCDN Storage.
   * @param buffer The file buffer
   * @param storagePath The path including filename where it should be stored in BunnyCDN (e.g., "videos/123.mp4")
   * @param contentType The MIME type of the file
   * @returns The public pull zone URL of the uploaded file
   */
  async uploadBuffer(buffer: Buffer, storagePath: string, contentType: string = 'video/mp4'): Promise<string> {
    if (!this.apiKey || !this.storageZoneName || !this.pullZoneDomain) {
      throw new Error('BunnyCDN configuration is missing in environment variables');
    }

    const cleanPath = storagePath.startsWith('/') ? storagePath.slice(1) : storagePath;
    const url = `${this.baseStorageUrl}/${cleanPath}`;

    this.logger.log(`Uploading file (${buffer.length} bytes) to BunnyCDN: ${url}`);

    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        AccessKey: this.apiKey,
        'Content-Type': contentType,
      },
      body: new Uint8Array(buffer),
    });

    if (!response.ok) {
      const errorText = await response.text();
      this.logger.error(`Failed to upload to BunnyCDN: ${response.status} ${errorText}`);
      throw new Error(`BunnyCDN upload failed: ${response.status} ${errorText}`);
    }

    const pullZoneClean = this.pullZoneDomain.replace(/\/$/, '');
    const publicUrl = `https://${pullZoneClean}/${cleanPath}`;
    this.logger.log(`Successfully uploaded to BunnyCDN. Public URL: ${publicUrl}`);
    return publicUrl;
  }

  /**
   * Downloads a file from a public URL and uploads it directly to BunnyCDN.
   */
  async uploadFromUrl(sourceUrl: string, storagePath: string, contentType: string = 'video/mp4'): Promise<string> {
    this.logger.log(`Downloading from ${sourceUrl} to upload to BunnyCDN...`);
    const fetchResponse = await fetch(sourceUrl);
    
    if (!fetchResponse.ok) {
      throw new Error(`Failed to download source URL: ${fetchResponse.statusText}`);
    }

    const arrayBuffer = await fetchResponse.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    return this.uploadBuffer(buffer, storagePath, contentType);
  }
}
