import { Length, IsEmail, Matches, } from 'class-validator';

export class UserRegistration {
  @IsEmail()
  username: string;

  @Length(8, 100)
  @Matches(/(?=.*\d)(?=.*[a-z,A-Z]).{8,}/)
  password: string;

  @Length(8, 100)
  @Matches(/(?=.*\d)(?=.*[a-z,A-Z]).{8,}/)
  passwordAgain: string;

  constructor(username: string, password: string, passwordAgain: string) {
    this.username = username;
    this.password = password;
    this.passwordAgain = passwordAgain;
  }
}