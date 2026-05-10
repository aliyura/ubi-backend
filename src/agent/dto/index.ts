import {
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsDateString,
  IsArray,
  IsUUID,
  IsEmail,
  IsNotEmpty,
  Length,
  Matches,
  IsInt,
  Min,
  ValidateNested,
  ArrayMinSize,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  AGENT_RECOMMENDATION_TYPE,
  CURRENCY,
  FARM_OWNERSHIP_TYPE,
  FULFILLMENT_METHOD,
  LOAN_APPLICATION_STATUS,
} from '@prisma/client';
export { AddCartItemDto, UpdateCartItemDto } from 'src/loan-cart/dto';

export const AGENT_ACTION = {
  LOGIN: 'LOGIN',
  VIEW_ASSIGNED_APPLICATIONS: 'VIEW_ASSIGNED_APPLICATIONS',
  SUBMIT_FIELD_VERIFICATION: 'SUBMIT_FIELD_VERIFICATION',
  ONBOARD_FARMER: 'ONBOARD_FARMER',
  CREATE_FARM_FOR_FARMER: 'CREATE_FARM_FOR_FARMER',
  SUBMIT_LOAN_FOR_FARMER: 'SUBMIT_LOAN_FOR_FARMER',
  VIEW_ONBOARDED_FARMERS: 'VIEW_ONBOARDED_FARMERS',
  VERIFY_FARMER_KYC_TIER2: 'VERIFY_FARMER_KYC_TIER2',
  VERIFY_FARMER_KYC_TIER3: 'VERIFY_FARMER_KYC_TIER3',
  VIEW_FARMER_CART: 'VIEW_FARMER_CART',
  ADD_FARMER_CART_ITEM: 'ADD_FARMER_CART_ITEM',
  UPDATE_FARMER_CART_ITEM: 'UPDATE_FARMER_CART_ITEM',
  REMOVE_FARMER_CART_ITEM: 'REMOVE_FARMER_CART_ITEM',
  CLEAR_FARMER_CART: 'CLEAR_FARMER_CART',
} as const;

export class SubmitVerificationDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  farmExists?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  visitedAt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  cropConfirmed?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  estimatedFarmSize?: number;

  @ApiProperty({ enum: AGENT_RECOMMENDATION_TYPE })
  @IsEnum(AGENT_RECOMMENDATION_TYPE)
  recommendation: AGENT_RECOMMENDATION_TYPE;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  note?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  photos?: string[];
}

export class GetActivityLogsDto {
  @ApiPropertyOptional({ description: 'ISO date — start of range (inclusive)' })
  @IsOptional()
  @IsDateString()
  from?: string;

  @ApiPropertyOptional({ description: 'ISO date — end of range (inclusive)' })
  @IsOptional()
  @IsDateString()
  to?: string;

  @ApiPropertyOptional({ description: 'Admin only: filter by agent UUID' })
  @IsOptional()
  @IsUUID()
  agentId?: string;
}

// ─── Agent Onboarding DTOs ────────────────────────────────────────────────────

export class CreateFarmForFarmerDto {
  @ApiProperty({ example: 'Green Acres Farm' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ example: '12 Farm Road, Kano' })
  @IsNotEmpty()
  @IsString()
  address: string;

  @ApiProperty({ example: 'Kano' })
  @IsNotEmpty()
  @IsString()
  state: string;

  @ApiProperty({ example: 'Kano Municipal' })
  @IsNotEmpty()
  @IsString()
  lga: string;

  @ApiProperty({
    enum: FARM_OWNERSHIP_TYPE,
    example: FARM_OWNERSHIP_TYPE.owned,
  })
  @IsEnum(FARM_OWNERSHIP_TYPE)
  ownershipType: FARM_OWNERSHIP_TYPE;

  @ApiProperty({ example: 'Maize' })
  @IsNotEmpty()
  @IsString()
  mainCropType: string;

  @ApiPropertyOptional({ example: 'Ward 3' })
  @IsOptional()
  @IsString()
  ward?: string;

