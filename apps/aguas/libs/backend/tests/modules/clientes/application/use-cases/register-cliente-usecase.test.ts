import { RegisterClienteUseCase } from '../../../../../src/contexts/aguas/modules/clientes/application/use-cases/register-cliente-usecase.service'
import { ClienteMother } from '../../domain/mothers/cliente.mother'
import { ClienteRepositoryMock } from '../../mocks/cliente.repository.mock'

describe('RegisterClienteUseCase', () => {
  let repositoryMock: ClienteRepositoryMock
  let useCase: RegisterClienteUseCase

  beforeEach(() => {
    repositoryMock = new ClienteRepositoryMock()
    useCase = new RegisterClienteUseCase(repositoryMock)
  })

  it('registers without uniqueness checks (the model declares no unique fields)', async () => {
    repositoryMock.whenRegisterSuccess()

    const input = ClienteMother.primitives()
    await useCase.invoke(input)

    repositoryMock.assertNotCalled('exists')
    const registered = repositoryMock.registeredCliente().toPrimitives()
    expect(registered.id).toBe(input.id)
  })
})
