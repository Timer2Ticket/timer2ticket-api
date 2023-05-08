export class DefaultTimeEntryActivity{
  id!: string | number;
  name!: string;

  constructor(id: string | number, name: string) {
    this.id = id;
    this.name = name;
  }
}