import { CustomField } from "../config/custom_field"

export class Project {
    id!: string | number
    name!: string
    customFields!: CustomField[]
    parentProject!: string | number | null
    constructor(projectId: string | number, projectName: string, custFields: CustomField[] = [], parent: string | number | null = null) {
        this.id = projectId
        this.name = projectName
        this.customFields = custFields
        this.parentProject = parent
    }
}