import { RegisterPropiedadUseCase } from '../../../../../src/contexts/fincaraiz/modules/propiedades/application/use-cases/register-propiedad-usecase.service'
import { PropiedadMother } from '../../domain/mothers/propiedad.mother'
import { PropiedadRepositoryMock } from '../../mocks/propiedad.repository.mock'

describe('RegisterPropiedadUseCase', () => {
  let repositoryMock: PropiedadRepositoryMock
  let useCase: RegisterPropiedadUseCase

  beforeEach(() => {
    repositoryMock = new PropiedadRepositoryMock()
    useCase = new RegisterPropiedadUseCase(repositoryMock)
  })

  it('registers without uniqueness checks (the model declares no unique fields)', async () => {
    repositoryMock.whenRegisterSuccess()

    const input = PropiedadMother.primitives()
    await useCase.invoke(input)

    repositoryMock.assertNotCalled('exists')
    const registered = repositoryMock.registeredPropiedad().toPrimitives()
    expect(registered.id).toBe(input.id)
  })
})
