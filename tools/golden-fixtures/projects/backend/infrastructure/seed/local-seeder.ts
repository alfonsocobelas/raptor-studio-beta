import { AlreadyExistsError } from '../../../../../shared/domain/errors'
import { RegisterProjectInput } from '../../application/dtos/register-project-input.dto'
import { RegisterProjectUseCase } from '../../application/use-cases/register-project-usecase.service'

export interface ProjectSeedSummary {
  projectsCreated: number
  projectsSkipped: number
}

// Siembra idempotente de proyectos para el entorno local vía RegisterProjectUseCase
// (respeta invariantes); los duplicados (customerId, name) se saltan capturando
// AlreadyExistsError.
export class ProjectLocalSeeder {
  constructor(private readonly registerProject: RegisterProjectUseCase) {}

  async seed(projects: RegisterProjectInput[]): Promise<ProjectSeedSummary> {
    const summary: ProjectSeedSummary = {
      projectsCreated: 0,
      projectsSkipped: 0
    }

    for (const project of projects) {
      try {
        await this.registerProject.invoke(project)
        summary.projectsCreated++
      } catch (error) {
        if (error instanceof AlreadyExistsError) {
          summary.projectsSkipped++
          continue
        }
        throw error
      }
    }

    return summary
  }
}
