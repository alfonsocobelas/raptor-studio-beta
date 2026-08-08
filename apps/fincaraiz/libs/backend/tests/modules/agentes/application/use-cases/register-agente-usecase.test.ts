import { RegisterAgenteUseCase } from '../../../../../src/contexts/fincaraiz/modules/agentes/application/use-cases/register-agente-usecase.service'
import { AgenteMother } from '../../domain/mothers/agente.mother'
import { AgenteRepositoryMock } from '../../mocks/agente.repository.mock'

describe('RegisterAgenteUseCase', () => {
  let repositoryMock: AgenteRepositoryMock
  let useCase: RegisterAgenteUseCase

  beforeEach(() => {
    repositoryMock = new AgenteRepositoryMock()
    useCase = new RegisterAgenteUseCase(repositoryMock)
  })

  it('registers without uniqueness checks (the model declares no unique fields)', async () => {
    repositoryMock.whenRegisterSuccess()

    const input = AgenteMother.primitives()
    await useCase.invoke(input)

    repositoryMock.assertNotCalled('exists')
    const registered = repositoryMock.registeredAgente().toPrimitives()
    expect(registered.id).toBe(input.id)
  })
})
