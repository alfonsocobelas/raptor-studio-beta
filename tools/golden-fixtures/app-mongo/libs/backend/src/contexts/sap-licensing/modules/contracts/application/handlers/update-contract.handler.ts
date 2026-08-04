import { Injectable } from '@nestjs/common'
import { UpdateContractInput } from '../dtos/update-contract-input.dto'
import { UpdateContractUseCase } from '../use-cases/update-contract-usecase.service'

@Injectable()
export class UpdateContractHandler {
  constructor(private readonly useCase: UpdateContractUseCase) {}

  async handle(input: UpdateContractInput): Promise<void> {
    await this.useCase.invoke(input)
  }
}
