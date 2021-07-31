import { Length, IsEmail, Matches, } from 'class-validator';

export class UserAuthentication {
  @IsEmail()
  username: string;

  @Length(8, 100)
  @Matches(/(?=.*\d)(?=.*[a-z,A-Z]).{8,}/)
  password: string;

  constructor(username: string, password: string) {
    this.username = username;
    this.password = password;
  }
}