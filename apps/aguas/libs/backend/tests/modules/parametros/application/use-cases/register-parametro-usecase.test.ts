import { RegisterParametroUseCase } from '../../../../../src/contexts/aguas/modules/parametros/application/use-cases/register-parametro-usecase.service'
import { ParametroMother } from '../../domain/mothers/parametro.mother'
import { ParametroRepositoryMock } from '../../mocks/parametro.repository.mock'

describe('RegisterParametroUseCase', () => {
  let repositoryMock: ParametroRepositoryMock
  let useCase: RegisterParametroUseCase

  beforeEach(() => {
    repositoryMock = new ParametroRepositoryMock()
    useCase = new RegisterParametroUseCase(repositoryMock)
  })

  it('registers without uniqueness checks (the model declares no unique fields)', async () => {
    repositoryMock.whenRegisterSuccess()

    const input = ParametroMother.primitives()
    await useCase.invoke(input)

    repositoryMock.assertNotCalled('exists')
    const registered = repositoryMock.registeredParametro().toPrimitives()
    expect(registered.id).toBe(input.id)
  })
})
