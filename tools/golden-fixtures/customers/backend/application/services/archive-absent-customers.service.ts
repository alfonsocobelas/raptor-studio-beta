import { Injectable } from '@nestjs/common'
import { CustomerRepository } from '../../domain/customer-repository'
import { ArchiveAbsentCustomersInput, ArchiveAbsentCustomersOutput } from '../dtos/archive-absent-customers-input.dto'

/**
 * Archiva los clientes candidatos (activos vistos alguna vez en SAP) cuyo sapId no ha
 * aparecido en el run actual. Lo invoca RunSapSyncUseCase solo tras un run 100% exitoso:
 * un fallo de fetch no puede opinar sobre quién existe. Los clientes nunca vistos en SAP
 * (alta manual) los excluye findArchivable, no este servicio.
 */
@Injectable()
export class ArchiveAbsentCustomersService {
  constructor(private readonly customerRepository: CustomerRepository) {}

  async archive(input: ArchiveAbsentCustomersInput): Promise<ArchiveAbsentCustomersOutput> {
    const seen = new Set(input.seenSapIds)
    const archivedAt = new Date(input.archivedAt)
    const archivable = await this.customerRepository.findArchivable()

    let archived = 0
    for (const customer of archivable) {
      if (seen.has(customer.sapId.value)) {
        continue
      }
      customer.archive(archivedAt)
      await this.customerRepository.save(customer)
      archived += 1
    }

    return { archived }
  }
}
