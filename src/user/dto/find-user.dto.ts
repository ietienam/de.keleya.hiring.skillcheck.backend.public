export class FindUserDto {
  readonly limit?: number;
  readonly offset?: number;
  readonly updatedSince?: string;
  readonly id?: number[];
  readonly name?: string;
  readonly credentials?: boolean;
  readonly email?: string;
}
