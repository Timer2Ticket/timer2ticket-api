export class FallbackIssue {
    fallbackIssue!: boolean
    name!: string

    constructor(fallbackIssue: boolean, name: string = '') {
        this.fallbackIssue = fallbackIssue
        this.name = name
    }
}