import { RegisterMuestraUseCase } from '../../../../../src/contexts/aguas/modules/muestras/application/use-cases/register-muestra-usecase.service'
import { MuestraMother } from '../../domain/mothers/muestra.mother'
import { MuestraRepositoryMock } from '../../mocks/muestra.repository.mock'

describe('RegisterMuestraUseCase', () => {
  let repositoryMock: MuestraRepositoryMock
  let useCase: RegisterMuestraUseCase

  beforeEach(() => {
    repositoryMock = new MuestraRepositoryMock()
    useCase = new RegisterMuestraUseCase(repositoryMock)
  })

  it('registers without uniqueness checks (the model declares no unique fields)', async () => {
    repositoryMock.whenRegisterSuccess()

    const input = MuestraMother.primitives()
    await useCase.invoke(input)

    repositoryMock.assertNotCalled('exists')
    const registered = repositoryMock.registeredMuestra().toPrimitives()
    expect(registered.id).toBe(input.id)
  })
})
