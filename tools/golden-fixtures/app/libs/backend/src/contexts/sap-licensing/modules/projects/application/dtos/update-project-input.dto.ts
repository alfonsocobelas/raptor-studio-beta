import { ProjectUpdateProps } from '../../domain/project-types'

export interface UpdateProjectInput {
  id: string
  updates: ProjectUpdateProps
}
