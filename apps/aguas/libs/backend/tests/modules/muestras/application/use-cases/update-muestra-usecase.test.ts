import { v7 as uuidv7 } from 'uuid'
import { UpdateMuestraUseCase } from '../../../../../src/contexts/aguas/modules/muestras/application/use-cases/update-muestra-usecase.service'
import { EntityNotFoundError } from '../../../../../src/contexts/shared/domain/errors'
import { MuestraMother } from '../../domain/mothers/muestra.mother'
import { MuestraRepositoryMock } from '../../mocks/muestra.repository.mock'

describe('UpdateMuestraUseCase', () => {
  let repositoryMock: MuestraRepositoryMock
  let useCase: UpdateMuestraUseCase

  beforeEach(() => {
    repositoryMock = new MuestraRepositoryMock()
    useCase = new UpdateMuestraUseCase(repositoryMock)
  })

  describe('given the muestra does not exist', () => {
    it('throws EntityNotFoundError and does not save', async () => {
      repositoryMock.givenNotFound()

      await expect(useCase.invoke({ id: uuidv7(), updates: {} })).rejects.toThrow(EntityNotFoundError)
      repositoryMock.assertNotCalled('save')
    })
  })

  describe('given an update that touches no unique field', () => {
    it('saves without checking uniqueness', async () => {
      repositoryMock.givenFound(MuestraMother.reconstruct())
      repositoryMock.whenSaveSuccess()

      await useCase.invoke({ id: uuidv7(), updates: {} })

      repositoryMock.assertNotCalled('exists')
      repositoryMock.assertCalled('save')
    })
  })
})
