import { ObjectId } from 'mongodb';
import { Membership } from './membership';
import { MembershipInfo } from './membership_info';
import { BillingInformation } from './billing_information';

export class MembershipInfoToUser {
  // Mongo
  _id!: string | ObjectId;
  userId!: string | ObjectId;
  currentMembership: Membership | null;
  currentMembershipFinishes!: Date | null;
  currentConnectionsOver: number;
  currentImmediateSyncs: number;
  billingInformation!: BillingInformation;

  constructor(membershipInfo: MembershipInfo, membership: Membership | null) {
    this._id = membershipInfo._id;
    this.userId = membershipInfo.userId;
    this.currentMembership = membership;
    this.currentMembershipFinishes = membershipInfo.currentMembershipFinishes;
    this.currentConnectionsOver = membershipInfo.currentConnectionsOver;
    this.currentImmediateSyncs = membershipInfo.currentImmediateSyncs;
    this.billingInformation = membershipInfo.billingInformation;
  }
}