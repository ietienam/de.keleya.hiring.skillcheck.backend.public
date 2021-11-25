import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  HttpCode,
  UseGuards,
  NotImplementedException,
  UnauthorizedException,
  Logger,
  HttpStatus,
} from '@nestjs/common';
import { Request } from 'express';
import { JWTPayload } from '../common/interface/jwtpayload.interface';
import { Usr } from '../common/decorators/user.decorator';
import { AuthenticateUserDto } from './dto/authenticate-user.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { DeleteUserDto } from './dto/delete-user.dto';
import { FindUserDto } from './dto/find-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserService } from './user.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('user')
export class UserController {
  constructor(private readonly usersService: UserService) {}

  @UseGuards(AuthGuard())
  @Get()
  async find(@Query() findUserDto: FindUserDto, @Usr() usr: JWTPayload) {
    if (!usr.is_admin) {
      return [usr];
    }

    const users = await this.usersService.find(findUserDto);

    return users;
  }

  @UseGuards(AuthGuard())
  @Get(':id')
  async findUnique(@Param('id', ParseIntPipe) id: number, @Usr() usr: JWTPayload) {
    if (!usr.is_admin) {
      if (usr.id !== id) {
        throw new UnauthorizedException();
      }

      const user = await this.usersService.findUnique({ id });

      return user;
    }
    const user = await this.usersService.findUnique({ id });

    return user;
  }

  @Post()
  @HttpCode(HttpStatus.OK)
  async create(@Body() createUserDto: CreateUserDto) {
    const userAndCredentials = await this.usersService.create(createUserDto);

    return userAndCredentials;
  }

  @UseGuards(AuthGuard())
  @Patch()
  async update(@Body() updateUserDto: UpdateUserDto, @Usr() usr: JWTPayload) {
    if (!usr.is_admin) {
      if (usr.id !== updateUserDto.id) {
        throw new UnauthorizedException();
      }

      const user = await this.usersService.update(updateUserDto);

      return user;
    }
    const user = await this.usersService.update(updateUserDto);

    return user;
  }

  @UseGuards(AuthGuard())
  @Delete()
  async delete(@Body() deleteUserDto: DeleteUserDto, @Usr() usr: JWTPayload) {
    if (usr.is_admin) {
      const deletedUser = await this.usersService.delete(deleteUserDto);

      return deletedUser;
    } else {
      throw new UnauthorizedException();
    }
  }

  @Post('validate')
  @HttpCode(HttpStatus.OK)
  async userValidateToken(@Req() req: Request) {
    const token = req.headers['authorization'].split(' ')[1];
    const isValid = await this.usersService.validateToken(token);

    return isValid;
  }

  @Post('authenticate')
  @HttpCode(HttpStatus.OK)
  async userAuthenticate(@Body() authenticateUserDto: AuthenticateUserDto) {
    const isAuthenticated = await this.usersService.authenticate(authenticateUserDto);

    return isAuthenticated;
  }

  @Post('token')
  @HttpCode(HttpStatus.OK)
  async userGetToken(@Body() authenticateUserDto: AuthenticateUserDto) {
    const token = await this.usersService.authenticateAndGetJwtToken(authenticateUserDto);

    return token;
  }
}
