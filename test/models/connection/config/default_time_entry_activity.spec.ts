import { expect } from 'chai';
import { DefaultTimeEntryActivity } from '../../../../src/models/connection/config/default_time_entry_activity';

describe('DefaultTimeEntryActivity', () => {
  it('should create an instance with the provided id and name', () => {
    const activity = new DefaultTimeEntryActivity(1, 'Activity 1');
    expect(activity.id).to.equal(1);
    expect(activity.name).to.equal('Activity 1');
  });
});