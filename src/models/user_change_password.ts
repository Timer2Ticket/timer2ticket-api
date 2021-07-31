import { Length, Matches, } from 'class-validator';

export class UserChangePassword {
  @Length(8, 100)
  @Matches(/(?=.*\d)(?=.*[a-z,A-Z]).{8,}/)
  oldPassword: string;

  @Length(8, 100)
  @Matches(/(?=.*\d)(?=.*[a-z,A-Z]).{8,}/)
  newPassword: string;

  @Length(8, 100)
  @Matches(/(?=.*\d)(?=.*[a-z,A-Z]).{8,}/)
  newPasswordAgain: string;

  constructor(oldPassword: string, newPassword: string, newPasswordAgain: string) {
    this.oldPassword = oldPassword;
    this.newPassword = newPassword;
    this.newPasswordAgain = newPasswordAgain;
  }
}