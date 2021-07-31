export class UserConfig {
  plan: string;
  daysToSync: number;

  constructor(plan: string) {
    this.plan = plan;

    switch (this.plan) {
      default:
        this.daysToSync = 60;
    }
  }
}