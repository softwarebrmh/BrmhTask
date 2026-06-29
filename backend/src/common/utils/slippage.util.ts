import { Decimal } from '@prisma/client/runtime/library';

export function computeSlippage(actual: Decimal, planned: Decimal): number {
  return Number(actual) - Number(planned);
}
