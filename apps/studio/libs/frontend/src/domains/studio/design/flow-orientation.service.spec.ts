import { beforeEach, describe, expect, it } from 'vitest'
import { TestBed } from '@angular/core/testing'
import { FlowOrientationService } from './flow-orientation.service'

describe('FlowOrientationService', () => {
  let orientation: FlowOrientationService

  beforeEach(() => {
    TestBed.configureTestingModule({})
    orientation = TestBed.inject(FlowOrientationService)
  })

  it('arranca en horizontal, como la referencia', () => {
    expect(orientation.value()).toBe('horizontal')
  })

  it('alterna entre horizontal y vertical', () => {
    orientation.toggle()
    expect(orientation.value()).toBe('vertical')

    orientation.toggle()
    expect(orientation.value()).toBe('horizontal')
  })
})
