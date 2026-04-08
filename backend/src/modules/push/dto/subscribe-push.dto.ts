import { Type } from "class-transformer";
import {
  IsNotEmptyObject,
  IsObject,
  IsString,
  IsUrl,
  MinLength,
  ValidateNested,
} from "class-validator";

class PushSubscriptionKeysDto {
  @IsString()
  @MinLength(1)
  auth!: string;

  @IsString()
  @MinLength(1)
  p256dh!: string;
}

class BrowserPushSubscriptionDto {
  @IsUrl({ require_tld: false })
  endpoint!: string;

  @IsObject()
  @ValidateNested()
  @Type(() => PushSubscriptionKeysDto)
  keys!: PushSubscriptionKeysDto;
}

export class SubscribePushDto {
  @IsNotEmptyObject()
  @ValidateNested()
  @Type(() => BrowserPushSubscriptionDto)
  subscription!: BrowserPushSubscriptionDto;
}
