import { Length, Matches, } from 'class-validator';

export class UserResetPassword {
  @Length(8, 100)
  @Matches(/(?=.*\d)(?=.*[a-z,A-Z]).{8,}/)
  newPassword: string;

  @Length(8, 100)
  @Matches(/(?=.*\d)(?=.*[a-z,A-Z]).{8,}/)
  newPasswordAgain: string;

  constructor(newPassword: string, newPasswordAgain: string) {
    this.newPassword = newPassword;
    this.newPasswordAgain = newPasswordAgain;
  }
}