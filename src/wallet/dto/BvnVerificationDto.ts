import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
} from 'class-validator';

export class BvnVerificationDto {
  @IsNotEmpty({ message: 'BVN is required' })
  @IsString({ message: 'BVN must be a string' })
  @Matches(/^[0-9]{11}$/, {
    message: 'BVN must be exactly 11 digits',
  })
  bvn: string;

  @IsNotEmpty({ message: 'BVN face base64 image is required' })
  @IsString({ message: 'Base64 must be a string' })
  selfieImage: string;
}

export class BvnFaceVerificationResponseDto {
  id?: number;
  metadata?: MetadataDto;
  summary?: SummaryDto;
  status?: StatusDto;
  bvn?: BvnDataDto;
  message?: string;
  statusCode?: number;
  face_verification?: FaceVerificationDto;
}

export class MetadataDto {
  type?: string;
  match?: boolean;
  match_score?: number;
  matching_threshold?: number;
  max_score?: number;
  imageUrl?: string;
}

export class SummaryDto {
  face_verification_check?: FaceVerificationCheckDto;
  bvn_check?: BvnCheckDto;
}

export class FaceVerificationCheckDto {
  match?: boolean;
  match_score?: number;
  matching_threshold?: number;
  max_score?: number;
}

export class BvnCheckDto {
  status?: string;
  fieldMatches?: FieldMatchesDto;
}

export class FieldMatchesDto {
  firstname?: boolean;
  lastname?: boolean;
  dob?: boolean;
  phoneNumber?: boolean;
  gender?: boolean;
  emailAddress?: boolean;
}

export class StatusDto {
  state?: string;
  status?: string;
}

export class BvnDataDto {
  bvn?: string;
  firstname?: string;
  lastname?: string;
  middlename?: string;
  birthdate?: string;
  gender?: string;
  phone?: string;
  photo?: string;
  lga_of_origin?: string;
  lga_of_residence?: string;
  marital_status?: string;
  nationality?: string;
  residential_address?: string;
  state_of_origin?: string;
  state_of_residence?: string;
  email?: string;
  enrollment_bank?: string;
  enrollment_branch?: string;
  title?: string;
  name_on_card?: string;
  nin?: string;
  level_of_account?: string;
  phone2?: string;
  registration_date?: string;
  watch_listed?: string;
  imageUrl?: string;
}

export class FaceVerificationDto {
  match?: boolean;
  match_score?: number;
  matching_threshold?: number;
  max_score?: number;
}
