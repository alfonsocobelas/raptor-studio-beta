import { Injectable } from '@nestjs/common'
import { ExpireContractUseCase } from '../use-cases/expire-contract-usecase.service'

@Injectable()
export class ExpireContractHandler {
  constructor(private readonly useCase: ExpireContractUseCase) {}

  async handle(input: { id: string }): Promise<void> {
    await this.useCase.invoke(input)
  }
}
