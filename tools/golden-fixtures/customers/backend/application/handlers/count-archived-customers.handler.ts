import { Injectable } from '@nestjs/common'
import { CountArchivedCustomersUseCase } from '../use-cases/count-archived-customers-usecase.service'

@Injectable()
export class CountArchivedCustomersHandler {
  constructor(private readonly useCase: CountArchivedCustomersUseCase) {}

  async handle(): Promise<{ count: number }> {
    return { count: await this.useCase.invoke() }
  }
}
