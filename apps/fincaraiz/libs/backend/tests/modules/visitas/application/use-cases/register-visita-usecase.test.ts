import { RegisterVisitaUseCase } from '../../../../../src/contexts/fincaraiz/modules/visitas/application/use-cases/register-visita-usecase.service'
import { VisitaMother } from '../../domain/mothers/visita.mother'
import { VisitaRepositoryMock } from '../../mocks/visita.repository.mock'

describe('RegisterVisitaUseCase', () => {
  let repositoryMock: VisitaRepositoryMock
  let useCase: RegisterVisitaUseCase

  beforeEach(() => {
    repositoryMock = new VisitaRepositoryMock()
    useCase = new RegisterVisitaUseCase(repositoryMock)
  })

  it('registers without uniqueness checks (the model declares no unique fields)', async () => {
    repositoryMock.whenRegisterSuccess()

    const input = VisitaMother.primitives()
    await useCase.invoke(input)

    repositoryMock.assertNotCalled('exists')
    const registered = repositoryMock.registeredVisita().toPrimitives()
    expect(registered.id).toBe(input.id)
  })
})
