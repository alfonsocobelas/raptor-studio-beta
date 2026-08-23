import { ProjectStatusEnum, ProjectImplementerEnum } from './project-enums'

export interface UpdateProjectDto {
  customerId?: string
  name?: string
  description?: string
  startDate?: string | null
  endDate?: string | null
  status?: ProjectStatusEnum
  implementer?: ProjectImplementerEnum
}
