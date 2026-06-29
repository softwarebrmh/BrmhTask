import { SetMetadata } from '@nestjs/common';
export const OWNER_FIELD_KEY = 'ownerField';
export const OwnerField = (field: string) => SetMetadata(OWNER_FIELD_KEY, field);
