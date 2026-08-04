import { Global, Module } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { FileStoragePort } from '../../domain/storage/file-storage.port'
import { AzureBlobFileStorage } from './azure-blob-file-storage'
import { LocalFileStorage } from './local-file-storage'

/**
 * Global: cualquier módulo con adjuntos inyecta FileStoragePort sin re-declararlo.
 *
 * El adapter lo decide la CONFIG, no el build: con la sección `storage` configurada los ficheros
 * van a Azure Blob; sin ella, a disco local. Así el mismo binario sirve para local y para la nube.
 */
@Global()
@Module({
  providers: [
    {
      provide: FileStoragePort,
      inject: [ConfigService],
      useFactory: (config: ConfigService) =>
        config.get<string>('storage.connectionString') ? new AzureBlobFileStorage(config) : new LocalFileStorage()
    }
  ],
  exports: [FileStoragePort]
})
export class StorageModule {}
