import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Prisma, User } from '@prisma/client';
import { PrismaService } from '../prisma.services';
import { AuthenticateUserDto } from './dto/authenticate-user.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { DeleteUserDto } from './dto/delete-user.dto';
import { FindUserDto } from './dto/find-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { hashPassword, matchHashedPassword } from '../common/utils/password';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class UserService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Finds users with matching fields
   *
   * @param findUserDto
   * @returns User[]
   */
  async find(findUserDto: FindUserDto): Promise<User[]> {
    let condition;

    if (findUserDto.id) {
      condition = Number(findUserDto.id);
    }
    if (findUserDto.id && Array.isArray(findUserDto.id)) {
      condition = { in: findUserDto.id.map((id) => Number(id)) };
    }
    const users = await this.prisma.user.findMany({
      skip: findUserDto.offset ? Number(findUserDto.offset) : undefined,
      take: findUserDto.limit ? Number(findUserDto.limit) : undefined,
      where: {
        name: { contains: findUserDto.name },
        email: { contains: findUserDto.email },
        updated_at: findUserDto.updatedSince ? { gte: new Date(findUserDto.updatedSince) } : undefined,
        id: condition,
      },
      include: { credentials: findUserDto.credentials ? true : false },
    });

    return users;
  }

  /**
   * Finds single User by id, name or email
   *
   * @param whereUnique
   * @returns User
   */
  async findUnique(whereUnique: Prisma.UserWhereUniqueInput, includeCredentials = false) {
    const user = await this.prisma.user.findUnique({
      where: whereUnique,
      include: { credentials: includeCredentials },
    });

    return user;
  }

  /**
   * Creates a new user with credentials
   *
   * @param createUserDto
   * @returns result of create
   */
  async create(createUserDto: CreateUserDto) {
    const hash = await hashPassword(createUserDto.password);
    const createCredentialAndUser = await this.prisma.user.create({
      data: {
        name: createUserDto.name,
        email: createUserDto.email,
        is_admin: createUserDto.admin,
        credentials: {
          create: {
            hash,
          },
        },
      },
    });

    return createCredentialAndUser;
  }

  /**
   * Updates a user unless it does not exist or has been marked as deleted before
   *
   * @param updateUserDto
   * @returns result of update
   */
  async update(updateUserDto: UpdateUserDto) {
    const user = await this.findUnique({ id: updateUserDto.id });

    if (user && user.email !== 'null') {
      let hash;
      let updatePayload;
      if (updateUserDto.password && updateUserDto.name) {
        hash = await hashPassword(updateUserDto.password);
        updatePayload = {
          name: updateUserDto.name,
          credentials: { update: { where: { id: user.credentials_id }, data: { hash } } },
        };
      }
      if (updateUserDto.name && !updateUserDto.password) {
        updatePayload = { name: updateUserDto.name };
      }
      if (updateUserDto.password && !updateUserDto.name) {
        hash = await hashPassword(updateUserDto.password);
        updatePayload = { credentials: { update: { where: { id: user.credentials_id }, data: { hash } } } };
      }
      const updatedUser = await this.prisma.user.update({
        where: { id: user.id },
        data: updatePayload,
      });
      const response = {};

      for (const key in updatedUser) {
        if (key === 'created_at') {
          response['createdAt'] = updatedUser[key];
        } else if (key === 'updated_at') {
          response['updatedAt'] = updatedUser[key];
        } else {
          response[key] = updatedUser[key];
        }
      }

      return updatedUser;
    }
  }

  /**
   * Deletes a user
   * Function does not actually remove the user from database but instead marks them as deleted by:
   * - removing the corresponding `credentials` row from your db
   * - changing the name to DELETED_USER_NAME constant (default: `(deleted)`)
   * - setting email to NULL
   *
   * @param deleteUserDto
   * @returns results of users and credentials table modification
   */
  async delete(deleteUserDto: DeleteUserDto) {
    const user = await this.findUnique({ id: deleteUserDto.id });

    if (user.name !== '(deleted)' && user.email !== 'null') {
      const deletedUser = await this.prisma.user.update({
        where: { id: user.id },
        data: {
          name: '(deleted)',
          email: 'null',
          credentials: {
            delete: true,
          },
        },
      });
      const response = { users: deletedUser };

      return response;
    }
  }

  /**
   * Authenticates a user and returns a JWT token
   *
   * @param authenticateUserDto email and password for authentication
   * @returns a JWT token
   */
  async authenticateAndGetJwtToken(authenticateUserDto: AuthenticateUserDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: authenticateUserDto.email },
      include: { credentials: true },
    });
    const passwordValid = await matchHashedPassword(authenticateUserDto.password, user.credentials.hash);

    if (user && passwordValid) {
      const payload = {
        id: user.id,
        username: user.email,
        admin: user.is_admin,
      };
      const signedPayload = await this.jwtService.signAsync(payload);

      return JSON.stringify({ token: signedPayload });
    } else {
      throw new UnauthorizedException();
    }
  }

  /**
   * Authenticates a user
   *
   * @param authenticateUserDto email and password for authentication
   * @returns true or false
   */
  async authenticate(authenticateUserDto: AuthenticateUserDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: authenticateUserDto.email },
      include: { credentials: true },
    });
    const passwordValid = await matchHashedPassword(authenticateUserDto.password, user.credentials.hash);

    return user && passwordValid ? JSON.stringify({ credentials: true }) : JSON.stringify({ credentials: false });
  }

  /**
   * Validates a JWT token
   *
   * @param token a JWT token
   * @returns the decoded token if valid
   */
  async validateToken(token: string) {
    const secret = this.configService.get<string>('JWT_SECRET');
    const decodedToken = await this.jwtService.verifyAsync(token, { secret });

    if (decodedToken.id) return decodedToken;
  }
}
