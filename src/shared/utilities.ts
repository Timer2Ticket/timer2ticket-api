export class Utilities {
  // private static _every24HoursSchedule = '0 */24 * * *';
  // private static _every12HoursSchedule = '0 */12 * * *';
  // private static _every6HoursSchedule = '0 */6 * * *';
  // private static _every3HoursSchedule = '0 */3 * * *';
  // private static _every1HourSchedule = '0 */1 * * *';

  private static _everySchedules = [
    '0 */24 * * *',
    '0 */12 * * *',
    '0 */6 * * *',
    '0 */3 * * *',
    '0 */1 * * *',
  ];

  /**
   * If given [cronSchedule] matches certain predefined schedule, it will randomize it.
   * Otherwise, returns same unmodified schedule.
   * Used to randomize every* schedule (every hour, 3 hours...) to start at different minute.
   * @param cronSchedule
   * @returns modified schedule with randomized minute or same schedule if [cronSchedule] does not match any every* pattern.
   */
  public static randomizeCronSchedule(cronSchedule: string): string {
    let newSchedule = cronSchedule;
    if (this._everySchedules.includes(newSchedule)) {
      const randomMinute = this.randomNumberBetween(0, 59);
      // take leading 0 from everySchedule and replaces it with randomMinute
      newSchedule = `${randomMinute}${newSchedule.substring(1)}`;
    }
    return newSchedule;
  }

  /**
   * @returns integer between [min] and [max] (both included).
   */
  public static randomNumberBetween(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1) + min);
  }
}
