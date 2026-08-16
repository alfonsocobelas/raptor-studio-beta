import { Module } from '@nestjs/common'
import { MuestrasModule } from '../modules/muestras/muestras.module'
import { DeLaRecepcionDelBoteAlInformeFacturadoProcess } from './de-la-recepcion-del-bote-al-informe-facturado/de-la-recepcion-del-bote-al-informe-facturado.process'
import { PruebaJaimeProcess } from './prueba-jaime/prueba-jaime.process'
import { JOBPermisosProximosACaducarProcess } from './job-·-permisos-proximos-a-caducar/job-·-permisos-proximos-a-caducar.process'
import { ResponsabilidadSolicitudDePRORROGAProcess } from './responsabilidad-solicitud-de-prorroga/responsabilidad-solicitud-de-prorroga.process'
import { SolicitudDePRORROGAFaseITramitacionesProcess } from './solicitud-de-prorroga-·-fase-i---tramitaciones/solicitud-de-prorroga-·-fase-i---tramitaciones.process'
import { SolicitudDePRORROGAFaseIIOperacionesProcess } from './solicitud-de-prorroga-·-fase-ii---operaciones/solicitud-de-prorroga-·-fase-ii---operaciones.process'
import { SolicitudDePRORROGAProcess } from './solicitud-de-prorroga/solicitud-de-prorroga.process'
import { SolicitudNUEVADeLicenciaPermisoProcess } from './solicitud-nueva-de-licencia/permiso/solicitud-nueva-de-licencia/permiso.process'

@Module({
  imports: [MuestrasModule],
  providers: [
    DeLaRecepcionDelBoteAlInformeFacturadoProcess,
    PruebaJaimeProcess,
    JOBPermisosProximosACaducarProcess,
    ResponsabilidadSolicitudDePRORROGAProcess,
    SolicitudDePRORROGAFaseITramitacionesProcess,
    SolicitudDePRORROGAFaseIIOperacionesProcess,
    SolicitudDePRORROGAProcess,
    SolicitudNUEVADeLicenciaPermisoProcess
  ],
  exports: [
    DeLaRecepcionDelBoteAlInformeFacturadoProcess,
    PruebaJaimeProcess,
    JOBPermisosProximosACaducarProcess,
    ResponsabilidadSolicitudDePRORROGAProcess,
    SolicitudDePRORROGAFaseITramitacionesProcess,
    SolicitudDePRORROGAFaseIIOperacionesProcess,
    SolicitudDePRORROGAProcess,
    SolicitudNUEVADeLicenciaPermisoProcess
  ]
})
export class ProcessesModule {}
