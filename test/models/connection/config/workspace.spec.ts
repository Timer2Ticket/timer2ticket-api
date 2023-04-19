import { expect } from 'chai';
import { Workspace } from '../../../../src/models/connection/config/workspace';

describe('Workspace', () => {
  it('should create an instance with the provided id and name', () => {
    const workspace = new Workspace(1, 'Workspace 1');
    expect(workspace.id).to.equal(1);
    expect(workspace.name).to.equal('Workspace 1');
  });
});
