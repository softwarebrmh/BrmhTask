import { Decimal } from '@prisma/client/runtime/library';

export function computeSlippage(actual: Decimal, estimated: Decimal): number {
  return Number(actual) - Number(estimated);
}