  @ApiPropertyOptional({ example: 11.9964 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  latitude?: number;

  @ApiPropertyOptional({ example: 8.5172 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  longitude?: number;

  @ApiPropertyOptional({ example: 5.5 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  sizeValue?: number;

  @ApiPropertyOptional({ example: 'hectares' })
  @IsOptional()
  @IsString()
  sizeUnit?: string;

  @ApiPropertyOptional({ example: 'Rice' })
  @IsOptional()
  @IsString()
  secondaryCropType?: string;

  @ApiPropertyOptional({ example: 'Wet season' })
  @IsOptional()
  @IsString()
  farmingSeason?: string;

  @ApiPropertyOptional({ example: '2026-05-01' })
  @IsOptional()
  @IsDateString()
  expectedPlantingDate?: string;

  @ApiPropertyOptional({ example: '2026-10-01' })
  @IsOptional()
  @IsDateString()
  expectedHarvestDate?: string;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  hasIrrigation?: boolean;
}

export class OnboardFarmerDto {
  @ApiProperty({ example: 'farmer123' })
  @IsNotEmpty()
  @IsString()
  username: string;

  @ApiProperty({ example: 'John Doe' })
  @IsNotEmpty()
  @IsString()
  fullname: string;

  @ApiProperty({ example: 'farmer@example.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: '08012345678' })
  @IsString({ message: 'Phone number must be a string' })
  @IsNotEmpty({ message: 'Phone number is required' })
  @Matches(/^[0-9]+$/, { message: 'Phone number must contain only digits' })
  @Length(10, 15, {
    message: 'Phone number must be between 10 and 15 digits long',
  })
  phoneNumber: string;

  @ApiProperty({ example: '8-Mar-1995' })
  @IsNotEmpty()
  @IsString()
  @Matches(
    /^(0?[1-9]|[12][0-9]|3[01])-(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)-\d{4}$/,
    {
      message:
        'Date of birth must be in format: DD-MMM-YYYY (e.g., 8-Mar-1995)',
    },
  )
  dateOfBirth: string;

  @ApiPropertyOptional({ example: 'RC1234567' })
  @IsOptional()
  @IsString()
  companyRegistrationNumber?: string;

  @ApiProperty({ example: 'StrongPass123!' })
  @IsNotEmpty()
  @IsString()
  @Length(8, 32, { message: 'Password must be between 8 and 32 characters' })
  password: string;

  @ApiPropertyOptional({ example: CURRENCY.NGN, enum: CURRENCY })
  @IsOptional()
  @IsEnum(CURRENCY)
  currency?: CURRENCY;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isBusinessRegistered?: boolean;

  @ApiPropertyOptional({ description: 'Farm data to create during onboarding' })
  @IsOptional()
  @IsNotEmpty()
  farm?: CreateFarmForFarmerDto;
}

export class BulkOnboardFarmersDto {
  @ApiProperty({ type: [OnboardFarmerDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => OnboardFarmerDto)
  farmers: OnboardFarmerDto[];
}

export class SubmitLoanForFarmerDto {
  @ApiProperty({
    description: 'UUID of the farmer (user) to create the loan for',
  })
  @IsUUID()
  farmerId: string;

  @ApiProperty()
  @IsUUID()
  farmId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  purpose?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  season?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  expectedPlantingDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  expectedHarvestDate?: string;

  @ApiPropertyOptional({ enum: FULFILLMENT_METHOD })
  @IsOptional()
  @IsEnum(FULFILLMENT_METHOD)
  fulfillmentMethod?: FULFILLMENT_METHOD;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  deliveryAddress?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  deliveryContact?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  farmerNotes?: string;

  @ApiPropertyOptional({ type: [Boolean] })
  @IsOptional()
  @IsArray()
  @IsBoolean({ each: true })
  declarations?: boolean[];
}

export class SubmitMarketplaceLoanForFarmerDto {
  @ApiProperty()
  @IsUUID()
  farmId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  purpose?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  season?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  expectedPlantingDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  expectedHarvestDate?: string;

  @ApiPropertyOptional({ enum: FULFILLMENT_METHOD })
  @IsOptional()
  @IsEnum(FULFILLMENT_METHOD)
  fulfillmentMethod?: FULFILLMENT_METHOD;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  deliveryAddress?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  deliveryContact?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  farmerNotes?: string;

  @ApiPropertyOptional({ type: [Boolean] })
  @IsOptional()
  @IsArray()
  @IsBoolean({ each: true })
  declarations?: boolean[];
}

export class QueryOnboardedFarmersDto {
  @ApiPropertyOptional({ enum: LOAN_APPLICATION_STATUS })
  @IsOptional()
  @IsEnum(LOAN_APPLICATION_STATUS)
  loanStatus?: LOAN_APPLICATION_STATUS;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 20;
}
