export class TranslateService {
  private _translateMap: Map<string, Map<string, string>> | undefined;

  private static _instance: TranslateService;

  private _initCalled = false;

  public static get Instance(): TranslateService {
    return this._instance || (this._instance = new this());
  }

  /**
   * Private empty constructor to make sure that this is correct singleton
   */
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  private constructor() { }

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
            ['emailPasswordResetRequestSubject', 'Timer2Ticket account password reset request'],
            ['emailPasswordResetRequestBody', '<p>You have requested a password reset for your Timer2Ticket account.</p><br/><p>Please enter a new password using the following link (it is valid for 60 minutes from the time it was generated): <a href="https://app.timer2ticket.com/reset-password/{{ token }}">https://app.timer2ticket.com/reset-password/{{ token }}</a>. If the link does not open, please copy it into your browser address.</p><br/><p>If you have not requested the change, ignore the email. Your password will be retained.</p>'],

            ['emailPasswordResetDoneSubject', 'Timer2Ticket account password reset done'],
            ['emailPasswordResetDoneBody', '<p>The password for your Timer2Ticket account has just been changed. This email is for confirmation purposes only. No further action is required.</p>'],
            
            ['emailRegistrationSubject', 'Timer2Ticket account registration'],
            ['emailRegistrationBody', '<p>You have requested a Timer2Ticket registration for this email.</p><br/><p>Please complete your registration using the following link (it is valid for 2 days from the time it was generated): <a href="https://app.timer2ticket.com/registration/{{ token }}">https://app.timer2ticket.com/registration/{{ token }}</a>. If the link does not open, please copy it into your browser address.</p><br/><p>If you have not requested this action, feel free to ignore the email.</p>'],

            ['emailGenericFooter', 'This email was generated automatically. Please do not reply to the address in the header.'],
          ])
        ]
      ]
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