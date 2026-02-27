import { PartialType } from '@nestjs/swagger';
import { CreateChildProfileDto } from './create-child-profile.dto';

/**
 * All fields optional for PATCH /kids/auth/children/:childId
 */
export class UpdateChildProfileDto extends PartialType(CreateChildProfileDto) {}
