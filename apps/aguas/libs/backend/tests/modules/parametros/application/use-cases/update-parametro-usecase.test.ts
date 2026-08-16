import { v7 as uuidv7 } from 'uuid'
import { UpdateParametroUseCase } from '../../../../../src/contexts/aguas/modules/parametros/application/use-cases/update-parametro-usecase.service'
import { EntityNotFoundError } from '../../../../../src/contexts/shared/domain/errors'
import { ParametroMother } from '../../domain/mothers/parametro.mother'
import { ParametroRepositoryMock } from '../../mocks/parametro.repository.mock'

describe('UpdateParametroUseCase', () => {
  let repositoryMock: ParametroRepositoryMock
  let useCase: UpdateParametroUseCase

  beforeEach(() => {
    repositoryMock = new ParametroRepositoryMock()
    useCase = new UpdateParametroUseCase(repositoryMock)
  })

  describe('given the parametro does not exist', () => {
    it('throws EntityNotFoundError and does not save', async () => {
      repositoryMock.givenNotFound()

      await expect(useCase.invoke({ id: uuidv7(), updates: {} })).rejects.toThrow(EntityNotFoundError)
      repositoryMock.assertNotCalled('save')
    })
  })

  describe('given an update that touches no unique field', () => {
    it('saves without checking uniqueness', async () => {
      repositoryMock.givenFound(ParametroMother.reconstruct())
      repositoryMock.whenSaveSuccess()

      await useCase.invoke({ id: uuidv7(), updates: {} })

      repositoryMock.assertNotCalled('exists')
      repositoryMock.assertCalled('save')
    })
  })
})
