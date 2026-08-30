import { Injectable } from '@nestjs/common'
import { TerminateContractUseCase } from '../use-cases/terminate-contract-usecase.service'

@Injectable()
export class TerminateContractHandler {
  constructor(private readonly useCase: TerminateContractUseCase) {}

  async handle(input: { id: string; version: number }): Promise<void> {
    await this.useCase.invoke(input)
  }
}
