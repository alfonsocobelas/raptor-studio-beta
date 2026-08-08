import { Injectable } from '@nestjs/common'
import { GetVisitaInput } from '../dtos/get-visita-input.dto'
import { GetVisitaUseCase } from '../use-cases/get-visita-usecase.service'
import { VisitaPrimitiveProps } from '../../domain/visita-types'

@Injectable()
export class GetVisitaHandler {
  constructor(private readonly useCase: GetVisitaUseCase) {}

  async handle(input: GetVisitaInput): Promise<VisitaPrimitiveProps> {
    return this.useCase.invoke(input)
  }
}
