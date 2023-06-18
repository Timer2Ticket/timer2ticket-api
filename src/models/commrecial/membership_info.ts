import { ObjectId } from 'mongodb';

export class MembershipInfo {
  // Mongo
  _id!: ObjectId;

  // UserId
  userId!: ObjectId;

  // Stripe
  stripeCustomerId!: string | null;
  stripeSubscriptionId!: string | null;
  stripeLastSubscriptionSessionId!: string | null;

  // Fakturoid
  fakturoidSubjectId!: string | null;

  // currentMembership: Hobby, Junior, Senior
  currentMembership!: string | null;
  currentMembershipFinishes!: number | null;
  currentConnections!: number;
  currentActiveConnections!: number;
  currentImmediateSyncs!: number;

  static default(userId: ObjectId): MembershipInfo {
    const membershipInfo = new MembershipInfo();
    membershipInfo.userId = userId;

    membershipInfo.stripeCustomerId = null;
    membershipInfo.stripeSubscriptionId = null;
    membershipInfo.stripeLastSubscriptionSessionId = null;

    membershipInfo.fakturoidSubjectId = null;

    membershipInfo.currentMembership = null;
    membershipInfo.currentMembershipFinishes = null;
    membershipInfo.currentConnections = 0;
    membershipInfo.currentActiveConnections = 0;
    membershipInfo.currentImmediateSyncs = 0;
    return membershipInfo;

  }
}
