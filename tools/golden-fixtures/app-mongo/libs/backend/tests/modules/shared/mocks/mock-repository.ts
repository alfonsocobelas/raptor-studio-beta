/* eslint-disable @typescript-eslint/no-explicit-any */
import { Criteria } from '../../../../src/contexts/shared/domain/query/criteria'

export abstract class MockRepository<_T> {
  private mocks: Map<string, jest.Mock> = new Map()

  protected getMock(methodName: string): jest.Mock {
    if (!this.mocks.has(methodName)) {
      this.mocks.set(methodName, jest.fn())
    }
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return this.mocks.get(methodName)!
  }

  protected setMockResult(methodName: string, result: unknown): void {
    this.getMock(methodName).mockResolvedValue(result)
  }

  assertCalled(methodName: string): void {
    expect(this.getMock(methodName)).toHaveBeenCalled()
  }

  assertNotCalled(methodName: string): void {
    expect(this.getMock(methodName)).not.toHaveBeenCalled()
  }

  assertCalledWith(methodName: string, ...expectedArgs: unknown[]): void {
    const calls = this.getMock(methodName).mock.calls
    const match = calls.some(
      (call: unknown[]) =>
        call.length === expectedArgs.length &&
        call.every((arg: unknown, i: number) => this.valueObjectEquals(arg, expectedArgs[i]))
    )
    expect(match).toBe(true)
  }

  assertLastCalledWith(methodName: string, ...expectedArgs: unknown[]): void {
    const calls = this.getMock(methodName).mock.calls
    const lastCall = calls[calls.length - 1] as unknown[]
    const match =
      lastCall &&
      lastCall.length === expectedArgs.length &&
      lastCall.every((arg: unknown, i: number) => this.valueObjectEquals(arg, expectedArgs[i]))
    expect(match).toBe(true)
  }

  assertCalledTimes(methodName: string, times: number): void {
    expect(this.getMock(methodName)).toHaveBeenCalledTimes(times)
  }

  assertCalledWithSpecification(methodName: string, expectedSpec: Criteria): void {
    const calls = this.getMock(methodName).mock.calls as unknown[][]
    const match = calls.some(
      call =>
        call.length === 1 &&
        call[0] instanceof expectedSpec.constructor &&
        JSON.stringify(call[0]) === JSON.stringify(expectedSpec)
    )
    expect(match).toBe(true)
  }

  private valueObjectEquals(a: any, b: any): boolean {
    if (Array.isArray(a) && Array.isArray(b)) {
      if (a.length !== b.length) {
        return false
      }
      return a.every((item: unknown, i: number) => this.valueObjectEquals(item, (b as unknown[])[i]))
    }
    if (a && typeof a.equals === 'function') {
      return a.equals(b)
    }
    if (b && typeof b.equals === 'function') {
      return b.equals(a)
    }
    return a === b
  }
}
