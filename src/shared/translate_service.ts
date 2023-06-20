export class TranslateService {
  _translateMap: Map<string, Map<string, string>> | undefined;

  private static _instance: TranslateService;

  private _initCalled = false;

  public static get Instance(): TranslateService {
    return this._instance || (this._instance = new this());
  }

  /**
   * Private empty constructor to make sure that this is correct singleton
   */
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  private constructor() {
  }

  /**
   * Needs to be called (and awaited) to correctly connect to the database
   */
  public async init(): Promise<boolean> {
    if (this._initCalled) {
      return false;
    }
    this._initCalled = true;
    this._translateMap = new Map(
      [
        [
          'en',
          new Map([
            ['emailNotifyMembershipChangesSubject', 'Timer2Ticket membership changes'],
            ['emailNotifyMembershipChangesBodyBegin', '<p>You have changed your membership.</p><p>Because of this, we had to '],
            ['emailNotifyMembershipChangesBodySyncSchedule', 'change the synchronization schedule of the following connections: {{ connections }}'],
            ['emailNotifyMembershipChangesBodyAnd', '.</p><p>We also had to '],
            ['emailNotifyMembershipChangesBodyDeactiavted', 'deactivate the following connections: {{ connections }}'],
            ['emailNotifyMembershipChangesBodyEnd', '.</p>'],

            ['emailGenericFooter', 'This email was generated automatically. Please do not reply to the address in the header.'],
          ]),
        ],
      ],
    );

    return true;
  }

  public get(language: string, key: string): string {
    const value = this._translateMap?.get(language)?.get(key);
    if (!value) {
      throw `This key does not exist in the translate map. Language: "${language}", Key: "${key}"`;
    }
    return value;
  }
}

export const translateService = TranslateService.Instance;