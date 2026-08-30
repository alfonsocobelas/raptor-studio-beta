import { IsInt, Min } from 'class-validator'

/** Cuerpo de toda transición (spec 78): la versión leída viaja con el gesto — dos transiciones simultáneas, la segunda 409. */
export class TransitionContractDto {
  @IsInt()
  @Min(1)
  version!: number
}
