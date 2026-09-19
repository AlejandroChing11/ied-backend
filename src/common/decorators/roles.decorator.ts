import { SetMetadata } from '@nestjs/common';
import { ROLES_KEY, RoleName } from '../constants';

export const Roles = (...roles: RoleName[]) => SetMetadata(ROLES_KEY, roles);
