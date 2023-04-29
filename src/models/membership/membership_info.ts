import { Membership } from './membership';

export class MembershipInfo {
  currentMembership: Membership | null = null;
  currentConnectionsOver: number = 0;
  currentImmediateSyncs: number = 0;
}