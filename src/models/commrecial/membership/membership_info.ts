import { ObjectId } from 'mongodb';
import { BillingInformation } from './billing_information';

export class MembershipInfo {
  // Mongo
  _id!: ObjectId;

  // UserId
  userId!: ObjectId;

  // Parameters
  currentMembership!: ObjectId | null;
  currentMembershipFinishes!: Date | null;
  currentConnectionsOver!: number;
  currentImmediateSyncs!: number;
  billingInformation!: BillingInformation;

  static default(userId: ObjectId): MembershipInfo {
    const membershipInfo = new MembershipInfo();
    membershipInfo.userId = userId;
    membershipInfo.currentMembership = null;
    membershipInfo.currentMembershipFinishes = null;
    membershipInfo.currentConnectionsOver = 0;
    membershipInfo.currentImmediateSyncs = 0;
    membershipInfo.billingInformation = BillingInformation.default();
    return membershipInfo;

  }
}