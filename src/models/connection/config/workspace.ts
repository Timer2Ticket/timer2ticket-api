export class Workspace {
  id!: number | string;
  name!: string;

  constructor(id: number | string, name: string) {
    this.id = id;
    this.name = name;
  }
}