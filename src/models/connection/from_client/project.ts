export class Project {
    id!: string | number
    name!: string
    constructor(projectId: string | number, projectName: string) {
        this.id = projectId
        this.name = projectName

    }
}