import { IsIn, IsNumber, Max, Min } from 'class-validator';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const t2tLib = require('@timer2ticket/timer2ticket-backend-library');

export class MembershipFromClient{
  // Membership name: Hobby, Junior, Senior
  @IsIn(t2tLib.MembershipTypeArray)
  name!: string;

  // Number of connections over membership
  @IsNumber()
  @Min(0)
  connectionsOver!: number;


  constructor(obj: any) {
    this.name = obj.name;
    this.connectionsOver = obj.connectionsOver;
  }
}
