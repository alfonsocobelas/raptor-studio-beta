import { Module } from '@nestjs/common'
import { ContractsModule } from '../modules/contracts/contracts.module'
import { ProjectsModule } from '../modules/projects/projects.module'
import { DelContratoAlProyectoImplantadoProcess } from './del-contrato-al-proyecto-implantado/del-contrato-al-proyecto-implantado.process'

@Module({
  imports: [ContractsModule, ProjectsModule],
  providers: [DelContratoAlProyectoImplantadoProcess],
  exports: [DelContratoAlProyectoImplantadoProcess]
})
export class ProcessesModule {}
