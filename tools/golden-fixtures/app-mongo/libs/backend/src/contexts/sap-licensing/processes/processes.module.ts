import { Module } from '@nestjs/common'
import { CustomersModule } from '../modules/customers/customers.module'
import { ContractsModule } from '../modules/contracts/contracts.module'
import { DelAltaDelClienteAlContratoTerminadoProcess } from './del-alta-del-cliente-al-contrato-terminado/del-alta-del-cliente-al-contrato-terminado.process'
import { DelAltaDelClienteAlContratoTerminadoController } from './del-alta-del-cliente-al-contrato-terminado/del-alta-del-cliente-al-contrato-terminado.controller'

@Module({
  imports: [CustomersModule, ContractsModule],
  controllers: [DelAltaDelClienteAlContratoTerminadoController],
  providers: [DelAltaDelClienteAlContratoTerminadoProcess],
  exports: [DelAltaDelClienteAlContratoTerminadoProcess]
})
export class ProcessesModule {}
