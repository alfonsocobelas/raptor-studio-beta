import { RegisterPuntoUseCase } from '../../../../../src/contexts/aguas/modules/puntos/application/use-cases/register-punto-usecase.service'
import { PuntoMother } from '../../domain/mothers/punto.mother'
import { PuntoRepositoryMock } from '../../mocks/punto.repository.mock'

describe('RegisterPuntoUseCase', () => {
  let repositoryMock: PuntoRepositoryMock
  let useCase: RegisterPuntoUseCase

  beforeEach(() => {
    repositoryMock = new PuntoRepositoryMock()
    useCase = new RegisterPuntoUseCase(repositoryMock)
  })

  it('registers without uniqueness checks (the model declares no unique fields)', async () => {
    repositoryMock.whenRegisterSuccess()

    const input = PuntoMother.primitives()
    await useCase.invoke(input)

    repositoryMock.assertNotCalled('exists')
    const registered = repositoryMock.registeredPunto().toPrimitives()
    expect(registered.id).toBe(input.id)
  })
})
