import { Injectable } from '@nestjs/common'
import { Propiedad } from '../../domain/propiedad'
import { PropiedadRepository } from '../../domain/propiedad-repository'
import { RegisterPropiedadInput } from '../dtos/register-propiedad-input.dto'

@Injectable()
export class RegisterPropiedadUseCase {
  constructor(private readonly propiedadRepository: PropiedadRepository) {}

  async invoke(input: RegisterPropiedadInput): Promise<void> {
    const propiedad = Propiedad.register(input)
    await this.propiedadRepository.register(propiedad)
  }
}
