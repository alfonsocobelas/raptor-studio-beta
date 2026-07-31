import { Project } from '../../../../../src/contexts/sap-licensing/modules/projects/domain/project'
import { ProjectPrimitiveProps } from '../../../../../src/contexts/sap-licensing/modules/projects/domain/project-types'
import { ProjectBuilder } from './project.builder'

export class ProjectMother {
  static random(): Project {
    return ProjectBuilder.aProject().build()
  }

  static randomList(count: number = 5): Project[] {
    return Array.from({ length: count }, () => this.random())
  }

  static register(overrides?: Partial<ProjectPrimitiveProps>): Project {
    return ProjectBuilder.aProject().withProps(overrides).create()
  }

  static reconstruct(overrides?: Partial<ProjectPrimitiveProps>): Project {
    return ProjectBuilder.aProject().withProps(overrides).build()
  }

  static withName(name: string): Project {
    return ProjectBuilder.aProject().withName(name).build()
  }

  static primitives(overrides?: Partial<ProjectPrimitiveProps>): ProjectPrimitiveProps {
    return ProjectBuilder.aProject().withProps(overrides).build().toPrimitives()
  }
}
