import { Injectable } from '@nestjs/common'
import { Visita } from '../../domain/visita'
import { VisitaRepository } from '../../domain/visita-repository'
import { RegisterVisitaInput } from '../dtos/register-visita-input.dto'

@Injectable()
export class RegisterVisitaUseCase {
  constructor(private readonly visitaRepository: VisitaRepository) {}

  async invoke(input: RegisterVisitaInput): Promise<void> {
    const visita = Visita.register(input)
    await this.visitaRepository.register(visita)
  }
}
